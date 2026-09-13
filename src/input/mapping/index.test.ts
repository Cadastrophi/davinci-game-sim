import { describe, expect, it } from 'vitest';
import { DEFAULT_CALIBRATION, INITIAL_TOOL_POSE } from '../../contracts';
import type { CalibrationConfig, RawPoseSample, ToolPose, Vec3 } from '../../contracts';
import { createInputMapping } from './index';

function setup() {
  let time = 1000;
  let sequence = 0;
  const mapping = createInputMapping({ now: () => time });
  mapping.setConnected(true);
  function sample(overrides: Partial<RawPoseSample> = {}): RawPoseSample {
    return { positionMm: [0, 0, 0], yawDeg: 0, pitchDeg: 0, roll: null, receivedAtMs: time, sequence: ++sequence, source: 'mock', ...overrides };
  }
  const send = (overrides: Partial<RawPoseSample> = {}) => mapping.ingest(sample(overrides));
  const frame = () => mapping.snapshot(time);
  const advance = (ms: number) => { time += ms; };
  function start(config = DEFAULT_CALIBRATION, pose = INITIAL_TOOL_POSE) {
    expect(send().ok).toBe(true);
    expect(mapping.calibrate(config, pose).ok).toBe(true);
  }
  return { mapping, sample, send, frame, advance, start };
}
const pose = (positionMm: Vec3, direction: Vec3 | null = [0, 0, -1]): ToolPose => ({ positionMm, direction, directionKind: direction === null ? 'unavailable' : 'virtual-mapped' });
function expectVector(actual: Vec3 | null, expected: Vec3) {
  expect(actual).not.toBeNull();
  expected.forEach((value, index) => expect(actual![index]).toBeCloseTo(value, 10));
}

describe('calibrated input mapping', () => {
  it('maps the default virtual axes from real Y, Z, X with gains 1, 1, 3', () => {
    const h = setup();
    h.start();
    h.send({ positionMm: [2, 3, 5] });
    expectVector(h.frame().requestedPose.positionMm, [3, 23, 6]);
  });

  it('starts paused and requires fresh input and explicit calibration', () => {
    const h = setup();
    expect(h.frame()).toMatchObject({ mode: 'paused', fresh: false });
    expect(h.mapping.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE)).toMatchObject({ ok: false, reason: 'missing-input' });
    h.send();
    expect(h.mapping.resume(INITIAL_TOOL_POSE).ok).toBe(false);
    expect(h.mapping.getCalibrationStatus()).toBe('uncalibrated');
    h.mapping.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    expect(h.frame()).toMatchObject({ mode: 'tool', fresh: true, calibrationRevision: 1 });
  });

  it('maps mm permutation/sign/gain from the raw neutral to the applied anchor', () => {
    const h = setup();
    h.send({ positionMm: [100, 200, 300] });
    const config: CalibrationConfig = { ...DEFAULT_CALIBRATION, axisOrder: [2, 0, 1], axisSigns: [-1, 1, -1], translationGain: [2, 3, 4] };
    h.mapping.calibrate(config, pose([10, 20, 30]));
    h.send({ positionMm: [101, 202, 303] });
    expectVector(h.frame().requestedPose.positionMm, [4, 23, 22]);
  });

  it('keeps yaw/pitch direction normalized using documented signs/order', () => {
    const h = setup();
    h.start({ ...DEFAULT_CALIBRATION, yawSign: -1 });
    h.send({ yawDeg: 90, pitchDeg: 30 });
    expectVector(h.frame().requestedPose.direction, [Math.sqrt(3) / 2, 0.5, 0]);
    expect(h.frame().requestedPose.directionKind).toBe('virtual-mapped');
  });

  it('crosses degree wrap with a small continuous direction change', () => {
    const h = setup();
    h.send({ yawDeg: 179 });
    h.mapping.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    h.send({ yawDeg: -179 });
    const radians = 2 * Math.PI / 180;
    expectVector(h.frame().requestedPose.direction, [-Math.sin(radians), 0, -Math.cos(radians)]);
  });

  it('handles finite extreme angles without overflow', () => {
    const h = setup();
    h.start();
    expect(h.send({ yawDeg: Number.MAX_VALUE, pitchDeg: -Number.MAX_VALUE }).ok).toBe(true);
    expect(Math.hypot(...h.frame().requestedPose.direction!)).toBeCloseTo(1);
  });

  it('never manufactures a direction or measured roll from unavailable inputs', () => {
    const h = setup();
    h.start({ ...DEFAULT_CALIBRATION, directionKind: 'unavailable' });
    h.send({ yawDeg: 40, pitchDeg: 20 });
    expect(h.frame().requestedPose).toMatchObject({ direction: null, directionKind: 'unavailable' });
    expect(h.mapping.getRaw()?.roll).toBeNull();
    h.mapping.calibrate(DEFAULT_CALIBRATION, pose([0, 0, 0], null));
    h.send({ yawDeg: 90 });
    expect(h.frame().requestedPose.direction).toBeNull();
  });

  it('does not carry physical validation through a virtual rebase', () => {
    const h = setup();
    h.start(DEFAULT_CALIBRATION, { ...INITIAL_TOOL_POSE, directionKind: 'physical-validated' });
    expect(h.frame().requestedPose.directionKind).toBe('virtual-mapped');
  });

  it.each([
    ['duplicate axis', { axisOrder: [0, 0, 2] }],
    ['zero sign', { axisSigns: [1, 0, 1] }],
    ['negative gain', { translationGain: [1, -1, 1] }],
    ['nonfinite camera gain', { cameraGain: [1, Infinity, 1] }],
    ['invalid yaw sign', { yawSign: 0 }],
    ['physical claim', { directionKind: 'physical-validated' }],
  ])('rejects %s calibration and pauses until recalibrated', (_name, override) => {
    const h = setup();
    h.start();
    const config = { ...DEFAULT_CALIBRATION, ...override } as CalibrationConfig;
    expect(h.mapping.calibrate(config, INITIAL_TOOL_POSE)).toMatchObject({ ok: false, reason: 'invalid-calibration' });
    expect(h.mapping.getCalibrationStatus()).toBe('invalid');
    expect(h.frame().mode).toBe('paused');
    expect(h.mapping.resume(INITIAL_TOOL_POSE).ok).toBe(false);
    expect(h.mapping.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE).ok).toBe(true);
  });

  it.each([
    pose([NaN, 0, 0]), pose([0, 0, 0], [0, 0, 0]), pose([0, 0, 0], [0, 0, 2]),
    { ...pose([0, 0, 0]), directionKind: 'unavailable' as const },
  ])('rejects malformed applied pose %# without contaminating output', badPose => {
    const h = setup();
    h.start();
    expect(h.mapping.resume(badPose)).toMatchObject({ ok: false, reason: 'invalid-applied-pose' });
    expect(h.frame().requestedPose).toEqual(INITIAL_TOOL_POSE);
    expect(h.frame().mode).toBe('paused');
  });

  it('rejects arithmetic overflow and preserves a finite last pose', () => {
    const h = setup();
    h.start({ ...DEFAULT_CALIBRATION, translationGain: [Number.MAX_VALUE, 1, 1] });
    expect(h.send({ positionMm: [0, 2, 0] })).toMatchObject({ ok: false, reason: 'mapping-overflow' });
    expect(h.frame()).toMatchObject({ mode: 'paused', requestedPose: INITIAL_TOOL_POSE });
  });

  it('rejects subtraction overflow and camera offset overflow', () => {
    const h = setup();
    h.send({ positionMm: [-Number.MAX_VALUE, 0, 0] });
    h.mapping.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    h.mapping.enterCameraMode(INITIAL_TOOL_POSE);
    expect(h.send({ positionMm: [Number.MAX_VALUE, 0, 0] })).toMatchObject({ ok: false, reason: 'mapping-overflow' });
    expectVector(h.frame().cameraOffsetMm, [0, 0, 0]);
  });
});

describe('camera anchors and deliberate recovery', () => {
  it('freezes collision-applied pose and returns cumulative camera offsets without render accumulation', () => {
    const h = setup();
    h.start({ ...DEFAULT_CALIBRATION, cameraGain: [2, 3, 4] });
    h.send({ positionMm: [100, 0, 0] });
    const blocked = pose([40, 0, 0], [1, 0, 0]);
    expect(h.mapping.enterCameraMode(blocked).ok).toBe(true);
    const session = h.frame().cameraSession;
    h.send({ positionMm: [105, 2, 3], yawDeg: 80, pitchDeg: 40 });
    const held = h.frame();
    expect(held).toMatchObject({ mode: 'camera', frozenPose: blocked, requestedPose: blocked });
    expectVector(held.cameraOffsetMm, [4, 9, 20]);
    for (let i = 0; i < 100; i++) expect(h.frame()).toEqual(held);
    expect(h.mapping.enterCameraMode(blocked)).toMatchObject({ ok: false, reason: 'wrong-mode' });
    expect(h.frame().cameraSession).toBe(session);
    expect(h.mapping.exitCameraMode(blocked).ok).toBe(true);
    expect(h.frame().requestedPose).toEqual(blocked);
    expect(h.frame().cameraOffsetMm).toEqual([0, 0, 0]);
    h.send({ positionMm: [106, 2, 3], yawDeg: 80, pitchDeg: 40 });
    expectVector(h.frame().requestedPose.positionMm, [40, 0, 3]);
    expectVector(h.frame().requestedPose.direction, [1, 0, 0]);
  });

  it.each([{ direction: [0, 0, 1] as Vec3 }, { direction: [0, 1, 0] as Vec3 }, { direction: [1e-11, 0, 1] as Vec3 }])('rebases direction without a jump near antipodes and poles: $direction', ({ direction }) => {
    const h = setup();
    h.start();
    const applied = pose([2, 3, 4], direction);
    h.mapping.enterCameraMode(applied);
    h.send({ yawDeg: 0, pitchDeg: 0, positionMm: [7, 8, 9] });
    h.mapping.exitCameraMode(applied);
    expect(h.frame().requestedPose).toEqual(applied);
    h.send({ yawDeg: 0, pitchDeg: 0, positionMm: [7, 8, 9] });
    expectVector(h.frame().requestedPose.direction, direction);
  });

  it('creates a new zero-offset session on each camera entry', () => {
    const h = setup();
    h.start();
    h.mapping.enterCameraMode(INITIAL_TOOL_POSE);
    h.send({ positionMm: [2, 0, 0] });
    h.mapping.exitCameraMode(INITIAL_TOOL_POSE);
    h.mapping.enterCameraMode(INITIAL_TOOL_POSE);
    expect(h.frame()).toMatchObject({ cameraSession: 2, cameraOffsetMm: [0, 0, 0] });
  });

  it('pauses at exactly 250ms and never auto-resumes when new packets arrive', () => {
    const h = setup();
    h.start();
    h.advance(249);
    expect(h.frame()).toMatchObject({ fresh: true, mode: 'tool' });
    h.advance(1);
    expect(h.frame()).toMatchObject({ fresh: false, mode: 'paused', pauseReason: 'stale-input' });
    h.send({ positionMm: [100, 0, 0] });
    expect(h.frame()).toMatchObject({ fresh: true, mode: 'paused', requestedPose: INITIAL_TOOL_POSE });
    h.mapping.resume(pose([3, 4, 5]));
    expect(h.frame().requestedPose.positionMm).toEqual([3, 4, 5]);
  });

  it('detects an outage before replacing the old sample without a render query', () => {
    const h = setup();
    h.start();
    h.advance(300);
    h.send({ positionMm: [100, 0, 0] });
    expect(h.frame()).toMatchObject({ mode: 'paused', fresh: true, pauseReason: 'stale-input', requestedPose: INITIAL_TOOL_POSE });
  });

  it('fails stale camera release while preserving frozen pose, then resumes from fresh applied anchors', () => {
    const h = setup();
    h.start();
    const blocked = pose([4, 5, 6], [1, 0, 0]);
    h.mapping.enterCameraMode(blocked);
    h.advance(250);
    expect(h.mapping.exitCameraMode(blocked)).toMatchObject({ ok: false, reason: 'stale-input' });
    expect(h.frame()).toMatchObject({ mode: 'paused', requestedPose: blocked, frozenPose: null });
    h.send({ positionMm: [100, 200, 300], yawDeg: 60, pitchDeg: 30 });
    expect(h.mapping.exitCameraMode(blocked)).toMatchObject({ ok: false, reason: 'wrong-mode' });
    h.mapping.resume(blocked);
    expect(h.frame().requestedPose).toEqual(blocked);
  });

  it('clears camera hold on pause and allows explicit reset while collision-blocked', () => {
    const h = setup();
    h.start();
    h.send({ positionMm: [100, 0, 0] });
    h.mapping.enterCameraMode(pose([40, 0, 0]));
    h.mapping.pause('blur');
    h.send({ positionMm: [200, 0, 0] });
    expect(h.frame()).toMatchObject({ mode: 'paused', frozenPose: null, cameraOffsetMm: [0, 0, 0] });
    const reset = pose([0, 10, 0], [1, 0, 0]);
    expect(h.mapping.resume(reset).ok).toBe(true);
    expect(h.frame().requestedPose).toEqual(reset);
    h.send({ positionMm: [201, 0, 0] });
    expectVector(h.frame().requestedPose.positionMm, [0, 10, 3]);
  });
});

describe('input sessions, chronology and isolation', () => {
  it('requires a new sample and deliberate resume after reconnect; sequence can restart', () => {
    const h = setup();
    h.start();
    h.mapping.setConnected(false);
    expect(h.send().ok).toBe(false);
    expect(h.frame()).toMatchObject({ mode: 'paused', fresh: false });
    h.mapping.setConnected(true);
    expect(h.mapping.resume(INITIAL_TOOL_POSE)).toMatchObject({ ok: false, reason: 'missing-input' });
    expect(h.send({ sequence: 0 }).ok).toBe(true);
    expect(h.frame()).toMatchObject({ mode: 'paused', fresh: true });
    expect(h.mapping.resume(INITIAL_TOOL_POSE).ok).toBe(true);
  });

  it('pauses/rebases on source change and permits a new source sequence', () => {
    const h = setup();
    h.start();
    expect(h.send({ source: 'replay', sequence: 0, positionMm: [100, 0, 0] }).ok).toBe(true);
    expect(h.frame()).toMatchObject({ mode: 'paused', source: 'replay', pauseReason: 'source-changed' });
    h.mapping.resume(INITIAL_TOOL_POSE);
    h.send({ source: 'replay', sequence: 1, positionMm: [101, 0, 0] });
    expectVector(h.frame().requestedPose.positionMm, [0, 18, 3]);
  });

  it('requires increasing sequence and nondecreasing receive time within a session', () => {
    const h = setup();
    h.start();
    expect(h.send({ sequence: 1 })).toMatchObject({ ok: false, reason: 'out-of-order-sample' });
    expect(h.send({ receivedAtMs: 999 })).toMatchObject({ ok: false, reason: 'out-of-order-sample' });
    expect(h.send({ sequence: 10, receivedAtMs: 1000 }).ok).toBe(true);
    expect(h.mapping.getRaw()?.sequence).toBe(10);
  });

  it.each<Partial<RawPoseSample>>([
    { positionMm: [NaN, 0, 0] }, { yawDeg: Infinity }, { pitchDeg: NaN },
    { sequence: -1 }, { sequence: 1.2 }, { receivedAtMs: -1 }, { receivedAtMs: NaN },
    { roll: 0 as unknown as null }, { positionMm: new Array(3) as unknown as Vec3 },
  ])('rejects invalid structured samples %# while preserving latest raw', override => {
    const h = setup();
    h.start();
    const before = h.mapping.getRaw();
    expect(h.send(override)).toMatchObject({ ok: false, reason: 'invalid-sample' });
    expect(h.mapping.getRaw()).toEqual(before);
  });

  it('rejects future timestamps and pauses on invalid or regressing clocks', () => {
    const h = setup();
    h.start();
    expect(h.send({ receivedAtMs: 1001 })).toMatchObject({ ok: false, reason: 'future-sample' });
    expect(h.mapping.snapshot(NaN)).toMatchObject({ mode: 'paused', fresh: false, pauseReason: 'invalid-clock' });
    expect(h.mapping.snapshot(999)).toMatchObject({ mode: 'paused', fresh: false, pauseReason: 'invalid-clock' });
  });

  it('does not let old replay timestamps move an active tool', () => {
    const h = setup();
    h.start();
    h.mapping.setConnected(false);
    h.mapping.setConnected(true);
    h.send({ receivedAtMs: 0, source: 'replay' });
    expect(h.frame()).toMatchObject({ mode: 'paused', fresh: false, pauseReason: 'stale-input' });
    expect(h.mapping.resume(INITIAL_TOOL_POSE).ok).toBe(false);
  });

  it('copies sample/config/pose inputs and every returned nested snapshot', () => {
    const h = setup();
    const rawPosition: [number, number, number] = [1, 2, 3];
    h.send({ positionMm: rawPosition });
    rawPosition[0] = 900;
    const gains: [number, number, number] = [1, 1, 1];
    const appliedPosition: [number, number, number] = [4, 5, 6];
    h.mapping.calibrate({ ...DEFAULT_CALIBRATION, translationGain: gains }, pose(appliedPosition));
    gains[0] = 100;
    appliedPosition[0] = 100;
    const rawCopy = h.mapping.getRaw()!;
    Reflect.set(rawCopy.positionMm, '0', 999);
    const frameCopy = h.frame();
    Reflect.set(frameCopy.requestedPose.positionMm, '0', 999);
    Reflect.set(frameCopy.requestedPose.direction!, '0', 999);
    Reflect.set(frameCopy.cameraOffsetMm, '0', 999);
    h.send({ positionMm: [2, 2, 3] });
    expectVector(h.frame().requestedPose.positionMm, [4, 5, 7]);
    expectVector(h.frame().requestedPose.direction, [0, 0, -1]);
    expectVector(h.frame().cameraOffsetMm, [0, 0, 0]);
    h.mapping.enterCameraMode(pose([8, 9, 10]));
    const frozenCopy = h.frame().frozenPose!;
    Reflect.set(frozenCopy.positionMm, '0', 900);
    expect(h.frame().frozenPose?.positionMm).toEqual([8, 9, 10]);
  });

  it('supports a finite custom freshness threshold', () => {
    let now = 0;
    const mapping = createInputMapping({ now: () => now, staleAfterMs: 10 });
    mapping.setConnected(true);
    mapping.ingest({ positionMm: [0, 0, 0], yawDeg: 0, pitchDeg: 0, roll: null, sequence: 1, receivedAtMs: 0, source: 'mock' });
    mapping.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    now = 10;
    expect(mapping.snapshot(now)).toMatchObject({ fresh: false, mode: 'paused' });
    expect(() => createInputMapping({ staleAfterMs: 0 })).toThrow(RangeError);
  });
});

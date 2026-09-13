import { describe, expect, it } from 'vitest';
import { DEFAULT_CALIBRATION, DEFAULT_SERIAL_SETTINGS, INITIAL_TOOL_POSE } from '../../src/contracts';
import type { RawPoseSample, ToolPose } from '../../src/contracts';
import { createInputFacade, createMockDriver, createReplayDriver, createManualSource } from '../../src/input';
import type { SerialPortLike } from '../../src/input/serial';
import { CAMERA_REPLAY } from '../fixtures/input/replay';

function setup() {
  let time = 1000;
  const now = () => time;
  const input = createInputFacade({ now, serial: null });
  const sample = (sequence: number, position: readonly [number, number, number] = [0, 0, 0], yawDeg = 0): RawPoseSample =>
    ({ positionMm: position, yawDeg, pitchDeg: 0, roll: null, receivedAtMs: time, sequence, source: 'mock' });
  return { input, now, sample, setTime(value: number) { time = value; } };
}

describe('composed input facade', () => {
  it('starts disconnected and requires deliberate calibration after synthetic input', () => {
    const { input, now, sample } = setup();
    expect(input.snapshot(now()).status.connection).toBe('disconnected');
    expect(input.ingest(sample(1)).ok).toBe(true);
    expect(input.snapshot(now()).control.mode).toBe('paused');
    expect(input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE).ok).toBe(true);
    expect(input.snapshot(now()).control.requestedPose).toEqual(INITIAL_TOOL_POSE);
  });

  it('freezes the applied pose and rebases position AND direction on camera release', () => {
    const { input, now, sample, setTime } = setup();
    input.ingest(sample(1)); input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    setTime(1020); input.ingest(sample(2, [100, 0, 0], 30));
    const applied: ToolPose = { positionMm: [40, 18, 0], direction: [1, 0, 0], directionKind: 'virtual-mapped' };
    expect(input.enterCameraMode(applied).ok).toBe(true);
    setTime(1040); input.ingest(sample(3, [105, 2, 3], 90));
    for (let i = 0; i < 100; i++) {
      const frame = input.snapshot(now()).control;
      expect(frame.requestedPose).toEqual(applied);
      expect(frame.cameraOffsetMm).toEqual([5, 2, 3]);
    }
    expect(input.exitCameraMode(applied).ok).toBe(true);
    expect(input.snapshot(now()).control.requestedPose.positionMm).toEqual(applied.positionMm);
    const direction = input.snapshot(now()).control.requestedPose.direction!;
    direction.forEach((component, i) => expect(component).toBeCloseTo(applied.direction![i]!, 12));
  });

  it('latches stale pause even if no snapshot was read during the outage', () => {
    const { input, now, sample, setTime } = setup();
    input.ingest(sample(1)); input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    setTime(1500); input.ingest(sample(2, [1000, 0, 0]));
    expect(input.snapshot(now()).control.mode).toBe('paused');
    expect(input.resume(INITIAL_TOOL_POSE).ok).toBe(true);
    expect(input.snapshot(now()).control.requestedPose.positionMm).toEqual(INITIAL_TOOL_POSE.positionMm);
  });

  it('rejects stale camera release and stays paused after fresh data', () => {
    const { input, now, sample, setTime } = setup();
    input.ingest(sample(1)); input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    input.enterCameraMode(INITIAL_TOOL_POSE);
    setTime(1250);
    expect(input.exitCameraMode(INITIAL_TOOL_POSE).ok).toBe(false);
    setTime(1260); input.ingest(sample(2));
    expect(input.snapshot(now()).control.mode).toBe('paused');
  });

  it('a source change requires new deliberate anchors', () => {
    const { input, now, sample } = setup();
    input.ingest(sample(1)); input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    expect(input.ingest({ ...sample(1, [100, 0, 0]), source: 'replay' }).ok).toBe(true);
    const state = input.snapshot(now());
    expect(state.status.source).toBe('replay');
    expect(state.control.mode).toBe('paused');
    expect(input.resume(INITIAL_TOOL_POSE).ok).toBe(true);
    expect(input.snapshot(now()).control.requestedPose.positionMm).toEqual(INITIAL_TOOL_POSE.positionMm);
  });

  it('rejects counterfeit serial input, invalid roll and future samples without refreshing age', () => {
    const { input, now, sample, setTime } = setup();
    input.ingest(sample(1));
    setTime(1020);
    expect(input.ingest({ ...sample(2), source: 'serial' }).ok).toBe(false);
    expect(input.ingest({ ...sample(2), receivedAtMs: 1021 }).ok).toBe(false);
    expect(input.ingest({ ...sample(2), roll: 0 } as unknown as RawPoseSample).ok).toBe(false);
    expect(input.snapshot(now()).status.sampleAgeMs).toBe(20);
    expect(input.snapshot(now()).status.invalidPackets).toBe(3);
  });

  it('diagnostics age with time and rate decays with silence', () => {
    const { input, now, sample, setTime } = setup();
    input.ingest(sample(1));
    expect(input.snapshot(now()).status.packetRateHz).toBe(1);
    setTime(2000);
    expect(input.snapshot(now()).status.sampleAgeMs).toBe(1000);
    expect(input.snapshot(now()).status.packetRateHz).toBe(0);
  });

  it('disconnect and dispose prevent automatic resumed control', async () => {
    const { input, now, sample } = setup();
    input.ingest(sample(1)); input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    await input.disconnect();
    expect(input.snapshot(now()).status.connection).toBe('disconnected');
    input.ingest(sample(1));
    expect(input.snapshot(now()).control.mode).toBe('paused');
    await input.dispose(); await input.dispose();
    expect(input.ingest(sample(2)).ok).toBe(false);
    expect(input.resume(INITIAL_TOOL_POSE).ok).toBe(false);
    expect(input.snapshot(now()).status.connection).toBe('disconnected');
  });

  it('serial ownership blocks mock ingestion and cancellation releases the reader', async () => {
    let time = 1000;
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let closed = 0;
    const stream = new ReadableStream<Uint8Array>({ start(c) { controller = c; } });
    const port: SerialPortLike = { readable: stream, async open() {}, async close() { expect(stream.locked).toBe(false); closed++; }, getInfo: () => ({}) };
    const input = createInputFacade({ now: () => time, secureContext: true,
      serial: { requestPort: async () => port, getPorts: async () => [port] } });
    const device = await input.requestDevice();
    expect(device.ok).toBe(true);
    if (!device.ok) throw new Error(device.reason);
    expect((await input.connect(device.value.id, DEFAULT_SERIAL_SETTINGS)).ok).toBe(true);
    controller.enqueue(new TextEncoder().encode('[0,0,0,0,0,0,0]'));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(input.snapshot(time).status.source).toBe('serial');
    expect(input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE).ok).toBe(true);
    const raw = input.snapshot(time).raw!;
    expect((await input.connect(device.value.id, DEFAULT_SERIAL_SETTINGS)).ok).toBe(false);
    expect(input.snapshot(time).control.mode).toBe('tool');
    expect(input.ingest({ ...raw, source: 'mock', sequence: 2 }).ok).toBe(false);
    time = 1260;
    expect(input.snapshot(time).control.mode).toBe('paused');
    await input.disconnect();
    expect(closed).toBe(1);
    expect(input.ingest({ ...raw, source: 'mock', sequence: 1, receivedAtMs: time }).ok).toBe(true);
    expect(input.snapshot(time).control.mode).toBe('paused');
    await input.dispose();
  });

  it('a later dispose retries cleanup after a transient close failure', async () => {
    let closes = 0;
    const port: SerialPortLike = {
      readable: new ReadableStream<Uint8Array>(), async open() {}, getInfo: () => ({}),
      async close() { closes++; if (closes === 1) throw new Error('transient-close'); },
    };
    const input = createInputFacade({ now: () => 1000, secureContext: true,
      serial: { requestPort: async () => port, getPorts: async () => [port] } });
    const devices = await input.refreshGrantedDevices();
    expect((await input.connect(devices[0]!.id, DEFAULT_SERIAL_SETTINGS)).ok).toBe(true);
    await input.dispose();
    expect(closes).toBe(1);
    await input.dispose();
    expect(closes).toBe(2);
  });
});

describe('discrete synthetic providers', () => {
  it('manual movement is sampled explicitly at 50Hz, with truthful static samples', () => {
    const { input, now, setTime } = setup();
    const manual = createManualSource(input, { now });
    expect(manual.tick().ok).toBe(true);
    input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    manual.move([5, 2, 3], 10, 20);
    manual.tick();
    expect(input.snapshot(now()).raw?.positionMm).toEqual([0, 0, 0]);
    setTime(1020); manual.tick();
    expect(input.snapshot(now()).raw?.positionMm).toEqual([5, 2, 3]);
    expect(input.snapshot(now()).raw?.yawDeg).toBe(10);
    setTime(1040); manual.tick();
    expect(input.snapshot(now()).raw?.sequence).toBe(3);
    expect(manual.move([NaN, 0, 0]).ok).toBe(false);
    manual.reset(); manual.tick();
    expect(input.snapshot(now()).raw?.positionMm).toEqual([0, 0, 0]);
    expect(input.snapshot(now()).control.mode).toBe('paused');
    manual.dispose(); expect(manual.tick().ok).toBe(false);
  });

  it('provider tick uses its own epoch when external app start predates construction', () => {
    const { input, now, setTime } = setup();
    const appStart = now();
    setTime(1005);
    const driver = createReplayDriver(input, CAMERA_REPLAY, { now });
    setTime(1025);
    expect(driver.advanceTo(now() - appStart).ok).toBe(false);
    expect(driver.tick().ok).toBe(true);
    expect(input.snapshot(now()).raw?.sequence).toBe(2);
  });

  it('replay dispatches each sample once and preserves original timeline ages', () => {
    const { input, now, setTime } = setup();
    const replay = createReplayDriver(input, CAMERA_REPLAY, { now });
    expect(replay.advanceTo(0).ok).toBe(true);
    input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    setTime(1040); expect(replay.advanceTo(40).ok).toBe(true);
    const before = input.snapshot(now());
    expect(before.raw?.sequence).toBe(3);
    for (let i = 0; i < 100; i++) expect(replay.advanceTo(40).ok).toBe(true);
    expect(input.snapshot(now()).raw).toEqual(before.raw);
    setTime(1400); replay.advanceTo(400);
    expect(input.snapshot(now()).status.sampleAgeMs).toBe(360);
    expect(input.snapshot(now()).control.mode).toBe('paused');
    expect(replay.advanceTo(399).ok).toBe(false);
    replay.reset(); expect(replay.advanceTo(0).ok).toBe(true);
    expect(input.snapshot(now()).control.mode).toBe('paused');
    replay.dispose(); expect(replay.advanceTo(0).ok).toBe(false);
  });

  it('mock sampling is discrete, deterministic and reset requires rebase', () => {
    const a = setup(); const b = setup();
    const first = createMockDriver(a.input, { now: a.now });
    const second = createMockDriver(b.input, { now: b.now });
    first.advanceTo(0); second.advanceTo(0);
    expect(a.input.snapshot(a.now()).raw).toEqual(b.input.snapshot(b.now()).raw);
    a.input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    a.setTime(1019); first.advanceTo(19);
    expect(a.input.snapshot(a.now()).raw?.sequence).toBe(1);
    expect(a.input.snapshot(a.now()).status.sampleAgeMs).toBe(19);
    a.setTime(1020); first.advanceTo(20);
    expect(a.input.snapshot(a.now()).raw?.sequence).toBe(2);
    first.reset(); first.advanceTo(0);
    expect(a.input.snapshot(a.now()).control.mode).toBe('paused');
    first.dispose(); expect(first.advanceTo(0).ok).toBe(false);
  });

  it('rejects invalid fixture ordering and future playback without samples', () => {
    const { input, now } = setup();
    expect(() => createReplayDriver(input, [CAMERA_REPLAY[1]!, CAMERA_REPLAY[0]!], { now })).toThrow('invalid-replay-fixture');
    expect(() => createMockDriver(input, { now, intervalMs: 0 })).toThrow('invalid-mock-interval');
    const replay = createReplayDriver(input, CAMERA_REPLAY, { now });
    expect(replay.advanceTo(100).ok).toBe(false);
    expect(input.snapshot(now()).raw).toBe(null);
  });
});

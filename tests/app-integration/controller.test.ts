import { describe, expect, it, vi } from 'vitest';
import { attachControls, createController } from '../../src/app/controller';
import { CAMERA_HOME, DEFAULT_SERIAL_SETTINGS, INITIAL_TOOL_POSE } from '../../src/contracts';
import type { ControlFrame, InputFacade, InputSnapshot, TrainingState, ToolPose, UiSnapshot, SceneSnapshot } from '../../src/contracts';
import { cameraPosition } from '../../src/app/camera';

function harness(overrides: Partial<InputFacade> = {}) {
  const applied: ToolPose = { ...INITIAL_TOOL_POSE, positionMm: [40, 18, 0] };
  let frame: ControlFrame = { sequence: 1, receivedAtMs: 1000, source: 'mock', fresh: true, mode: 'tool', requestedPose: { ...applied, positionMm: [100, 18, 0] }, frozenPose: null, cameraOffsetMm: [0, 0, 0], cameraSession: 0, calibrationRevision: 1, pauseReason: null };
  const state: TrainingState = { applied: { pose: applied, requestedPose: frame.requestedPose, contactIds: ['barrier'], contactEpisodes: 1, mismatch: true }, exercise: { mode: 'reach', phase: 'running', target: null, targetIndex: 0, targetCount: 3, positionErrorMm: null, directionErrorRad: null, dwellMs: 0, elapsedMs: 0, pathMm: 0, contactEpisodes: 1, steadinessMm: 0, pauseReason: null, feedback: '' }, obstacles: [] };
  const snapshot = (): InputSnapshot => ({ raw: null, control: frame, status: { connection: 'connected', source: 'mock', packetRateHz: 50, sampleAgeMs: frame.fresh ? 0 : 300, invalidPackets: 0, deviceLabel: 'test fixture', calibration: 'valid', error: null } });
  const enter = vi.fn((pose: ToolPose) => { frame = { ...frame, mode: 'camera', frozenPose: pose, cameraSession: 1 }; return { ok: true as const, value: undefined }; });
  const exit = vi.fn(() => frame.fresh ? { ok: true as const, value: undefined } : { ok: false as const, reason: 'stale-input' });
  const pause = vi.fn((reason: string) => { frame = { ...frame, mode: 'paused', pauseReason: reason }; });
  const resume = vi.fn(() => { frame = { ...frame, mode: 'tool', frozenPose: null }; return { ok: true as const, value: undefined }; });
  const input: InputFacade = { requestDevice: async () => ({ ok: false, reason: 'not used' }), refreshGrantedDevices: async () => [], connect: async () => ({ ok: false, reason: 'not used' }), disconnect: async () => {}, ingest: () => ({ ok: true, value: undefined }), snapshot, enterCameraMode: enter, exitCameraMode: exit, pause, resume, calibrate: () => ({ ok: true, value: undefined }), dispose: async () => {}, ...overrides };
  const sceneRender = vi.fn<(snapshot: SceneSnapshot) => void>();
  const uiRender = vi.fn<(snapshot: UiSnapshot) => void>();
  const trainingPause = vi.fn();
  const onSource = vi.fn();
  const controller = createController({ input, training: { step: () => state, start: vi.fn(), reset: vi.fn(), pause: trainingPause }, scene: { render: sceneRender, resize() {}, dispose() {} }, ui: { render: uiRender, dispose() {} }, now: () => 1000, onSource });
  return { controller, onSource, applied, enter, exit, resume, pause, trainingPause, sceneRender, uiRender, setFrame: (patch: Partial<ControlFrame>) => { frame = { ...frame, ...patch }; } };
}

describe('app facade wiring', () => {
  it('passes collision-applied pose, not raw requested position, to camera entry/release', () => {
    const h = harness();
    h.controller.spaceDown();
    expect(h.enter).toHaveBeenCalledWith(h.applied);
    h.controller.tick();
    h.controller.spaceUp();
    expect(h.exit).toHaveBeenCalledWith(h.applied);
  });
  it('applies the cumulative camera frame idempotently and leaves tool state alone', () => {
    const h = harness(); h.controller.spaceDown();
    h.setFrame({ cameraOffsetMm: [5, 2, 3] });
    for (let i = 0; i < 100; i++) h.controller.tick(1000 + i);
    expect(h.sceneRender.mock.lastCall?.[0].cameraPositionMm).toEqual(cameraPosition(CAMERA_HOME, [5, 2, 3]));
    expect(h.sceneRender.mock.lastCall?.[0].applied.pose).toEqual(h.applied);
    h.setFrame({ cameraOffsetMm: [10, 0, 0] }); h.controller.tick();
    expect(h.sceneRender.mock.lastCall?.[0].cameraPositionMm).toEqual([10, 100, 180]);
  });
  it('stale release pauses both facades; a fresh packet alone never invokes resume', async () => {
    const h = harness(); h.controller.spaceDown(); h.setFrame({ fresh: false }); h.controller.spaceUp();
    expect(h.pause).toHaveBeenCalledWith('stale-input');
    expect(h.trainingPause).toHaveBeenCalledWith('stale-input');
    h.setFrame({ fresh: true }); h.controller.tick();
    expect(h.resume).not.toHaveBeenCalled();
    expect(h.uiRender.mock.lastCall?.[0].cameraAdjusting).toBe(false);
    await h.controller.command({ type: 'resume' });
    expect(h.resume).toHaveBeenCalledWith(h.applied);
  });
  it('detects stale input during a hold and freezes the camera at its last applied translation', () => {
    const h = harness(); h.controller.spaceDown(); h.setFrame({ cameraOffsetMm: [5, 0, 0] }); h.controller.tick();
    h.setFrame({ fresh: false, cameraOffsetMm: [90, 0, 0] }); h.controller.tick();
    expect(h.sceneRender.mock.lastCall?.[0].cameraPositionMm).toEqual([5, 100, 180]);
    expect(h.pause).toHaveBeenCalled();
  });
  it('routes a single Space hold, ignores repeat, and cleans up on blur and disposal', () => {
    const h = harness(); const win = new EventTarget(); const doc = new EventTarget();
    const detach = attachControls(h.controller, win, doc);
    const key = (type: string, repeat = false) => Object.assign(new Event(type, { cancelable: true }), { code: 'Space', repeat });
    const first = key('keydown'); win.dispatchEvent(first); const repeated = key('keydown', true); win.dispatchEvent(repeated); expect(repeated.defaultPrevented).toBe(true);
    expect(first.defaultPrevented).toBe(true); expect(h.enter).toHaveBeenCalledTimes(1);
    win.dispatchEvent(new Event('blur')); win.dispatchEvent(key('keyup'));
    expect(h.pause).toHaveBeenCalledWith('Window lost focus'); expect(h.exit).not.toHaveBeenCalled();
    detach(); win.dispatchEvent(key('keydown')); expect(h.enter).toHaveBeenCalledTimes(1);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('connection intent ordering', () => {
  it.each(['source', 'disconnect'] as const)('ignores a delayed chooser after %s', async type => {
    const chooser = deferred<Awaited<ReturnType<InputFacade['requestDevice']>>>();
    const requestDevice = vi.fn(() => chooser.promise);
    const connect = vi.fn<InputFacade['connect']>();
    const disconnect = vi.fn(async () => {});
    const h = harness({ requestDevice, connect, disconnect });
    const pending = h.controller.command({ type: 'connect', settings: DEFAULT_SERIAL_SETTINGS });
    expect(requestDevice).toHaveBeenCalledTimes(1); // before any microtask / await
    await h.controller.command(type === 'source' ? { type, source: 'mock' } : { type });
    chooser.resolve({ ok: true, value: { id: 'obsolete', label: 'old device' } });
    await pending;
    expect(connect).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
    if (type === 'source') expect(h.onSource).toHaveBeenCalledWith('mock');
  });

  it('suppresses a cancelled chooser rejection after a new source intent', async () => {
    const chooser = deferred<Awaited<ReturnType<InputFacade['requestDevice']>>>();
    const h = harness({ requestDevice: () => chooser.promise });
    const pending = h.controller.command({ type: 'connect', settings: DEFAULT_SERIAL_SETTINGS });
    await h.controller.command({ type: 'source', source: 'replay' });
    chooser.reject(new Error('obsolete chooser failure'));
    await pending;
    h.controller.tick();
    expect(h.uiRender.mock.lastCall?.[0].input.status.error).toBeNull();
  });

  it.each(['source', 'disconnect'] as const)('closes an obsolete in-flight port before completing %s', async type => {
    const opened = deferred<Awaited<ReturnType<InputFacade['connect']>>>();
    const events: string[] = [];
    const h = harness({
      requestDevice: async () => ({ ok: true, value: { id: 'device', label: 'device' } }),
      connect: () => { events.push('open'); return opened.promise; },
      disconnect: async () => { events.push('close'); },
    });
    const pending = h.controller.command({ type: 'connect', settings: DEFAULT_SERIAL_SETTINGS });
    await vi.waitFor(() => expect(events).toEqual(['open']));
    const sourceChange = h.controller.command(type === 'source' ? { type, source: 'mock' } : { type });
    expect(h.onSource).not.toHaveBeenCalled();
    opened.resolve({ ok: true, value: undefined });
    await Promise.all([pending, sourceChange]);
    expect(events[0]).toBe('open');
    expect(events.slice(1).every(event => event === 'close')).toBe(true);
    expect(events.length).toBeGreaterThan(1);
    if (type === 'source') expect(h.onSource).toHaveBeenCalledWith('mock');
    else expect(h.onSource).not.toHaveBeenCalled();
    expect(h.resume).not.toHaveBeenCalled();
  });

  it('does not open a device selected after controller disposal', async () => {
    const chooser = deferred<Awaited<ReturnType<InputFacade['requestDevice']>>>();
    const connect = vi.fn<InputFacade['connect']>();
    const h = harness({ requestDevice: () => chooser.promise, connect });
    const pending = h.controller.command({ type: 'connect', settings: DEFAULT_SERIAL_SETTINGS });
    h.controller.dispose();
    chooser.resolve({ ok: true, value: { id: 'late', label: 'late' } });
    await pending;
    expect(connect).not.toHaveBeenCalled();
  });
});

describe('Space in setup controls', () => {
  it.each(['summary', 'empty-editable', 'inherited-editable'])('preserves native behavior for %s', kind => {
    const h = harness();
    const win = new EventTarget();
    const detach = attachControls(h.controller, win, new EventTarget());
    const key = Object.assign(new Event('keydown', { cancelable: true }), { code: 'Space', repeat: false });
    // Small event target doubles avoid introducing a DOM dependency for routing.
    Object.defineProperty(key, 'target', { value: {
      isContentEditable: kind === 'inherited-editable',
      closest: (selector: string) => kind === 'summary' ? selector.includes('summary') : kind === 'empty-editable' ? selector.includes('[contenteditable=""]') : false,
    } });
    win.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
    expect(h.enter).not.toHaveBeenCalled();
    detach();
  });
});

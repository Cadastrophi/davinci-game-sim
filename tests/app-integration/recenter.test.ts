import { describe, expect, it } from 'vitest';
import { createInputFacade, createManualSource } from '../../src/input';
import { createTraining } from '../../src/training';
import { attachControls, createController } from '../../src/app/controller';
import { CAMERA_HOME, DEFAULT_CALIBRATION, INITIAL_TOOL_POSE, type SceneSnapshot, type Vec3 } from '../../src/contracts';

function setup() {
  let time = 1000;
  const input = createInputFacade({ now: () => time, serial: null });
  const provider = createManualSource(input, { now: () => time });
  provider.tick(); input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
  let rendered!: SceneSnapshot;
  const controller = createController({ input, training: createTraining(), now: () => time, onSource() {},
    scene: { render: value => { rendered = value; }, resize() {}, dispose() {} }, ui: { render() {}, dispose() {} } });
  controller.tick();
  return { input, provider, controller, state: () => rendered,
    move(delta: Vec3 = [0, 0, 0], yaw = 0, pitch = 0, elapsed = 20) {
      provider.move(delta, yaw, pitch); time += elapsed; provider.tick(); controller.tick();
    },
    gap() { time += 300; controller.tick(); },
    async dispose() { provider.dispose(); await controller.dispose(); await input.dispose(); },
  };
}
function expectPose(actual: SceneSnapshot['applied']['pose'], expected: SceneSnapshot['applied']['pose']) {
  expect(actual.positionMm).toEqual(expected.positionMm);
  expect(actual.directionKind).toBe(expected.directionKind);
  actual.direction!.forEach((n, i) => expect(n).toBeCloseTo(expected.direction![i]!, 10));
}

describe('Shift recenter with real input and training', () => {
  it('freezes an adjusted camera and full applied pose, then rebases at release', async () => {
    const h = setup(); await h.controller.command({ type: 'start', mode: 'free' });
    h.move([4, 2, 1], 15, 10);
    h.controller.spaceDown(); h.move([8, 5, 3]);
    const camera = h.state().cameraPositionMm;
    const pose = h.state().applied.pose;
    expect(camera).not.toEqual(CAMERA_HOME);
    h.controller.recenterDown(); // Shift takes over an existing Space hold.
    h.controller.spaceUp(); h.controller.spaceDown();
    for (let i = 0; i < 20; i++) h.move([10, 3, 4], 4, 2);
    expectPose(h.state().applied.pose, pose);
    expect(h.state().cameraPositionMm).toEqual(camera);
    expect(h.state().exercise.phase).toBe('paused');
    h.controller.recenterUp(); h.controller.tick();
    expectPose(h.state().applied.pose, pose);
    expect(h.state().cameraPositionMm).toEqual(camera);
    h.move([1, 0, 0]);
    expect(h.state().applied.pose.positionMm[0]).toBeCloseTo(pose.positionMm[0] + 1, 10);
    await h.dispose();
  });

  it('rebases at collision-applied position instead of the blocked request', async () => {
    const h = setup(); await h.controller.command({ type: 'start', mode: 'free' }); h.move([40, -2, 0]);
    await h.controller.command({ type: 'start', mode: 'incision' }); h.move([-65, 0, 0]);
    expect(h.state().applied.mismatch).toBe(true);
    const pose = h.state().applied.pose;
    h.controller.recenterDown(); h.move([100, 20, 10], 40, 20); h.controller.recenterUp(); h.controller.tick();
    expectPose(h.state().applied.pose, pose); expect(h.state().incision?.coverage01).toBe(0);
    await h.dispose();
  });

  it('never cuts or accumulates exercise time while recentering', async () => {
    const h = setup(); await h.controller.command({ type: 'start', mode: 'incision' }); h.move();
    const before = h.state(); h.controller.recenterDown();
    for (let i = 0; i < 20; i++) h.move([2, 0, 0]);
    expect(h.state().incision?.coverage01).toBe(0);
    expect(h.state().exercise.elapsedMs).toBe(before.exercise.elapsedMs);
    h.controller.recenterUp(); h.controller.tick();
    expect(h.state().incision?.coverage01).toBe(0);
    h.move([2, 0, 0]);
    expect(h.state().incision?.coverage01).toBeGreaterThan(0);
    await h.dispose();
  });

  it.each(['observed stale', 'unobserved stale', 'pause', 'disconnect', 'source'] as const)('keeps %s interruptions paused after release', async reason => {
    const h = setup(); await h.controller.command({ type: 'start', mode: 'free' }); h.move([2, 0, 0]);
    const pose = h.state().applied.pose; h.controller.recenterDown();
    if (reason === 'observed stale') h.gap();
    if (reason === 'pause') await h.controller.command({ type: 'pause' });
    if (reason === 'disconnect') await h.controller.command({ type: 'disconnect' });
    if (reason === 'source') await h.controller.command({ type: 'source', source: 'replay' });
    h.move([100, 0, 0], 40, 20, reason === 'unobserved stale' ? 300 : 20);
    h.controller.recenterUp(); h.controller.tick();
    expect(h.state().exercise.phase).toBe('paused'); expectPose(h.state().applied.pose, pose);
    await h.dispose();
  });

  it('does not bypass an existing pause or allow practice commands during a hold', async () => {
    const h = setup(); await h.controller.command({ type: 'start', mode: 'free' });
    await h.controller.command({ type: 'pause' }); h.controller.recenterDown(); h.move([50, 0, 0]); h.controller.recenterUp(); h.controller.tick();
    expect(h.state().exercise.phase).toBe('paused');
    await h.controller.command({ type: 'resume' }); h.controller.recenterDown();
    for (const type of ['resume', 'reset'] as const) await h.controller.command({ type });
    await h.controller.command({ type: 'start', mode: 'incision' });
    await h.controller.command({ type: 'calibrate', config: DEFAULT_CALIBRATION });
    h.move([50, 0, 0]); expect(h.state().exercise.mode).toBe('free'); expect(h.state().exercise.phase).toBe('paused');
    h.controller.recenterUp(); h.controller.tick(); expect(h.state().exercise.phase).toBe('running');
    await h.dispose();
  });
});

function key(type: string, code: string, repeat = false) { return Object.assign(new Event(type, { cancelable: true }), { code, repeat }); }
describe('Shift routing', () => {
  it('waits for both Shift keys, ignores repeat, and cancels release-to-resume on blur', async () => {
    const h = setup(); await h.controller.command({ type: 'start', mode: 'free' });
    const win = new EventTarget(); const doc = new EventTarget(); const detach = attachControls(h.controller, win, doc);
    win.dispatchEvent(key('keydown', 'ShiftLeft')); win.dispatchEvent(key('keydown', 'ShiftLeft', true));
    win.dispatchEvent(key('keydown', 'ShiftRight')); h.move([10, 0, 0]);
    win.dispatchEvent(key('keyup', 'ShiftLeft')); h.move([10, 0, 0]); expect(h.state().exercise.phase).toBe('paused');
    win.dispatchEvent(key('keyup', 'ShiftRight')); h.controller.tick(); expect(h.state().exercise.phase).toBe('running');
    win.dispatchEvent(key('keydown', 'ShiftLeft')); win.dispatchEvent(new Event('blur'));
    win.dispatchEvent(key('keyup', 'ShiftLeft')); h.move(); expect(h.state().exercise.phase).toBe('paused');
    detach(); await h.controller.command({ type: 'resume' }); win.dispatchEvent(key('keydown', 'ShiftLeft')); h.move();
    expect(h.state().exercise.phase).toBe('running'); await h.dispose();
  });
  it('leaves Shift typing in setup fields alone', async () => {
    const h = setup(); await h.controller.command({ type: 'start', mode: 'free' });
    const win = new EventTarget(); const detach = attachControls(h.controller, win, new EventTarget());
    const event = key('keydown', 'ShiftLeft');
    Object.defineProperty(event, 'target', { value: { closest: () => true } });
    win.dispatchEvent(event); h.move([1, 0, 0]);
    expect(event.defaultPrevented).toBe(false); expect(h.state().exercise.phase).toBe('running');
    detach(); await h.dispose();
  });
});

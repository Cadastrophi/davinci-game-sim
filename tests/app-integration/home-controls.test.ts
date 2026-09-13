import { describe, expect, it, vi } from 'vitest';
import { createController } from '../../src/app/controller';
import { CAMERA_HOME, DEFAULT_CALIBRATION, INITIAL_TOOL_POSE, type SceneSnapshot, type UiSnapshot, type Vec3 } from '../../src/contracts';
import { createInputFacade, createManualSource } from '../../src/input';
import { createTraining } from '../../src/training';

function setup() {
  let time = 1000;
  const input = createInputFacade({ now: () => time, serial: null });
  const provider = createManualSource(input, { now: () => time });
  provider.tick();
  expect(input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE).ok).toBe(true);
  let rendered!: SceneSnapshot;
  const uiRender = vi.fn<(snapshot: UiSnapshot) => void>();
  const controller = createController({
    input,
    training: createTraining(),
    now: () => time,
    onSource() {},
    scene: { render: value => { rendered = value; }, resize() {}, dispose() {} },
    ui: { render: uiRender, dispose() {} },
  });
  controller.tick();
  return {
    controller,
    uiRender,
    state: () => rendered,
    move(delta: Vec3) {
      provider.move(delta);
      time += 20;
      provider.tick();
      controller.tick();
    },
    async dispose() {
      provider.dispose();
      await controller.dispose();
      await input.dispose();
    },
  };
}

describe('home calibration and control feedback', () => {
  it('maps the raw pose held during set center to the simulator home pose', async () => {
    const h = setup();
    await h.controller.command({ type: 'start', mode: 'free' });
    h.move([24, 7, -11]);
    expect(h.state().applied.pose.positionMm).not.toEqual(INITIAL_TOOL_POSE.positionMm);

    await h.controller.command({ type: 'calibrate', config: DEFAULT_CALIBRATION });
    h.controller.tick();

    expect(h.state().applied.pose).toEqual(INITIAL_TOOL_POSE);
    await h.dispose();
  });

  it('returns the instrument and camera to home on reset', async () => {
    const h = setup();
    await h.controller.command({ type: 'start', mode: 'free' });
    h.move([18, 4, -9]);
    h.controller.spaceDown();
    h.move([6, 3, 2]);
    h.controller.spaceUp();
    h.controller.tick();
    expect(h.state().applied.pose.positionMm).not.toEqual(INITIAL_TOOL_POSE.positionMm);
    expect(h.state().cameraPositionMm).not.toEqual(CAMERA_HOME);

    await h.controller.command({ type: 'reset' });
    h.controller.tick();

    expect(h.state().applied.pose).toEqual(INITIAL_TOOL_POSE);
    expect(h.state().cameraPositionMm).toEqual(CAMERA_HOME);
    await h.dispose();
  });

  it('renders pause and resume state in the same command turn', async () => {
    const h = setup();
    await h.controller.command({ type: 'start', mode: 'free' });
    h.controller.tick();
    h.uiRender.mockClear();

    await h.controller.command({ type: 'pause' });
    expect(h.uiRender).toHaveBeenCalledTimes(1);
    expect(h.uiRender.mock.lastCall?.[0].input.control.mode).toBe('paused');

    h.uiRender.mockClear();
    await h.controller.command({ type: 'resume' });
    expect(h.uiRender).toHaveBeenCalledTimes(1);
    expect(h.uiRender.mock.lastCall?.[0].input.control.mode).toBe('tool');
    await h.dispose();
  });
});

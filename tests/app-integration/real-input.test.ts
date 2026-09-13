import { describe, expect, it } from 'vitest';
import { createInputFacade, createManualSource } from '../../src/input';
import { createTraining } from '../../src/training';
import { createController } from '../../src/app/controller';
import { CAMERA_HOME, DEFAULT_CALIBRATION, INITIAL_TOOL_POSE, type SceneSnapshot } from '../../src/contracts';

describe('real input / training / app composition', () => {
  it('freezes position and direction during cumulative pan, rebases release, and requires fresh explicit resume', async () => {
    let time = 1000;
    const input = createInputFacade({ now: () => time, serial: null });
    const provider = createManualSource(input, { now: () => time });
    provider.tick(); input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
    let rendered: SceneSnapshot | undefined;
    const controller = createController({ input, training: createTraining(), now: () => time, onSource() {},
      scene: { render: value => { rendered = value; }, resize() {}, dispose() {} }, ui: { render() {}, dispose() {} } });
    await controller.command({ type: 'start', mode: 'free' }); controller.tick();
    provider.move([10, 0, 0], 20, 10); time += 20; provider.tick(); controller.tick();
    const applied = rendered!.applied.pose;
    controller.spaceDown(); provider.move([5, 2, 3], 80, 30); time += 20; provider.tick(); controller.tick();
    expect(rendered!.applied.pose).toEqual(applied);
    expect(rendered!.cameraPositionMm).not.toEqual(CAMERA_HOME);
    const camera = rendered!.cameraPositionMm;
    for (let i = 0; i < 100; i++) controller.tick();
    expect(rendered!.cameraPositionMm).toEqual(camera);
    controller.spaceUp(); controller.tick();
    expect(rendered!.applied.pose.positionMm).toEqual(applied.positionMm);
    rendered!.applied.pose.direction!.forEach((value, i) => expect(value).toBeCloseTo(applied.direction![i]!, 10));
    expect(rendered!.cameraPositionMm).toEqual(camera);
    time += 250; controller.tick();
    provider.move([100, 50, 25], 80, 20); time += 20; provider.tick(); controller.tick();
    expect(rendered!.exercise.phase).toBe('paused');
    expect(rendered!.applied.pose.positionMm).toEqual(applied.positionMm);
    await controller.command({ type: 'resume' }); controller.tick();
    expect(rendered!.applied.pose.positionMm).toEqual(applied.positionMm);
    rendered!.applied.pose.direction!.forEach((value, i) => expect(value).toBeCloseTo(applied.direction![i]!, 10));
    provider.dispose(); await controller.dispose(); await input.dispose();
  });
});

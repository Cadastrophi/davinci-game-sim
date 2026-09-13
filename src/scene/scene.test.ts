import { afterEach, describe, expect, it } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CAMERA_HOME, INITIAL_TOOL_POSE } from '../contracts';
import type { SceneSnapshot } from '../contracts';
import { createSceneRuntime } from './index';

const snapshot = (): SceneSnapshot => ({
  applied: { pose: INITIAL_TOOL_POSE, requestedPose: INITIAL_TOOL_POSE, contactIds: [], contactEpisodes: 0, mismatch: false },
  exercise: { mode: 'free', phase: 'running', target: null, targetIndex: 0, targetCount: 0, positionErrorMm: null, directionErrorRad: null, dwellMs: 0, elapsedMs: 0, pathMm: 0, contactEpisodes: 0, steadinessMm: 0, pauseReason: null, feedback: '' },
  obstacles: [], cameraPositionMm: CAMERA_HOME, showTrail: false,
});
const disposals: (() => void)[] = [];
afterEach(() => { for (const dispose of disposals.splice(0)) dispose(); });
const setup = () => {
  const runtime = createSceneRuntime(new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 512, deterministicLockstep: false, lockstepMaxSteps: 4 }));
  disposals.push(() => runtime.facade.dispose());
  return runtime;
};

describe('scene snapshot integration', () => {
  it('translates camera without changing attitude/FOV or world tool pose', () => {
    const { facade, scene, camera } = setup();
    const first = snapshot();
    facade.render(first);
    const rotation = camera.rotation.clone();
    const fov = camera.fov;
    const tool = scene.getTransformNodeByName('applied-tool')!;
    const toolPosition = tool.position.clone();
    facade.render({ ...first, cameraPositionMm: [30, 120, 160] });
    expect(camera.position.asArray()).toEqual([30, 120, 160]);
    expect(camera.rotation.equalsWithEpsilon(rotation, 1e-7)).toBe(true);
    expect(camera.fov).toBe(fov);
    expect(tool.position.equals(toolPosition)).toBe(true);
  });

  it('puts the blade tip at applied pose and points local -Z along supported direction', () => {
    const { facade, scene } = setup();
    const first = snapshot();
    const pose = { ...INITIAL_TOOL_POSE, positionMm: [20, 25, -12] as const, direction: [1, 0, 0] as const };
    facade.render({ ...first, applied: { ...first.applied, pose, mismatch: true } });
    const tool = scene.getTransformNodeByName('applied-tool')!;
    tool.computeWorldMatrix(true);
    const worldTip = Vector3.TransformCoordinates(Vector3.Zero(), tool.getWorldMatrix());
    const forward = Vector3.TransformNormal(new Vector3(0, 0, -1), tool.getWorldMatrix());
    expect(worldTip.asArray()).toEqual([20, 25, -12]);
    expect(Vector3.Distance(forward, new Vector3(1, 0, 0))).toBeLessThan(1e-6);
    expect(scene.getTransformNodeByName('requested-tool')!.isEnabled()).toBe(true);
    facade.render(first);
    expect(scene.getTransformNodeByName('requested-tool')!.isEnabled()).toBe(false);
  });

  it('updates targets/obstacles and keeps repeated rendering and trail geometry bounded', () => {
    const { facade, scene } = setup();
    const first = snapshot();
    const current: SceneSnapshot = { ...first, showTrail: true, obstacles: [{ id: 'one', min: [-10, 8, -5], max: [10, 20, 5] }], exercise: { ...first.exercise, mode: 'reach', target: { id: 'target', positionMm: [20, 25, 0], direction: [0, 1, 0], positionToleranceMm: 8, directionToleranceRad: 0.2, dwellMs: 500 } } };
    facade.render(current);
    const meshCount = scene.meshes.length;
    for (let i = 0; i < 120; i++) facade.render({ ...current, applied: { ...current.applied, pose: { ...INITIAL_TOOL_POSE, positionMm: [i / 2, 18, 0] } } });
    expect(scene.meshes.length).toBe(meshCount);
    expect(scene.getMeshByName('tool-trail')!.getTotalVertices()).toBe(96);
    expect(scene.getMeshByName('obstacle-one')!.scaling.asArray()).toEqual([20, 12, 10]);
    expect(scene.getTransformNodeByName('target')!.position.asArray()).toEqual([20, 25, 0]);
    facade.render(first);
    expect(scene.getMeshByName('obstacle-one')).toBeNull();
    expect(scene.getTransformNodeByName('target')!.isEnabled()).toBe(false);
    facade.dispose();
    expect(scene.isDisposed).toBe(true);
    expect(() => facade.render(first)).not.toThrow();
  });

  it('uses the single-arm first-person presentation only for navigation tasks', () => {
    const { facade, scene } = setup();
    const first = snapshot();
    const navigation = { ...first, exercise: { ...first.exercise, mode: 'obstacle' as const } };
    facade.render(navigation);
    expect(scene.layers.find(layer => layer.name === 'navigation-anatomical-background')?.isEnabled).toBe(true);
    expect(scene.getTransformNodeByName('first-person-instrument')?.isEnabled()).toBe(true);
    expect(scene.getTransformNodeByName('applied-tool')?.isEnabled()).toBe(false);
    expect(scene.getMeshByName('anatomical-practice-pad')?.isEnabled()).toBe(false);

    const rig = scene.getTransformNodeByName('first-person-instrument')!;
    const initial = rig.position.clone();
    facade.render({ ...navigation, applied: { ...navigation.applied, pose: { ...INITIAL_TOOL_POSE, positionMm: [30, 38, -20] } } });
    expect(Vector3.Distance(initial, rig.position)).toBeGreaterThan(1);

    facade.render({ ...first, exercise: { ...first.exercise, mode: 'incision' } });
    expect(scene.layers.find(layer => layer.name === 'navigation-anatomical-background')?.isEnabled).toBe(false);
    expect(rig.isEnabled()).toBe(false);
    expect(scene.getTransformNodeByName('applied-tool')?.isEnabled()).toBe(true);
    expect(scene.getMeshByName('anatomical-practice-pad')?.isEnabled()).toBe(true);
  });
});

import { Scene } from '@babylonjs/core/scene';
import { Layer } from '@babylonjs/core/Layers/layer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import type { ExerciseMode, ToolPose } from '../contracts';
import { INITIAL_TOOL_POSE } from '../contracts';
import { material } from './environment';

const NAVIGATION_MODES = new Set<ExerciseMode>(['align', 'obstacle', 'camera']);

export function usesFirstPersonNavigation(mode: ExerciseMode): boolean {
  return NAVIGATION_MODES.has(mode);
}

/** A camera-space single-arm viewmodel. It is presentation only; collision and scoring
 * continue to use the world-space applied pose supplied in the scene snapshot. */
export function createFirstPersonNavigation(scene: Scene, camera: Camera) {
  const background = new Layer(
    'navigation-anatomical-background',
    '/assets/environment/anatomical-cavity-navigation.png',
    scene,
    true,
  );
  background.scale = new Vector2(1.04, 1.04);
  background.isEnabled = false;

  const root = new TransformNode('first-person-instrument', scene);
  root.parent = camera;
  root.setEnabled(false);

  const steel = material(scene, 'first-person-steel', '#777275', 115);
  steel.specularColor.set(0.42, 0.31, 0.28);
  steel.disableDepthWrite = true;
  const darkSteel = material(scene, 'first-person-joints', '#272a30', 80);
  darkSteel.disableDepthWrite = true;
  const sleeve = material(scene, 'first-person-sleeve', '#16181d', 30);
  sleeve.disableDepthWrite = true;

  const meshes: Mesh[] = [];
  const arm = CreateTube('first-person-arm', {
    path: [new Vector3(35, -27, 4), new Vector3(22, -19, 2), new Vector3(10, -10, -1)],
    radius: 5.25,
    tessellation: 24,
    cap: 3,
  }, scene);
  arm.material = sleeve;
  arm.parent = root;
  meshes.push(arm);

  const collar = CreateSphere('first-person-collar', { diameter: 8.2, segments: 20 }, scene);
  collar.position.set(9.5, -9.5, -1);
  collar.scaling.set(1.1, 0.75, 0.75);
  collar.material = steel;
  collar.parent = root;
  meshes.push(collar);

  const joint = CreateSphere('first-person-wrist-joint', { diameter: 5.8, segments: 20 }, scene);
  joint.position.set(5.5, -5.8, -3.8);
  joint.material = darkSteel;
  joint.parent = root;
  meshes.push(joint);

  const wrist = CreateTube('first-person-wrist', {
    path: [new Vector3(6, -6, -4), new Vector3(1.5, -1.2, -8.5)],
    radius: 2.45,
    tessellation: 18,
    cap: 3,
  }, scene);
  wrist.material = steel;
  wrist.parent = root;
  meshes.push(wrist);

  for (const side of [-1, 1] as const) {
    const jaw = CreateBox(`first-person-jaw-${side < 0 ? 'left' : 'right'}`, { width: 1.15, height: 1.35, depth: 10 }, scene);
    jaw.position.set(side * 1.25 + 0.5, 0.5 + side * 0.7, -13.2);
    jaw.rotation.y = side * 0.1;
    jaw.rotation.z = side * 0.14;
    jaw.material = steel;
    jaw.parent = root;
    meshes.push(jaw);
  }
  for (const mesh of meshes) {
    mesh.isPickable = false;
    mesh.renderingGroupId = 3;
    mesh.alwaysSelectAsActiveMesh = true;
  }

  return {
    background,
    root,
    update(mode: ExerciseMode, pose: ToolPose) {
      const enabled = usesFirstPersonNavigation(mode);
      background.isEnabled = enabled;
      root.setEnabled(enabled);
      if (!enabled) return;

      const dx = pose.positionMm[0] - INITIAL_TOOL_POSE.positionMm[0];
      const dy = pose.positionMm[1] - INITIAL_TOOL_POSE.positionMm[1];
      const dz = pose.positionMm[2] - INITIAL_TOOL_POSE.positionMm[2];
      root.position.copyFromFloats(
        5 + Math.max(-7, Math.min(7, dx * 0.11)),
        -3 + Math.max(-6, Math.min(6, dy * 0.1)),
        -55 + Math.max(-7, Math.min(7, dz * 0.08)),
      );
      const direction = pose.direction ?? [0, 0, -1];
      root.rotation.copyFromFloats(
        Math.max(-0.16, Math.min(0.16, direction[1] * 0.22)),
        -Math.max(-0.2, Math.min(0.2, direction[0] * 0.26)),
        0,
      );
      const depthScale = 1 + Math.max(-0.08, Math.min(0.12, -dz / 350));
      root.scaling.copyFromFloats(depthScale, depthScale, depthScale);
    },
  };
}

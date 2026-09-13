import { Scene } from '@babylonjs/core/scene';
import { Layer } from '@babylonjs/core/Layers/layer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Quaternion, Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import type { ExerciseMode, ToolPose } from '../contracts';
import { INITIAL_TOOL_POSE } from '../contracts';

const NAVIGATION_MODES = new Set<ExerciseMode>(['align', 'obstacle', 'camera']);

export function usesFirstPersonNavigation(mode: ExerciseMode): boolean {
  return NAVIGATION_MODES.has(mode);
}

function pbr(scene: Scene, name: string, color: string, metallic: number, roughness: number): PBRMaterial {
  const result = new PBRMaterial(name, scene);
  result.albedoColor = Color3.FromHexString(color);
  result.metallic = metallic;
  result.roughness = roughness;
  result.environmentIntensity = 0.7;
  result.disableDepthWrite = true;
  return result;
}

function alignSegment(mesh: Mesh, from: Vector3, to: Vector3): void {
  const direction = to.subtract(from);
  mesh.position.copyFrom(from.add(to).scale(0.5));
  mesh.rotationQuaternion = Quaternion.Identity();
  Quaternion.FromUnitVectorsToRef(Vector3.Up(), direction.normalize(), mesh.rotationQuaternion);
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

  const steel = pbr(scene, 'first-person-steel', '#8f9296', 0.9, 0.23);
  const brushedSteel = pbr(scene, 'first-person-brushed-steel', '#6f747a', 0.82, 0.34);
  const darkSteel = pbr(scene, 'first-person-joints', '#25282d', 0.72, 0.3);
  const sleeve = pbr(scene, 'first-person-sleeve', '#101318', 0.12, 0.72);
  const jawSteel = pbr(scene, 'first-person-jaw-steel', '#a9adb0', 0.94, 0.2);

  const meshes: Mesh[] = [];
  const add = <T extends Mesh>(mesh: T, material: PBRMaterial): T => {
    mesh.material = material;
    mesh.parent = root;
    meshes.push(mesh);
    return mesh;
  };
  const segment = (name: string, from: Vector3, to: Vector3, diameter: number, material: PBRMaterial, diameterEnd = diameter) => {
    const mesh = add(CreateCylinder(name, {
      height: Vector3.Distance(from, to),
      diameterTop: diameterEnd,
      diameterBottom: diameter,
      tessellation: 28,
      cap: 3,
    }, scene), material);
    alignSegment(mesh, from, to);
    return mesh;
  };

  const sleeveStart = new Vector3(38, -29, 8);
  const sleeveEnd = new Vector3(19, -15, 1);
  const shaftEnd = new Vector3(8.5, -7, -4);
  const wristEnd = new Vector3(2, -1.7, -10.5);
  const jawBase = new Vector3(-1, 0.7, -14.2);
  segment('first-person-cannula-sleeve', sleeveStart, sleeveEnd, 11.8, sleeve, 8.6);
  segment('first-person-cannula-collar', new Vector3(21.5, -16.9, 1.9), new Vector3(17.1, -13.6, 0.2), 9.4, steel, 8.6);
  segment('first-person-cannula-shaft', sleeveEnd, shaftEnd, 5.1, brushedSteel, 4.6);
  segment('first-person-articulated-wrist', shaftEnd, wristEnd, 4.7, steel, 3.5);

  const wristBall = add(CreateSphere('first-person-wrist-ball', { diameter: 5.9, segments: 24 }, scene), darkSteel);
  wristBall.position.copyFrom(shaftEnd);
  const wristBand = segment('first-person-wrist-band', new Vector3(10.6, -8.7, -3.1), new Vector3(7.3, -6.1, -4.8), 5.8, steel, 5.2);
  wristBand.scaling.y = 0.82;

  for (const side of [-1, 1] as const) {
    const railFrom = wristEnd.add(new Vector3(side * 1.45, side * 0.35, 0));
    const railTo = jawBase.add(new Vector3(side * 1.25, side * 0.45, 0));
    segment(`first-person-clevis-${side < 0 ? 'left' : 'right'}`, railFrom, railTo, 1.05, brushedSteel);
  }
  segment('first-person-pivot-pin', jawBase.add(new Vector3(-3.1, 0, 0)), jawBase.add(new Vector3(3.1, 0, 0)), 1.15, steel);
  for (const side of [-1, 1] as const) {
    const cap = add(CreateSphere(`first-person-pivot-cap-${side < 0 ? 'left' : 'right'}`, { diameter: 1.8, segments: 16 }, scene), darkSteel);
    cap.position.copyFrom(jawBase.add(new Vector3(side * 3.15, 0, 0)));
    cap.scaling.x = 0.38;
  }

  const jawPaths = [
    [jawBase.add(new Vector3(-0.2, 0.95, -0.1)), new Vector3(-3.1, 3.0, -18.8), new Vector3(-7.7, 4.1, -24.3)],
    [jawBase.add(new Vector3(0.2, -0.95, 0.1)), new Vector3(-3.0, -1.5, -18.8), new Vector3(-7.6, -2.5, -24.3)],
  ];
  jawPaths.forEach((path, jawIndex) => {
    add(CreateTube(`first-person-jaw-${jawIndex + 1}`, {
      path,
      radius: 0.82,
      tessellation: 12,
      cap: 3,
    }, scene), jawSteel);
    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const tooth = add(CreateBox(`first-person-jaw-${jawIndex + 1}-tooth-${i}`, { width: 0.6, height: 0.55, depth: 0.7 }, scene), darkSteel);
      tooth.position.copyFrom(Vector3.Lerp(path[1]!, path[2]!, t));
      tooth.position.y += jawIndex === 0 ? -0.62 : 0.62;
      tooth.rotation.y = -0.55;
    }
  });

  for (const side of [-1, 1] as const) {
    segment(
      `first-person-tendon-${side < 0 ? 'left' : 'right'}`,
      new Vector3(7.2 + side * 0.7, -5.7, -5.1),
      jawBase.add(new Vector3(side * 0.72, side * 0.52, -0.5)),
      0.42,
      jawSteel,
    );
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
        3 + Math.max(-7, Math.min(7, dx * 0.11)),
        -1 + Math.max(-6, Math.min(6, dy * 0.1)),
        -57 + Math.max(-7, Math.min(7, dz * 0.08)),
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

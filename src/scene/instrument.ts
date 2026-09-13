import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import type { ToolPose } from '../contracts';
import { material } from './environment';

/** Local -Z points forward; tip is the origin. Twist is synthetic, never measured roll. */
export function applyPose(node: TransformNode, pose: ToolPose): void {
  node.position.copyFromFloats(...pose.positionMm);
  const forward = pose.direction ? new Vector3(...pose.direction) : new Vector3(0, 0, -1);
  if (forward.lengthSquared() < 1e-10) forward.set(0, 0, -1);
  forward.normalize();
  const back = forward.negate();
  const referenceUp = Math.abs(back.y) > 0.98 ? new Vector3(1, 0, 0) : Vector3.Up();
  const right = Vector3.Cross(referenceUp, back).normalize();
  const up = Vector3.Cross(back, right).normalize();
  node.rotationQuaternion = Quaternion.RotationQuaternionFromAxis(right, up, back);
}

export function createInstrument(scene: Scene, ghost: boolean): { root: TransformNode; meshes: Mesh[] } {
  const prefix = ghost ? 'requested' : 'applied';
  const root = new TransformNode(`${prefix}-tool`, scene);
  const steel = material(scene, `${prefix}-steel`, ghost ? '#ffdba1' : '#cbdce0', 120);
  if (ghost) { steel.alpha = 0.25; steel.disableLighting = true; steel.emissiveColor.copyFrom(steel.diffuseColor); }
  // A closed, bevelled blade fits the training approximation: length 16, radius <= 2 mm.
  const positions = [0, 0, 0, -1.8, 0, 9, -1.1, 0, 16, 1.1, 0, 16, 1.8, 0, 9, 0, 0.55, 9, 0, -0.55, 9];
  const indices = [0, 1, 5, 1, 2, 5, 2, 3, 5, 3, 4, 5, 4, 0, 5, 1, 0, 6, 2, 1, 6, 3, 2, 6, 4, 3, 6, 0, 4, 6];
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals, { useRightHandedSystem: true });
  const blade = new Mesh(`${prefix}-blade`, scene);
  const data = new VertexData();
  Object.assign(data, { positions, indices, normals });
  data.applyToMesh(blade);
  blade.material = steel;
  blade.parent = root;
  const handle = CreateCylinder(`${prefix}-handle`, { height: 21, diameter: 3.2, tessellation: 12 }, scene);
  handle.rotation.x = Math.PI / 2;
  handle.position.z = 26.5;
  handle.parent = root;
  handle.material = steel;
  const grip = material(scene, `${prefix}-grip`, ghost ? '#ffdda8' : '#3d6269', 50);
  if (ghost) { grip.alpha = 0.22; grip.disableLighting = true; }
  const meshes = [blade, handle];
  for (let i = 0; i < 5; i++) {
    const band = CreateCylinder(`${prefix}-grip-${i}`, { height: 1.1, diameter: 3.5, tessellation: 12 }, scene);
    band.rotation.x = Math.PI / 2;
    band.position.z = 21 + i * 3;
    band.parent = root;
    band.material = grip;
    meshes.push(band);
  }
  const tip = CreateSphere(`${prefix}-tip`, { diameter: 0.8, segments: 8 }, scene);
  tip.parent = root;
  tip.material = material(scene, `${prefix}-tip-light`, ghost ? '#ffd391' : '#c4fff0');
  meshes.push(tip);
  if (ghost) for (const mesh of meshes) { mesh.visibility = 0.45; mesh.isPickable = false; }
  return { root, meshes };
}

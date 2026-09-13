import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';

export function material(scene: Scene, name: string, color: string, shine = 32): StandardMaterial {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = Color3.FromHexString(color);
  result.specularColor = new Color3(0.3, 0.35, 0.37);
  result.specularPower = shine;
  return result;
}

/** Original stylised anatomy, entirely procedural; this surface has no collision authority. */
export function tissueHeight(x: number, z: number): number {
  const mound = (cx: number, cz: number, sx: number, sz: number) => Math.exp(-(((x - cx) / sx) ** 2) - ((z - cz) / sz) ** 2);
  return 0.8 + 3.6 * mound(-26, -3, 30, 31) + 4.7 * mound(25, 9, 33, 27)
    + 1.1 * mound(5, -28, 45, 16) + 0.13 * Math.sin(x * 0.52) * Math.sin(z * 0.45);
}

export function createEnvironment(scene: Scene): readonly Mesh[] {
  const floor = CreateGround('surgical-drape', { width: 650, height: 650 }, scene);
  floor.position.y = -9;
  floor.material = material(scene, 'deep-teal-drape', '#142d32', 9);
  floor.receiveShadows = true;
  const tray = CreateBox('instrument-tray', { width: 165, height: 3, depth: 116 }, scene);
  tray.position.y = -5;
  tray.material = material(scene, 'satin-titanium', '#5c7178', 100);
  tray.receiveShadows = true;
  const inset = CreateBox('tray-inset', { width: 151, height: 1, depth: 101 }, scene);
  inset.position.y = -3;
  inset.material = material(scene, 'tray-inset-material', '#273f43', 85);
  const rimPath: Vector3[] = [];
  for (let corner = 0; corner < 4; corner++) {
    const angle = corner * Math.PI / 2;
    const cx = corner === 0 || corner === 3 ? 74 : -74;
    const cz = corner < 2 ? 49 : -49;
    for (let i = 0; i <= 12; i++) {
      const a = angle + i / 12 * Math.PI / 2;
      rimPath.push(new Vector3(cx + Math.cos(a) * 7, -1.7, cz + Math.sin(a) * 7));
    }
  }
  rimPath.push(rimPath[0]!.clone());
  const rim = CreateTube('rolled-tray-rim', { path: rimPath, radius: 1.8, tessellation: 10 }, scene);
  rim.material = tray.material;

  const positions: number[] = [0, tissueHeight(0, 0), 0];
  const colors: number[] = [0.8, 0.47, 0.43, 1];
  const indices: number[] = [];
  const segments = 96;
  const rings = 18;
  for (let ring = 1; ring <= rings; ring++) {
    const r = ring / rings;
    for (let j = 0; j < segments; j++) {
      const a = j / segments * Math.PI * 2;
      const x = Math.sign(Math.cos(a)) * Math.sqrt(Math.abs(Math.cos(a))) * 68 * r;
      const z = Math.sign(Math.sin(a)) * Math.sqrt(Math.abs(Math.sin(a))) * 43 * r;
      const y = tissueHeight(x, z) * (1 - 0.28 * r ** 12);
      positions.push(x, y, z);
      const grain = Math.sin(x * 1.35 + Math.cos(z)) * Math.cos(z * 1.2) * 0.023;
      colors.push(0.77 + grain, 0.40 + grain + y * 0.014, 0.37 + grain + y * 0.012, 1);
      const curr = 1 + (ring - 1) * segments + j;
      const next = 1 + (ring - 1) * segments + (j + 1) % segments;
      if (ring === 1) indices.push(0, next, curr);
      else {
        const prev = curr - segments;
        const prevNext = next - segments;
        indices.push(prev, next, curr, prev, prevNext, next);
      }
    }
  }
  const sideStart = positions.length / 3;
  for (let j = 0; j < segments; j++) {
    const top = 1 + (rings - 1) * segments + j;
    positions.push(positions[top * 3]!, -2.8, positions[top * 3 + 2]!);
    colors.push(0.48, 0.22, 0.22, 1);
    const next = 1 + (rings - 1) * segments + (j + 1) % segments;
    const bottom = sideStart + j;
    const bottomNext = sideStart + (j + 1) % segments;
    indices.push(top, bottom, next, next, bottom, bottomNext);
  }
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals, { useRightHandedSystem: true });
  const tissue = new Mesh('anatomical-practice-pad', scene);
  const data = new VertexData();
  Object.assign(data, { positions, indices, normals, colors });
  data.applyToMesh(tissue);
  const tissueMaterial = material(scene, 'soft-tissue', '#ffffff', 72);
  tissueMaterial.specularColor = new Color3(0.35, 0.22, 0.2);
  tissueMaterial.backFaceCulling = false;
  tissue.material = tissueMaterial;
  tissue.receiveShadows = true;

  const vesselMaterial = material(scene, 'vessel-rose', '#8e3544', 80);
  const vessels: Mesh[] = [];
  const vessel = (name: string, points: readonly [number, number][], radius: number) => {
    const path: Vector3[] = [];
    for (let p = 0; p < points.length - 1; p++) {
      const from = points[p]!;
      const to = points[p + 1]!;
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        const x = from[0] + (to[0] - from[0]) * t;
        const z = from[1] + (to[1] - from[1]) * t;
        path.push(new Vector3(x, tissueHeight(x, z) + 0.12, z));
      }
    }
    const last = points[points.length - 1]!;
    path.push(new Vector3(last[0], tissueHeight(...last) + 0.12, last[1]));
    const mesh = CreateTube(name, { path, radius, tessellation: 8, cap: Mesh.CAP_ALL }, scene);
    mesh.material = vesselMaterial;
    vessels.push(mesh);
  };
  vessel('vessel-trunk', [[-58, 22], [-39, 18], [-21, 8], [1, 4], [23, -9], [52, -21]], 0.72);
  vessel('vessel-left-branch', [[-25, 10], [-35, -3], [-42, -16], [-49, -27]], 0.47);
  vessel('vessel-upper-branch', [[8, 0], [16, 16], [34, 29], [51, 33]], 0.5);
  vessel('vessel-small-branch', [[28, -11], [28, -25], [17, -35]], 0.38);
  // Sparse engraved reference ticks around the tray aid depth and scale perception.
  for (let i = -6; i <= 6; i++) {
    const tick = CreateBox(`tray-tick-${i}`, { width: 0.35, height: 0.12, depth: i % 2 ? 2 : 4 }, scene);
    tick.position.set(i * 10, -0.1, 53);
    tick.material = inset.material;
  }
  return [tray, rim, tissue, ...vessels];
}

import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { IncisionSnapshot } from '../contracts';
import { material } from './environment';

const SEGMENTS = 20;
const STATIONS = SEGMENTS * 2 + 1;
const WIDTH_STEPS = 6;

/** Pure geometry: each half is independent; no index ever crosses the incision seam.
 * The midpoint of a cut segment opens fully. A boundary shared with an uncut
 * segment stays closed, confining the opening to marked segments.
 */
export function incisionHalfGeometry(snapshot: IncisionSnapshot, side: -1 | 1) {
  const positions: number[] = [];
  const indices: number[] = [];
  const wallPositions: number[] = [];
  const wallIndices: number[] = [];
  const cutAt = (segment: number) => segment >= 0 && segment < SEGMENTS && snapshot.cutSegments[segment] === true;
  for (let station = 0; station < STATIONS; station++) {
    const segment = Math.floor(station / 2);
    const cut = station % 2 ? cutAt(segment) : cutAt(segment - 1) && cutAt(segment);
    const open = cut ? 3 : 0;
    const x = snapshot.seamStartMm[0] + (snapshot.seamEndMm[0] - snapshot.seamStartMm[0]) * station / (STATIONS - 1);
    const surfaceY = snapshot.seamStartMm[1];
    const seamZ = snapshot.seamStartMm[2];
    for (let across = 0; across <= WIDTH_STEPS; across++) {
      const t = across / WIDTH_STEPS;
      const taper = (1 - t) ** 2;
      positions.push(x, surfaceY + open * 0.22 * taper,
        seamZ + side * (snapshot.halfWidthMm * t + open * taper));
      if (station < STATIONS - 1 && across < WIDTH_STEPS) {
        const a = station * (WIDTH_STEPS + 1) + across;
        const b = a + WIDTH_STEPS + 1;
        // Facing up in the right-handed scene on both sides.
        if (side === 1) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    // Recessed wound walls connect each displaced edge to its own interior foot.
    wallPositions.push(x, surfaceY + open * 0.22, seamZ + side * open,
      x, surfaceY - 4, seamZ + side * open * 0.3);
    if (station < STATIONS - 1) {
      const a = station * 2;
      wallIndices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  return { positions, indices, wallPositions, wallIndices };
}

function updateGeometry(mesh: Mesh, positions: number[], indices: number[]) {
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals, { useRightHandedSystem: true });
  if (mesh.getTotalVertices()) {
    mesh.updateVerticesData(VertexBuffer.PositionKind, positions, true);
    mesh.updateVerticesData(VertexBuffer.NormalKind, normals);
  } else {
    const data = new VertexData();
    Object.assign(data, { positions, indices, normals });
    data.applyToMesh(mesh, true);
  }
}

/** Presentation only: progress comes exclusively from the training snapshot. */
export function createIncisionPatch(scene: Scene) {
  const root = new TransformNode('incision-patch', scene);
  const surface = material(scene, 'incision-surface', '#d89488', 65);
  surface.backFaceCulling = false;
  const wound = material(scene, 'incision-wound-walls', '#983e47', 60);
  wound.backFaceCulling = false;
  const core = material(scene, 'incision-interior', '#4e202b', 25);
  const base = CreateBox('incision-support', { width: 50, height: 8, depth: 30 }, scene);
  base.parent = root;
  base.position.set(0, 10, 0);
  base.material = core;
  base.receiveShadows = true;
  // Fixed outer walls support the raised practice patch above the underlying anatomy.
  const outerMaterial = material(scene, 'incision-outer-tissue', '#b66c66', 30);
  const outerWalls = [-1, 1].map(side => {
    const wall = CreateBox(`incision-outer-${side}`, { width: 50, height: 4, depth: 0.4 }, scene);
    wall.parent = root; wall.position.set(0, 16, side * 15); wall.material = outerMaterial;
    return wall;
  });
  const ends = [-1, 1].map(side => {
    const end = CreateBox(`incision-end-${side}`, { width: 0.4, height: 4, depth: 30 }, scene);
    end.parent = root; end.position.set(side * 25, 16, 0); end.material = outerMaterial;
    return end;
  });
  const halves = ([-1, 1] as const).map(side => {
    const top = new Mesh(`incision-half-${side}`, scene);
    top.parent = root; top.material = surface; top.receiveShadows = true;
    const wall = new Mesh(`incision-wall-${side}`, scene);
    wall.parent = root; wall.material = wound; wall.receiveShadows = true;
    return { side, top, wall };
  });
  // End markers frame the finite seam without painting an imitation cut.
  const guide = CreateLines('incision-guide', { points: [new Vector3(-25, 18.1, -2), new Vector3(-25, 18.1, 2), new Vector3(-25, 18.1, 0), new Vector3(25, 18.1, 0), new Vector3(25, 18.1, -2), new Vector3(25, 18.1, 2)] }, scene);
  guide.parent = root;
  guide.color = new Color3(0.96, 0.84, 0.53);
  guide.alpha = 0.5;
  let signature = '';
  root.setEnabled(false);
  return {
    meshes: [base, ...outerWalls, ...ends, ...halves.flatMap(half => [half.top, half.wall])],
    update(snapshot: IncisionSnapshot | null | undefined) {
      root.setEnabled(Boolean(snapshot));
      if (!snapshot) return;
      // This rendering slice intentionally supports the published fixed horizontal patch only.
      // Training owns the geometry defaults; arbitrary seam placement is not advertised.
      const nextSignature = snapshot.cutSegments.map(cut => cut ? '1' : '0').join('');
      if (signature === nextSignature) return;
      signature = nextSignature;
      for (const half of halves) {
        const geometry = incisionHalfGeometry(snapshot, half.side);
        updateGeometry(half.top, geometry.positions, geometry.indices);
        updateGeometry(half.wall, geometry.wallPositions, geometry.wallIndices);
      }
      // Once opened, remove the setup guide; no line spans the wound.
      guide.setEnabled(!snapshot.cutSegments.some(Boolean));
    },
  };
}

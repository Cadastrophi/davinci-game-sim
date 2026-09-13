import { describe, expect, it } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import type { IncisionSnapshot } from '../contracts';
import { createIncisionPatch, incisionHalfGeometry } from './incision';

const snapshot = (cutSegments: readonly boolean[] = Array(20).fill(false)): IncisionSnapshot => ({
  seamStartMm: [-25, 18, 0], seamEndMm: [25, 18, 0], halfWidthMm: 15,
  cutSegments, coverage01: cutSegments.filter(Boolean).length / 20,
  contact: false, depthMm: null, deviationMm: null,
});

describe('constrained incision geometry', () => {
  it('uses two separate half meshes whose triangles never cross the seam', () => {
    for (const side of [-1, 1] as const) {
      const geometry = incisionHalfGeometry(snapshot(), side);
      expect(geometry.positions).toHaveLength(41 * 7 * 3);
      expect(geometry.indices).toHaveLength(40 * 6 * 6);
      for (const index of geometry.indices) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(41 * 7);
        expect(geometry.positions[index * 3 + 2]! * side).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('opens only cut intervals, deforms nearby tissue and pins outer edges', () => {
    const cuts = Array<boolean>(20).fill(false); cuts[9] = true;
    for (const side of [-1, 1] as const) {
      const closed = incisionHalfGeometry(snapshot(), side);
      const open = incisionHalfGeometry(snapshot(cuts), side);
      for (let station = 0; station < 41; station++) {
        const inner = station * 7 * 3;
        const outer = inner + 6 * 3;
        expect(open.positions.slice(outer, outer + 3)).toEqual(closed.positions.slice(outer, outer + 3));
        expect(open.positions[inner + 2]).toBe(station === 19 ? side * 3 : 0);
      }
      const middle = (19 * 7 + 3) * 3;
      expect(open.positions[middle + 1]).toBeGreaterThan(18);
      expect(Math.abs(open.positions[middle + 2]!)).toBeGreaterThan(7.5);
      expect(open.wallPositions[19 * 6 + 4]).toBe(14);
    }
  });

  it('snapshots alone control opening, repeated rendering is inert, reset closes and hidden state stays hidden', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const patch = createIncisionPatch(scene);
      const closed = snapshot();
      patch.update(closed);
      const root = scene.getTransformNodeByName('incision-patch')!;
      const half = scene.getMeshByName('incision-half-1')!;
      const original = Array.from(half.getVerticesData(VertexBuffer.PositionKind)!);
      const cuts = Array<boolean>(20).fill(true);
      const cut = snapshot(cuts);
      patch.update(cut);
      const opened = Array.from(half.getVerticesData(VertexBuffer.PositionKind)!);
      const meshCount = scene.meshes.length;
      expect(opened).not.toEqual(original);
      for (let i = 0; i < 100; i++) patch.update(cut);
      expect(scene.meshes.length).toBe(meshCount);
      expect(Array.from(half.getVerticesData(VertexBuffer.PositionKind)!)).toEqual(opened);
      expect(cut.cutSegments).toEqual(cuts);
      patch.update(null); expect(root.isEnabled()).toBe(false);
      patch.update(closed); expect(root.isEnabled()).toBe(true);
      expect(Array.from(half.getVerticesData(VertexBuffer.PositionKind)!)).toEqual(original);
      expect(scene.getMeshByName('incision-guide')!.isEnabled()).toBe(true);
    } finally { scene.dispose(); engine.dispose(); }
  });
});

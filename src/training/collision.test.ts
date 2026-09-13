import { describe, expect, it } from 'vitest';
import type { Obstacle, ToolPose, Vec3 } from '../contracts';
import { clearance, createCollision, segmentBoxDistance } from './collision';
const pose = (p: Vec3, direction: Vec3 = [0, 0, -1]): ToolPose => ({ positionMm: p, direction, directionKind: 'virtual-mapped' });
const wall: Obstacle = { id: 'wall', min: [-0.05, -100, -100], max: [0.05, 100, 100] };
describe('continuous blade collision', () => {
  it('finds interior segment distance, not only endpoint distance', () => {
    const box: Obstacle = { id: 'box', min: [-1, -1, -1], max: [1, 1, 1] };
    expect(segmentBoxDistance([-10, 0, 0], [10, 0, 0], box)).toBe(0);
    expect(segmentBoxDistance([-10, 3, 0], [10, 3, 0], box)).toBeCloseTo(2);
  });
  it('blocks a packet jump through a thin wall and cannot teleport on repeats', () => {
    const c = createCollision(pose([-20, 0, 0]));
    for (let i = 0; i < 10; i++) {
      const state = c.apply(pose([20, 0, 0]), [wall]);
      expect(state.pose.positionMm[0]).toBeLessThan(-2.15); expect(clearance(state.pose, wall)).toBeGreaterThanOrEqual(0);
      expect(state.contactEpisodes).toBe(1); expect(state.mismatch).toBe(true); expect(state.contactIds).toEqual(['wall']);
    }
  });
  it('retreats after blocking, releases with hysteresis and counts a new episode', () => {
    const c = createCollision(pose([-20, 0, 0])); c.apply(pose([20, 0, 0]), [wall]);
    const jitter = c.apply(pose([-2.3, 0, 0]), [wall]); expect(jitter.contactEpisodes).toBe(1); expect(jitter.contactIds).toEqual(['wall']);
    const away = c.apply(pose([-20, 0, 0]), [wall]); expect(away.pose.positionMm[0]).toBe(-20); expect(away.contactIds).toEqual([]);
    expect(c.apply(pose([20, 0, 0]), [wall]).contactEpisodes).toBe(2);
  });
  it('catches pure rotation with both endpoint poses clear', () => {
    const box: Obstacle = { id: 'rotation', min: [-1, -1, -13], max: [1, 1, -11] };
    const a = pose([0, 0, 0], [1, 0, 0]), b = pose([0, 0, 0], [-1, 0, 0]);
    // Explicit non-antipodal arc across +Z makes the backward blade cross the box.
    const start = pose([0, 0, 0], [Math.SQRT1_2, 0, Math.SQRT1_2]);
    const end = pose([0, 0, 0], [-Math.SQRT1_2, 0, Math.SQRT1_2]);
    expect(clearance(start, box)).toBeGreaterThan(0); expect(clearance(end, box)).toBeGreaterThan(0);
    const blocked = createCollision(start).apply(end, [box]);
    expect(blocked.mismatch).toBe(true); expect(blocked.contactIds).toEqual(['rotation']); expect(clearance(blocked.pose, box)).toBeGreaterThanOrEqual(0);
    expect(createCollision(a).apply(b, []).pose).toEqual(b);
  });
  it('keeps unavailable pointing null at the boundary while blocking and retreating', () => {
    const start: ToolPose = { positionMm: [-20, 0, 0], direction: null, directionKind: 'unavailable' };
    const requested: ToolPose = { ...start, positionMm: [20, 0, 0] };
    const c = createCollision(start);
    for (let i = 0; i < 3; i++) {
      const blocked = c.apply(requested, [wall]);
      expect(blocked.mismatch).toBe(true); expect(blocked.pose.directionKind).toBe('unavailable');
      expect(blocked.pose.direction).toBeNull(); expect(blocked.requestedPose.direction).toBeNull();
      expect(clearance(blocked.pose, wall)).toBeGreaterThanOrEqual(0);
    }
    expect(c.apply(start, [wall]).pose).toEqual(start);
  });
  it('allows a clear route and does not mutate caller poses', () => {
    const a = pose([-20, 0, 0]), b = pose([-10, 5, 0]), copy = structuredClone(a);
    const state = createCollision(a).apply(b, [wall]); expect(state.pose).toEqual(b); expect(state.mismatch).toBe(false); expect(a).toEqual(copy);
  });
});

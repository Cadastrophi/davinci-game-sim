import { describe, expect, it } from 'vitest';
import type { ControlFrame, ToolPose, Vec3 } from '../contracts';
import { createTraining } from './index';
const pose = (positionMm: Vec3): ToolPose => ({ positionMm, direction: [0, 0, -1], directionKind: 'virtual-mapped' });
const frame = (now: number, p: Vec3, extra: Partial<ControlFrame> = {}): ControlFrame => ({ sequence: now + 1, receivedAtMs: now, source: 'mock', fresh: true, mode: 'tool', requestedPose: pose(p), cameraOffsetMm: [0, 0, 0], cameraSession: 0, frozenPose: null, calibrationRevision: 1, pauseReason: null, ...extra });
function begin(p: Vec3 = [-25, 16, 0]) { const t = createTraining(pose(p)); t.start('incision', 0); t.step(frame(0, p), 0); return t; }
describe('constrained contact-driven incision', () => {
  it('cuts contacted seam segments and freezes completed coverage/depth/time', () => {
    const t = begin(); const state = t.step(frame(100, [25, 16, 0]), 100);
    expect(state.incision?.cutSegments).toHaveLength(20); expect(state.incision?.cutSegments.every(Boolean)).toBe(true);
    expect(state.incision?.coverage01).toBe(1); expect(state.incision?.depthMm).toBe(2); expect(state.incision?.deviationMm).toBe(0);
    expect(state.exercise.phase).toBe('completed');
    t.pause('Blur'); const after = t.step(frame(1000, [0, 40, 20]), 1000);
    expect(after.incision).toEqual(state.incision); expect(after.exercise.elapsedMs).toBe(state.exercise.elapsedMs);
    expect(after.exercise.pathMm).toBe(state.exercise.pathMm); expect(after.exercise.phase).toBe('completed');
  });
  it.each([19, 14])('does not cut horizontal strokes at invalid surface height %s', y => {
    const t = begin([-25, y, 0]); const state = t.step(frame(100, [25, y, 0]), 100);
    expect(state.incision?.coverage01).toBe(0); expect(state.incision?.contact).toBe(false);
  });
  it('does not cut outside the seam corridor or other modes', () => {
    const t = begin([-25, 16, 3]); expect(t.step(frame(100, [25, 16, 3]), 100).incision?.coverage01).toBe(0);
    t.start('free', 100); expect(t.step(frame(200, [-25, 16, 0]), 200).incision).toBeNull();
  });
  it('never cuts from elapsed time, a duplicate sample or stationary unique samples', () => {
    const t = begin();
    expect(t.step(frame(0, [25, 16, 0]), 100).incision?.coverage01).toBe(0);
    for (const now of [200, 300, 400, 500]) expect(t.step(frame(now, [-25, 16, 0]), now).incision?.coverage01).toBe(0);
  });
  it.each(['camera', 'pause', 'stale', 'calibration', 'source'] as const)('does not bridge %s interruption', kind => {
    const t = begin(); expect(t.step(frame(100, [-20, 16, 0]), 100).incision?.coverage01).toBe(0.1);
    let nextTime = 300;
    if (kind === 'camera') {
      const held = t.step(frame(200, [20, 16, 0], { mode: 'camera', cameraSession: 1, cameraOffsetMm: [10, 0, 0] }), 200);
      expect(held.applied.pose.positionMm).toEqual([-20, 16, 0]); expect(held.incision?.contact).toBe(false); expect(held.exercise.elapsedMs).toBe(200);
    }
    if (kind === 'pause') t.pause('User pause');
    if (kind === 'stale') nextTime = 1000;
    const result = t.step(frame(nextTime, [20, 16, 0], { calibrationRevision: kind === 'calibration' ? 2 : 1, source: kind === 'source' ? 'replay' : 'mock' }), nextTime);
    expect(result.incision?.coverage01).toBe(0.1);
  });
  it('uses collision-limited applied motion, not a request through a protected structure', () => {
    const t = begin([40, 16, 0]); const state = t.step(frame(100, [-25, 16, 0]), 100);
    expect(state.applied.mismatch).toBe(true); expect(state.applied.pose.positionMm[0]).toBeGreaterThan(35);
    expect(state.applied.contactIds).toContain('incision-right-protected'); expect(state.incision?.coverage01).toBe(0);
    expect(state.exercise.contactEpisodes).toBe(1);
  });
  it('rejects overlapping starts without mutation and retry restores the patch', () => {
    const overlap = createTraining(pose([30, 16, 0])); overlap.start('free', 0);
    expect(() => overlap.start('incision', 0)).toThrow('Move clear');
    expect(overlap.step(frame(0, [30, 16, 0]), 0).exercise.mode).toBe('free');
    const t = begin(); t.step(frame(100, [-20, 16, 0]), 100); t.reset(100);
    expect(t.step(frame(200, [-20, 16, 0]), 200).incision?.coverage01).toBe(0);
    t.start('incision', 200); expect(t.step(frame(300, [-20, 16, 0]), 300).incision?.coverage01).toBe(0);
  });
});

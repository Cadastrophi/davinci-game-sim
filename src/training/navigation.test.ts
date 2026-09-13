import { describe, expect, it } from 'vitest';
import type { ControlFrame, ToolPose, Vec3 } from '../contracts';
import { clearance } from './collision';
import { createTraining } from './index';
const pose = (positionMm: Vec3 = [0, 24, 0]): ToolPose => ({ positionMm, direction: [0, 0, -1], directionKind: 'virtual-mapped' });
const frame = (now: number, opts: Partial<ControlFrame> = {}): ControlFrame => ({ sequence: now + 1, receivedAtMs: now, source: 'mock', fresh: true, mode: 'tool', requestedPose: pose(), cameraOffsetMm: [0, 0, 0], cameraSession: 0, frozenPose: null, calibrationRevision: 1, pauseReason: null, ...opts });
describe('protected obstacle route', () => {
  it('blocks packet skips, exposes a ghost mismatch and counts one continuous episode', () => {
    const t = createTraining(); t.start('obstacle', 0); t.step(frame(0), 0);
    for (let now = 100; now <= 500; now += 100) {
      const state = t.step(frame(now, { requestedPose: pose([35, 24, 0]) }), now);
      expect(state.applied.pose.positionMm[0]).toBeLessThan(5.9); expect(state.applied.mismatch).toBe(true);
      expect(state.exercise.contactEpisodes).toBe(1); expect(state.applied.contactIds).toContain('central-protected');
      expect(state.exercise.targetIndex).toBe(0);
      for (const box of state.obstacles) expect(clearance(state.applied.pose, box)).toBeGreaterThanOrEqual(0);
    }
    const retreat = t.step(frame(600), 600); expect(retreat.applied.contactIds).toEqual([]);
    expect(t.step(frame(700, { requestedPose: pose([35, 24, 0]) }), 700).exercise.contactEpisodes).toBe(2);
  });
  it('completes the legal route around fixed boxes without contact', () => {
    const t = createTraining(); t.start('obstacle', 0);
    let now = 0, state = t.step(frame(0), 0);
    for (let index = 0; index < 3; index++) {
      const target = state.exercise.target!;
      for (let tick = 0; tick <= 5; tick++) { now += 100; state = t.step(frame(now, { requestedPose: pose(target.positionMm) }), now); }
      expect(state.exercise.targetIndex).toBe(index + 1); expect(state.applied.mismatch).toBe(false);
    }
    expect(state.exercise.phase).toBe('completed'); expect(state.exercise.contactEpisodes).toBe(0); expect(state.exercise.pathMm).toBeGreaterThan(100);
    const finalPath = state.exercise.pathMm; now += 100;
    const after = t.step(frame(now, { requestedPose: pose([10, 24, 0]) }), now);
    expect(after.applied.contactEpisodes).toBe(1); expect(after.exercise.contactEpisodes).toBe(0); expect(after.exercise.pathMm).toBe(finalPath);
  });
  it('rejects an overlapping starting pose without altering the previous exercise', () => {
    const initial = pose([10, 24, 0]), t = createTraining(initial); t.start('free', 0);
    expect(() => t.start('obstacle', 100)).toThrow('Move clear of protected volumes in Free practice');
    const state = t.step(frame(100, { requestedPose: initial }), 100);
    expect(state.exercise.mode).toBe('free'); expect(state.applied.pose).toEqual(initial); expect(state.obstacles).toEqual([]);
  });
});
describe('camera navigation qualification', () => {
  it('requires a fresh 5mm camera session before each dwell; holds count time but freeze pose', () => {
    const t = createTraining(pose()); t.start('camera', 0); t.step(frame(0), 0);
    for (const now of [100, 200, 300]) expect(t.step(frame(now), now).exercise.dwellMs).toBe(0);
    let state = t.step(frame(400, { mode: 'camera', cameraSession: 1, cameraOffsetMm: [4.99, 0, 0], requestedPose: pose([100, 100, 100]) }), 400);
    expect(state.applied.pose).toEqual(pose()); expect(state.exercise.dwellMs).toBe(0);
    state = t.step(frame(500, { mode: 'camera', cameraSession: 1, cameraOffsetMm: [3, 4, 0] }), 500);
    expect(state.exercise.elapsedMs).toBe(500); expect(state.exercise.dwellMs).toBe(0);
    for (const now of [600, 700, 800, 900, 1000, 1100]) state = t.step(frame(now), now);
    expect(state.exercise.targetIndex).toBe(1);
    const next = state.exercise.target!;
    for (const now of [1200, 1300, 1400, 1500, 1600, 1700]) state = t.step(frame(now, { requestedPose: pose(next.positionMm) }), now);
    expect(state.exercise.targetIndex).toBe(1); expect(state.exercise.dwellMs).toBe(0);
  });
  it('does not accumulate repeated subthreshold offsets or count stale camera frames', () => {
    const t = createTraining(pose()); t.start('camera', 0); t.step(frame(0), 0);
    for (const now of [100, 200, 300]) t.step(frame(now, { mode: 'camera', cameraSession: 1, cameraOffsetMm: [2, 0, 0] }), now);
    expect(t.step(frame(400), 400).exercise.dwellMs).toBe(0);
    t.step(frame(500, { mode: 'camera', cameraSession: 2, cameraOffsetMm: [20, 0, 0], fresh: false }), 500);
    for (const now of [600, 700, 800, 900, 1000, 1100]) expect(t.step(frame(now), now).exercise.dwellMs).toBe(0);
  });
  it('reset and pause cannot reuse an already observed camera session', () => {
    const t = createTraining(pose()); t.start('camera', 0); t.step(frame(0), 0);
    t.step(frame(100, { mode: 'camera', cameraSession: 1, cameraOffsetMm: [5, 0, 0] }), 100);
    t.start('camera', 200); t.step(frame(200), 200);
    t.step(frame(300, { mode: 'camera', cameraSession: 1, cameraOffsetMm: [5, 0, 0] }), 300);
    expect(t.step(frame(400), 400).exercise.dwellMs).toBe(0);
    expect(t.step(frame(500), 500).exercise.dwellMs).toBe(0);
    t.step(frame(600, { mode: 'camera', cameraSession: 2, cameraOffsetMm: [5, 0, 0] }), 600);
    t.pause('Blur'); t.step(frame(700), 700);
    t.step(frame(800, { mode: 'camera', cameraSession: 2, cameraOffsetMm: [5, 0, 0] }), 800);
    for (const now of [900, 1000]) expect(t.step(frame(now), now).exercise.dwellMs).toBe(0);
    t.step(frame(1100, { mode: 'camera', cameraSession: 3, cameraOffsetMm: [5, 0, 0] }), 1100);
    t.step(frame(1200), 1200); expect(t.step(frame(1300), 1300).exercise.dwellMs).toBe(100);
  });
  it('expires camera qualification across a silent telemetry gap', () => {
    const t = createTraining(pose()); t.start('camera', 0); t.step(frame(0), 0);
    t.step(frame(100, { mode: 'camera', cameraSession: 1, cameraOffsetMm: [5, 0, 0] }), 100);
    t.step(frame(200), 200);
    for (const now of [1000, 1100, 1200, 1300, 1400, 1500]) expect(t.step(frame(now), now).exercise.dwellMs).toBe(0);
  });
  it('completes three targets only after distinct fresh camera sessions', () => {
    const t = createTraining(pose()); t.start('camera', 0); let now = 0, state = t.step(frame(0), 0);
    for (let index = 0; index < 3; index++) {
      const desired = pose(state.exercise.target!.positionMm);
      now += 100; t.step(frame(now, { mode: 'camera', cameraSession: index + 1, cameraOffsetMm: [0, 0, 5] }), now);
      for (let tick = 0; tick <= 5; tick++) { now += 100; state = t.step(frame(now, { requestedPose: desired }), now); }
      expect(state.exercise.targetIndex).toBe(index + 1);
    }
    expect(state.exercise.phase).toBe('completed');
  });
});

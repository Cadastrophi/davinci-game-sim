import { describe, expect, it } from 'vitest';
import type { ControlFrame, ToolPose, Vec3 } from '../contracts';
import { createTraining, directionErrorRad } from './index';
const pose = (direction: Vec3 | null = [0, 0, -1], positionMm: Vec3 = [0, 24, 0], directionKind: ToolPose['directionKind'] = 'virtual-mapped'): ToolPose => ({ positionMm, direction, directionKind });
const frame = (now: number, requestedPose: ToolPose): ControlFrame => ({ sequence: now + 1, receivedAtMs: now, source: 'mock', fresh: true, mode: 'tool', requestedPose, cameraOffsetMm: [0, 0, 0], cameraSession: 0, frozenPose: null, calibrationRevision: 1, pauseReason: null });
function begin() { const t = createTraining(pose()); t.start('align', 0); return t; }
describe('direction alignment', () => {
  it('uses a signed normalized angle: opposite directions are pi radians apart', () => {
    expect(directionErrorRad(pose([0, 0, 2]), [0, 0, -3])).toBeCloseTo(Math.PI);
    expect(directionErrorRad(pose([0, 0, -2]), [0, 0, -3])).toBe(0);
    expect(directionErrorRad(pose([1, 0, 0]), [0, 0, -1])).toBeCloseTo(Math.PI / 2);
  });
  it('cannot trade excellent position for wrong pointing, or vice versa', () => {
    for (const p of [pose([0, 0, 1]), pose([0, 0, -1], [10.01, 24, 0])]) {
      const t = begin(); let state = t.step(frame(0, p), 0);
      for (let now = 100; now <= 1000; now += 100) state = t.step(frame(now, p), now);
      expect(state.exercise.targetIndex).toBe(0); expect(state.exercise.dwellMs).toBe(0);
    }
  });
  it('requires both tolerances continuously for 500ms', () => {
    const radians = 9 * Math.PI / 180;
    const p = pose([Math.sin(radians), 0, -Math.cos(radians)], [9, 24, 0]);
    const t = begin(); for (const now of [0, 131, 270, 401, 499]) t.step(frame(now, p), now);
    expect(t.step(frame(499, p), 499).exercise.dwellMs).toBe(499);
    const reached = t.step(frame(500, p), 500).exercise;
    expect(reached.targetIndex).toBe(1); expect(reached.feedback).toContain('target reached');
  });
  it('leaving angle tolerance interrupts dwell rather than preserving partial credit', () => {
    const t = begin(); t.step(frame(0, pose()), 0); t.step(frame(200, pose()), 200);
    const out = 10.01 * Math.PI / 180;
    expect(t.step(frame(300, pose([Math.sin(out), 0, -Math.cos(out)])), 300).exercise.dwellMs).toBe(0);
    expect(t.step(frame(400, pose()), 400).exercise.dwellMs).toBe(0);
    expect(t.step(frame(500, pose()), 500).exercise.dwellMs).toBe(100);
  });
  it('unavailable, null and zero directions never receive alignment credit', () => {
    for (const p of [pose(null), pose([0, 0, -1], [0, 24, 0], 'unavailable'), pose([0, 0, 0])]) {
      const t = begin(); let state = t.step(frame(0, p), 0);
      for (let now = 100; now <= 1000; now += 100) state = t.step(frame(now, p), now);
      expect(state.exercise.directionErrorRad).toBeNull(); expect(state.exercise.targetIndex).toBe(0); expect(state.exercise.dwellMs).toBe(0);
    }
  });
  it('exposes varied bounded virtual targets and completes their deterministic sequence', () => {
    const t = begin(); let now = 0, state = t.step(frame(now, pose()), now);
    const directions = new Set<string>();
    for (let index = 0; index < 4; index++) {
      const target = state.exercise.target!; directions.add(JSON.stringify(target.direction));
      expect(target.positionMm[0]).toBeGreaterThanOrEqual(-45); expect(target.positionMm[0]).toBeLessThanOrEqual(45);
      expect(target.direction).not.toBeNull();
      const p = pose(target.direction, target.positionMm);
      for (let tick = 0; tick <= 5; tick++) { state = t.step(frame(now, p), now); now += 100; }
      expect(state.exercise.targetIndex).toBe(index + 1);
    }
    expect(directions.size).toBe(4); expect(state.exercise.phase).toBe('completed');
    t.pause('Blur'); expect(t.step(frame(now, pose()), now).exercise.phase).toBe('completed');
    t.start('align', now); const retry = t.step(frame(now, pose()), now).exercise;
    expect(retry.targetIndex).toBe(0); expect(retry.feedback).toContain('Virtual direction');
  });
});

import { describe, expect, it } from 'vitest';
import { createTraining } from './index';
import type { ControlFrame, ToolPose, Vec3 } from '../contracts';
const pose = (p: Vec3 = [0, 24, 0]): ToolPose => ({ positionMm: p, direction: [0, 0, -1], directionKind: 'virtual-mapped' });
const frame = (time: number, opts: Partial<ControlFrame> = {}): ControlFrame => ({ sequence: time + 1, receivedAtMs: time, source: 'mock', fresh: true, mode: 'tool', requestedPose: pose(), cameraOffsetMm: [0, 0, 0], cameraSession: 0, frozenPose: null, calibrationRevision: 1, pauseReason: null, ...opts });
function begin() { const t = createTraining(pose()); t.start('reach', 0); t.step(frame(0), 0); return t; }
describe('reach timing', () => {
  it('requires 500 continuous milliseconds at irregular sample cadence', () => {
    const t = begin(); for (const n of [103, 249, 397, 499]) t.step(frame(n), n);
    expect(t.step(frame(499), 499).exercise.dwellMs).toBe(499);
    const result = t.step(frame(500), 500).exercise;
    expect(result.targetIndex).toBe(1); expect(result.dwellMs).toBe(0); expect(result.elapsedMs).toBe(500);
  });
  it('duplicate rendering accrues time once, never path or additional samples', () => {
    const t = begin(); const f = frame(0);
    expect(t.step(f, 100).exercise.dwellMs).toBe(100);
    expect(t.step(f, 100).exercise.dwellMs).toBe(100);
    expect(t.step(f, 200).exercise.pathMm).toBe(0);
  });
  it('clips elapsed at stale threshold then excludes outage and resumed gap', () => {
    const t = begin(); const stale = t.step(frame(0), 1000).exercise;
    expect(stale.phase).toBe('paused'); expect(stale.elapsedMs).toBe(250); expect(stale.dwellMs).toBe(0);
    const resumed = t.step(frame(3000), 3000).exercise;
    expect(resumed.elapsedMs).toBe(250); expect(resumed.dwellMs).toBe(0);
    expect(t.step(frame(3100), 3100).exercise.elapsedMs).toBe(350);
  });
  it('250ms old input is stale even if its provider says fresh', () => {
    const t = begin(); expect(t.step(frame(0), 249).exercise.dwellMs).toBe(249);
    expect(t.step(frame(0), 250).exercise.phase).toBe('paused');
  });
  it('camera resets dwell but time runs and tool pose remains frozen', () => {
    const t = begin(); t.step(frame(100), 100);
    const result = t.step(frame(200, { mode: 'camera', requestedPose: pose([30, 20, 30]) }), 200);
    expect(result.exercise.dwellMs).toBe(0); expect(result.exercise.elapsedMs).toBe(200); expect(result.applied.pose).toEqual(pose());
    expect(t.step(frame(300), 300).exercise.dwellMs).toBe(0);
    expect(t.step(frame(400), 400).exercise.dwellMs).toBe(100);
  });
  it('pause interrupts timing and fresh resume cannot credit a large delta', () => {
    const t = begin(); t.step(frame(100), 100); t.pause('User pause');
    expect(t.step(frame(3000), 3000).exercise.elapsedMs).toBe(100);
    expect(t.step(frame(3100), 3100).exercise.dwellMs).toBe(100);
  });
  it('calibration and leaving target reset dwell', () => {
    const t = begin(); t.step(frame(100), 100);
    expect(t.step(frame(200, { calibrationRevision: 2 }), 200).exercise.dwellMs).toBe(0);
    t.step(frame(300, { calibrationRevision: 2 }), 300);
    expect(t.step(frame(400, { requestedPose: pose([10.01, 24, 0]), calibrationRevision: 2 }), 400).exercise.dwellMs).toBe(0);
  });
  it('ready/free/retry semantics and unsupported modes are explicit', () => {
    const t = createTraining(); expect(t.step(frame(0), 0).exercise.phase).toBe('ready');
    t.start('free', 0); expect(t.step(frame(100), 100).exercise.target).toBeNull();
    t.reset(100); const state = t.step(frame(100), 100); expect(state.exercise.phase).toBe('ready'); expect(state.exercise.elapsedMs).toBe(0);
    expect(() => t.start('align', 100)).toThrow('not implemented');
    expect(() => t.start('obstacle', 100)).toThrow('not implemented');
    expect(() => t.start('camera', 100)).toThrow('not implemented');
  });
});

import type { ReplayEvent } from '../../../src/input/sources';
export const CAMERA_REPLAY: readonly ReplayEvent[] = Object.freeze([
  Object.freeze({ atMs: 0, positionMm: Object.freeze([0, 0, 0] as const), yawDeg: 179, pitchDeg: 0 }),
  Object.freeze({ atMs: 20, positionMm: Object.freeze([5, 2, 3] as const), yawDeg: -179, pitchDeg: 10 }),
  Object.freeze({ atMs: 40, positionMm: Object.freeze([15, 2, 3] as const), yawDeg: -170, pitchDeg: 20 }),
]);

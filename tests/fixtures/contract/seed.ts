import type { RawPoseSample, ControlFrame } from '../../../src/contracts';
import { INITIAL_TOOL_POSE } from '../../../src/contracts';
export const RAW_SEED: RawPoseSample = Object.freeze({ positionMm: Object.freeze([1, 2, 3] as const), yawDeg: 179, pitchDeg: 10, roll: null, receivedAtMs: 1000, sequence: 1, source: 'replay' });
export const CAMERA_SEED: ControlFrame = Object.freeze({ sequence: 2, receivedAtMs: 1020, source: 'replay', fresh: true, mode: 'camera', requestedPose: INITIAL_TOOL_POSE, frozenPose: INITIAL_TOOL_POSE, cameraOffsetMm: Object.freeze([10, 5, 3] as const), cameraSession: 1, calibrationRevision: 1, pauseReason: null });
export const WIRE_FIXTURES = Object.freeze({ multiple: '[1,2,3,179,10,0,0][4,5,6,-179,10,0,0]', split: Object.freeze(['noise[1,2', ',3,179,10,0,0]']), invalid: '[1,2,NaN,0,0,0,0]', oversized: '[' + '1'.repeat(2048), recovery: '[1,2,3,0,0,0,0]' });

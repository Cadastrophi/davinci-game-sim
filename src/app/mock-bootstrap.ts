import type { ControlFrame } from '../contracts';
/** Temporary visual replay only. H replaces this with its input facade, including mock source. */
export function replayFrame(nowMs: number): ControlFrame {
  return { sequence: Math.floor(nowMs / 20), receivedAtMs: nowMs, source: 'replay', fresh: true, mode: 'tool', requestedPose: { positionMm: [Math.sin(nowMs / 1500) * 35, 18, Math.cos(nowMs / 1500) * 20], direction: [0, 0, -1], directionKind: 'virtual-mapped' }, cameraOffsetMm: [0, 0, 0], cameraSession: 0, frozenPose: null, calibrationRevision: 0, pauseReason: null };
}

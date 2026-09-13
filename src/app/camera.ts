import { CAMERA_FORWARD, CAMERA_RIGHT, CAMERA_UP } from '../contracts';
import type { Vec3 } from '../contracts';
/** Absolute camera application. Repeated snapshots are idempotent. */
export function cameraPosition(entry: Vec3, offset: Vec3): Vec3 {
  const p = [0, 1, 2].map(i => entry[i]! + CAMERA_RIGHT[i]! * offset[0] + CAMERA_UP[i]! * offset[1] + CAMERA_FORWARD[i]! * offset[2]);
  return [Math.max(-120, Math.min(120, p[0]!)), Math.max(35, Math.min(180, p[1]!)), Math.max(60, Math.min(260, p[2]!))];
}

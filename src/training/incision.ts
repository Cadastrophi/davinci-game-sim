import type { IncisionSnapshot, Obstacle, Vec3 } from '../contracts';
import { distance } from './collision';

export const INCISION_PROTECTED: readonly Obstacle[] = [
  { id: 'incision-left-protected', min: [-35, 5, -12], max: [-28, 22, 12] },
  { id: 'incision-right-protected', min: [28, 5, -12], max: [35, 22, 12] },
];
const MIN: Vec3 = [-25, 15, -2], MAX: Vec3 = [25, 18, 2];
/** Clip the actual applied-tip stroke to the cuttable corridor, never requested motion. */
function clip(a: Vec3, b: Vec3): readonly [number, number] | null {
  let enter = 0, exit = 1;
  for (const i of [0, 1, 2] as const) {
    const delta = b[i] - a[i];
    if (Math.abs(delta) < 1e-12) { if (a[i] < MIN[i] || a[i] > MAX[i]) return null; }
    else {
      const t0 = (MIN[i] - a[i]) / delta, t1 = (MAX[i] - a[i]) / delta;
      enter = Math.max(enter, Math.min(t0, t1)); exit = Math.min(exit, Math.max(t0, t1));
      if (enter > exit) return null;
    }
  }
  return [enter, exit];
}
export function createIncision() {
  let cuts = Array<boolean>(20).fill(false), anchor: Vec3 | null = null;
  return {
    reset() { cuts = Array<boolean>(20).fill(false); anchor = null; },
    interrupt() { anchor = null; },
    advance(position: Vec3) {
      const before = anchor; anchor = [...position];
      if (!before || distance(before, position) < 1e-6) return;
      const interval = clip(before, position);
      if (!interval || interval[1] - interval[0] < 1e-9) return;
      const x0 = before[0] + (position[0] - before[0]) * interval[0];
      const x1 = before[0] + (position[0] - before[0]) * interval[1];
      const start = Math.max(0, Math.min(19, Math.floor((Math.min(x0, x1) + 25) / 2.5)));
      const end = Math.max(start, Math.min(19, Math.ceil((Math.max(x0, x1) + 25) / 2.5) - 1));
      for (let i = start; i <= end; i++) cuts[i] = true;
    },
    snapshot(position: Vec3, eligible: boolean): IncisionSnapshot {
      const footprint = Math.abs(position[0]) <= 25 && Math.abs(position[2]) <= 15;
      return {
        seamStartMm: [-25, 18, 0], seamEndMm: [25, 18, 0], halfWidthMm: 15,
        cutSegments: [...cuts], coverage01: cuts.filter(Boolean).length / cuts.length,
        contact: eligible && footprint && Math.abs(position[2]) <= 2 && position[1] >= 15 && position[1] <= 18,
        depthMm: footprint ? 18 - position[1] : null,
        deviationMm: footprint ? Math.abs(position[2]) : null,
      };
    },
  };
}

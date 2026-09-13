import type { AppliedToolState, Obstacle, ToolPose, Vec3 } from '../contracts';

export const BLADE_LENGTH_MM = 16;
export const BLADE_RADIUS_MM = 2;
export const COLLISION_MARGIN_MM = 0.1;
const RELEASE_MM = 0.6;
const axes = [0, 1, 2] as const;
export const distance = (a: Vec3, b: Vec3): number => Math.hypot(...axes.map(i => a[i] - b[i]));
const dot = (a: Vec3, b: Vec3): number => axes.reduce<number>((n, i) => n + a[i] * b[i], 0);
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function unit(v: Vec3): Vec3 { const n = Math.hypot(...v); return n > 1e-12 ? [v[0] / n, v[1] / n, v[2] / n] : [0, 0, -1]; }
function direction(p: ToolPose): Vec3 { return unit(p.direction ?? [0, 0, -1]); }
/** Sweep directions are internal geometry, never evidence that unavailable input became measured. */
function publishedPose(pose: ToolPose): ToolPose {
  return { ...structuredClone(pose), direction: pose.directionKind === 'unavailable' ? null : pose.direction === null ? null : [...pose.direction] };
}
function arc(a: Vec3, b: Vec3): { angle: number; tangent: Vec3 } {
  const c = Math.max(-1, Math.min(1, dot(a, b)));
  const angle = Math.acos(c);
  let tangent: Vec3 = [b[0] - c * a[0], b[1] - c * a[1], b[2] - c * a[2]];
  if (Math.hypot(...tangent) < 1e-8) {
    const v: Vec3 = Math.abs(a[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
    const d = dot(v, a); tangent = [v[0] - d * a[0], v[1] - d * a[1], v[2] - d * a[2]];
  }
  return { angle, tangent: unit(tangent) };
}
function interpolate(a: ToolPose, b: ToolPose, t: number): ToolPose {
  const u = direction(a), { angle, tangent } = arc(u, direction(b));
  const c = Math.cos(angle * t), s = Math.sin(angle * t);
  return { positionMm: mix(a.positionMm, b.positionMm, t), direction: unit([u[0] * c + tangent[0] * s, u[1] * c + tangent[1] * s, u[2] * c + tangent[2] * s]), directionKind: b.directionKind };
}
/** Exact minimum segment/AABB distance: split at slab crossings and minimize each quadratic. */
export function segmentBoxDistance(a: Vec3, b: Vec3, box: Obstacle): number {
  const cuts = [0, 1];
  for (const i of axes) if (b[i] !== a[i]) for (const bound of [box.min[i], box.max[i]]) {
    const t = (bound - a[i]) / (b[i] - a[i]); if (t > 0 && t < 1) cuts.push(t);
  }
  cuts.sort((x, y) => x - y);
  const at = (t: number): number => axes.reduce<number>((sum, i) => {
    const x = a[i] + (b[i] - a[i]) * t;
    const d = Math.max(box.min[i] - x, 0, x - box.max[i]); return sum + d * d;
  }, 0);
  let best = Math.min(at(0), at(1));
  for (let j = 1; j < cuts.length; j++) {
    const lo = cuts[j - 1]!, hi = cuts[j]!, mid = (lo + hi) / 2;
    let qa = 0, qb = 0;
    for (const i of axes) {
      const v = b[i] - a[i], x = a[i] + v * mid;
      const bound = x < box.min[i] ? box.min[i] : x > box.max[i] ? box.max[i] : null;
      if (bound !== null) { qa += v * v; qb += v * (a[i] - bound); }
    }
    best = Math.min(best, at(lo), at(hi), at(qa > 0 ? Math.max(lo, Math.min(hi, -qb / qa)) : mid));
  }
  return Math.sqrt(best);
}
export function clearance(pose: ToolPose, box: Obstacle): number {
  const d = direction(pose), p = pose.positionMm;
  return segmentBoxDistance(p, [p[0] - d[0] * BLADE_LENGTH_MM, p[1] - d[1] * BLADE_LENGTH_MM, p[2] - d[2] * BLADE_LENGTH_MM], box) - BLADE_RADIUS_MM - COLLISION_MARGIN_MM;
}
export function createCollision(initial: ToolPose) {
  let pose = structuredClone(initial), episodes = 0;
  let active = new Set<string>();
  return {
    reset(next: ToolPose) { pose = structuredClone(next); episodes = 0; active.clear(); },
    apply(requested: ToolPose, obstacles: readonly Obstacle[]): AppliedToolState {
      const from = pose;
      const speed = distance(from.positionMm, requested.positionMm) + BLADE_LENGTH_MM * arc(direction(from), direction(requested)).angle;
      let t = 0;
      // Distance is 1-Lipschitz: this step cannot cross contact, even for pure rotation.
      // Bounded effort fails closed at the last proven safe pose; never applies the unchecked remainder.
      for (let i = 0; i < 192 && t < 1; i++) {
        const current = interpolate(from, requested, t);
        const gap = Math.min(...obstacles.map(o => clearance(current, o)));
        if (speed === 0 || gap > speed * (1 - t)) { t = 1; break; }
        if (gap <= 1e-10) break;
        const next = t + 0.8 * gap / speed;
        if (next === t) break;
        const candidate = Math.min(1, next);
        if (obstacles.some(o => clearance(interpolate(from, requested, candidate), o) < 0.001)) break;
        t = candidate;
      }
      pose = t === 1 ? structuredClone(requested) : interpolate(from, requested, t);
      const contacts = new Set(obstacles.filter(o => clearance(pose, o) <= 0.03 || (active.has(o.id) && clearance(pose, o) < RELEASE_MM)).map(o => o.id));
      if (contacts.size > 0 && active.size === 0) episodes++;
      active = contacts;
      return { pose: publishedPose(pose), requestedPose: publishedPose(requested), contactIds: [...active], contactEpisodes: episodes, mismatch: distance(pose.positionMm, requested.positionMm) > 1e-6 || distance(direction(pose), direction(requested)) > 1e-6 };
    },
  };
}

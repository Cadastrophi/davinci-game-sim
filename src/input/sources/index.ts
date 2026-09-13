import type { InputFacade, RawPoseSample, Result, Vec3 } from '../../contracts';

export interface ReplayEvent {
  readonly atMs: number;
  readonly positionMm: Vec3;
  readonly yawDeg: number;
  readonly pitchDeg: number;
}
export interface SampleDriver {
  /** Advance using the driver's own clock origin; preferred for app render loops. */
  tick(): Result;
  advanceTo(elapsedMs: number): Result;
  reset(): void;
  dispose(): void;
}
type Sink = Pick<InputFacade, 'ingest' | 'pause'>;
interface DriverOptions { readonly now?: () => number }
const success = (): Result => ({ ok: true, value: undefined });
const fail = (reason: string): Result => ({ ok: false, reason });

/** Discrete playback: timestamps retain their place in the replay timeline.
 * Late polling cannot manufacture fresh input. Reset requires deliberate rebase.
 */
export function createReplayDriver(input: Sink, events: readonly ReplayEvent[], options: DriverOptions = {}): SampleDriver {
  const now = options.now ?? (() => performance.now());
  let previous = -Infinity;
  const fixture = events.map(event => {
    if (!Number.isFinite(event.atMs) || event.atMs < 0 || event.atMs < previous ||
      !Array.isArray(event.positionMm) || event.positionMm.length !== 3 ||
      ![0, 1, 2].every(i => Number.isFinite(event.positionMm[i])) || !Number.isFinite(event.yawDeg) || !Number.isFinite(event.pitchDeg)) {
      throw new Error('invalid-replay-fixture');
    }
    previous = event.atMs;
    return { ...event, positionMm: [event.positionMm[0], event.positionMm[1], event.positionMm[2]] as Vec3 };
  });
  let epoch = now();
  let cursor = 0;
  let lastElapsed = -Infinity;
  let sequence = 0;
  let disposed = false;
  const driver: SampleDriver = {
    tick() { return driver.advanceTo(now() - epoch); },
    advanceTo(elapsedMs) {
      if (disposed) return fail('disposed');
      if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs < lastElapsed || epoch + elapsedMs > now()) return fail('invalid-replay-time');
      lastElapsed = elapsedMs;
      while (cursor < fixture.length && fixture[cursor]!.atMs <= elapsedMs) {
        const event = fixture[cursor]!;
        const result = input.ingest({ positionMm: [...event.positionMm] as Vec3, yawDeg: event.yawDeg, pitchDeg: event.pitchDeg,
          roll: null, source: 'replay', sequence: sequence + 1, receivedAtMs: epoch + event.atMs });
        if (!result.ok) return result;
        sequence++;
        cursor++;
      }
      return success();
    },
    reset() {
      if (disposed) return;
      input.pause('replay-reset');
      epoch = now(); cursor = 0; lastElapsed = -Infinity;
    },
    dispose() { disposed = true; },
  };
  return driver;
}

/** A deterministic 50Hz synthetic controller; reads never generate input themselves. */
export function createMockDriver(input: Sink, options: DriverOptions & { readonly intervalMs?: number } = {}): SampleDriver {
  const now = options.now ?? (() => performance.now());
  const interval = options.intervalMs ?? 20;
  if (!Number.isFinite(interval) || interval <= 0) throw new Error('invalid-mock-interval');
  let epoch = now();
  let lastTick = -1;
  let lastElapsed = -Infinity;
  let sequence = 0;
  let disposed = false;
  const driver: SampleDriver = {
    tick() { return driver.advanceTo(now() - epoch); },
    advanceTo(elapsedMs) {
      if (disposed) return fail('disposed');
      if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs < lastElapsed || epoch + elapsedMs > now()) return fail('invalid-mock-time');
      lastElapsed = elapsedMs;
      const tick = Math.floor(elapsedMs / interval);
      if (!Number.isSafeInteger(tick)) return fail('invalid-mock-time');
      if (tick === lastTick) return success();
      const at = tick * interval;
      const sample: RawPoseSample = { positionMm: [Math.sin(at / 1500) * 35, 0, Math.cos(at / 1500) * 20],
        yawDeg: Math.sin(at / 2000) * 25, pitchDeg: Math.cos(at / 1700) * 15,
        roll: null, receivedAtMs: epoch + at, sequence: sequence + 1, source: 'mock' };
      const result = input.ingest(sample);
      if (!result.ok) return result;
      lastTick = tick; sequence++;
      return success();
    },
    reset() {
      if (disposed) return;
      input.pause('mock-reset'); epoch = now(); lastTick = -1; lastElapsed = -Infinity;
    },
    dispose() { disposed = true; },
  };
  return driver;
}

export interface ManualPose { readonly positionMm: Vec3; readonly yawDeg: number; readonly pitchDeg: number }
export interface ManualSource {
  setPose(pose: ManualPose): Result;
  move(deltaMm: Vec3, yawDeltaDeg?: number, pitchDeltaDeg?: number): Result;
  tick(): Result;
  reset(): void;
  dispose(): void;
}

/** E translates keyboard/mouse actions into raw virtual deltas and owns all listeners.
 * tick explicitly simulates a stationary controller stream too, at most 50Hz.
 */
export function createManualSource(input: Sink, options: DriverOptions = {}): ManualSource {
  const now = options.now ?? (() => performance.now());
  let pose: ManualPose = { positionMm: [0, 0, 0], yawDeg: 0, pitchDeg: 0 };
  let sequence = 0;
  let lastAt = -Infinity;
  let disposed = false;
  function valid(next: ManualPose): boolean {
    return !!next && Array.isArray(next.positionMm) && next.positionMm.length === 3 &&
      [0, 1, 2].every(i => Number.isFinite(next.positionMm[i])) && Number.isFinite(next.yawDeg) && Number.isFinite(next.pitchDeg);
  }
  const source: ManualSource = {
    setPose(next) {
      if (disposed) return fail('disposed');
      if (!valid(next)) return fail('invalid-manual-pose');
      pose = { ...next, positionMm: [...next.positionMm] as Vec3 };
      return success();
    },
    move(delta, yaw = 0, pitch = 0) {
      if (!valid({ positionMm: delta, yawDeg: yaw, pitchDeg: pitch })) return fail('invalid-manual-delta');
      return source.setPose({ positionMm: [pose.positionMm[0] + delta[0], pose.positionMm[1] + delta[1], pose.positionMm[2] + delta[2]],
        yawDeg: pose.yawDeg + yaw, pitchDeg: pose.pitchDeg + pitch });
    },
    tick() {
      if (disposed) return fail('disposed');
      const time = now();
      if (!Number.isFinite(time) || time < 0 || time < lastAt) return fail('invalid-manual-time');
      if (time - lastAt < 20) return success();
      const result = input.ingest({ ...pose, positionMm: [...pose.positionMm] as Vec3, roll: null,
        source: 'mock', sequence: sequence + 1, receivedAtMs: time });
      if (!result.ok) return result;
      sequence++; lastAt = time;
      return success();
    },
    reset() {
      if (disposed) return;
      input.pause('mock-reset'); pose = { positionMm: [0, 0, 0], yawDeg: 0, pitchDeg: 0 }; lastAt = -Infinity;
    },
    dispose() { disposed = true; },
  };
  return source;
}

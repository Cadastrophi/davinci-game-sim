import { INITIAL_TOOL_POSE, STALE_AFTER_MS } from '../../contracts';
import type { CalibrationConfig, ControlFrame, InputStatus, RawPoseSample, Result, ToolPose, Vec3 } from '../../contracts';

type CalibrationStatus = InputStatus['calibration'];
type Rotation = readonly [number, number, number, number];
const success = (): Result => ({ ok: true, value: undefined });
const failure = (reason: string): Result => ({ ok: false, reason });
const tuple = (v: Vec3): Vec3 => [v[0], v[1], v[2]];
const copyPose = (pose: ToolPose): ToolPose => ({ ...pose, positionMm: tuple(pose.positionMm), direction: pose.direction === null ? null : tuple(pose.direction) });
const copyRaw = (sample: RawPoseSample): RawPoseSample => ({ ...sample, positionMm: tuple(sample.positionMm) });
const finiteTuple = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2]);
const norm = (v: Vec3): number => Math.hypot(...v);
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (v: Vec3): Vec3 => { const length = norm(v); return [v[0] / length, v[1] / length, v[2] / length]; };

function validPose(pose: ToolPose): boolean {
  if (!pose || !finiteTuple(pose.positionMm)) return false;
  if (pose.directionKind === 'unavailable') return pose.direction === null;
  return (pose.directionKind === 'virtual-mapped' || pose.directionKind === 'physical-validated') &&
    finiteTuple(pose.direction) && Math.abs(norm(pose.direction) - 1) <= 1e-6;
}
function validConfig(config: CalibrationConfig): boolean {
  return !!config && finiteTuple(config.axisOrder) &&
    new Set(config.axisOrder).size === 3 && config.axisOrder.every(axis => axis === 0 || axis === 1 || axis === 2) &&
    finiteTuple(config.axisSigns) && config.axisSigns.every(sign => sign === 1 || sign === -1) &&
    finiteTuple(config.translationGain) && config.translationGain.every(gain => gain > 0) &&
    finiteTuple(config.cameraGain) && config.cameraGain.every(gain => gain > 0) &&
    (config.yawSign === 1 || config.yawSign === -1) && (config.pitchSign === 1 || config.pitchSign === -1) &&
    (config.directionKind === 'unavailable' || config.directionKind === 'virtual-mapped');
}
function validSample(sample: RawPoseSample): boolean {
  return !!sample && finiteTuple(sample.positionMm) && Number.isFinite(sample.yawDeg) && Number.isFinite(sample.pitchDeg) &&
    sample.roll === null && Number.isFinite(sample.receivedAtMs) && sample.receivedAtMs >= 0 &&
    Number.isSafeInteger(sample.sequence) && sample.sequence >= 0 &&
    (sample.source === 'mock' || sample.source === 'replay' || sample.source === 'serial');
}

/** Right-handed world: neutral points -Z; positive yaw turns toward -X,
 * positive pitch toward +Y. Apply local X pitch, then world Y yaw.
 * Unit angular gains make periodic angle reduction continuous across +/-180.
 */
function nominalDirection(sample: RawPoseSample, config: CalibrationConfig): Vec3 {
  const yaw = (sample.yawDeg % 360) * (Math.PI / 180) * config.yawSign;
  const pitch = (sample.pitchDeg % 360) * (Math.PI / 180) * config.pitchSign;
  return [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
}

/** Shortest-arc rotation with a deterministic perpendicular axis at the antipode.
 * This corrects a pointing direction only; it is not measured tool twist.
 */
function directionRebase(from: Vec3, to: Vec3): Rotation {
  const d = Math.max(-1, Math.min(1, dot(from, to)));
  const axis = cross(from, to);
  const axisLength = norm(axis);
  if (axisLength < 1e-12) {
    if (d >= 0) return [0, 0, 0, 1];
    const leastAligned: Vec3 = Math.abs(from[0]) <= Math.abs(from[1]) && Math.abs(from[0]) <= Math.abs(from[2])
      ? [1, 0, 0] : Math.abs(from[1]) <= Math.abs(from[2]) ? [0, 1, 0] : [0, 0, 1];
    const perpendicular = normalize(cross(from, leastAligned));
    return [...perpendicular, 0];
  }
  const halfAngle = Math.atan2(axisLength, d) / 2;
  const scale = Math.sin(halfAngle) / axisLength;
  return [axis[0] * scale, axis[1] * scale, axis[2] * scale, Math.cos(halfAngle)];
}
function rotate(v: Vec3, q: Rotation): Vec3 {
  const u: Vec3 = [q[0], q[1], q[2]];
  const uv = cross(u, v);
  const uuv = cross(u, uv);
  return normalize([v[0] + 2 * (q[3] * uv[0] + uuv[0]), v[1] + 2 * (q[3] * uv[1] + uuv[1]), v[2] + 2 * (q[3] * uv[2] + uuv[2])]);
}

export interface InputMapping {
  ingest(sample: RawPoseSample): Result;
  snapshot(nowMs: number): ControlFrame;
  calibrate(config: CalibrationConfig, appliedPose: ToolPose): Result;
  enterCameraMode(appliedPose: ToolPose): Result;
  exitCameraMode(appliedPose: ToolPose): Result;
  pause(reason: string): void;
  resume(appliedPose: ToolPose): Result;
  setConnected(connected: boolean): void;
  getCalibrationStatus(): CalibrationStatus;
  getRaw(): RawPoseSample | null;
}

export function createInputMapping(options: { now?: () => number; staleAfterMs?: number } = {}): InputMapping {
  const now = options.now ?? (() => performance.now());
  const staleAfterMs = options.staleAfterMs ?? STALE_AFTER_MS;
  if (!Number.isFinite(staleAfterMs) || staleAfterMs <= 0) throw new RangeError('staleAfterMs must be finite and positive');
  let connected = false;
  let sessionHasSample = false;
  let raw: RawPoseSample | null = null;
  let config: CalibrationConfig | null = null;
  let calibration: CalibrationStatus = 'uncalibrated';
  let calibrationRevision = 0;
  let mode: ControlFrame['mode'] = 'paused';
  let pauseReason: string | null = 'uncalibrated';
  let requested = copyPose(INITIAL_TOOL_POSE);
  let anchorRaw: RawPoseSample | null = null;
  let anchorPose: ToolPose | null = null;
  let directionRotation: Rotation = [0, 0, 0, 1];
  let frozen: ToolPose | null = null;
  let cameraOffset: Vec3 = [0, 0, 0];
  let cameraSession = 0;
  let lastObservedMs = -Infinity;

  function pause(reason: string): void {
    mode = 'paused';
    pauseReason = reason;
    frozen = null;
    cameraOffset = [0, 0, 0];
    anchorRaw = null;
    anchorPose = null;
  }
  function observe(time: number): boolean {
    if (!Number.isFinite(time) || time < 0 || time < lastObservedMs) {
      pause('invalid-clock');
      return false;
    }
    lastObservedMs = time;
    if (connected && sessionHasSample && raw !== null && time - raw.receivedAtMs >= staleAfterMs && mode !== 'paused') pause('stale-input');
    return true;
  }
  function isFresh(time: number): boolean {
    return connected && sessionHasSample && raw !== null && time >= raw.receivedAtMs && time - raw.receivedAtMs < staleAfterMs;
  }
  function mutationCheck(applied: ToolPose): Result {
    const time = now();
    if (!observe(time)) return failure('invalid-clock');
    if (!connected) { pause('disconnected'); return failure('disconnected'); }
    if (!sessionHasSample || raw === null) { pause('missing-input'); return failure('missing-input'); }
    if (!isFresh(time)) { pause('stale-input'); return failure('stale-input'); }
    if (!validPose(applied)) { pause('invalid-applied-pose'); return failure('invalid-applied-pose'); }
    return success();
  }
  function rebase(applied: ToolPose): void {
    // Callers have checked raw/config before invoking rebase.
    anchorRaw = copyRaw(raw!);
    // H cannot preserve physical-validation provenance through arbitrary virtual rebasing.
    anchorPose = {
      positionMm: tuple(applied.positionMm),
      direction: config!.directionKind === 'virtual-mapped' && applied.direction !== null ? tuple(applied.direction) : null,
      directionKind: config!.directionKind === 'virtual-mapped' && applied.direction !== null ? 'virtual-mapped' : 'unavailable',
    };
    directionRotation = anchorPose.direction === null ? [0, 0, 0, 1] : directionRebase(nominalDirection(raw!, config!), normalize(anchorPose.direction));
    requested = copyPose(anchorPose);
    mode = 'tool';
    pauseReason = null;
    frozen = null;
    cameraOffset = [0, 0, 0];
  }
  function displacement(sample: RawPoseSample, gain: Vec3): Vec3 {
    const a = anchorRaw!.positionMm;
    const c = config!;
    const mapped = (i: 0 | 1 | 2): number => {
      const axis = c.axisOrder[i];
      return (sample.positionMm[axis] - a[axis]) * c.axisSigns[i] * gain[i];
    };
    return [mapped(0), mapped(1), mapped(2)];
  }
  function derive(sample: RawPoseSample): Result {
    if (mode === 'paused' || config === null || anchorRaw === null || anchorPose === null) return success();
    if (mode === 'camera') {
      const offset = displacement(sample, config.cameraGain);
      if (!finiteTuple(offset)) { pause('mapping-overflow'); return failure('mapping-overflow'); }
      cameraOffset = offset;
      return success();
    }
    const delta = displacement(sample, config.translationGain);
    const position: Vec3 = [anchorPose.positionMm[0] + delta[0], anchorPose.positionMm[1] + delta[1], anchorPose.positionMm[2] + delta[2]];
    if (!finiteTuple(delta) || !finiteTuple(position)) { pause('mapping-overflow'); return failure('mapping-overflow'); }
    const direction = anchorPose.direction === null ? null : rotate(nominalDirection(sample, config), directionRotation);
    if (direction !== null && !finiteTuple(direction)) { pause('mapping-overflow'); return failure('mapping-overflow'); }
    requested = { positionMm: position, direction, directionKind: anchorPose.directionKind };
    return success();
  }
  const api: InputMapping = {
    ingest(sample) {
      const time = now();
      // Observe the OLD sample before replacing it: fresh arrivals cannot hide an outage.
      if (!observe(time)) return failure('invalid-clock');
      if (!connected) return failure('disconnected');
      if (!validSample(sample)) return failure('invalid-sample');
      if (sample.receivedAtMs > time) return failure('future-sample');
      const changedSource = sessionHasSample && raw !== null && sample.source !== raw.source;
      if (!changedSource && sessionHasSample && raw !== null &&
          (sample.sequence <= raw.sequence || sample.receivedAtMs < raw.receivedAtMs)) return failure('out-of-order-sample');
      if (changedSource) pause('source-changed');
      if (time - sample.receivedAtMs >= staleAfterMs) pause('stale-input');
      const derived = derive(sample);
      if (!derived.ok) return derived;
      raw = copyRaw(sample);
      sessionHasSample = true;
      return success();
    },
    snapshot(time) {
      const validTime = observe(time);
      return {
        sequence: raw?.sequence ?? 0,
        receivedAtMs: raw?.receivedAtMs ?? 0,
        source: raw?.source ?? 'mock',
        fresh: validTime && isFresh(time),
        mode,
        requestedPose: copyPose(requested),
        cameraOffsetMm: tuple(cameraOffset),
        cameraSession,
        frozenPose: frozen === null ? null : copyPose(frozen),
        calibrationRevision,
        pauseReason,
      };
    },
    calibrate(nextConfig, applied) {
      if (!validConfig(nextConfig)) { calibration = 'invalid'; config = null; pause('invalid-calibration'); return failure('invalid-calibration'); }
      const checked = mutationCheck(applied);
      if (!checked.ok) return checked;
      config = { ...nextConfig, axisOrder: [...nextConfig.axisOrder], axisSigns: tuple(nextConfig.axisSigns), translationGain: tuple(nextConfig.translationGain), cameraGain: tuple(nextConfig.cameraGain) };
      calibration = 'valid';
      calibrationRevision++;
      rebase(applied);
      return success();
    },
    enterCameraMode(applied) {
      const checked = mutationCheck(applied);
      if (!checked.ok) return checked;
      if (config === null || calibration !== 'valid') return failure('invalid-calibration');
      if (mode !== 'tool') return failure('wrong-mode');
      anchorRaw = copyRaw(raw!);
      anchorPose = copyPose(applied);
      frozen = copyPose(applied);
      requested = copyPose(applied);
      cameraOffset = [0, 0, 0];
      cameraSession++;
      mode = 'camera';
      return success();
    },
    exitCameraMode(applied) {
      const checked = mutationCheck(applied);
      if (!checked.ok) return checked;
      if (mode !== 'camera') return failure('wrong-mode');
      if (config === null || calibration !== 'valid') return failure('invalid-calibration');
      rebase(applied);
      return success();
    },
    pause,
    resume(applied) {
      const checked = mutationCheck(applied);
      if (!checked.ok) return checked;
      if (config === null || calibration !== 'valid') return failure('invalid-calibration');
      rebase(applied);
      return success();
    },
    setConnected(value) {
      if (connected === value) return;
      connected = value;
      sessionHasSample = false;
      pause(value ? 'awaiting-input' : 'disconnected');
    },
    getCalibrationStatus: () => calibration,
    getRaw: () => raw === null ? null : copyRaw(raw),
  };
  return api;
}

import { INITIAL_TOOL_POSE, STALE_AFTER_MS } from '../contracts';
import type { ControlFrame, ExerciseMode, ExerciseSnapshot, Target, ToolPose, TrainingFacade, TrainingState, Vec3, Obstacle } from '../contracts';
import { clearance, createCollision, distance } from './collision';

const REACH_TARGETS: readonly Target[] = [[0, 24, 0], [-30, 32, 20], [35, 18, -25], [0, 40, 30]].map((p, i) => ({ id: `reach-${i + 1}`, positionMm: [p[0]!, p[1]!, p[2]!] as const, direction: null, positionToleranceMm: 10, directionToleranceRad: Math.PI / 18, dwellMs: 500 }));
// Modest virtual pointing offsets; these are not measured physical shaft orientations.
const ALIGN_DIRECTIONS: readonly Vec3[] = [[0, 0, -1], [Math.sin(Math.PI / 12), 0, -Math.cos(Math.PI / 12)], [-Math.sin(Math.PI / 12), 0, -Math.cos(Math.PI / 12)], [0, Math.sin(Math.PI / 18), -Math.cos(Math.PI / 18)]];
const ALIGN_TARGETS: readonly Target[] = REACH_TARGETS.map((target, i) => ({ ...target, id: `align-${i + 1}`, direction: ALIGN_DIRECTIONS[i]! }));
const OBSTACLE_TARGETS: readonly Target[] = [[-25, 24, 30], [25, 24, 30], [35, 24, -25]].map((p, i) => ({ ...REACH_TARGETS[0]!, id: `obstacle-${i + 1}`, positionMm: [p[0]!, p[1]!, p[2]!] as const }));
const CAMERA_TARGETS: readonly Target[] = [[0, 24, 0], [-35, 30, 25], [35, 30, -25]].map((p, i) => ({ ...REACH_TARGETS[0]!, id: `camera-${i + 1}`, positionMm: [p[0]!, p[1]!, p[2]!] as const }));
const PROTECTED_BOXES: readonly Obstacle[] = [
  { id: 'central-protected', min: [8, 5, -18], max: [14, 42, 18] },
  { id: 'left-protected', min: [-44, 8, -34], max: [-36, 36, -18] },
];
/** Signed dot product: a reversed direction is pi radians away, never equivalent. */
export function directionErrorRad(pose: ToolPose, target: Vec3 | null): number | null {
  if (!target || !pose.direction || pose.directionKind === 'unavailable') return null;
  const actualLength = Math.hypot(...pose.direction), targetLength = Math.hypot(...target);
  if (!Number.isFinite(actualLength) || !Number.isFinite(targetLength) || actualLength < 1e-12 || targetLength < 1e-12) return null;
  const dot = pose.direction.reduce((sum, value, i) => sum + value / actualLength * target[i]! / targetLength, 0);
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}
/** Pure training state. Input owns the deliberate resume latch; fresh active frames resume training.
 * reset preserves applied pose and returns to ready; start begins/retries the chosen mode.
 */
export function createTraining(initialPose: ToolPose = INITIAL_TOOL_POSE): TrainingFacade {
  const collision = createCollision(initialPose);
  let applied = collision.apply(initialPose, []);
  let mode: ExerciseMode = 'free', phase: ExerciseSnapshot['phase'] = 'ready';
  let targetIndex = 0, dwellMs = 0, elapsedMs = 0, pathMm = 0, scoredContactEpisodes = 0;
  let lastNow: number | null = null, previous: ControlFrame | null = null, previousInside = false;
  let lastIdentity = '', pauseReason: string | null = null, interrupted = false;
  let samples: ToolPose['positionMm'][] = [];
  let cameraQualified = false, cameraArmed = false, qualifyingSession: string | null = null;
  // Preserve observed session identity across retries: an already-held Space cannot earn new credit.
  let lastCameraSession: string | null = null;
  const obstacles = (): readonly Obstacle[] => mode === 'obstacle' ? PROTECTED_BOXES : [];
  const targets = (): readonly Target[] => mode === 'reach' ? REACH_TARGETS : mode === 'align' ? ALIGN_TARGETS : mode === 'obstacle' ? OBSTACLE_TARGETS : mode === 'camera' ? CAMERA_TARGETS : [];
  const target = (): Target | null => phase !== 'completed' ? targets()[targetIndex] ?? null : null;
  function reset(nowMs: number) {
    collision.reset(applied.pose); applied = collision.apply(applied.pose, []);
    phase = 'ready'; targetIndex = 0; dwellMs = elapsedMs = pathMm = scoredContactEpisodes = 0;
    lastNow = nowMs; previous = null; previousInside = false; lastIdentity = ''; pauseReason = null; interrupted = false; samples = [];
    cameraQualified = false; cameraArmed = false; qualifyingSession = null;
  }
  return {
    start(nextMode, nowMs) {
      if (nextMode === 'obstacle' && PROTECTED_BOXES.some(box => clearance(applied.pose, box) <= 0.001)) {
        throw new Error('Move clear of protected volumes in Free practice before starting navigation.');
      }
      mode = nextMode; reset(nowMs); phase = 'running';
    },
    reset,
    pause(reason) {
      if (phase === 'ready' || phase === 'completed') return;
      phase = 'paused'; pauseReason = reason; interrupted = true; dwellMs = 0; previousInside = false;
      cameraQualified = false; cameraArmed = false; qualifyingSession = null;
    },
    step(frame, nowMs): TrainingState {
      if (!Number.isFinite(nowMs) || (lastNow !== null && nowMs < lastNow)) throw new Error('Training requires a monotonic finite clock');
      const age = nowMs - frame.receivedAtMs;
      const fresh = frame.fresh && age >= 0 && age < STALE_AFTER_MS;
      const active = fresh && frame.mode !== 'paused';
      const eligiblePhase = phase === 'running' || phase === 'paused';
      const continuous = previous !== null && lastNow !== null && nowMs < previous.receivedAtMs + STALE_AFTER_MS;
      const revisionChanged = previous !== null && previous.calibrationRevision !== frame.calibrationRevision;
      let dt = 0;
      if (eligiblePhase && !interrupted && previous && lastNow !== null && previous.fresh && previous.mode !== 'paused') {
        dt = Math.max(0, Math.min(nowMs, previous.receivedAtMs + STALE_AFTER_MS) - lastNow);
        elapsedMs += dt;
      }
      if (eligiblePhase) {
        phase = active ? 'running' : 'paused';
        pauseReason = active ? null : frame.pauseReason ?? (fresh ? 'Paused' : 'Input stale');
      }
      if (mode === 'camera' && phase !== 'completed') {
        if (!active || (previous !== null && !continuous) || revisionChanged || interrupted) { cameraQualified = false; cameraArmed = false; qualifyingSession = null; }
        if (fresh && frame.mode === 'tool') cameraArmed = true;
        if (frame.mode === 'camera') {
          const session = `${frame.source}:${frame.calibrationRevision}:${frame.cameraSession}`;
          if (phase === 'running' && fresh && cameraArmed && session !== lastCameraSession) qualifyingSession = session;
          cameraArmed = false; lastCameraSession = session;
          if (phase === 'running' && fresh && qualifyingSession === session && Number.isFinite(Math.hypot(...frame.cameraOffsetMm)) && Math.hypot(...frame.cameraOffsetMm) >= 5) cameraQualified = true;
        }
      }
      const identity = `${frame.source}:${frame.calibrationRevision}:${frame.sequence}`;
      const newSample = identity !== lastIdentity;
      if (fresh && frame.mode === 'tool' && newSample) {
        const before = applied.pose;
        applied = collision.apply(frame.requestedPose, obstacles());
        if (phase === 'running') {
          pathMm += distance(before.positionMm, applied.pose.positionMm);
          scoredContactEpisodes = applied.contactEpisodes;
        }
        lastIdentity = identity;
      }
      const currentTarget = target();
      const error = currentTarget ? distance(applied.pose.positionMm, currentTarget.positionMm) : null;
      const angleError = directionErrorRad(applied.pose, currentTarget?.direction ?? null);
      const directionInside = currentTarget?.direction == null || (angleError !== null && angleError <= currentTarget.directionToleranceRad);
      const cameraInside = mode !== 'camera' || cameraQualified;
      const inside = cameraInside && directionInside && phase === 'running' && fresh && frame.mode === 'tool' && error !== null && error <= currentTarget!.positionToleranceMm;
      if (phase !== 'completed') {
        if (!inside || !previousInside || !continuous || revisionChanged || interrupted) { dwellMs = 0; samples = []; }
        else dwellMs += dt;
      }
      if (inside && newSample) { samples.push(applied.pose.positionMm); if (samples.length > 1000) samples.shift(); }
      let steadinessMm = 0;
      if (samples.length) {
        const mean = [0, 0, 0]; for (const p of samples) for (let i = 0; i < 3; i++) mean[i] = mean[i]! + p[i]! / samples.length;
        steadinessMm = Math.sqrt(samples.reduce((sum, p) => sum + distance(p, [mean[0]!, mean[1]!, mean[2]!]) ** 2, 0) / samples.length);
      }
      let feedback = phase === 'completed' ? 'Practice complete' : mode === 'free' ? 'Free practice — no competitive score' : inside ? 'Hold steady' : 'Reach the target';
      let advanced = false;
      if (currentTarget && dwellMs >= currentTarget.dwellMs) {
        targetIndex++; advanced = true;
        cameraQualified = false; qualifyingSession = null;
        if (targetIndex === targets().length) { phase = 'completed'; feedback = 'Practice complete'; dwellMs = currentTarget.dwellMs; }
        else { dwellMs = 0; samples = []; feedback = 'Target reached — continue'; }
      }
      previousInside = inside && !advanced;
      previous = structuredClone(frame); lastNow = nowMs; interrupted = false;
      const nextTarget = target();
      if (mode === 'align' && phase !== 'completed') {
        feedback = applied.pose.directionKind === 'unavailable' || applied.pose.direction === null
          ? 'Direction unavailable — calibrate a virtual pointing mapping'
          : `${applied.pose.directionKind === 'physical-validated' ? 'Pointing alignment' : 'Virtual direction'} — ${advanced ? 'target reached — continue' : inside ? 'hold position and direction' : 'match position and pointing direction'}`;
      }
      if (mode === 'camera' && phase !== 'completed' && !cameraQualified) feedback = 'Hold Space and pan/dolly at least 5mm, then release to acquire this target';
      if (mode === 'obstacle' && phase !== 'completed' && applied.contactIds.length) feedback = 'Protected contact — retreat and route around the obstacle';
      return { applied: structuredClone(applied), obstacles: structuredClone(obstacles()), exercise: { mode, phase, target: nextTarget, targetIndex, targetCount: targets().length, positionErrorMm: nextTarget ? distance(applied.pose.positionMm, nextTarget.positionMm) : null, directionErrorRad: directionErrorRad(applied.pose, nextTarget?.direction ?? null), dwellMs, elapsedMs, pathMm, contactEpisodes: scoredContactEpisodes, steadinessMm, pauseReason, feedback: phase === 'paused' ? pauseReason ?? 'Paused' : feedback } };
    },
  };
}

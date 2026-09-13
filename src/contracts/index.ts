/** launch-v1.1 — renderer-independent seam; E is the sole custodian.
 * Virtual mm, right-handed +X right/+Y up/+Z toward viewer. Raw angles are degrees.
 * All times share the injected performance.now() domain. No hardware timestamps.
 */
export const CONTRACT_REVISION = 'launch-v1.1' as const;
export const STALE_AFTER_MS = 250;
export type Vec3 = readonly [number, number, number];
export type Source = 'serial' | 'replay' | 'mock';
export type DirectionKind = 'unavailable' | 'virtual-mapped' | 'physical-validated';
export type Result<T = undefined> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string };
export interface RawPoseSample {
  readonly positionMm: Vec3;
  readonly yawDeg: number;
  readonly pitchDeg: number;
  readonly roll: null;
  readonly receivedAtMs: number;
  readonly sequence: number;
  readonly source: Source;
}
export interface ToolPose {
  readonly positionMm: Vec3;
  readonly direction: Vec3 | null;
  readonly directionKind: DirectionKind;
}
export interface InputStatus {
  readonly connection: 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'error';
  readonly source: Source;
  readonly packetRateHz: number;
  readonly sampleAgeMs: number | null;
  readonly invalidPackets: number;
  readonly deviceLabel: string;
  readonly calibration: 'uncalibrated' | 'valid' | 'invalid';
  readonly error: string | null;
}
export interface ControlFrame {
  readonly sequence: number;
  readonly receivedAtMs: number;
  readonly source: Source;
  readonly fresh: boolean;
  readonly mode: 'tool' | 'camera' | 'paused';
  readonly requestedPose: ToolPose;
  /** Cumulative from this camera session's raw entry anchor, never integrate per render. */
  readonly cameraOffsetMm: Vec3;
  readonly cameraSession: number;
  readonly frozenPose: ToolPose | null;
  readonly calibrationRevision: number;
  readonly pauseReason: string | null;
}
export interface InputSnapshot {
  readonly raw: RawPoseSample | null;
  readonly status: InputStatus;
  readonly control: ControlFrame;
}
export interface DeviceDescriptor { readonly id: string; readonly label: string }
export interface SerialSettings {
  readonly baudRate: 115200;
  readonly dataBits: 7 | 8;
  readonly stopBits: 1 | 2;
  readonly parity: 'none' | 'even' | 'odd';
  readonly flowControl: 'none';
}
export const DEFAULT_SERIAL_SETTINGS: SerialSettings = Object.freeze({ baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
export interface CalibrationConfig {
  /** Output axis i uses raw axis axisOrder[i], sign[i] and gain[i]. Must be a permutation. */
  readonly axisOrder: readonly [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];
  readonly axisSigns: Vec3;
  readonly translationGain: Vec3;
  readonly cameraGain: Vec3;
  readonly yawSign: 1 | -1;
  readonly pitchSign: 1 | -1;
  readonly directionKind: 'unavailable' | 'virtual-mapped';
}
export const DEFAULT_CALIBRATION: CalibrationConfig = Object.freeze({ axisOrder: [0, 1, 2] as const, axisSigns: [1, 1, 1] as const, translationGain: [1, 1, 1] as const, cameraGain: [1, 1, 1] as const, yawSign: 1, pitchSign: 1, directionKind: 'virtual-mapped' });
/** H implements this facade and exports createInputFacade({now?}) from src/input/index.ts.
 * Mapping mutations require a fresh sample, return explicit failure otherwise.
 * Stale/disconnect latches pause; only deliberate resume/calibrate rebases it.
 * Device selection is called directly from a user gesture. No global key listeners.
 */
export interface InputFacade {
  requestDevice(): Promise<Result<DeviceDescriptor>>;
  refreshGrantedDevices(): Promise<readonly DeviceDescriptor[]>;
  connect(deviceId: string, settings: SerialSettings): Promise<Result>;
  disconnect(): Promise<void>;
  ingest(sample: RawPoseSample): Result;
  snapshot(nowMs: number): InputSnapshot;
  calibrate(config: CalibrationConfig, appliedPose: ToolPose): Result;
  enterCameraMode(appliedPose: ToolPose): Result;
  exitCameraMode(appliedPose: ToolPose): Result;
  pause(reason: string): void;
  resume(appliedPose: ToolPose): Result;
  dispose(): Promise<void>;
}
export type ExerciseMode = 'free' | 'reach' | 'align' | 'obstacle' | 'camera' | 'incision';
export interface Target {
  readonly id: string;
  readonly positionMm: Vec3;
  readonly direction: Vec3 | null;
  readonly positionToleranceMm: number;
  readonly directionToleranceRad: number;
  readonly dwellMs: number;
}
export interface Obstacle { readonly id: string; readonly min: Vec3; readonly max: Vec3 }
export interface AppliedToolState {
  readonly pose: ToolPose;
  readonly requestedPose: ToolPose;
  readonly contactIds: readonly string[];
  readonly contactEpisodes: number;
  readonly mismatch: boolean;
}
export interface ExerciseSnapshot {
  readonly mode: ExerciseMode;
  readonly phase: 'ready' | 'running' | 'paused' | 'completed';
  readonly target: Target | null;
  readonly targetIndex: number;
  readonly targetCount: number;
  readonly positionErrorMm: number | null;
  readonly directionErrorRad: number | null;
  readonly dwellMs: number;
  readonly elapsedMs: number;
  readonly pathMm: number;
  readonly contactEpisodes: number;
  readonly steadinessMm: number;
  readonly pauseReason: string | null;
  readonly feedback: string;
}
/** Disclosed pre-tessellated seam demonstration, driven by applied-tip contact. */
export interface IncisionSnapshot {
  readonly seamStartMm: Vec3;
  readonly seamEndMm: Vec3;
  /** Outer patch half-width, perpendicular to its seam. */
  readonly halfWidthMm: number;
  readonly cutSegments: readonly boolean[];
  readonly coverage01: number;
  readonly contact: boolean;
  readonly depthMm: number | null;
  readonly deviationMm: number | null;
}

export interface TrainingState {
  readonly incision?: IncisionSnapshot | null;
  readonly applied: AppliedToolState;
  readonly exercise: ExerciseSnapshot;
  readonly obstacles: readonly Obstacle[];
}
/** Training owns all collision and scoring. Duplicate renders cannot add samples/path. */
export interface TrainingFacade {
  start(mode: ExerciseMode, nowMs: number): void;
  step(frame: ControlFrame, nowMs: number): TrainingState;
  pause(reason: string): void;
  reset(nowMs: number): void;
}
export interface SceneSnapshot extends TrainingState {
  readonly cameraPositionMm: Vec3;
  readonly showTrail: boolean;
}
export interface SceneFacade { render(snapshot: SceneSnapshot): void; resize(): void; dispose(): void }
export interface UiSnapshot extends TrainingState {
  readonly input: InputSnapshot;
  readonly frameTimeMs: number;
  readonly cameraAdjusting: boolean;
  readonly showTrail: boolean;
}
export type UiCommand =
  | { readonly type: 'start'; readonly mode: ExerciseMode }
  | { readonly type: 'source'; readonly source: Source }
  | { readonly type: 'trail'; readonly enabled: boolean }
  | { readonly type: 'connect'; readonly settings: SerialSettings }
  | { readonly type: 'calibrate'; readonly config: CalibrationConfig }
  | { readonly type: 'pause' | 'resume' | 'reset' | 'disconnect' };
export interface UiFacade { render(snapshot: UiSnapshot): void; dispose(): void }
export const INITIAL_TOOL_POSE: ToolPose = Object.freeze({ positionMm: [0, 18, 0] as const, direction: [0, 0, -1] as const, directionKind: 'virtual-mapped' });
/** Fixed viewing basis: no orbit, orientation changes or lens zoom. */
export const CAMERA_HOME: Vec3 = Object.freeze([0, 100, 180]);
export const CAMERA_RIGHT: Vec3 = Object.freeze([1, 0, 0]);
export const CAMERA_UP: Vec3 = Object.freeze([0, 0.9138115486, -0.4061384661]);
export const CAMERA_FORWARD: Vec3 = Object.freeze([0, -0.4061384661, -0.9138115486]);

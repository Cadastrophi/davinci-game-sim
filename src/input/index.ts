import type { InputFacade, InputSnapshot, RawPoseSample, SerialSettings, Source } from '../contracts';
import { createInputMapping } from './mapping';
import { createSerialTransport } from './serial';
import type { SerialAccess } from './serial';

export interface InputOptions {
  readonly now?: () => number;
  readonly staleAfterMs?: number;
  /** Injectable receive-only browser boundary for tests and embedded hosts. */
  readonly serial?: SerialAccess | null;
  readonly secureContext?: boolean;
}

/** One owner for the selected source. E owns event listeners and application wiring. */
export function createInputFacade(options: InputOptions = {}): InputFacade {
  const now = options.now ?? (() => performance.now());
  const mapping = createInputMapping({ now, staleAfterMs: options.staleAfterMs });
  let source: Source = 'mock';
  let virtualConnected = false;
  let disposed = false;
  let disposal: Promise<void> | null = null;
  let invalidPackets = 0;
  let virtualError: string | null = null;
  let serialMappingError: string | null = null;
  const rateBuckets = Array.from({ length: 20 }, () => ({ tick: -Infinity, count: 0 }));
  const fail = (reason: string) => ({ ok: false, reason } as const);
  const transport = createSerialTransport({
    now,
    serial: options.serial,
    secureContext: options.secureContext,
    onSample(sample) {
      if (!disposed && source === 'serial') {
        const result = mapping.ingest(sample);
        serialMappingError = result.ok ? null : result.reason;
      }
    },
    onState(status) {
      if (!disposed && source === 'serial') mapping.setConnected(status.connection === 'connected');
    },
  });
  const rejectSample = (reason: string) => {
    invalidPackets++;
    virtualError = reason;
    return fail(reason);
  };
  function validSynthetic(sample: RawPoseSample): boolean {
    return !!sample && (sample.source === 'mock' || sample.source === 'replay') &&
      Array.isArray(sample.positionMm) && sample.positionMm.length === 3 &&
      [0, 1, 2].every(i => Number.isFinite(sample.positionMm[i])) && Number.isFinite(sample.yawDeg) &&
      Number.isFinite(sample.pitchDeg) && sample.roll === null &&
      Number.isFinite(sample.receivedAtMs) && sample.receivedAtMs >= 0 &&
      Number.isSafeInteger(sample.sequence) && sample.sequence >= 0;
  }
  function rate(nowMs: number): number {
    const tick = Math.floor(nowMs / 50);
    return rateBuckets.reduce((sum, bucket) => sum + (bucket.tick > tick - 20 && bucket.tick <= tick ? bucket.count : 0), 0);
  }
  function resetRate(): void {
    for (const bucket of rateBuckets) { bucket.tick = -Infinity; bucket.count = 0; }
  }
  function syntheticIngest(sample: RawPoseSample) {
    if (disposed) return fail('disposed');
    if (!validSynthetic(sample)) return rejectSample('invalid-synthetic-sample');
    if (sample.receivedAtMs > now()) return rejectSample('future-sample');
    const connection = transport.getStatus().connection;
    if (source === 'serial' && (connection === 'connecting' || connection === 'connected')) return fail('serial-active');
    if (source !== sample.source || !virtualConnected) {
      mapping.setConnected(false);
      source = sample.source;
      virtualConnected = true;
      mapping.setConnected(true);
      resetRate();
    }
    const result = mapping.ingest(sample);
    if (!result.ok) return rejectSample(result.reason);
    virtualError = null;
    const tick = Math.floor(now() / 50);
    const bucket = rateBuckets[((tick % 20) + 20) % 20]!;
    if (bucket.tick !== tick) { bucket.tick = tick; bucket.count = 0; }
    bucket.count++;
    return result;
  }
  return {
    requestDevice: () => disposed ? Promise.resolve(fail('disposed')) : transport.requestDevice(),
    refreshGrantedDevices: () => disposed ? Promise.resolve([]) : transport.refreshGrantedDevices(),
    async connect(deviceId: string, settings: SerialSettings) {
      if (disposed) return fail('disposed');
      const existing = transport.getStatus().connection;
      if (existing === 'connecting' || existing === 'connected') return fail('serial-active');
      source = 'serial';
      serialMappingError = null;
      virtualConnected = false;
      mapping.setConnected(false);
      return transport.connect(deviceId, settings);
    },
    async disconnect() {
      virtualConnected = false;
      mapping.setConnected(false);
      await transport.disconnect();
    },
    ingest: syntheticIngest,
    snapshot(nowMs: number): InputSnapshot {
      const control = mapping.snapshot(nowMs);
      const raw = mapping.getRaw();
      const calibration = mapping.getCalibrationStatus();
      if (source === 'serial') {
        const status = transport.getStatus(nowMs);
        return { raw, control, status: { ...status, calibration, error: serialMappingError ?? status.error } };
      }
      const age = raw?.source === source && Number.isFinite(nowMs) ? nowMs - raw.receivedAtMs : null;
      return {
        raw, control,
        status: {
          connection: virtualConnected && !disposed ? 'connected' : 'disconnected',
          source, calibration, packetRateHz: virtualConnected && Number.isFinite(nowMs) ? rate(nowMs) : 0,
          sampleAgeMs: age !== null && age >= 0 ? age : null,
          invalidPackets, deviceLabel: source === 'replay' ? 'Replay fixture' : 'Synthetic controller', error: virtualError,
        },
      };
    },
    calibrate: (config, applied) => disposed ? fail('disposed') : mapping.calibrate(config, applied),
    enterCameraMode: applied => disposed ? fail('disposed') : mapping.enterCameraMode(applied),
    exitCameraMode: applied => disposed ? fail('disposed') : mapping.exitCameraMode(applied),
    pause: reason => mapping.pause(reason),
    resume: applied => disposed ? fail('disposed') : mapping.resume(applied),
    async dispose() {
      if (disposal) return disposal;
      disposed = true;
      virtualConnected = false;
      mapping.setConnected(false);
      mapping.pause('disposed');
      disposal = transport.dispose().finally(() => { disposal = null; });
      return disposal;
    },
  };
}

export { createReplayDriver, createMockDriver, createManualSource } from './sources';
export type { ReplayEvent, SampleDriver, ManualSource, ManualPose } from './sources';

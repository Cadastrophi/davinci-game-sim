import { DEFAULT_SERIAL_SETTINGS } from '../../contracts';
import type { DeviceDescriptor, InputStatus, RawPoseSample, Result, SerialSettings } from '../../contracts';
import { BracketPoseParser } from './parser';

export { BracketPoseParser, MAX_PACKET_BYTES } from './parser';
export type { ParsedPose, ParseBatch } from './parser';
export type SerialStatus = Omit<InputStatus, 'calibration'>;

/** The adapter deliberately has no output streams or signal-setting capability. */
export interface SerialPortLike {
  readonly readable: ReadableStream<Uint8Array> | null;
  open(settings: SerialSettings): Promise<void>;
  close(): Promise<void>;
  getInfo(): { usbVendorId?: number; usbProductId?: number; bluetoothServiceClassId?: string };
}
export interface SerialAccess {
  requestPort(): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
}
export interface SerialTransportOptions {
  readonly now?: () => number;
  readonly onSample: (sample: RawPoseSample) => void;
  readonly onState?: (status: SerialStatus) => void;
  readonly serial?: SerialAccess | null;
  readonly secureContext?: boolean;
}
interface Session {
  readonly port: SerialPortLike;
  readonly parser: BracketPoseParser;
  opening: Promise<void>;
  opened: boolean;
  stopped: boolean;
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
  loop: Promise<void> | null;
  closing: Promise<void> | null;
}

const fail = (reason: string): Result<never> => ({ ok: false, reason });
const success = (): Result => ({ ok: true, value: undefined });
const message = (error: unknown): string => error instanceof Error ? error.message : String(error);

export function createSerialTransport(options: SerialTransportOptions) {
  const now = options.now ?? (() => performance.now());
  const serial = options.serial === undefined
    ? (typeof navigator === 'undefined' ? null : (navigator as Navigator & { serial?: SerialAccess }).serial ?? null)
    : options.serial;
  const secure = options.secureContext ?? globalThis.isSecureContext === true;
  const supported = secure && serial !== null;
  const ports = new Map<string, SerialPortLike>();
  const ids = new WeakMap<SerialPortLike, string>();
  let nextDevice = 1;
  let session: Session | null = null;
  let disposed = false;
  let selecting = false;
  let deviceLabel = '';
  let connection: SerialStatus['connection'] = supported ? 'disconnected' : 'unsupported';
  let error: string | null = supported ? null : 'Web Serial requires a supported browser and secure context';
  let raw: RawPoseSample | null = null;
  let sequence = 0;
  let invalidPackets = 0;
  // Fixed 100 ms bins: the current bin and preceding nine approximate a trailing second.
  const rateBins = Array.from({ length: 10 }, () => ({ tick: -Infinity, count: 0 }));

  function getStatus(nowMs = now()): SerialStatus {
    const tick = Math.floor(nowMs / 100);
    const age = raw ? nowMs - raw.receivedAtMs : NaN;
    return {
      connection, source: 'serial', packetRateHz: connection === 'connected'
        ? rateBins.reduce((sum, bin) => sum + (bin.tick <= tick && bin.tick > tick - 10 ? bin.count : 0), 0) : 0,
      sampleAgeMs: Number.isFinite(age) && age >= 0 ? age : null,
      invalidPackets, deviceLabel, error,
    };
  }

  function state(value: SerialStatus['connection'], reason: string | null = null): void {
    connection = value;
    error = reason;
    options.onState?.(getStatus());
  }

  function descriptor(port: SerialPortLike): DeviceDescriptor {
    let id = ids.get(port);
    if (!id) { id = `serial-${nextDevice++}`; ids.set(port, id); }
    ports.set(id, port);
    const info = port.getInfo();
    const hex = (value: number) => value.toString(16).padStart(4, '0');
    const label = info.usbVendorId === undefined ? `Serial device ${id.slice(7)}`
      : `USB ${hex(info.usbVendorId)}:${info.usbProductId === undefined ? 'unknown' : hex(info.usbProductId)}`;
    return { id, label };
  }

  async function requestDevice(): Promise<Result<DeviceDescriptor>> {
    if (disposed) return fail('Serial transport is disposed');
    if (!supported || !serial) return fail(error ?? 'Web Serial is unavailable');
    if (selecting) return fail('Device selection is already pending');
    selecting = true;
    try {
      // Invoke immediately: awaiting other work first can lose transient user activation.
      const port = await serial.requestPort();
      if (disposed) return fail('Serial transport is disposed');
      return { ok: true, value: descriptor(port) };
    } catch (cause) {
      return fail(message(cause));
    } finally { selecting = false; }
  }

  async function refreshGrantedDevices(): Promise<readonly DeviceDescriptor[]> {
    if (disposed || !supported || !serial) return [];
    try {
      const granted = await serial.getPorts();
      if (disposed) return [];
      ports.clear();
      return granted.map(descriptor);
    } catch (cause) {
      // A failed inventory should not stop an already-connected read session.
      if (disposed) return [];
      error = message(cause);
      options.onState?.(getStatus());
      return [];
    }
  }

  function closeSession(target: Session): Promise<void> {
    if (target.closing) return target.closing;
    target.stopped = true;
    target.closing = (async () => {
      let closed = false;
      await target.opening.catch(() => undefined);
      try {
        if (target.reader) await target.reader.cancel().catch(() => undefined);
        await target.loop;
        if (target.opened) await target.port.close();
        closed = true;
      } catch (cause) {
        if (session === target) state('error', `Serial cleanup failed: ${message(cause)}`);
      } finally {
        target.parser.reset();
        if (closed && session === target) session = null;
        // Preserve ownership when close fails; a later disconnect can retry cleanup.
        if (!closed) target.closing = null;
      }
    })();
    return target.closing;
  }

  async function readLoop(target: Session): Promise<void> {
    try {
      if (!target.port.readable) throw new Error('Serial port has no readable stream');
      target.reader = target.port.readable.getReader();
      while (!target.stopped) {
        const { done, value } = await target.reader.read();
        if (target.stopped || session !== target) break;
        if (done) { state('disconnected', 'Serial stream ended'); break; }
        if (!value) continue;
        const receivedAtMs = now();
        const batch = target.parser.push(value);
        invalidPackets += batch.invalidPackets;
        if (batch.latest) {
          sequence += batch.validPackets;
          const tick = Math.floor(receivedAtMs / 100);
          const bin = rateBins[((tick % 10) + 10) % 10]!;
          if (bin.tick !== tick) { bin.tick = tick; bin.count = 0; }
          bin.count += batch.validPackets;
          raw = Object.freeze({ positionMm: Object.freeze(batch.latest.positionMm),
            yawDeg: batch.latest.yawDeg, pitchDeg: batch.latest.pitchDeg, roll: null,
            receivedAtMs, sequence, source: 'serial' });
          options.onSample(raw);
        }
      }
    } catch (cause) {
      if (!target.stopped && session === target) state('error', `Serial read failed: ${message(cause)}`);
    } finally {
      target.reader?.releaseLock();
      target.reader = null;
    }
  }

  async function connect(deviceId: string, settings: SerialSettings = DEFAULT_SERIAL_SETTINGS): Promise<Result> {
    if (disposed) return fail('Serial transport is disposed');
    if (!supported) return fail(error ?? 'Web Serial is unavailable');
    if (session) return fail('A serial connection or cleanup is already active');
    if (!settings || settings.baudRate !== 115200 || settings.flowControl !== 'none'
      || ![7, 8].includes(settings.dataBits) || ![1, 2].includes(settings.stopBits)
      || !['none', 'even', 'odd'].includes(settings.parity)) return fail('Invalid receive-only serial settings');
    const port = ports.get(deviceId);
    if (!port) return fail('Select or refresh the serial device first');
    const target: Session = { port, parser: new BracketPoseParser(), opening: Promise.resolve(), opened: false,
      stopped: false, reader: null, loop: null, closing: null };
    session = target;
    deviceLabel = descriptor(port).label;
    rateBins.forEach(bin => { bin.tick = -Infinity; bin.count = 0; });
    // Supply only the validated fields; callers cannot smuggle output/control options through JS.
    const openSettings: SerialSettings = { baudRate: 115200, dataBits: settings.dataBits,
      stopBits: settings.stopBits, parity: settings.parity, flowControl: 'none' };
    target.opening = Promise.resolve().then(() => port.open(openSettings)).then(() => { target.opened = true; });
    state('connecting');
    try {
      await target.opening;
      if (target.stopped || disposed || session !== target) return fail('Connection was cancelled');
      state('connected');
      target.loop = readLoop(target);
      void target.loop.then(() => closeSession(target));
      return success();
    } catch (cause) {
      if (!target.stopped && session === target) state('error', `Serial open failed: ${message(cause)}`);
      await closeSession(target);
      return fail(message(cause));
    }
  }

  async function disconnect(): Promise<void> {
    const target = session;
    if (target) target.stopped = true;
    state(supported ? 'disconnected' : 'unsupported', supported ? null : error);
    if (target) await closeSession(target);
  }

  async function dispose(): Promise<void> {
    if (disposed) { if (session) await disconnect(); return; }
    disposed = true;
    await disconnect();
    ports.clear();
  }

  return { requestDevice, refreshGrantedDevices, connect, disconnect, dispose, getStatus, latestSample: () => raw };
}

import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SERIAL_SETTINGS } from '../../contracts';
import type { RawPoseSample } from '../../contracts';
import { createSerialTransport } from './index';
import type { SerialPortLike } from './index';

const bytes = (value: string) => new TextEncoder().encode(value);
const packet = '[1,2,3,179,10,0,0]';
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fakePort() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const cancel = vi.fn();
  const port = {
    readable: null as ReadableStream<Uint8Array> | null,
    open: vi.fn(async () => { port.readable = new ReadableStream<Uint8Array>({ start(value) { controller = value; }, cancel }); }),
    close: vi.fn(async () => { if (port.readable?.locked) throw new Error('Reader still locked'); port.readable = null; }),
    getInfo: () => ({ usbVendorId: 1234, usbProductId: 42 }),
    get writable(): never { throw new Error('Forbidden writer access'); },
    setSignals: vi.fn(() => { throw new Error('Forbidden signal change'); }),
  };
  return { port, cancel, send: (value: string) => controller.enqueue(bytes(value)),
    end: () => controller.close(), fail: () => controller.error(new Error('Device removed')) };
}
function setup() {
  const device = fakePort();
  let time = 1000;
  const samples: RawPoseSample[] = [];
  const serial = { requestPort: vi.fn(async (): Promise<SerialPortLike> => device.port), getPorts: vi.fn(async () => [device.port]) };
  const onState = vi.fn();
  const transport = createSerialTransport({ serial, secureContext: true, now: () => time,
    onSample: sample => samples.push(sample), onState });
  const connect = async () => {
    const result = await transport.requestDevice();
    if (!result.ok) throw new Error(result.reason);
    expect(await transport.connect(result.value.id, DEFAULT_SERIAL_SETTINGS)).toEqual({ ok: true, value: undefined });
    return result.value.id;
  };
  return { ...device, transport, samples, serial, onState, connect, setTime: (value: number) => { time = value; } };
}

describe('receive-only serial transport', () => {
  it('opens exact settings, reports newest pose and counts all packets', async () => {
    const h = setup();
    expect(h.transport.getStatus().sampleAgeMs).toBeNull();
    await h.connect();
    h.send(packet + '[4,5,6,-179,10,88,9][bad]');
    await flush();
    expect(h.port.open).toHaveBeenCalledWith(DEFAULT_SERIAL_SETTINGS);
    expect(h.samples).toHaveLength(1);
    expect(h.samples[0]).toEqual({ positionMm: [4, 5, 6], yawDeg: -179, pitchDeg: 10,
      roll: null, source: 'serial', receivedAtMs: 1000, sequence: 2 });
    expect(h.transport.getStatus()).toMatchObject({ invalidPackets: 1, packetRateHz: 2, sampleAgeMs: 0 });
    expect(h.transport.getStatus(NaN).sampleAgeMs).toBeNull();
    expect(h.transport.getStatus(999).sampleAgeMs).toBeNull();
    expect(Object.isFrozen(h.samples[0]?.positionMm)).toBe(true);
    await h.transport.dispose();
    expect(h.port.setSignals).not.toHaveBeenCalled();
  });

  it('stamps completion reads and never refreshes age on malformed input', async () => {
    const h = setup(); await h.connect();
    h.send('[1,2'); await flush(); h.setTime(1100);
    h.send(',3,179,10,0,0]'); await flush(); h.setTime(1350);
    h.send('[NaN]'); await flush();
    expect(h.transport.latestSample()?.receivedAtMs).toBe(1100);
    expect(h.transport.getStatus().sampleAgeMs).toBe(250);
    h.setTime(2100);
    expect(h.transport.getStatus().packetRateHz).toBe(0);
    await h.transport.dispose();
  });

  it('cancels a pending read, unlocks and closes once; reconnect clears partial data', async () => {
    const h = setup(); const id = await h.connect();
    h.send(packet + '[7,8'); await flush();
    await Promise.all([h.transport.disconnect(), h.transport.disconnect()]);
    expect(h.cancel).toHaveBeenCalledTimes(1);
    expect(h.port.close).toHaveBeenCalledTimes(1);
    expect(h.transport.getStatus().connection).toBe('disconnected');
    await h.transport.connect(id);
    h.send(',9,0,0,0,0]' + packet); await flush();
    expect(h.samples).toHaveLength(2);
    expect(h.samples[1]?.sequence).toBe(2);
    await h.transport.dispose(); await h.transport.dispose();
    expect(h.port.close).toHaveBeenCalledTimes(2);
    expect((await h.transport.connect(id)).ok).toBe(false);
  });

  it('disconnect during a pending open closes the eventual port without reading', async () => {
    const h = setup(); const opening = deferred();
    const actualOpen = h.port.open.getMockImplementation()!;
    h.port.open.mockImplementation(async () => { await opening.promise; await actualOpen(); });
    const selected = await h.transport.requestDevice(); if (!selected.ok) throw new Error('Missing device');
    const connecting = h.transport.connect(selected.value.id);
    const disconnecting = h.transport.disconnect();
    expect((await h.transport.connect(selected.value.id)).ok).toBe(false);
    opening.resolve();
    expect((await connecting).ok).toBe(false);
    await disconnecting;
    expect(h.port.close).toHaveBeenCalledTimes(1);
    expect(h.samples).toHaveLength(0);
    expect(h.transport.getStatus().connection).toBe('disconnected');
  });

  it('does not deliver bytes already queued when disconnect starts', async () => {
    const h = setup(); await h.connect();
    h.send(packet);
    await h.transport.disconnect();
    expect(h.samples).toHaveLength(0);
  });

  it('reports reader failure and can reconnect deliberately', async () => {
    const h = setup(); const id = await h.connect();
    h.fail(); await flush();
    expect(h.transport.getStatus()).toMatchObject({ connection: 'error', error: 'Serial read failed: Device removed' });
    expect(h.port.close).toHaveBeenCalledTimes(1);
    expect((await h.transport.connect(id)).ok).toBe(true);
    h.send(packet); await flush();
    expect(h.samples).toHaveLength(1);
    await h.transport.dispose();
  });

  it('handles clean stream end without retaining connection ownership', async () => {
    const h = setup(); const id = await h.connect(); h.end(); await flush();
    expect(h.transport.getStatus().connection).toBe('disconnected');
    expect(h.port.close).toHaveBeenCalledTimes(1);
    expect((await h.transport.connect(id)).ok).toBe(true);
    await h.transport.dispose();
  });

  it('handles failed open and cancelled picker explicitly', async () => {
    const h = setup();
    h.serial.requestPort.mockRejectedValueOnce(new Error('Picker cancelled'));
    expect(await h.transport.requestDevice()).toEqual({ ok: false, reason: 'Picker cancelled' });
    const selected = await h.transport.requestDevice(); if (!selected.ok) throw new Error('Missing device');
    h.port.open.mockRejectedValueOnce(new Error('Device busy'));
    expect(await h.transport.connect(selected.value.id)).toEqual({ ok: false, reason: 'Device busy' });
    expect(h.port.close).not.toHaveBeenCalled();
    expect((await h.transport.connect(selected.value.id)).ok).toBe(true);
    await h.transport.dispose();
  });

  it('refreshes granted descriptors with stable opaque IDs', async () => {
    const h = setup();
    const first = await h.transport.refreshGrantedDevices();
    expect(await h.transport.refreshGrantedDevices()).toEqual(first);
    expect(first[0]).toEqual({ id: 'serial-1', label: 'USB 04d2:002a' });
    expect((await h.transport.connect('unknown')).ok).toBe(false);
    await h.transport.dispose();
  });

  it('does not invoke permission APIs in unsupported contexts', async () => {
    const h = setup();
    const transport = createSerialTransport({ serial: h.serial, secureContext: false, onSample: () => undefined });
    expect(transport.getStatus().connection).toBe('unsupported');
    expect((await transport.requestDevice()).ok).toBe(false);
    expect(await transport.refreshGrantedDevices()).toEqual([]);
    expect(h.serial.requestPort).not.toHaveBeenCalled();
    expect(h.serial.getPorts).not.toHaveBeenCalled();
    await transport.dispose();
  });

  it('drops device selection resolving after disposal', async () => {
    const h = setup(); const picker = deferred();
    h.serial.requestPort.mockImplementation(async () => { await picker.promise; return h.port; });
    const pending = h.transport.requestDevice();
    expect(h.serial.requestPort).toHaveBeenCalledTimes(1);
    expect((await h.transport.requestDevice()).ok).toBe(false);
    await h.transport.dispose(); picker.resolve();
    expect((await pending).ok).toBe(false);
    expect(h.port.open).not.toHaveBeenCalled();
  });

  it('rejects runtime settings outside the receive-only contract before open', async () => {
    const h = setup(); const devices = await h.transport.refreshGrantedDevices();
    // @ts-expect-error Simulate an untyped runtime caller overriding the confirmed baud.
    expect((await h.transport.connect(devices[0]!.id, { ...DEFAULT_SERIAL_SETTINGS, baudRate: 9600 })).ok).toBe(false);
    expect(h.port.open).not.toHaveBeenCalled();
    await h.transport.dispose();
  });

  it('publishes connected before any immediately buffered sample', async () => {
    const device = fakePort();
    const actualOpen = device.port.open.getMockImplementation()!;
    device.port.open.mockImplementation(async () => { await actualOpen(); device.send(packet); });
    const events: string[] = [];
    const transport = createSerialTransport({ secureContext: true,
      serial: { requestPort: async () => device.port, getPorts: async () => [device.port] },
      onState: status => events.push(status.connection), onSample: () => events.push('sample') });
    const devices = await transport.refreshGrantedDevices(); await transport.connect(devices[0]!.id); await flush();
    expect(events).toEqual(['connecting', 'connected', 'sample']);
    await transport.dispose();
  });

  it('retains ownership after close failure until cleanup is retried', async () => {
    const h = setup(); const id = await h.connect();
    h.port.close.mockRejectedValueOnce(new Error('Transient close failure'));
    await h.transport.disconnect();
    expect(h.transport.getStatus()).toMatchObject({ connection: 'error', error: 'Serial cleanup failed: Transient close failure' });
    expect((await h.transport.connect(id)).ok).toBe(false);
    await h.transport.disconnect();
    expect(h.port.close).toHaveBeenCalledTimes(2);
    expect((await h.transport.connect(id)).ok).toBe(true);
    await h.transport.dispose();
  });

  it('clears a cleanup error after a successful repeated dispose', async () => {
    const h = setup(); await h.connect();
    h.port.close.mockRejectedValueOnce(new Error('Transient dispose failure'));
    await h.transport.dispose();
    expect(h.transport.getStatus()).toMatchObject({ connection: 'error', error: 'Serial cleanup failed: Transient dispose failure' });
    await h.transport.dispose();
    expect(h.port.close).toHaveBeenCalledTimes(2);
    expect(h.transport.getStatus()).toMatchObject({ connection: 'disconnected', error: null });
    await h.transport.dispose();
    expect(h.port.close).toHaveBeenCalledTimes(2);
  });
});

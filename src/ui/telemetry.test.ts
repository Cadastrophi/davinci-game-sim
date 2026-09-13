import { describe, expect, it } from 'vitest';
import type { RawPoseSample } from '../contracts';
import { formatRawTelemetry } from './telemetry';

describe('raw input telemetry', () => {
  it('formats a serial sample without hiding zeroes or signs', () => {
    const sample: RawPoseSample = {
      positionMm: [0, -12.345, 8.5],
      yawDeg: -0.25,
      pitchDeg: 19.75,
      roll: null,
      receivedAtMs: 1000,
      sequence: 42,
      source: 'serial',
    };

    expect(formatRawTelemetry('serial', sample)).toEqual({
      label: 'UART STREAM',
      position: 'X 0.0  Y -12.3  Z 8.5',
      angles: 'YAW -0.3°  PITCH 19.8°',
      sequence: '#42',
    });
  });

  it('clearly reports when no raw sample is available', () => {
    expect(formatRawTelemetry('serial', null)).toEqual({
      label: 'UART STREAM',
      position: 'X —  Y —  Z —',
      angles: 'YAW —  PITCH —',
      sequence: '#—',
    });
  });
});

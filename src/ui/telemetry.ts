import type { RawPoseSample, Source } from '../contracts';

export interface RawTelemetry {
  readonly label: string;
  readonly position: string;
  readonly angles: string;
  readonly sequence: string;
}

function decimal(value: number): string {
  const formatted = value.toFixed(1);
  return formatted === '-0.0' ? '0.0' : formatted;
}

export function formatRawTelemetry(source: Source, sample: RawPoseSample | null): RawTelemetry {
  const label = source === 'serial' ? 'UART STREAM' : `${source.toUpperCase()} STREAM`;
  if (sample === null) {
    return { label, position: 'X —  Y —  Z —', angles: 'YAW —  PITCH —', sequence: '#—' };
  }
  return {
    label,
    position: `X ${decimal(sample.positionMm[0])}  Y ${decimal(sample.positionMm[1])}  Z ${decimal(sample.positionMm[2])}`,
    angles: `YAW ${decimal(sample.yawDeg)}°  PITCH ${decimal(sample.pitchDeg)}°`,
    sequence: `#${sample.sequence}`,
  };
}

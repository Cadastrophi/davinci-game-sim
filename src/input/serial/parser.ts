import type { Vec3 } from '../../contracts';

/** Decimal telemetry only: Number(''), hex and partial parses are deliberately rejected. */
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
export const MAX_PACKET_BYTES = 512;

export interface ParsedPose {
  readonly positionMm: Vec3;
  readonly yawDeg: number;
  readonly pitchDeg: number;
  /** Diagnostics only; this is never a measured roll in RawPoseSample. */
  readonly wireRoll: number;
  readonly unused: number;
}

export interface ParseBatch {
  readonly latest: ParsedPose | null;
  readonly validPackets: number;
  readonly invalidPackets: number;
}

/** One bounded ASCII candidate; noise and discarded packets do not accumulate. */
export class BracketPoseParser {
  private candidate: string | null = null;

  constructor(private readonly maxPacketBytes = MAX_PACKET_BYTES) {
    if (!Number.isInteger(maxPacketBytes) || maxPacketBytes < 2) throw new RangeError('Invalid packet limit');
  }

  get bufferedBytes(): number { return this.candidate?.length ?? 0; }

  reset(): void { this.candidate = null; }

  push(bytes: Uint8Array): ParseBatch {
    let latest: ParsedPose | null = null;
    let validPackets = 0;
    let invalidPackets = 0;
    for (const byte of bytes) {
      if (byte === 91) {
        if (this.candidate !== null) invalidPackets++;
        this.candidate = '[';
      } else if (this.candidate !== null) {
        if (this.candidate.length >= this.maxPacketBytes) {
          invalidPackets++;
          this.candidate = null;
        } else if (byte === 93) {
          const pose = parsePayload(this.candidate.slice(1));
          if (pose) { latest = pose; validPackets++; } else invalidPackets++;
          this.candidate = null;
        } else {
          // Non-ASCII bytes are retained as invalid characters, never decoded into numeric text.
          this.candidate += String.fromCharCode(byte);
        }
      }
    }
    return { latest, validPackets, invalidPackets };
  }
}

function parsePayload(payload: string): ParsedPose | null {
  const fields = payload.split(',');
  if (fields.length !== 7) return null;
  const values: number[] = [];
  for (const field of fields) {
    const token = field.replace(/^[\t\n\r ]+|[\t\n\r ]+$/g, '');
    if (!DECIMAL.test(token)) return null;
    const value = Number(token);
    if (!Number.isFinite(value)) return null;
    values.push(value);
  }
  return {
    positionMm: [values[0]!, values[1]!, values[2]!], yawDeg: values[3]!, pitchDeg: values[4]!,
    wireRoll: values[5]!, unused: values[6]!,
  };
}

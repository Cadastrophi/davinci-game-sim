import { describe, expect, it } from 'vitest';
import { BracketPoseParser, MAX_PACKET_BYTES } from './parser';

const bytes = (value: string) => new TextEncoder().encode(value);
const valid = '[1,2,3,179,-10,0,0]';

describe('bounded bracket telemetry', () => {
  it('accepts every possible split without requiring a newline', () => {
    for (let split = 0; split <= valid.length; split++) {
      const parser = new BracketPoseParser();
      const a = parser.push(bytes(valid.slice(0, split)));
      const b = parser.push(bytes(valid.slice(split)));
      expect(a.validPackets + b.validPackets).toBe(1);
      expect(b.latest ?? a.latest).toEqual({ positionMm: [1, 2, 3], yawDeg: 179, pitchDeg: -10, wireRoll: 0, unused: 0 });
    }
  });

  it('counts every valid packet while keeping only the latest', () => {
    const result = new BracketPoseParser().push(bytes(`debug ]${valid}[4,5,6,-179,10,22,99][bad]`));
    expect(result.validPackets).toBe(2);
    expect(result.invalidPackets).toBe(1);
    expect(result.latest?.positionMm).toEqual([4, 5, 6]);
    expect(result.latest?.wireRoll).toBe(22);
  });

  it.each(['', '1,2,3,4,5,6', '1,2,3,4,5,6,7,8', '1,,3,4,5,6,7',
    '1,2,3,4,5,NaN,0', '1,2,3,4,5,0,Infinity', '1,2,3,4,5,0,1e999',
    '0x10,2,3,4,5,0,0', '12oops,2,3,4,5,0,0', '1,2,3,4,5,0,\u00a01'])('rejects invalid payload %j and recovers', payload => {
    const result = new BracketPoseParser().push(bytes(`[${payload}]${valid}`));
    expect(result.invalidPackets).toBe(1);
    expect(result.validPackets).toBe(1);
  });

  it('accepts finite decimal exponents and ASCII whitespace', () => {
    const result = new BracketPoseParser().push(bytes('[ +1e2, -.5, 3.,\t-1.2E+2,0,0, 7\r\n]'));
    expect(result.latest?.positionMm).toEqual([100, -0.5, 3]);
    expect(result.latest?.yawDeg).toBe(-120);
  });

  it('bounds an unterminated candidate and counts overflow once', () => {
    const parser = new BracketPoseParser();
    expect(parser.push(bytes('[' + '1'.repeat(MAX_PACKET_BYTES * 10))).invalidPackets).toBe(1);
    expect(parser.bufferedBytes).toBe(0);
    expect(parser.push(bytes('noise'.repeat(200_000))).invalidPackets).toBe(0);
    expect(parser.bufferedBytes).toBe(0);
    expect(parser.push(bytes(valid)).validPackets).toBe(1);
  });

  it('abandons a nested candidate and resets partial data between sessions', () => {
    const parser = new BracketPoseParser();
    expect(parser.push(bytes('[garbage' + valid)).invalidPackets).toBe(1);
    parser.push(bytes('[1,2'));
    parser.reset();
    expect(parser.push(bytes(',3,4,5,0,0]')).validPackets).toBe(0);
    expect(parser.push(bytes(valid)).validPackets).toBe(1);
  });

  it('counts packet length including both brackets', () => {
    expect(new BracketPoseParser(valid.length).push(bytes(valid)).validPackets).toBe(1);
    expect(new BracketPoseParser(valid.length - 1).push(bytes(valid)).invalidPackets).toBe(1);
  });
});

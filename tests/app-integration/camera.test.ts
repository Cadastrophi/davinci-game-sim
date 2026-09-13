import { describe, expect, it } from 'vitest';
import { cameraPosition } from '../../src/app/camera';
import { CAMERA_HOME } from '../../src/contracts';
import { CAMERA_SEED, RAW_SEED } from '../fixtures/contract/seed';
describe('camera application contract', () => {
  it('applies cumulative offsets exactly once even over repeated renders', () => {
    const expected = cameraPosition(CAMERA_HOME, CAMERA_SEED.cameraOffsetMm);
    for (let i = 0; i < 100; i++) expect(cameraPosition(CAMERA_HOME, CAMERA_SEED.cameraOffsetMm)).toEqual(expected);
    expect(cameraPosition(CAMERA_HOME, [20, 0, 0])).toEqual([20, 100, 180]);
  });
  it('does not mutate the frozen tool pose when camera translation changes', () => {
    const pose = structuredClone(CAMERA_SEED.frozenPose);
    cameraPosition(CAMERA_HOME, [30, 25, 15]);
    expect(CAMERA_SEED.frozenPose).toEqual(pose);
    expect(RAW_SEED.roll).toBeNull();
  });
  it('bounds camera travel without changing the entry anchor', () => {
    expect(cameraPosition(CAMERA_HOME, [10000, 0, 0])[0]).toBe(120);
    expect(cameraPosition(CAMERA_HOME, [0, 0, 0])).toEqual(CAMERA_HOME);
  });
});

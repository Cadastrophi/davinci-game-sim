// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { INITIAL_TOOL_POSE, type InputSnapshot, type RawPoseSample, type UiSnapshot } from '../contracts';
import { createUi } from './index';

const raw: RawPoseSample = {
  positionMm: [0, -12.345, 8.5],
  yawDeg: -0.25,
  pitchDeg: 19.75,
  roll: null,
  receivedAtMs: 1000,
  sequence: 42,
  source: 'serial',
};

function snapshot(sample: RawPoseSample | null): UiSnapshot {
  const input: InputSnapshot = {
    raw: sample,
    control: {
      sequence: sample?.sequence ?? 0,
      receivedAtMs: sample?.receivedAtMs ?? 0,
      source: 'serial',
      fresh: sample !== null,
      mode: sample === null ? 'paused' : 'tool',
      requestedPose: INITIAL_TOOL_POSE,
      cameraOffsetMm: [0, 0, 0],
      cameraSession: 0,
      frozenPose: null,
      calibrationRevision: 1,
      pauseReason: sample === null ? 'missing-input' : null,
    },
    status: {
      connection: sample === null ? 'disconnected' : 'connected',
      source: 'serial',
      packetRateHz: sample === null ? 0 : 50,
      sampleAgeMs: sample === null ? null : 0,
      invalidPackets: 0,
      deviceLabel: sample === null ? '' : 'USB controller',
      calibration: 'valid',
      error: null,
    },
  };
  return {
    input,
    applied: { pose: INITIAL_TOOL_POSE, requestedPose: INITIAL_TOOL_POSE, contactIds: [], contactEpisodes: 0, mismatch: false },
    exercise: { mode: 'free', phase: sample === null ? 'paused' : 'running', target: null, targetIndex: 0, targetCount: 0, positionErrorMm: null, directionErrorRad: null, dwellMs: 0, elapsedMs: 0, pathMm: 0, contactEpisodes: 0, steadinessMm: 0, pauseReason: sample === null ? 'missing-input' : null, feedback: '' },
    obstacles: [],
    frameTimeMs: 16,
    cameraAdjusting: false,
    showTrail: false,
  };
}

describe('live input stream panel', () => {
  it('renders serial values and an explicit unavailable state in the top-right header', () => {
    const root = document.createElement('div');
    const ui = createUi(root, vi.fn(), ['free']);
    const panel = root.querySelector<HTMLElement>('.training-live-input')!;
    expect(panel.closest('.training-header-status')).not.toBeNull();

    ui.render(snapshot(raw));
    expect(panel.querySelector('[data-stream-label]')?.textContent).toBe('UART STREAM');
    expect(panel.querySelector('[data-stream-position]')?.textContent).toBe('X 0.0  Y -12.3  Z 8.5');
    expect(panel.querySelector('[data-stream-angles]')?.textContent).toBe('YAW -0.3°  PITCH 19.8°');
    expect(panel.querySelector('[data-stream-sequence]')?.textContent).toBe('#42');

    ui.render(snapshot(null));
    expect(panel.querySelector('[data-stream-position]')?.textContent).toBe('X —  Y —  Z —');
    expect(panel.querySelector('[data-stream-angles]')?.textContent).toBe('YAW —  PITCH —');
    expect(panel.querySelector('[data-stream-sequence]')?.textContent).toBe('#—');
    ui.dispose();
  });
});

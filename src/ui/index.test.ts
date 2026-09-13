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

function snapshot(sample: RawPoseSample | null, exercise: Partial<UiSnapshot['exercise']> = {}): UiSnapshot {
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
    exercise: { mode: 'free', phase: sample === null ? 'paused' : 'running', target: null, targetIndex: 0, targetCount: 0, positionErrorMm: null, directionErrorRad: null, dwellMs: 0, elapsedMs: 0, pathMm: 0, contactEpisodes: 0, steadinessMm: 0, pauseReason: sample === null ? 'missing-input' : null, feedback: '', ...exercise },
    obstacles: [],
    frameTimeMs: 16,
    cameraAdjusting: false,
    showTrail: false,
  };
}

describe('live input stream panel', () => {
  it('renders current serial values and removes the panel when no live sample exists', () => {
    const root = document.createElement('div');
    const ui = createUi(root, vi.fn(), ['free']);
    const panel = root.querySelector<HTMLElement>('.training-live-input')!;
    expect(panel.closest('.training-header-status')).not.toBeNull();

    ui.render(snapshot(raw));
    expect(panel.querySelector('[data-stream-label]')?.textContent).toBe('UART STREAM');
    expect(panel.querySelector('[data-stream-position]')?.textContent).toBe('X 0.0  Y -12.3  Z 8.5');
    expect(panel.querySelector('[data-stream-angles]')?.textContent).toBe('YAW -0.3°  PITCH 19.8°');
    expect(panel.querySelector('[data-stream-sequence]')?.textContent).toBe('#42');

    const retained = snapshot(raw);
    ui.render({
      ...retained,
      input: {
        ...retained.input,
        control: { ...retained.input.control, fresh: false, mode: 'paused', pauseReason: 'disconnected' },
        status: { ...retained.input.status, connection: 'disconnected', sampleAgeMs: null },
      },
    });
    expect(panel.hidden).toBe(true);
    ui.dispose();
  });
});

describe('conditional session measurements', () => {
  it('omits unavailable measurements instead of rendering placeholder values', () => {
    const root = document.createElement('div');
    const ui = createUi(root, vi.fn(), ['free']);

    ui.render(snapshot(raw));

    expect(root.querySelector<HTMLElement>('[data-metric="position"]')?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-metric="direction"]')?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-metric="time"]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-metric="path"]')?.hidden).toBe(false);
    expect(root.querySelector('.training-metrics')?.textContent).not.toContain('—');
    expect(root.textContent?.toLowerCase()).not.toContain('unavailable');
    ui.dispose();
  });

  it('shows a measurement pill when its value becomes available', () => {
    const root = document.createElement('div');
    const ui = createUi(root, vi.fn(), ['reach']);

    ui.render(snapshot(raw, { mode: 'reach', positionErrorMm: 4.25, directionErrorRad: Math.PI / 12 }));

    const position = root.querySelector<HTMLElement>('[data-metric="position"]')!;
    const direction = root.querySelector<HTMLElement>('[data-metric="direction"]')!;
    expect(position.hidden).toBe(false);
    expect(position.textContent).toContain('4.3 mm');
    expect(direction.hidden).toBe(false);
    expect(direction.textContent).toContain('15.0°');
    ui.dispose();
  });

  it('omits unavailable incision details', () => {
    const root = document.createElement('div');
    const ui = createUi(root, vi.fn(), ['incision']);
    const base = snapshot(raw, { mode: 'incision' });

    ui.render({
      ...base,
      incision: {
        seamStartMm: [-25, 18, 0], seamEndMm: [25, 18, 0], halfWidthMm: 15,
        cutSegments: [false], coverage01: 0, contact: false, depthMm: null, deviationMm: null,
      },
    });

    expect(root.querySelector<HTMLElement>('[data-direction]')?.hidden).toBe(true);
    expect(root.textContent).not.toContain('—');
    ui.dispose();
  });
});

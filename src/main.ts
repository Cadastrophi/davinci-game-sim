import { DEFAULT_CALIBRATION, INITIAL_TOOL_POSE, type Result, type Source } from './contracts';
import { createInputFacade, createManualSource, createReplayDriver } from './input';
import { mountApplication } from './app/mount';
import { attachManualControls } from './app/manual-controls';

const input = createInputFacade({ now: () => performance.now() });
type Provider = { tick(): Result; dispose(): void };
let provider: Provider | null = null;
let manual: ReturnType<typeof createManualSource> | null = null;
let keyboard: ReturnType<typeof attachManualControls> | null = null;
function stopSource() {
  provider?.dispose(); provider = null; manual = null; keyboard?.clear();
}
function sourceSelected(source: Source) {
  stopSource();
  if (source === 'mock') { manual = createManualSource(input, { now: () => performance.now() }); provider = manual; }
  if (source === 'replay') provider = createReplayProvider();
  provider?.tick();
}

function createReplayProvider() {
  const events = Array.from({ length: 2001 }, (_, i) => ({
    atMs: i * 20,
    positionMm: [Math.sin(i / 75) * 35, Math.sin(i / 110) * 10, Math.cos(i / 75) * 20 - 20] as const,
    yawDeg: Math.sin(i / 100) * 15,
    pitchDeg: Math.sin(i / 140) * 10,
  }));
  return createReplayDriver(input, events, { now: () => performance.now() });
}

sourceSelected('mock');
input.calibrate(DEFAULT_CALIBRATION, INITIAL_TOOL_POSE);
input.resume(INITIAL_TOOL_POSE);
const application = mountApplication(document.querySelector<HTMLElement>('#app')!, {
  input, onSource: sourceSelected, stopSource,
  pump: () => { keyboard?.tick(); provider?.tick(); },
  availableModes: ['free', 'reach', 'align', 'obstacle', 'camera'],
});
keyboard = attachManualControls(document.querySelector<HTMLCanvasElement>('.practice-canvas')!, () => manual);
void application.controller.command({ type: 'start', mode: 'free' });

if (import.meta.hot) import.meta.hot.dispose(() => { keyboard?.dispose(); void application.dispose(); });

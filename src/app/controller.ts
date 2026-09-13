import { CAMERA_HOME } from '../contracts';
import type { InputFacade, InputSnapshot, SceneFacade, Source, TrainingFacade, TrainingState, UiCommand, UiFacade, Vec3 } from '../contracts';
import { cameraPosition } from './camera';

export interface AppDependencies {
  readonly input: InputFacade;
  readonly training: TrainingFacade;
  readonly scene: SceneFacade;
  readonly ui: UiFacade;
  readonly now: () => number;
  readonly onSource: (source: Source) => void;
  readonly stopSource?: () => void;
}

/** Owns event routing and camera placement. Mapping and scored state stay in their facades. */
export function createController({ input, training, scene, ui, now, onSource, stopSource }: AppDependencies) {
  let camera: Vec3 = CAMERA_HOME;
  let cameraEntry: Vec3 = CAMERA_HOME;
  let held = false;
  let showTrail = false;
  let disposed = false;
  let message: string | null = null;
  let connectionGeneration = 0;
  let serialTail: Promise<void> = Promise.resolve();
  // Serial mutations cannot race a previous port open/close. Device selection stays
  // outside this queue so requestDevice retains the browser's user activation.
  function serialOperation(operation: () => Promise<void>): Promise<void> {
    const pending = serialTail.then(operation);
    serialTail = pending.catch(() => {});
    return pending;
  }
  function isCurrent(generation: number) { return !disposed && generation === connectionGeneration; }
  function connectionError(error: unknown) { return error instanceof Error ? error.message : String(error); }
  let previousTick: number | null = null;
  let frameTime = 0;
  let state: TrainingState = training.step(input.snapshot(now()).control, now());

  function pause(reason: string) {
    held = false;
    input.pause(reason);
    training.pause(reason);
  }

  function spaceDown() {
    if (held || disposed) return;
    const result = input.enterCameraMode(state.applied.pose);
    if (!result.ok) { message = result.reason; return; }
    held = true;
    cameraEntry = camera;
  }

  function spaceUp() {
    if (!held || disposed) return;
    held = false;
    const result = input.exitCameraMode(state.applied.pose);
    if (!result.ok) { message = result.reason; pause(result.reason); }
  }

  function tick(time = now()) {
    if (disposed) return;
    let snapshot: InputSnapshot = input.snapshot(time);
    if (!snapshot.control.fresh && snapshot.control.mode !== 'paused') {
      pause('Input stale — resume with fresh input');
      snapshot = input.snapshot(time);
    }
    if (snapshot.control.mode === 'paused') held = false;
    if (held && snapshot.control.mode === 'camera' && snapshot.control.fresh) {
      camera = cameraPosition(cameraEntry, snapshot.control.cameraOffsetMm);
    }
    state = training.step(snapshot.control, time);
    if (previousTick !== null) frameTime = frameTime === 0 ? time - previousTick : frameTime * 0.9 + (time - previousTick) * 0.1;
    previousTick = time;
    scene.render({ ...state, cameraPositionMm: camera, showTrail });
    ui.render({ ...state, input: message ? { ...snapshot, status: { ...snapshot.status, error: message } } : snapshot, frameTimeMs: frameTime, cameraAdjusting: held, showTrail });
  }

  async function command(command: UiCommand): Promise<void> {
    if (disposed) return;
    message = null;
    switch (command.type) {
      case 'pause': pause('Paused by you'); break;
      case 'resume': {
        const result = input.resume(state.applied.pose);
        if (!result.ok) message = result.reason;
        break;
      }
      case 'start': {
        pause('Starting exercise');
        try { training.start(command.mode, now()); }
        catch (error) { message = connectionError(error); break; }
        const result = input.resume(state.applied.pose);
        if (!result.ok) { message = result.reason; training.pause(result.reason); }
        break;
      }
      case 'reset': {
        pause('Resetting exercise');
        camera = CAMERA_HOME;
        training.reset(now());
        try { training.start(state.exercise.mode, now()); }
        catch (error) { message = connectionError(error); break; }
        const result = input.resume(state.applied.pose);
        if (!result.ok) { message = result.reason; training.pause(result.reason); }
        break;
      }
      case 'calibrate': {
        pause('Calibrating');
        const result = input.calibrate(command.config, state.applied.pose);
        if (!result.ok) message = result.reason;
        break;
      }
      case 'trail': showTrail = command.enabled; break;
      case 'source': {
        const generation = ++connectionGeneration;
        stopSource?.();
        pause('Changing input source');
        try {
          await serialOperation(async () => {
            await input.disconnect();
            if (isCurrent(generation)) onSource(command.source);
          });
        } catch (error) { if (isCurrent(generation)) message = connectionError(error); }
        break;
      }
      case 'disconnect': {
        const generation = ++connectionGeneration;
        stopSource?.();
        pause('Disconnected');
        try { await serialOperation(() => input.disconnect()); }
        catch (error) { if (isCurrent(generation)) message = connectionError(error); }
        break;
      }
      case 'connect': {
        const generation = ++connectionGeneration;
        stopSource?.();
        pause('Connecting device');
        try {
          // This invocation occurs before the first await, in the click call stack.
          const selected = await input.requestDevice();
          if (!isCurrent(generation)) break;
          if (!selected.ok) { message = selected.reason; break; }
          await serialOperation(async () => {
            if (!isCurrent(generation)) return;
            try {
              const connected = await input.connect(selected.value.id, command.settings);
              if (isCurrent(generation) && !connected.ok) message = connected.reason;
            } finally {
              // A newer intent can arrive while opening. Close the obsolete session
              // before the next mutation, including when a failed open rejects.
              if (!isCurrent(generation)) await input.disconnect();
            }
          });
        } catch (error) { if (isCurrent(generation)) message = connectionError(error); }
        break;
      }
    }
  }

  function dispose() { disposed = true; held = false; connectionGeneration++; return serialTail; }
  return { tick, command, pause, spaceDown, spaceUp, dispose };
}

export type AppController = ReturnType<typeof createController>;

/** Exactly one listener owner. Losing focus clears the hold and requires deliberate resume. */
export function attachControls(controller: AppController, windowTarget: EventTarget = window, documentTarget: EventTarget & { readonly hidden?: boolean } = document) {
  const down = (event: Event) => {
    const key = event as KeyboardEvent;
    const target = key.target as HTMLElement | null;
    if (key.code !== 'Space' || target?.isContentEditable || target?.closest?.('input, textarea, select, button, summary, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]')) return;
    event.preventDefault();
    if (key.repeat) return;
    controller.spaceDown();
  };
  const up = (event: Event) => {
    if ((event as KeyboardEvent).code !== 'Space') return;
    controller.spaceUp();
  };
  const blur = () => controller.pause('Window lost focus');
  const visibility = () => { if (documentTarget.hidden) controller.pause('Page hidden'); };
  windowTarget.addEventListener('keydown', down);
  windowTarget.addEventListener('keyup', up);
  windowTarget.addEventListener('blur', blur);
  documentTarget.addEventListener('visibilitychange', visibility);
  return () => {
    windowTarget.removeEventListener('keydown', down);
    windowTarget.removeEventListener('keyup', up);
    windowTarget.removeEventListener('blur', blur);
    documentTarget.removeEventListener('visibilitychange', visibility);
  };
}

import type { ExerciseMode, InputFacade, Source } from '../contracts';
import { createScene } from '../scene';
import { createTraining } from '../training';
import { createUi } from '../ui';
import { attachControls, createController, type AppController } from './controller';
import './layout.css';

export interface MountOptions {
  input: InputFacade;
  onSource: (source: Source) => void;
  pump?: () => void;
  stopSource?: () => void;
  availableModes?: readonly ExerciseMode[];
}

/** One application loop and one listener owner; input providers own sample timing. */
export function mountApplication(root: HTMLElement, { input, onSource, pump, stopSource, availableModes }: MountOptions) {
  root.replaceChildren();
  const canvas = document.createElement('canvas');
  canvas.className = 'practice-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Virtual anatomical practice field. Hold Space to pan or dolly while the instrument stays fixed.');
  root.append(canvas);
  const overlay = document.createElement('div');
  overlay.className = 'practice-overlay';
  root.append(overlay);
  const scene = createScene(canvas);
  const training = createTraining();
  let controller: AppController;
  const ui = createUi(overlay, command => { void controller.command(command); }, availableModes);
  controller = createController({ input, training, scene, ui, now: () => performance.now(), onSource, stopSource });
  const detach = attachControls(controller);
  const resize = () => scene.resize();
  window.addEventListener('resize', resize);
  let animation = 0;
  let disposed = false;
  function frame() {
    if (disposed) return;
    pump?.();
    controller.tick(performance.now());
    animation = requestAnimationFrame(frame);
  }
  animation = requestAnimationFrame(frame);
  return {
    controller,
    async dispose() {
      if (disposed) return;
      disposed = true;
      stopSource?.();
      cancelAnimationFrame(animation);
      detach();
      window.removeEventListener('resize', resize);
      const pending = controller.dispose();
      ui.dispose();
      scene.dispose();
      canvas.remove();
      overlay.remove();
      await pending;
      await input.dispose();
    },
  };
}

import type { Result, Vec3 } from '../contracts';

export interface ManualMotion { move(deltaMm: Vec3, yawDeltaDeg?: number, pitchDeltaDeg?: number): Result }

/** Keyboard intent only. H's source creates and timestamps all mock samples. */
export function attachManualControls(canvas: HTMLCanvasElement, current: () => ManualMotion | null) {
  const keys = new Set<string>();
  const accepted = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
  const down = (event: KeyboardEvent) => {
    if (!current() || !accepted.has(event.code)) return;
    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable || target?.closest?.('input, select, textarea, button, summary')) return;
    event.preventDefault();
    if (!event.repeat) {
      const delta: Record<string, Vec3> = { KeyD: [1, 0, 0], KeyA: [-1, 0, 0], KeyE: [0, 1, 0], KeyQ: [0, -1, 0], KeyS: [0, 0, 1], KeyW: [0, 0, -1] };
      current()?.move(delta[event.code] ?? [0, 0, 0], event.code === 'ArrowLeft' ? 1 : event.code === 'ArrowRight' ? -1 : 0, event.code === 'ArrowUp' ? 1 : event.code === 'ArrowDown' ? -1 : 0);
    }
    keys.add(event.code);
  };
  const up = (event: KeyboardEvent) => { keys.delete(event.code); };
  const clear = () => keys.clear();
  const hidden = () => { if (document.hidden) clear(); };
  const focus = () => canvas.focus();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', hidden);
  canvas.addEventListener('pointerdown', focus);
  let previous = performance.now();
  return {
    tick() {
      const now = performance.now();
      const seconds = Math.min(0.05, Math.max(0, now - previous) / 1000);
      previous = now;
      const source = current();
      if (!source || !keys.size) return;
      const axis = (positive: string, negative: string) => Number(keys.has(positive)) - Number(keys.has(negative));
      const distance = 25 * seconds;
      source.move([axis('KeyD', 'KeyA') * distance, axis('KeyE', 'KeyQ') * distance, axis('KeyS', 'KeyW') * distance], axis('ArrowLeft', 'ArrowRight') * 35 * seconds, axis('ArrowUp', 'ArrowDown') * 35 * seconds);
    },
    clear,
    dispose() {
      clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', hidden);
      canvas.removeEventListener('pointerdown', focus);
    },
  };
}

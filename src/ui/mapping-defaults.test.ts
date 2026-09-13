// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CALIBRATION, type UiCommand } from '../contracts';
import { createUi } from './index';

describe('mapping defaults', () => {
  it('shows and dispatches the default physical-to-virtual mapping', () => {
    const root = document.createElement('div');
    const dispatch = vi.fn<(command: UiCommand) => void>();
    const ui = createUi(root, dispatch, ['free']);

    expect([...root.querySelectorAll<HTMLSelectElement>('[data-axis]')].map(select => Number(select.value))).toEqual([1, 2, 0]);
    expect([...root.querySelectorAll<HTMLInputElement>('[data-gain]')].map(input => Number(input.value))).toEqual([1, 1, 3]);
    root.querySelector<HTMLButtonElement>('[data-command="calibrate"]')!.click();
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'calibrate', config: DEFAULT_CALIBRATION });

    ui.dispose();
  });
});

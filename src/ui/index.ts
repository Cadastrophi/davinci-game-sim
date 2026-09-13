import {
  DEFAULT_CALIBRATION, DEFAULT_SERIAL_SETTINGS,
  type CalibrationConfig, type ExerciseMode, type Source,
  type UiCommand, type UiFacade, type UiSnapshot,
} from '../contracts';
import './styles.css';

const MODES: readonly [ExerciseMode, string, string][] = [
  ['free', 'Free practice', 'Explore the instrument'],
  ['reach', 'Reach & hold', 'Precision through stillness'],
  ['align', 'Direction alignment', 'Match position and direction'],
  ['obstacle', 'Obstacle navigation', 'Find a clear path'],
  ['camera', 'Camera & navigation', 'Reposition your view'],
  ['incision', 'Constrained incision', 'Open a predefined tissue seam'],
];

function explainPause(reason: string | null, fresh: boolean): string | null {
  if (!reason) return null;
  const explanations: Record<string, string> = {
    'stale-input': 'Input paused after a gap. Resume when ready.',
    'awaiting-input': fresh ? 'Input is ready. Calibrate to set center, or Resume.' : 'Waiting for input from the selected source.',
    'missing-input': 'Waiting for a fresh input sample.',
    'disconnected': 'Input disconnected. Choose a source or connect a device.',
    'uncalibrated': 'Center the controller, then select Calibrate / set center.',
    'invalid-calibration': 'Check the axis mapping and gains, then calibrate again.',
    'invalid-clock': 'Input timing was interrupted. Resume to set a fresh anchor.',
    'wrong-mode': 'Resume practice before adjusting the camera.',
    'calibration-changed': 'Calibration changed. Resume when ready.',
  };
  return explanations[reason] ?? reason;
}

/** Mount above the canvas. The left rail occupies 260px; see the handoff for layout. */
export function createUi(
  root: HTMLElement,
  dispatch: (command: UiCommand) => void,
  availableModes: readonly ExerciseMode[] = ['free', 'reach'],
): UiFacade {
  const abort = new AbortController();
  const shell = document.createElement('div');
  shell.className = 'training-ui';
  shell.innerHTML = `
    <aside class="training-rail" aria-label="Training controls">
      <a class="training-brand" href="#" aria-label="Anatomical training arena"><span class="training-mark">✳</span><span>FIELDWORK<small>TELEOPERATION LAB</small></span></a>
      <div class="training-section-label">01 / TRAINING</div>
      <nav class="training-modes" aria-label="Exercise modes">
        ${MODES.map(([mode, label, description], i) => `<button type="button" data-mode="${mode}" ${availableModes.includes(mode) ? '' : 'disabled'}><span class="training-mode-number">0${i + 1}</span><span>${label}<small>${availableModes.includes(mode) ? description : 'Not available in this build'}</small></span><span class="training-mode-arrow" aria-hidden="true">↗</span></button>`).join('')}
      </nav>
      <div class="training-setup">
        <div class="training-section-label">02 / INPUT SETUP</div>
        <label class="training-field">Input source<select data-source><option value="mock">Mock · interactive</option><option value="replay">Replay · synthetic sequence</option><option value="serial">Serial · physical controller</option></select></label>
        <p class="training-help" data-source-help>Choose a source, then calibrate from a fresh sample.</p>
        <div data-serial hidden>
          <details><summary>Serial settings <span>115200 baud</span></summary><div class="training-settings">
            <label class="training-field">Data bits<select data-bits><option value="8">8</option><option value="7">7</option></select></label>
            <label class="training-field">Parity<select data-parity><option value="none">None</option><option value="even">Even</option><option value="odd">Odd</option></select></label>
            <label class="training-field">Stop bits<select data-stop><option value="1">1</option><option value="2">2</option></select></label>
          </div><p class="training-help">Receive only · no flow control</p></details>
          <div class="training-button-row"><button type="button" data-command="connect">Connect device</button><button type="button" data-command="disconnect">Disconnect</button></div>
        </div>
        <details class="training-calibration"><summary>Mapping & calibration</summary>
          <p class="training-help">Each virtual axis maps to one raw axis. Center the controller, then apply.</p>
          <div class="training-map-head"><span>Virtual</span><span>Raw axis</span><span>Sign</span><span>Gain</span></div>
          ${['X', 'Y', 'Z'].map((axis, i) => `<div class="training-map-row"><span>${axis}</span><select aria-label="${axis} raw axis" data-axis="${i}">${['X', 'Y', 'Z'].map((raw, j) => `<option value="${j}" ${i === j ? 'selected' : ''}>${raw}</option>`).join('')}</select><select aria-label="${axis} sign" data-sign="${i}"><option value="1">+</option><option value="-1">−</option></select><input aria-label="${axis} gain" data-gain="${i}" type="number" min="0.01" max="10" step="0.1" value="1"></div>`).join('')}
          <p class="training-form-error" data-calibration-error role="alert" hidden></p>
        </details>
        <button type="button" class="training-calibrate" data-command="calibrate">Calibrate / set center <span>⌖</span></button>
        <label class="training-toggle"><input type="checkbox" data-trail> Show instrument trail</label>
      </div>
      <div class="training-rail-foot">Original virtual practice arena<br><span>Virtual measurements · roll unavailable</span></div>
    </aside>
    <section class="training-viewport" aria-label="Training status">
      <header class="training-header"><div><div class="training-section-label">PRACTICE FIELD / VIRTUAL MM</div><h1 data-title>Free practice</h1></div><div class="training-state"><span class="training-status-dot"></span><span data-phase>Ready</span></div></header>
      <div class="training-session"><span data-target>Explore at your pace</span><span data-direction>Virtual mapped direction</span></div>
      <div class="training-feedback" role="status" aria-live="polite"><span data-feedback>Choose an exercise to begin.</span></div>
      <div class="training-results" hidden><div class="training-section-label">SESSION COMPLETE</div><h2>Practice makes precise.</h2><p data-result-summary></p><button type="button" data-retry>Try again ↗</button></div>
      <div class="training-bottom">
        <div class="training-dwell"><span data-progress-label>HOLD PROGRESS</span><span data-dwell-text>0 / 0.5 s</span><progress data-dwell max="1" value="0" aria-label="Continuous target dwell"></progress></div>
        <div class="training-metrics" aria-label="Session measurements">
          <div><span>TIME</span><strong data-elapsed>0:00.0</strong></div><div><span>POSITION ERROR</span><strong data-position>—</strong></div><div><span>DIRECTION ERROR</span><strong data-angle>—</strong></div><div><span>PATH</span><strong data-path>0 mm</strong></div><div><span>CONTACTS</span><strong data-contacts>0</strong></div><div><span>STEADINESS</span><strong data-steady>0 mm</strong></div>
        </div>
        <div class="training-toolbar"><p><kbd>SPACE</kbd> Hold to pan / dolly <span>· Tool stays fixed</span><br><kbd>SHIFT</kbd> Hold to recenter controller <span>· Camera and tool stay fixed</span></p><div class="training-button-row"><button type="button" data-command="pause">Pause</button><button type="button" data-command="resume">Resume</button><button type="button" data-command="reset">Reset</button></div></div>
        <footer class="training-telemetry"><span data-connection>DISCONNECTED</span><span data-device>No device</span><span data-rate>0 Hz</span><span data-age>Age —</span><span data-calibration>Uncalibrated</span><span data-frame>Frame —</span><span data-invalid>0 invalid</span></footer>
      </div>
    </section>`;
  root.append(shell);
  const get = <T extends HTMLElement = HTMLElement>(selector: string): T => shell.querySelector<T>(selector)!;
  const text = (selector: string, value: string) => { const element = get(selector); if (element.textContent !== value) element.textContent = value; };
  const listen = (selector: string, event: string, handler: EventListener) => get(selector).addEventListener(event, handler, { signal: abort.signal });
  let currentMode: ExerciseMode = 'free';
  let previousSource: Source | undefined;
  let selectedSource: Source = 'mock';
  shell.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => dispatch({ type: 'start', mode: button.dataset.mode as ExerciseMode }), { signal: abort.signal }));
  listen('[data-source]', 'change', () => {
    selectedSource = get<HTMLSelectElement>('[data-source]').value as Source;
    get('[data-serial]').hidden = selectedSource !== 'serial';
    dispatch({ type: 'source', source: selectedSource });
  });
  listen('[data-trail]', 'change', () => dispatch({ type: 'trail', enabled: get<HTMLInputElement>('[data-trail]').checked }));
  for (const type of ['pause', 'resume', 'reset', 'disconnect'] as const) listen(`[data-command="${type}"]`, 'click', () => dispatch({ type }));
  listen('[data-command="connect"]', 'click', () => dispatch({ type: 'connect', settings: {
    ...DEFAULT_SERIAL_SETTINGS,
    dataBits: Number(get<HTMLSelectElement>('[data-bits]').value) as 7 | 8,
    stopBits: Number(get<HTMLSelectElement>('[data-stop]').value) as 1 | 2,
    parity: get<HTMLSelectElement>('[data-parity]').value as 'none' | 'even' | 'odd',
  } }));
  listen('[data-command="calibrate"]', 'click', () => {
    const axes = [0, 1, 2].map(i => Number(get<HTMLSelectElement>(`[data-axis="${i}"]`).value));
    const signs = [0, 1, 2].map(i => Number(get<HTMLSelectElement>(`[data-sign="${i}"]`).value));
    const gains = [0, 1, 2].map(i => Number(get<HTMLInputElement>(`[data-gain="${i}"]`).value));
    const error = new Set(axes).size !== 3 ? 'Choose each raw axis once.' : gains.some(gain => !Number.isFinite(gain) || gain < 0.01 || gain > 10) ? 'Gains must be between 0.01 and 10.' : null;
    get('[data-calibration-error]').hidden = !error;
    if (error) { text('[data-calibration-error]', error); get<HTMLDetailsElement>('.training-calibration').open = true; return; }
    dispatch({ type: 'calibrate', config: {
      ...DEFAULT_CALIBRATION,
      axisOrder: axes as unknown as CalibrationConfig['axisOrder'],
      axisSigns: signs as unknown as CalibrationConfig['axisSigns'],
      translationGain: gains as unknown as CalibrationConfig['translationGain'],
    } });
  });
  listen('[data-retry]', 'click', () => dispatch({ type: 'start', mode: currentMode }));
  listen('.training-brand', 'click', event => event.preventDefault());
  return {
    render(snapshot: UiSnapshot) {
      const { exercise: e, input: { status, control }, applied } = snapshot;
      currentMode = e.mode;
      text('[data-title]', MODES.find(([mode]) => mode === e.mode)?.[1] ?? 'Practice');
      shell.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.setAttribute('aria-current', button.dataset.mode === e.mode ? 'true' : 'false'));
      const paused = control.mode === 'paused' || e.phase === 'paused';
      text('[data-phase]', snapshot.cameraAdjusting ? 'Adjusting camera' : paused ? 'Paused' : e.phase === 'completed' ? 'Complete' : e.phase === 'running' ? 'In practice' : 'Ready');
      get('.training-state').dataset.state = paused ? 'paused' : status.connection;
      text('[data-target]', e.target ? `TARGET ${Math.min(e.targetIndex + 1, e.targetCount)} / ${e.targetCount}` : 'Explore at your pace');
      text('[data-direction]', applied.pose.directionKind === 'physical-validated' ? 'Physically validated direction · roll unavailable' : applied.pose.directionKind === 'virtual-mapped' ? 'Virtual mapped direction · roll unavailable' : 'Direction unavailable · roll unavailable');
      const feedback = explainPause(status.error || control.pauseReason || e.pauseReason, control.fresh) || (snapshot.cameraAdjusting ? 'Camera adjustment · tool world pose is frozen' : e.feedback);
      text('[data-feedback]', feedback || 'Move the instrument with your selected input.');
      get('.training-feedback').dataset.warning = String(paused || Boolean(status.error) || applied.mismatch);
      const incision = e.mode === 'incision' ? snapshot.incision : null;
      const dwellTarget = e.target?.dwellMs ?? 500;
      get<HTMLProgressElement>('[data-dwell]').value = dwellTarget > 0 ? Math.min(1, e.dwellMs / dwellTarget) : 0;
      get('.training-dwell').hidden = !e.target && !incision;
      text('[data-progress-label]', incision ? 'SEAM COVERAGE' : 'HOLD PROGRESS');
      get('[data-dwell]').setAttribute('aria-label', incision ? 'Incision seam coverage' : 'Continuous target dwell');
      text('[data-dwell-text]', `${(e.dwellMs / 1000).toFixed(1)} / ${(dwellTarget / 1000).toFixed(1)} s`);
      if (incision) {
        get<HTMLProgressElement>('[data-dwell]').value = incision.coverage01;
        text('[data-dwell-text]', `${Math.round(incision.coverage01 * 100)}%`);
        text('[data-target]', 'CONSTRAINED INCISION DEMONSTRATION');
        text('[data-direction]', `Depth ${incision.depthMm === null ? '—' : incision.depthMm.toFixed(1) + ' mm'} · seam offset ${incision.deviationMm === null ? '—' : incision.deviationMm.toFixed(1) + ' mm'}`);
      }
      const elapsed = `${Math.floor(e.elapsedMs / 60000)}:${((e.elapsedMs % 60000) / 1000).toFixed(1).padStart(4, '0')}`;
      const metric = (value: number | null, unit: string) => value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)} ${unit}`;
      text('[data-elapsed]', elapsed);
      text('[data-position]', metric(e.positionErrorMm, 'mm'));
      text('[data-angle]', metric(e.directionErrorRad === null ? null : e.directionErrorRad * 180 / Math.PI, '°'));
      text('[data-path]', metric(e.pathMm, 'mm'));
      text('[data-contacts]', String(e.contactEpisodes));
      text('[data-steady]', metric(e.steadinessMm, 'mm'));
      get('.training-results').hidden = e.phase !== 'completed';
      text('[data-result-summary]', `${incision ? `${Math.round(incision.coverage01 * 100)}% predefined seam opened` : `${e.targetCount} targets`} · ${elapsed} · ${e.contactEpisodes} contacts · ${e.pathMm.toFixed(0)} mm path`);
      get<HTMLInputElement>('[data-trail]').checked = snapshot.showTrail;
      if (previousSource === undefined || (status.source !== previousSource && status.connection === 'connected')) {
        selectedSource = status.source; get<HTMLSelectElement>('[data-source]').value = selectedSource;
      }
      previousSource = status.source;
      get('[data-serial]').hidden = selectedSource !== 'serial';
      text('[data-source-help]', selectedSource === 'serial' ? 'Select your physical controller, then Calibrate / set center.' : selectedSource === 'replay' ? '40-second synthetic replay. Calibrate or Resume. Switch to another source and back to restart.' : 'Click the field. WASD moves across it, Q/E moves down/up, arrows change direction. Calibrate to set center, or Resume.');
      text('[data-connection]', `${status.source.toUpperCase()} / ${status.connection.toUpperCase()}`);
      text('[data-device]', status.deviceLabel || 'No device');
      text('[data-rate]', `${status.packetRateHz.toFixed(0)} Hz`);
      text('[data-age]', `Age ${status.sampleAgeMs === null ? '—' : `${status.sampleAgeMs.toFixed(0)} ms`}`);
      text('[data-calibration]', `${status.calibration} calibration`);
      text('[data-frame]', `Frame ${snapshot.frameTimeMs.toFixed(1)} ms`);
      text('[data-invalid]', `${status.invalidPackets} invalid`);
      get<HTMLButtonElement>('[data-command="connect"]').disabled = status.connection === 'connecting' || status.connection === 'connected';
      get<HTMLButtonElement>('[data-command="disconnect"]').disabled = status.connection !== 'connected' && status.connection !== 'connecting';
      get<HTMLButtonElement>('[data-command="pause"]').disabled = paused;
      get<HTMLButtonElement>('[data-command="resume"]').disabled = !paused;
    },
    dispose() { abort.abort(); shell.remove(); },
  };
}

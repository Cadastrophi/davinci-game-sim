# UI controls handoff — issue #10

Owner: Master E UI worker. Branch: `Cadastrophi_training-ui`. Base: `34baec7aecd9ecdb601aeceec1715587205655d6`, contract `launch-v1.1`.

## Intent and scope

Implement the authorized native HTML/CSS training dashboard without creating an input, scoring or camera owner. Exclusive paths are `src/ui/**` and this handoff. The parent owns the central intent/claim log and sole PR integration. No dependencies added.

## Integration

Import `createUi` from `src/ui`; it imports its own CSS. Call `createUi(root, dispatch, availableModes)` once, then `render(UiSnapshot)` during app updates and `dispose()` during teardown. Default available modes are free/reach; pass all five only when their implementations are ready. Every interaction emits an existing `UiCommand`; UI attaches no global keyboard listener, serial operation or stateful measurement.

The supplied root must be positioned and cover the full viewport. UI occupies a 260px left rail, reduced to 210px at widths <=780px. The scene canvas should cover the remaining right region at full height, so scene centering excludes the rail. Header occupies approximately 140px at top; metrics/toolbars occupy approximately 180px at bottom. The center is transparent and non-interactive, with pointer-events enabled only for controls/panels. Keep a minimum supported desktop viewport of approximately 900x650; narrower layouts are compact fallbacks. Remove/scope the baseline global `header`, `footer`, `small`, `main`, `canvas` CSS when wiring the final app.

Source/connection/calibration labels are authoritative from snapshots. Source selection dispatches immediately and app must change the source. Connect dispatch is synchronous within the click user gesture (important for browser serial chooser). Serial baud and flow are fixed; diagnostic data bits/parity/stop bits are editable. Calibration exposes axis permutation, signs and gain; duplicate axes and invalid gains show an accessible local error and do not dispatch. Camera gain/yaw/pitch/direction kind use shared defaults. Roll is always labeled unavailable. No physical validation is asserted unless the snapshot explicitly says physical-validated.

Pause/resume/reset remain separate commands. Retry restarts the currently rendered mode. Dwell/metrics/results reflect snapshots, with direction displayed in degrees. Telemetry includes packet rate/age, invalid count, source, device, calibration and frame duration. All user/device text is assigned through textContent. Event listeners are aborted and the owned shell removed on dispose.

## Verification and limitations

`npm ci`, `npm run typecheck`, `npm run build` and baseline `npm test` are the local checks. No DOM test library exists in P0; visual/browser interaction verification belongs to parent integration after the new scene and app wiring are present. No hardware verification is claimed. The UI is not wired into the baseline page by this isolated change.

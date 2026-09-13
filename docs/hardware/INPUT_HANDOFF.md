# Master H input integration

User intent: implement Master H's receive-only input, calibrated mapping, and mock/replay lane. Claims are #8 (serial), #11 (mapping), and #13 (facade/providers). E owns app composition, shared contracts and merges. Starting contract is launch-v1.1, baseline `34baec7aecd9ecdb601aeceec1715587205655d6`. This note records H's implementation intent; E maintains shared logs from issue #1.

## Composition

Import `createInputFacade`, `createManualSource`, `createMockDriver`, or `createReplayDriver` from `src/input`. Use one injected `now: () => performance.now()` throughout. The facade implements the shared `InputFacade` exactly; factory options additionally permit `staleAfterMs` (default 250), a receive-only `serial` test boundary and `secureContext` injection.

Create one source driver at a time. `createManualSource(input,{now})` accepts `move(deltaMm,yawDeltaDeg?,pitchDeltaDeg?)` and `setPose({positionMm,yawDeg,pitchDeg})`; E owns keyboard/mouse listeners. `createMockDriver(input,{now,intervalMs?})` is deterministic moving demonstration input. `createReplayDriver(input,events,{now})` consumes ordered `{atMs,positionMm,yawDeg,pitchDeg}` events. All three expose `tick()`, `reset()` and `dispose()`; replay/automatic mock also expose `advanceTo(elapsedMs)` for deterministic tests.

In each frame, call `provider.tick()`, then capture `t=now()`, then `input.snapshot(t)` and training's step at `t`. Freshness is strictly `0 <= age < 250ms`. Snapshot reads do not generate samples. Manual input emits at most 50Hz even when stationary. Replay retains timeline timestamps so late polling does not pretend old data is fresh. Prefer `tick()` in the app: it owns the correct timeline origin. Passing an older rAF timestamp after ingestion can trigger the backwards-clock guard.

For a source switch, dispose the old driver, await `input.disconnect()`, construct/tick the new driver, then explicitly calibrate or resume with E's current applied pose. This also applies when replacing a driver with another instance of the same source; the new sequence starts at one. Resetting an existing driver preserves sequence and pauses mapping until deliberate rebase. Public `input.ingest()` accepts mock/replay only; real serial samples come from the transport. Synthetic ingestion is rejected while serial is connecting/connected.

For serial, invoke `requestDevice()` directly in a user-gesture handler, then `connect(id,DEFAULT_SERIAL_SETTINGS)`. Defaults are 115200/8/N/1/no flow control. Only baud is user confirmed; other settings need live verification. Await disconnect/dispose during teardown. The serial adapter has no outbound stream or signal-setting capability.

At camera entry/exit/resume, pass E's applied pose, including pointing direction. H freezes the applied pose and returns cumulative camera-local offsets; E applies those from the camera entry anchor using its fixed basis. E owns camera bounds, collision, scoring and event listeners. Outage, stale release and source changes require deliberate fresh resume. Rebase adjusts both position and pointing direction. Roll stays unavailable; virtual calibration never establishes measured shaft direction or axial twist.

## Verification record

Automated integration checks and exact delivered commits are recorded in the linked PRs. Native Node smoke checks passed during dependency installation; they are not a substitute for the final Vitest/typecheck/build results.

Hardware status on this machine at preparation: Linux x86_64, Node 24.19.0, no `/dev/ttyACM*`, `/dev/ttyUSB*` or `/dev/serial/by-id` detected. Browser port selection and real telemetry tests are pending. No real-device success or measured packet rate/latency is asserted.

## Live check record to complete on the controller machine

1. Record reviewed source SHA, browser/version, OS, selected device label and actual serial settings. Run the E-integrated build on localhost in a browser with Web Serial.
2. Connect through the browser picker. Record a representative seven-field bracket packet, degree-angle confirmation, mm position confirmation, rate, host receive age and invalid count. These timestamps cannot measure sensor-to-display latency.
3. Calibrate neutral; perform small known X/Y/Z and yaw/pitch movements. Record axis signs/reference point and whether direction is virtual-mapped or backed by actual validation. Placeholder roll remains unavailable.
4. Verify fixed tool world pose and attitude during Space pan/dolly, cumulative camera offsets, fixed camera orientation/FOV, and no position/direction jump on release. Repeat while tool is collision-blocked.
5. Verify stale input, unplug/replug, blur, hidden page, reset and source switching pause control and require deliberate fresh rebase. Record failures and recovery steps.

No firmware, motor, modem signal, haptic or physical safety modifications are part of this lane.

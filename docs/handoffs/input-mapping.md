# Input mapping handoff — issue #11

Owner: Master H mapping worker, branch `Jin-underworld_input-mapping`.
Base: merged `34baec7aecd9ecdb601aeceec1715587205655d6`, contract `launch-v1.1`.
Allowlist: `src/input/mapping/**` and this handoff. Shared contracts are unchanged.

## Intent and interface

Map valid receive-only pose samples into calibrated tool requests and cumulative camera translation. Preserve the applied tool pose across camera transitions, stale input, reconnect, and deliberate recovery. Mapping owns no serial transport, DOM events, renderer, collision, or scoring.

`createInputMapping({ now?, staleAfterMs? })` exports:

- `ingest(sample): Result` and `snapshot(nowMs): ControlFrame`.
- `calibrate(config, appliedPose)`, `enterCameraMode(appliedPose)`, `exitCameraMode(appliedPose)`, `resume(appliedPose)`, each returning `Result`.
- `pause(reason): void`, `setConnected(boolean): void`.
- `getCalibrationStatus(): 'uncalibrated' | 'valid' | 'invalid'` and `getRaw(): RawPoseSample | null`.

The parent owns facade exports and integration tests. E owns application routing and merging. Call `setConnected(true)` for an active mock/replay provider as well as a connected serial transport. A disconnect clears current-session freshness; retained raw data is diagnostics only. Every connection and source switch establishes a new sequence session. Within a session, sequence must strictly increase (safe nonnegative integers) and receive times must not decrease. The facade must filter callbacks from inactive providers/ports; the mapper cannot identify an old source callback as distinct from a deliberate source switch.

## Mapping and recovery semantics

All times use the injected monotonic clock. Sample `now()` at consumption when calling `snapshot(nowMs)`; do not forward an earlier frame-start `requestAnimationFrame` timestamp after newer serial ingestion. Regressing/non-finite clock observations pause explicitly as `invalid-clock`. Samples are fresh only at age `>= 0 && < 250ms` by default. Future timestamps are rejected. A stale gap is detected against the previous raw sample **before** accepting its replacement, so skipped rendering cannot conceal an outage. A stale interval, explicit pause, source change, or disconnect latches paused mode. New packets alone never resume control. Fresh explicit resume or calibrate anchors raw input to E's current applied pose. Repeated connection-state reports do not restart an active session.

Translation uses the calibration axis permutation, signs, and positive gains on displacement from the raw anchor. Tool output adds E's applied-position anchor. Camera output applies camera gains into `[rightMm, upMm, forwardMm]`; it is cumulative from camera entry, stable under repeated render reads, and never integrated internally. Each successful entry increments `cameraSession`. E applies scene bounds and camera basis, then retains its final camera position at exit/pause. Mapper pause clears held-camera state and offsets while retaining the frozen tool pose as the last request.

The virtual direction convention is right-handed, neutral `-Z`, local X pitch followed by world Y yaw. Positive pitch points toward `+Y`; positive yaw toward `-X`. Calibration signs reverse these directions. Angular gains are unity in launch-v1.1, so reducing finite angles modulo 360 handles wrap without introducing a gain discontinuity. Rebase uses the deterministic shortest rotation from current nominal direction to applied direction, with a stable perpendicular axis for an exact antipode. This represents pointing direction only, never measured roll or twist. Camera mode ignores incoming yaw/pitch and freezes the full supplied applied pose.

Unavailable direction remains null. If calibration permits virtual mapping but applied direction is null, output remains unavailable until a later rebase supplies a direction. Arbitrary virtual rebasing downgrades a supplied `physical-validated` direction to `virtual-mapped`; configuration cannot establish physical validation. Camera freeze itself preserves the applied pose and provenance exactly.

Calibration accepts axis permutations, signs of +/-1 and finite positive translation/camera gains. Bad calibration invalidates the configuration and pauses until successful calibration. Applied poses require finite positions and null/unavailable or a unit pointing direction. Invalid samples are rejected without replacing the last valid raw sample. Numeric overflow pauses without publishing NaN/Infinity. Inputs and all nested snapshots are copied to isolate consumer mutation. Error reasons are stable strings but are not additions to shared contract types.

## Validation and limitations

Native Node v24.19.0 smoke checks passed for calibration, collision-applied camera freeze, 100 duplicate camera snapshots, cumulative offsets, position/direction release rebasing, a missed stale gap, reconnect, and sparse-vector rejection. Full Vitest and repository typecheck have not run: exact package-lock dependencies are still downloading in the parent-owned dependency workspace. This is a draft handoff, not READY for merge; parent/E must run both checks before publication approval. Behavioral coverage includes applied-vs-requested collision anchors, Space hold/release, duplicate render reads, strict stale boundary, missed stale gaps, stale release, blocked reset/resume, source/reconnect sequence restart, wrap/sign handling, antipodes, unavailable direction, invalid data/configuration, numeric overflow, and mutation isolation.

No real controller movements or device measurements were performed by this worker. Axes, gains, reference point and physical direction remain subject to live calibration. Parent/E must exercise the facade and rendered camera path in integration and arrange actual-device acceptance. Tests use mock samples and a deterministic clock only.

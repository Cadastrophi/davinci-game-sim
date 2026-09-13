# Cross-team contract blueprint — launch-v1

Purpose: prevent divergent implementations. These are design requirements, not application source. Master E writes `src/contracts/**` in the baseline PR after Master H acknowledges the exported API and fixtures. Pin that baseline SHA in issue #1 before dependent coding. All changes require proposal, affected consumers, migration/test plan and peer ACK; one custodian commits them.

Use renderer-independent readonly numeric tuples/plain objects, not Babylon classes, DOM nodes or serial-port objects. Normalize internally to radians and game-world mm; renderer conversion stays in scene code. Document handedness, axis directions, yaw/pitch order, tool axis/offset and gain calibration. A suggested right-handed world with Y up is a baseline design choice to validate, not a claimed hardware frame.

## Required data types

- `RawPoseSample`: XYZ-mm tuple; yaw/pitch-degrees; `roll: null`; monotonic `receivedAtMs`; local sequence; source `serial|replay|mock`. Preserve raw zero only in diagnostics, never as available roll.
- `InputStatus`: connection state (`unsupported|disconnected|connecting|connected|error`), packet rate/age, invalid count, device label, calibration state and error message; source/provenance visible.
- `ToolPose`: position in virtual mm and unit pointing direction or null, plus `directionKind: unavailable|virtual-mapped|physical-validated`. Optional render quaternion must be explicitly derived with synthetic twist, not asserted as measured full orientation.
- `ControlFrame`: sequence/receive time, freshness, mode (`tool|camera|paused`), requested tool pose, camera-local pan/dolly offset tuple `[rightMm, upMm, forwardMm]` since Space-down, frozen tool pose while in camera mode, calibration revision. Offsets are cumulative from the entry anchor, not incremental per render; consumers must not integrate the same sample repeatedly.
- `AppliedToolState`: collision-limited pose, contact IDs/episodes, requested/applied mismatch. Owned by E; never substitute raw position for applied position in scoring.
- `ExerciseSnapshot`: mode/phase, target, errors, dwell/time/path/contact metrics, completion, pause reason and feedback. Owned by E; H never writes scoring state.

## Input facade, implemented by H

Specify exact names/types in baseline for: request device from a user gesture; refresh granted devices; connect/disconnect with settings; ingest mock/replay sample; latest raw/status/control snapshot; calibrate; enter camera mode with current applied pose; exit camera mode with current applied pose; pause; resume/rebase with current applied pose; dispose. Methods affecting mapping require a fresh raw sample or return an explicit failure. Event listener attachment belongs to E's app/UI; H supplies the functions and contains no competing global Space handler.

H calculates calibrated translation/direction and anchors. E owns camera bounds/pose application, collision response, rendering and input-event routing. At camera entry, E records camera translation and its fixed right/up/forward basis and passes applied tool pose to H; each camera frame transforms H's camera-local cumulative offset through that basis and adds it to the entry translation, clamped to safe scene bounds, with no camera orientation change. H does not need Babylon camera objects or world camera orientation. At exit, rebase from latest raw input; stale exit pauses instead of jumping.

E's scene facade consumes applied tool/target state and camera translation; it does not read serial. Training consumes applied pose/status and returns exercise state/events. UI consumes snapshots and dispatches commands through app wiring. The baseline must define scene/training/UI facades as well as input so workers cannot invent competing state ownership.

## Baseline fixtures and tests

H proposes immutable fixtures; E adds the minimal seed under `tests/fixtures/contract/**`, then H owns additional input fixtures under `tests/fixtures/input/**`. E may temporarily supply one `src/app/mock-bootstrap.ts` provider; remove/replace it with H's real mock facade after integration rather than maintaining parallel sources.

Required examples: two valid packets in one chunk; split brackets/numbers; debug noise; malformed/non-finite/oversized payload; degree wraparound; forced-zero roll; fresh/stale/disconnect; tool-mode movement; Space entry/held/release; repeated render of same camera offset; stale release and safe resume; collision-requested versus applied pose; camera pan changes screen projection but not tool world pose. Bound decoder buffers and recover after noise. Agree frame-rate-independent dwell and contact episodes.

Baseline code compiles, fixture tests pass, and E/H each acknowledge the same SHA and contract revision. Until then, subagents can perform read-only research/test design, not divergent production implementations of the seam.

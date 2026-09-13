# Navigation drills — issue #19

Branch `Cadastrophi_navigation-drills`, base `b195b0e8ffafd9b96bbf0e6174edc77922737570`, unchanged launch-v1.1 contract. Exclusive writes are `src/training/**` and this handoff. Parent E owns independent review, publication and integration.

## Obstacle drill

`obstacle` uses two fixed protected, non-cuttable AABBs: central `[8,5,-18]..[14,42,18]`, left `[-44,8,-34]..[-36,36,-18]`. Its three target centers are `[-25,24,30]`, `[25,24,30]`, `[35,24,-25]`. With the standard negative-Z pointing direction, these form a tested clear route around the positive-Z side of the central barrier. All target centers fit the existing virtual workspace. Physical reachability remains a device validation item.

The existing continuous capsule sweep owns all applied poses, contact IDs/episodes, mismatch ghost and path/time metrics. Requested packet jumps cannot skip protected boxes or score from raw positions. Collision keeps numerical fallback directions internal and publishes null whenever directionKind is unavailable, preserving the input facade’s rebase/Space shape contract. Starting the drill while the current applied capsule overlaps a protected box throws before changing mode/state: move clear in Free practice and retry. Parent app displays this actionable error. No automatic repositioning or obstacle ejection is performed. Reset/retry preserves the applied pose. Completed contact/path/time results stay frozen while subsequent tool motion remains collision-limited.

## Camera drill

Three targets `[0,24,0]`, `[-35,30,25]`, `[35,30,-25]` each require a fresh camera session following an observed fresh tool-mode frame. Cumulative camera-local displacement magnitude must reach 5mm; repeated subthreshold snapshots do not add together. Qualification is retained on release for that target's normal 500ms/10mm dwell. Camera holds advance eligible elapsed time but never move the applied tool or earn dwell.

Qualification clears after each target, reset, pause, stale input (including a silent gap) or calibration revision change. The last observed camera-session identity survives retry, so an already-held/reused session cannot automatically qualify again. After an interruption, H/app must deliberately resume and produce a fresh new camera session. The threshold measures H's cumulative requested pan/dolly offset; scene camera clamping and actual visible displacement remain E app/scene integration checks. Training never changes camera orientation or FOV.

## Verification

`npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`. Navigation tests cover blocked packet skips/ghost/contact episode, retreat and renewed contact, legal route completion, initial-overlap rejection without mutation, camera elapsed/frozen pose/no dwell, threshold and per-target gate, non-accumulated repeated offsets, stale sessions, reset/pause reuse prevention, silent-gap expiry and full camera-route completion. Existing alignment/reach/lifecycle/collision regressions remain green.

No input, contract, app, UI, scene or root dependency changes. Parent must expose both modes, render `TrainingState.obstacles`, preserve the sole Space handler and verify visible camera invariants. No live-device or browser interaction proof is claimed for this pure training increment.

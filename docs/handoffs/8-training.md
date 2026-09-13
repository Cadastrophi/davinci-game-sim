# Training core handoff — issue #9

The filename retains the originally published claim. Issue #9 is authoritative; issue #8 belongs to H.

- Branch: `Cadastrophi_training-core`; base `34baec7aecd9ecdb601aeceec1715587205655d6`.
- Contract: `launch-v1.1`, unchanged. Exclusive writes: `src/training/**` and this file.
- Outcome: `createTraining(initialPose?)` implements free practice and sequential reach-and-hold through `TrainingFacade`. Alignment, obstacle and camera exercises throw explicit unsupported errors until their later increments. The shared collision engine is available to the later obstacle mode; free/reach currently supply no obstacles.

## State and timing

The constructor is ready at the supplied pose. `start(mode, now)` starts/retries and clears metrics while preserving the applied pose. `reset(now)` preserves pose, clears metrics and returns to ready; the app subsequently calls `start` for retry. `pause(reason)` interrupts active dwell and suppresses the interval to the next step. Ready and completed phases are preserved across input interruptions; completion metrics and feedback remain final until explicit start/reset. H/app owns the deliberate resume latch: fresh active frames resume training only after the input facade has deliberately resumed/rebased. App must pause input alongside training.

Eligible elapsed intervals are capped at the prior sample's receive time plus 250ms, so a long render gap cannot count an outage. Input is fresh strictly below 250ms age. Intentional camera frames keep elapsed time running and reset dwell without moving the tool. Frame sequence/source/calibration identity prevents repeated rendering from applying a pose or adding path/noise measurements twice. The clock can accrue eligible dwell between fresh samples; duplicate rendering at the same time adds nothing. Calibration changes, missing freshness, camera mode, pause and leaving tolerance interrupt dwell. Scoring uses applied poses only, never render interpolation.

Reach targets are deterministic virtual positions `[0,24,0]`, `[-30,32,20]`, `[35,18,-25]`, `[0,40,30]` in mm, within the bounded virtual set. They are not a claim of physically validated reachability. Position tolerance is 10mm and dwell is 500ms. Steadiness is positional RMS about the current dwell's mean across unique samples, capped at 1000 samples. Free practice has no competitive score.

## Collision

The collider is a capsule extending 16mm backward from the tip along the pointing direction, radius 2mm, with 0.1mm added blocking margin. Unavailable direction uses a synthetic negative-Z axis internally for the conservative collider; this is not measured physical orientation. Exact segment/AABB distance is minimized piecewise at slab crossings. Conservative advancement uses the maximum point-travel bound `tip distance + blade length * angle`, accounting for translation and shortest-arc direction rotation, including pure rotation. An exact antipodal turn chooses a deterministic orthogonal arc; the telemetry cannot establish the true intervening physical path.

Each advancement remains within proven clearance. At most 192 iterations run; unresolved travel holds at the last proven safe pose rather than applying the remainder. Near contact the engine preserves at least 0.001mm clearance beyond its margin to allow retreat on the next request. Contact starts within 0.03mm of that boundary; release requires 0.6mm clearance. One penalty is counted per continuous contact episode across the current contact set. Requested and applied poses remain separate for the ghost. Subsequent blocked requests always sweep from the applied pose, so repeated requests cannot teleport through a wall. A starting pose already intersecting an obstacle is not automatically ejected; setup must supply a safe pose. Conservative advancement can stop early for very large/tangential requests; it does not claim a sliding solver or physical dynamics.

## Verification and integration

`npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check` run in the isolated worktree. Tests exercise 499/500ms timing, irregular cadence, duplicate rendering, stale clipping/resume, camera dwell interruption and frozen pose, explicit pause, calibration/tolerance reset, mode lifecycle, exact segment distance, thin-wall packet jumps, repeated blocking, release/recontact, pure rotation with clear endpoints and clear-path motion.

Parent E owns review/publication/integration. No serial, scene, UI, root configuration or shared contract edits were made. No browser or live-device acceptance is claimed for this pure training slice. Next: wire free/reach snapshots in E app/scene/UI, then add the remaining three modes in reviewed increments. Live physical reachability, noise tuning and performance remain device checks.

# Incision training — issue #27

Branch `Cadastrophi_incision-training`, contract base `8d5fd2a86af4dbdaa30e61244030e70194eca7e3`. Writes limited to `src/training/**` and this handoff. E owns review/publication, app/UI and coordination with the scene worker.

The optional `TrainingState.incision` snapshot follows the published contract: seam `[-25,18,0]` to `[25,18,0]`, outer half-width 15mm, 20 equal 2.5mm segment flags. Snapshot is null in other modes. Starting or resetting incision restores an uncut patch; completing all segments finishes the exercise and freezes final incision, path, time and contact-score metrics.

## Contact semantics

This is a constrained applied-tip contact approximation, not arbitrary mesh cutting or blade dynamics. Fresh unique tool samples define linearly swept applied-tip strokes. Only the portion clipped to x ±25mm, z ±2mm and y 15–18mm (depth 0–3mm) can mark seam segments. There must be positive applied movement and a nonzero clipped interval: stationary contact and elapsed time alone do not cut. A stroke crossing the valid depth band can cut its intersected portion even when its endpoint is above or below that band; horizontal strokes wholly above, below or outside the corridor cannot cut.

A first fresh sample only establishes the stroke anchor. Pause, Space camera hold, stale/hidden interval, calibration or source change clears that anchor, so no interpolation bridges an interruption. Duplicate sequence frames do not create strokes. No cutting occurs in ready, paused, camera-control or completed state. Camera holds retain the existing fixed applied pose and eligible elapsed-time behavior.

Depth reports surfaceY minus applied-tip Y while over the patch footprint; negative values mean above the surface. Deviation is absolute Z distance from the straight seam. Values are virtual practice feedback, not physical arm accuracy. Scene geometry must derive its opening/deformation directly from the returned immutable segment flags.

## Protected structures

Blocking boxes are x `[-35,-28]` and `[28,35]`, y `[5,22]`, z `[-12,12]`. They flank the patch endpoints while leaving the standard negative-Z blade's complete seam route clear. They use the existing conservative collision sweep and contact episodes. Cut coverage uses only the resulting applied movement; a requested jump through a protected box cannot paint a cut on the far side. The patch is deliberately not a blocking box. Starting while already overlapping a protected box throws before any state mutation and asks the user to move clear in Free practice.

## Evidence / next owner

Validation: `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`. Added tests cover complete contact strokes, depth/deviation and frozen completion, off-path/invalid-depth movement, other-mode isolation, duplicate/stationary samples, camera/pause/stale/calibration/source interruptions, applied-pose blocking, rejected overlapping starts and reset/retry.

No app, UI, scene, input, contract or root dependency changes. No geometry/browser/device acceptance is claimed here. Parent integrates the reviewed training and scene slices, verifies actual separated/deformed geometry and keeps incision disabled if visual or hardware checks miss feature freeze. Core five modes remain the delivery priority.

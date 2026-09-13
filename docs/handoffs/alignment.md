# Alignment handoff — issue #17

Branch `Cadastrophi_direction-drill`, base `9931063eed15f5fd60a4665d1e68194e6ae74224`, unchanged contract launch-v1.1. Exclusive writes: `src/training/**` and this handoff. Parent E owns publication and integration.

`createTraining` now accepts `align`. Four deterministic targets reuse the bounded virtual reach positions with pointing offsets of neutral, ±15° horizontal and +10° vertical around negative Z. These are a modest virtual practice set, not physically validated device reachability. A fresh applied pose must satisfy both 10mm position and 10° signed pointing error continuously for 500ms. The normalized dot product is clamped to [-1,1] before acos; opposite directions remain 180° apart. Roll is never scored. Null, unavailable, zero-length or non-finite directions cannot earn alignment credit. Feedback labels virtual pointing semantics unless the input explicitly supplies a physically validated direction kind.

Alignment reuses the existing timing, collision, pause/resume, completion and retry engine. No global listeners, input mapping, public interfaces, camera behavior or UI/scene files changed. Obstacle and camera drills remain unsupported in this increment.

Validation: `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`. New tests cover signed angle normalization, separate position/direction gates, 499/500ms irregular dwell, angular interruption, unavailable directions, varied target completion and completed pause/retry. No hardware acceptance claimed. Parent must expose alignment in its app/UI and render the target pointing direction; device noise/reachability remain live checks.

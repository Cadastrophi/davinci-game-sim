# Local preservation record — 2026-09-14

## Purpose

This record explains the preservation branch created before the Desktop checkout is retired. It is an archival handoff, not a product feature change.

## Preserved

- The current browser trainer baseline from `origin/dev`.
- Pose-trainer research, planning, hardware clarifications and supporting references from the local `justin/pose-trainer-plan` worktree.
- Local-only application branch history and detached review snapshots, each under an explicitly named remote recovery ref where required.

## Excluded by request

- `references/foc-motor-test/` and its nested Git checkout. Its edits were declared irrelevant and were removed from the preservation tree.
- Generated or machine-local files including `node_modules/`, `dist/` and `.DS_Store`.

## Important distinction

The preservation branch contains one coherent tree based on `origin/dev`. Separate recovery refs preserve histories that cannot be represented as one ordinary branch without merging unrelated work. Uncommitted work is recorded only after it has been committed deliberately; it is not inferred from generated files.

## Evidence

The preservation branch was pushed successfully:

- `Cadastrophi_local-preservation-2026-09-14` at `1cffc56151edbb47fb330e97d385691d29a7a65`.
- It is based on `origin/dev` at `3694eac` and contains documentation plus the archived pose-trainer research; application behavior is unchanged.
- `npm ci` completed successfully, `npm test` passed with 19 files and 180 tests, and `npm run build` passed.
- `git diff --check origin/dev...HEAD` passed.

Additional recovery branches were pushed under `Cadastrophi_recovery/`:

- `pose-trainer-plan-2026-09-14` from `ea79da4`.
- `incision-ui-2026-09-14` from the local `Cadastrophi_incision-ui` tip.
- `incision-scene-2026-09-14` from the local `Cadastrophi_incision-scene` tip.
- `review-facade-2026-09-14` from `83b7d70` and `review-serial-2026-09-14` from `91d3caf`.
- Thirteen `unreachable-*` refs preserve the remaining non-FOC dangling commit tips: `c028a27`, `684e93b`, `9a55b48`, `fb5e78b`, `c36dbf3`, `8eb6296`, `e6c0b2b`, `26c3d2f`, `efc6c96`, `d4e379b`, `36f2a23`, `e1f41be` and `eafaa4a`.

The `foc-motor-test` checkout was excluded as requested and moved out of the Desktop repository to `/private/tmp/davinci-game-sim-discarded-foc-motor-test-20260914` as a temporary recoverable copy. It was not pushed to the browser trainer repository.

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

The final commit SHA, pushed refs, validation commands and any remote-connectivity limitation are recorded in the handoff response and should be updated here before the checkout is deleted.

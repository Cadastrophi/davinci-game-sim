# Two masters, bounded workers, one integration owner

> Historical record. Current workflow: [ADR 0004](../adr/0004-dev-prod-local-workflow.md). Past deadlines, collaborator ownership and acknowledgement gates are superseded. Preserve this record as evidence.

This supplements, not replaces, `AGENTS.md` and the current Git workflow. Use [issue #1](https://github.com/Cadastrophi/davinci-game-sim/issues/1) as cross-computer coordination; local files/chat are supplementary. Two subscriptions do not share a mailbox or memory.

## Authority and startup

Master E owns experience and is the sole merge coordinator. Master H owns input/calibration and reviews E integration. Each master identifies the human/account it serves; verify the actual push identity before new branches. Current branch convention is `<github-login>_<task-name>`, e.g. `Cadastrophi_scene-lighting` or `Jin-underworld_serial-framing`, with unique suffixes when needed. Preserve historical branches and unknown uncommitted work.

Before any product writes, both post: role, human/push account, task/thread identifier, documentation SHA, baseline plan, actual remaining time/shared deadline, expected paths, proposed worker claims and merge authority. Both ACK the same plan. E obtains review and integrates this launch package if unmerged, then reconciles old Unity-only CONTEXT/intent/ADR wording through an acknowledged docs PR. The user's web choice is settled; don't reopen engine selection because old docs say Unity. Preserve UART reference boundaries and unrelated peer edits; don't blindly merge the older discovery branch over current decisions.

Use one narrow issue, branch, worktree, author and PR per independent slice. Every writing subagent gets an isolated worktree; if the runtime cannot provide one, serialize code writers instead of sharing Git index/branch state. Parents never checkout, stage, commit or edit inside a live worker's worktree. Record handoff and exact SHA before taking ownership. The package baseline was prepared from `ed8d460`; discover current main, never pin feature work to that historical SHA.

## Exclusive ownership

| Owner | Write allowlist |
| --- | --- |
| E master / explicitly assigned foundation worker | `src/app/**`, `src/contracts/**`, `src/main.ts`, `index.html`, root package/lock/tsconfig/Vite files, CI/deploy config, `tests/fixtures/contract/**`, `tests/app-integration/**`, `tests/e2e/**`, shared docs/ADRs/indexes |
| E scene worker | `src/scene/**`, `public/assets/environment/**`, colocated scene tests |
| E training worker | `src/training/**`, colocated exercise/collision/scoring tests |
| E UI worker | `src/ui/**`, colocated component styles/tests |
| E cutting worker, later wave | `src/tissue/**`, `public/assets/tissue/**`, colocated tissue tests; training/scene wiring requested through owners |
| H master | `src/input/index.ts`, `docs/hardware/**`, `tests/input-integration/**` |
| H serial worker | `src/input/serial/**`, colocated parser/transport tests |
| H mapping worker | `src/input/mapping/**`, colocated calibration/camera-switch tests |
| H fixtures worker | `src/input/sources/**`, `tests/fixtures/input/**`, colocated provider tests |

All paths outside a claim are read-only. Directory ownership also covers functional behavior: H does not score, E does not parse UART or recreate calibration. E owns visible diagnostics UI; H supplies diagnostics data. E scene renders targets; training defines targets. Shared stylesheet, dependencies, contracts and app composition have only the E custodian. Worker-specific notes use unique `docs/handoffs/<issue>-<worker>.md` paths declared in claims; masters update shared logs/indexes serially.

## Subagent execution template

Start two workers per master once independent tasks are ready; expand to three if slots and dependencies permit. Across a shared runtime respect its combined cap. Use Astra where available as requested; do not assume unlimited slots or spend effort merely keeping them occupied. One wave's review worker can reuse a completed implementation slot. Workers may not recursively spawn writers or merge main.

Each dispatch includes outcome, exact file allowlist, repo/worktree, branch/base SHA, contract revision, dependency PRs, tests/acceptance evidence, handoff destination and stop conditions. Ask for a PR-sized deliverable, not an entire subsystem. Masters synthesize/review continuously; they do not wait for every worker before integrating a ready slice. Read-only independent review can run alongside implementation without changing its files.

## Incremental PR queue

| Slice | Owner | Gate / visible result |
| --- | --- | --- |
| D0 | E with H review | Launch docs integrated; old shared wording reconciled without overwriting research |
| P0 | E foundation with H ACK | Single Vite/Babylon scaffold, contract facades, seed fixtures, test/build scripts and minimal visible replay page; both record merged baseline SHA |
| P1-E / P1-H | Scene / serial workers in parallel | Original anatomical scene plus replay; separately live read-only serial facade/diagnostics; E wires small integration PR, first real HTTPS test target ≤45min |
| P2 | H mapping/provider workers + E wiring PR | Calibrated live free practice and Space pan/dolly; fixed camera orientation, fixed tool during Space, no release jump |
| P3 | E training/UI | Reach-and-hold end-to-end with results/retry; stale/pause tests |
| P4 | E workers | Direction alignment, obstacle course, camera-navigation drills in separate PRs using shared engine; individual usable increments |
| P5 | E cutting worker, after core | Bounded contact-driven tissue separation/deformation; experimental until tested; no blocking core release |
| P6 | Both lanes, disjoint fixes | Live rehearsal, failure recovery, frame-time/readability checks and feature freeze |

Dependency means merged contract/code, not merely an open PR. Pure tests/logic can advance against stable baseline fixtures while integration waits. Prefer fresh branches from current main after prerequisite merges; avoid long squash-merged stacks. Each increment is runnable, has a preview/source SHA where hosting is available, and labels replay honestly.

## Review and merging

Before editing, pushing and merging, fetch/prune; inspect all open issues/PRs, expected file claims and diffs. Shared interface/path change requires explicit ACK, including owner and integration order. Silence/timeout is not permission. H reviews E boundary changes; E reviews H changes; non-author reviewers inspect feature behavior/tests. A worker cannot approve its own work. If GitHub formal approval is required but both agents use the same account, obtain an eligible reviewer—do not bypass the rule.

Only E merges, one reviewed PR at a time. Integrate latest main into the feature branch, rerun checks, review updated diffs and ensure review covers the current head. Squash merge, verify merged main SHA, notify dependents, then safely close claims. Do not force-push shared branches, cherry-pick around PR review, reset unknown work, or resolve conflicts by blindly choosing a side. A failed integration pauses later merges until a reviewed fix restores runnable main. Merge-authority handoff needs explicit release and recipient ACK.

When tasks are ready for integration, post `READY: issue, PR, head SHA, checks, contract impact, hardware/visual evidence`. E/H check messages at task boundaries and before publication/integration. For waiting during an active run use bounded waits and continue disjoint work; no autonomous monitoring after the task ends is implied. If a peer is unavailable, keep ready work reviewable and report the blocker rather than pretending a handshake occurred.

## Operational gates and completion

Check GitHub access, local tool/runtime availability, actual browser/port and an existing authorized host early. The human may need to select a serial device or authenticate hosting; those are bounded handoffs, not reasons to stop independent work. Do not expose secrets, change repo visibility, buy assets or alter security settings. Use secure-context Web Serial with user activation.

If no hardware proof at the first gate, prioritize transport over extra features. If direction mapping is unvalidated, label virtual semantics or disable physical-alignment claims. If cutting cannot meet separation/deformation, disclose it unfinished and preserve core modes. Reserve final hour for testing; no unreviewed last-minute merges. Final report: modes actually working, URLs and source SHAs, PRs, tests, real-device evidence vs mocks, known limits, blockers and next owner. A green build or attractive screenshot alone is not completion.

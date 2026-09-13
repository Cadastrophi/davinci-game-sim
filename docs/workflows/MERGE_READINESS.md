# Merge readiness — 2026-09-13

## Decision

Configuration is prepared for review; do not promote dev to prod or delete main until the questions and migration gates below are resolved. This audit covers branches, open issues, integration conflicts, workflow configuration and existing automated checks; it is not a full clinical, hardware or security audit.

## Branch evidence

| Ref | Audited SHA | Finding |
| --- | --- | --- |
| origin/main | 61efa65 | GitHub default at audit time |
| origin/dev | 61efa65 | Created during this task from the complete remote-main history |
| origin/prod | 04fbf5f | Six commits behind dev; ancestor of dev, so no textual promotion conflict |
| local main | 64afb7d | Two unique commits, 25 behind remote main; FOC reference and intent entries |
| recovery | 64afb7d | Local `Cadastrophi_recovery-local-main-64afb7d` preserves the local-main tip |

Prod lacks Shift recenter (#32), home controls/telemetry (#36), local-first policy (#38), axis/default-gain correction (#40), white UI (#39), and showcase documentation. A clean merge does not establish hardware acceptance.

The primary checkout remains on legacy local main with untracked dist/ and node_modules/. It is not the current runnable app checkout. The tested configuration checkout is `/private/tmp/davinci-dev-prod-config`; preserve the primary checkout until migration is complete.

## Open issues and merge conflicts

- [#1: two-agent delivery plan](https://github.com/Cadastrophi/davinci-game-sim/issues/1): its coordination model is superseded by the current request. Recommend closing as superseded after preserving research links, rather than claiming every historical acceptance item was completed.
- [#35: physical controller mapping](https://github.com/Cadastrophi/davinci-game-sim/issues/35): partially implemented. [PR #40](https://github.com/Cadastrophi/davinci-game-sim/pull/40) sets axisOrder `[1,2,0]` and translationGain `[1,1,3]`, but explicitly excludes angular mapping. `src/contracts/index.ts` still sets pitchSign `1`; the issue requests `-1`. Do not close as fully fixed.
- [#37: first-person navigation](https://github.com/Cadastrophi/davinci-game-sim/issues/37): remote branch `Cadastrophi_first-person-navigation` at `1f20966` has unmerged scene code and a generated image. A merge-tree simulation against `61efa65` conflicts in `docs/coordination/ACTIVE_WORK.md` and `docs/intent/INTENT_LOG.md`, with no reported code conflict. Preserve both intent records when integrating. Its local worktree later moved to `798deef` while remote remained `1f20966`; this task did not make that change. Recheck before any integration and do not assume the local and published versions match.
- Merging local main `64afb7d` into remote main also conflicts in `docs/intent/INTENT_LOG.md`. The unique FOC reference commits are preserved, not silently included in dev.
- No open PRs were returned by GitHub at the audit checks. Historical feature branches often survive squash merges; commit ancestry alone is not evidence that all their code remains unmerged. Do not bulk-delete them or their worktrees.

## Configuration defects addressed in the proposed change

The previous operating docs disagreed: AGENTS made issue claims/handshakes optional while Git and agent workflows still required them; templates still required acknowledgements; product/run-status docs still imposed old deadlines and two-master gates. The proposed documentation uses dev/prod consistently, removes these active requirements, preserves historical evidence, and retains intent, validation, PR review and handoff requirements. ADR 0004 records the change.

## Remaining questions before merge

1. **Release scope:** promote the six current dev commits to prod now, or keep prod at its older release while completing hardware validation? Recommendation: hold prod until its acceptance evidence is agreed.
2. **Pitch:** keep `+1` pending a controller observation, or implement the `-1` requested by #35? Record a neutral-to-positive-pitch sample and expected virtual direction. Preserve the newer gain `[1,1,3]` unless explicitly changed.
3. **First-person navigation:** include #37 in this release, or defer it while stabilizing the current app? Recommendation: defer unless it is part of the required release experience.
4. **FOC reference:** integrate local-only commits `4c533bc`/`64afb7d`, or keep them archived under the recovery branch? Recommendation: preserve separately until reference access and intended use are confirmed.
5. **Release acceptance:** is a localhost mock/demo release sufficient, or must the connected controller pass calibration, direction, recenter, reset, pause/resume and disconnect/reconnect checks before prod promotion? No current live-device pass is asserted.
6. **Merge enforcement:** keep documented local checks only, or add CI for lockfile install, tests and build and require it on dev/prod PRs? There is no checked-in `.github/workflows` directory. Remote rulesets/protection/merge methods are unverified; the browser settings page is signed out and no repository-admin connector is available.
7. **Tracker cleanup:** close #1 as superseded, retain #35 for pitch/hardware evidence, and retain or defer #37 according to release scope?
8. **TDD seams:** confirm the public input facade and app controller as boundaries for behavioral fixes before adding tests. The invoked TDD skill requires explicit confirmation; existing tests can be run without adding new tests.

## Main retirement gate

Remote dev now preserves remote-main history; the local recovery branch preserves local-only work. Remaining steps: merge the reviewed workflow changes into dev, establish dev as GitHub default, inspect/migrate rulesets and any deployment/PR references, safely move the primary checkout to dev, and recheck all tips before deleting main. Main remains intact until these conditions hold. Branch creation alone is not a completed migration.

## Validation

- Baseline dev/main `61efa65`, Node v24.14.1, macOS: offline lockfile install succeeded; 19 test files / 180 tests passed; `npm run build` passed, including TypeScript checking.
- Vite reports a main JS chunk of approximately 1,013 kB (247 kB gzip), above its 500 kB warning threshold. This is a performance follow-up, not a compile failure. No new runtime code or tests were added.
- Merge-tree simulations do not change working files; their conflicts are described above.
- Prod `04fbf5f`: offline lockfile install succeeded; 14 test files / 157 tests passed; production build passed, including TypeScript checking, with the same bundle-size warning.
- Documentation: `git diff --check` passed; new and changed relative Markdown links were checked for existing targets.

## Publication handoff

Configuration commit `ab86eb6` was pushed on `Cadastrophi_dev-prod-config`. Draft PR creation targeting dev failed with GitHub 403 “Resource not accessible by integration”; no PR was created. The available browser session is signed out. Continue through an authenticated repository session, open the configuration PR, resolve the questions, then complete the migration gate. No main deletion or production promotion occurred.

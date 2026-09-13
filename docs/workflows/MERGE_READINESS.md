# Configuration validation — 2026-09-13

## Current decisions

- Hold production application promotion until hardware verification. Hardware is currently unavailable.
- Keep pitchSign +1. Issue #35 remains open for future device evidence.
- Defer first-person navigation (#37); none of its scene changes are in dev or prod.
- Add no new behavioral tests until public test boundaries are agreed. Existing mock tests still run.
- Issue #1 is closed as not planned; its two-agent delivery model is superseded.
- Remove FOC-only local commits from active branch history; leave reference files and upstream untouched.

## Delivered configuration

- [PR #41](https://github.com/Cadastrophi/davinci-game-sim/pull/41) merged dev workflow/intent cleanup and CI at a555695.
- [PR #42](https://github.com/Cadastrophi/davinci-game-sim/pull/42) merged CI only into prod at 1c61413. No dev application changes were promoted.
- GitHub default branch and local origin/HEAD are dev. The primary checkout is on dev.
- Active ruleset `dev-prod-ci` (23181190) targets exactly dev and prod: require a PR, an up-to-date `Test and build` check, prevent force pushes and deletions. No bypass actors and no external approval count requirement.
- CI performs a locked install, existing tests, typecheck/build, and a downloadable 14-day artifact. It runs on dev/prod pushes and PRs and supports manual dispatch. Submodules are not checked out. Actions are pinned to official commit SHAs.
- Deployment is deliberately not configured. GitHub Pages is disabled; no deployment environments or webhooks are configured. Future hosting needs a destination and remains behind the hardware release hold.
- Repository-local skills remain removed, preserving the separate device-scope maintenance on dev/prod. Current dev operating docs retain intent, validation, review and handoff requirements without concurrent-friend or hackathon gates.

## Validation evidence

- Node 24.14.1 on macOS: dev 180 existing tests pass; prod 157 existing tests pass. Both typecheck and build successfully.
- GitHub PR CI passed for both #41 and #42, including artifact upload.
- Merged dev push CI [34764443590](https://github.com/Cadastrophi/davinci-game-sim/actions/runs/34764443590) passed.
- Merged prod push CI [34764488189](https://github.com/Cadastrophi/davinci-game-sim/actions/runs/34764488189) passed.
- Application paths, package/lockfile, Vite and TypeScript configuration are unchanged versus the original dev/prod baselines. The Babylon bundle-size warning remains; no runtime failure was found by these checks.
- No live hardware acceptance is claimed. Simulated-input tests do not establish physical controller correctness.

## FOC cleanup

Full inspection showed local commits 4c533bc and 64afb7d contained only the FOC registration and associated intent/coordination record. Local main now matches origin/main; the FOC feature and temporary recovery branches were removed. Normal reflogs were not purged. The FOC checkout remains untracked, internally clean, and at b1a857e3bc9985f3f8a7deab6ec1876dd57b7017. No FOC files or upstream commits were changed.

## Main retirement

Main remains at 61efa65 and is fully contained in dev. Its default-branch role is migrated; no checked-in CI or configured deployment depends on it. Both new branch checks pass, and local-only FOC history has been removed from active refs. Hardware verification gates application promotion, not deletion of the redundant main branch.

The user requested validation and an update on when main can be deleted. After this final handoff is merged, main can be retired following a fresh remote/PR check. Leave it intact for this status update. Historical documents and old feature worktree upstreams may still name main; new work starts from dev, and an old task must refresh its base before continuing.

## Integration handoff

The final handoff branch merges the CI-only prod commit into dev so future dev-to-prod promotion shares its ancestry. Merge this PR with a merge commit, not squash. No application files change. Preserve intent records from both branches. Before future promotion, repeat device acceptance on the exact candidate SHA and record results.

# Git workflow

## Branch roles

- `dev`: integration branch and intended GitHub default. Feature PRs target dev.
- `prod`: accepted release snapshot. Promote reviewed dev changes through a dev-to-prod PR; a branch name alone does not deploy the application.
- `main`: transitional legacy branch. Retire only after the migration gate below passes.

Use `<github-login>_<short-slug>` for feature branches. Verify the account authenticated by the push remote, rather than inferring it from the repository owner or commit author. Existing historical names remain valid.

## Work and validation

1. Inspect `git status --short --branch`, fetch/prune origin, and inspect relevant open issues/PRs.
2. Create an isolated feature branch from current origin/dev. Record non-trivial intent before editing; issue claims and collaborator acknowledgements are optional.
3. Preserve unknown edits and commits. Understand both sides of any actual conflict; never blindly select a whole side.
4. Run a lockfile install with `npm ci`, then `npm test` and `npm run build` (which includes typechecking). Record Node version and browser/hardware checks as appropriate. For behavioral fixes follow the TDD skill at confirmed public seams.
5. Fetch again and incorporate current origin/dev. Review the full diff and required checks before pushing and merging the feature PR. Prefer squash merges for feature PRs. A user request for pre-merge decisions overrides automatic integration.
6. Verify the merged remote commit before cleaning up a feature branch/worktree. Leave intent, results and remaining work legible.

## Production promotion

Open a PR from dev to prod with the exact candidate SHA, release scope, automated results, relevant browser/device evidence and rollback SHA. Resolve outstanding release decisions before merge. Prefer a merge commit for promotions so prod contains the validated dev history and future comparisons remain meaningful. Do not squash repeated dev-to-prod promotions. If the repository disallows merge commits, resolve that configuration before promotion.

Fix production defects on a branch, validate them, and integrate the same fix into dev. Never force-push dev or prod or bypass required checks. Local checks remain required even if CI is added.

## Retiring main

All conditions must be verified before deleting remote or local main:

- Remote dev exists and contains the complete remote-main history; prod exists at an identified, recoverable release.
- GitHub's default branch is dev. Inspect branch protections/rulesets, PR bases and deployment integrations; migrate any main-specific settings. Report unavailable settings rather than assuming they are correct.
- Every commit unique to local main is integrated, preserved or explicitly rejected by the user. Preserve dirty worktrees and submodule files.
- Feature/release PRs and merge-readiness questions have been reviewed; no remaining consumer requires main.
- Fetch and re-check SHAs immediately before deletion. Switch the primary working checkout away from main safely. Retain a recovery ref for the old tip.

See [merge readiness](MERGE_READINESS.md) for the current audit and unresolved decisions.

## Automated delivery checks

`.github/workflows/ci.yml` runs existing tests and production builds on dev/prod pushes and PRs targeting either branch. It uses Node 24.14.1, a lockfile install, read-only repository permissions and no submodule checkout. Each successful run uploads dist as a 14-day artifact tied to the tested SHA. Configure `Test and build` as the required status check after its first successful run.

Production feature promotion and deployment are on hold pending hardware verification. CI builds are downloadable candidates, not hardware acceptance or an automatic deployment. No hosting destination or deployment credentials are configured by this change. A CI-only PR into prod may proceed without promoting dev application changes.

Action sources: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [upload-artifact](https://github.com/actions/upload-artifact).

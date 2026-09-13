# Git workflow

## Invariants

- `main` is always integration-ready and is never a working branch.
- One task, one issue, one owner, one branch, one pull request.
- One branch is written by one agent at a time unless a handoff is explicitly recorded.
- Fetch and collision-check before starting, before pushing, and before merging.
- Never discard unknown local changes, force-push a shared branch, or resolve a conflict by blindly choosing one side.

## Branch naming

Use `<github-login>_<branch-name>`, with one underscore separating the pushing account's GitHub login from a short, lowercase, hyphen-separated task name. Preserve the login's spelling. For example: `Cadastrophi_update-controller-input` or `Jin-underworld_branch-naming`.

Before creating the branch, inspect `git remote get-url --push origin` and verify the account authenticated by that push connection. For SSH, use `ssh -T` with the same user and host/alias as the push URL; GitHub's successful greeting identifies the account even though the command normally exits with status 1. For HTTPS, verify the account associated with Git's configured push credential; `gh api user --jq .login` is suitable only when Git uses that same GitHub CLI account.

Use the authenticated login, not the repository owner, `git config user.name`, commit author, or a fixed Justin/Jinyu/agent mapping. If the pushing account cannot be verified, resolve that identity before creating or publishing a branch.

Create a unique branch from current `origin/main`; add a short task suffix if the name already exists. Re-check the account before pushing. If the pushing account changes, create a new correctly prefixed branch containing the intended commits and record the handoff; preserve any shared branch. Existing historical branch names remain unchanged.

## Start checklist

```bash
git status --short --branch
git fetch origin --prune
git log --oneline --decorate -n 12 origin/main
git branch --all
```

Also inspect open issues and pull requests, because branches alone do not communicate intent.

## Commits

Keep commits reviewable and single-purpose. Use an imperative subject with a conventional prefix where helpful, such as `docs: establish agent coordination contract`. Do not mix formatting churn, generated Unity files, and behavioral changes.

## Before push or PR update

```bash
git fetch origin --prune
git diff --name-status origin/main...HEAD
git log --oneline origin/main..HEAD
```

Compare the changed paths and contracts with every open PR. If `origin/main` moved, update the branch and repeat validation. Use `--force-with-lease` only for your own unshared branch and only when rewriting is truly necessary.

## Conflict resolution

Understand the intent of both sides from their issues, PRs, and commits. For Unity YAML/scene/prefab conflicts, prefer splitting ownership or using Unity Smart Merge; validate the resulting asset in the matching Unity Editor. Record any behavior choice made during resolution in the PR or an ADR.

## Merge

Prefer squash merge after review and passing checks. Confirm the PR still reflects the latest `origin/main`, no new overlapping PR appeared, and the other agent acknowledged shared interfaces. Do not delete a branch until the merge commit is visible and any remaining work has a new owner.

## Emergency recovery

Stop when history, ownership, or uncommitted changes are unclear. Preserve evidence with `git status`, `git diff`, `git log`, and a patch or temporary branch; never use destructive reset/checkout as a discovery tool. Escalate with the exact branch, commit, changed paths, and intended recovery.

# Agent workflow

## 1. Recover context

Read `AGENTS.md`, `CONTEXT.md`, the project intent, active work, relevant ADRs, and the issue/PR history. Restate the requested outcome in the intent log if it is non-trivial. Separate explicit requirements from assumptions and open decisions.

## 2. Synchronize and discover peers

Fetch `origin` with pruning. Inspect the default branch, open GitHub issues, open pull requests, remote branches, and `docs/coordination/ACTIVE_WORK.md`.

Identify the other agent's active issue, branch, expected files, and integration surface. When a direct agent channel exists, message the other agent. Otherwise, use the shared GitHub issue or pull request. The handshake must state:

- issue and desired outcome;
- human owner and agent identifier;
- branch name;
- files/subsystems expected to change;
- dependencies or integration points;
- whether overlap exists.

No acknowledgement is required for clearly disjoint work. Explicit acknowledgement is required before overlapping files, schemas, scenes, prefabs, project settings, or public interfaces are edited concurrently.

## 3. Claim narrowly

Create or take ownership of one GitHub issue. Add the branch and file set to the issue, then mirror the claim in `ACTIVE_WORK.md` where practical. If ownership is ambiguous, narrow the task instead of claiming a broad subsystem.

## 4. Work on an isolated branch

Create a branch from current `origin/main` using the convention in `GIT_WORKFLOW.md`. Keep the working tree comprehensible, preserve unrelated edits, and make single-purpose commits. Update docs and ADRs alongside behavior.

## 5. Validate and prepare integration

Run focused checks first, then broader checks proportional to risk. Fetch again. Compare both agents' branches with `origin/main` and inspect overlapping paths or contracts. Rebase the feature branch onto current `origin/main` when safe; never rewrite another agent's branch.

## 6. Pull request and review

Push the feature branch and open a pull request linked to its issue. The PR must summarize intent, scope boundaries, validation, coordination, risks, and screenshots/video for visual Unity changes. Ask the other agent to review integration surfaces even when the code paths are disjoint.

## 7. Merge and hand off

Re-check remote state immediately before merge. Merge only when required checks pass, conflicts are resolved on the feature branch, and ownership/overlap concerns are acknowledged. Prefer squash merge. Close the claim, update the active-work mirror, and leave a handoff if any follow-up remains.

## When communication fails

If the other agent cannot be reached, continue only on work that is demonstrably disjoint. For overlapping work, publish a clear claim/status on the issue and stop before editing or merging the overlap. Ask the humans to arbitrate only after the repository evidence and a proposed split are documented.

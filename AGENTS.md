# Agent operating contract

This repository is developed primarily by autonomous agents acting for Justin and Jinyu. Humans are not expected to manage Git mechanics. Every agent owns the safety of its local work, the clarity of its intent, and the quality of what it merges.

## Read before acting

1. Read `CONTEXT.md`, `docs/README.md`, and `docs/PROJECT_INTENT.md`.
2. Read the ADR index and any ADR relevant to the files or subsystem being changed.
3. Use applicable device-level skills for the task. Do not download or commit skill packages into this repository.

## Scope and intent

- Preserve the current task's user intent in `docs/intent/INTENT_LOG.md` before implementation when the request is more than a trivial edit.
- Implementation is authorized for the original browser teleoperation-training game described in `docs/launch/SPEC.md`; read `docs/launch/RUN_STATUS.md` for current delivery constraints and launch gates. The accepted Babylon.js/TypeScript/Vite direction supersedes the former Unity product plan.
- `references/idp-unity-simulation` is an upstream reference only for UART command parsing and ingestion. Never copy its gameplay, visuals, scene structure, or unrelated architecture into this project.
- Do not invent product decisions. Record consequential choices as ADRs; record unresolved decisions in `docs/PROJECT_INTENT.md`.

## Local-first integration protocol

- Run implementation and proportionate validation locally on the machine doing the work. Local execution is the acceptance source of truth; do not depend on cloud tasks or remote execution to complete a change.
- Never develop on `main` and never share a working branch with another agent. Start a unique local branch or worktree from current `origin/main`, using `<github-login>_<branch-name>` after verifying the push identity.
- Assume work performed on the two devices is independent. GitHub issues, issue claims, the active-work mirror, and peer acknowledgements are not required to start or complete a task.
- Preserve unrelated work. If actual overlap appears in changed paths, public interfaces, or merge conflicts, inspect both intents and resolve the overlap deliberately before integration.
- After local validation passes, push the branch and open a pull request. Review the complete PR diff, required checks, and mergeability against the latest `origin/main`.
- When the PR is correct, checks pass, and no unresolved overlap remains, squash-merge it into `main` immediately. Never bypass required checks, force-push another agent's branch, or merge changes that were not reviewed.
- Confirm the merge is visible on `origin/main`. Remove the branch or worktree only when the merged commit remains recoverable.

## Change quality

- Keep commits single-purpose and explain why in the message.
- Preserve unrelated work and never discard uncommitted changes you did not create.
- Test in proportion to risk. For Unity changes, include Editor version, platform, commands/checks run, and any manual scene verification in the PR.
- A task is not complete until intent, implementation, verification, and handoff are all legible to the other agent.

## Agent skills

### Domain docs

This is a single-context repository rooted at `CONTEXT.md`; see `docs/agents/domain.md`.

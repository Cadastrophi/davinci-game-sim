# Agent operating contract

This repository is developed primarily by autonomous agents acting for Justin and Jinyu. Humans are not expected to manage Git mechanics. Every agent owns the safety of its branch, the clarity of its intent, and coordination with the other active agent.

## Read before acting

1. Read `CONTEXT.md`, `docs/README.md`, and `docs/PROJECT_INTENT.md`.
2. Read `docs/coordination/ACTIVE_WORK.md`, then inspect open GitHub issues and pull requests. The remote tracker is authoritative; the file is a convenient local mirror.
3. Read the ADR index and any ADR relevant to the files or subsystem being changed.
4. Use the project-local skill `.agents/skills/coordinate-agentic-unity-work/` for any change that writes code, assets, project settings, documentation, branches, commits, pull requests, or merges.
5. Load only the additional project-local skills relevant to the task. Skills live in `.agents/skills/`.

## Scope and intent

- Preserve the current task's user intent in `docs/intent/INTENT_LOG.md` before implementation when the request is more than a trivial edit.
- This repository will become a higher-fidelity Unity simulator inspired by the da Vinci simulator experience. Do not begin game implementation unless the user explicitly requests it.
- `references/idp-unity-simulation` is an upstream reference only for UART command parsing and ingestion. Never copy its gameplay, visuals, scene structure, or unrelated architecture into this project.
- Do not invent product decisions. Record consequential choices as ADRs; record unresolved decisions in `docs/PROJECT_INTENT.md`.

## Mandatory concurrency protocol

- Never develop on `main` and never share a working branch with another agent.
- Before editing, fetch/prune the remote, inspect open work, and claim a narrow task with expected files in the corresponding GitHub issue. Mirror the claim in `docs/coordination/ACTIVE_WORK.md` when practical.
- Branches use `<github-login>_<branch-name>`, where `<github-login>` is the verified GitHub account used to push to `origin`. Follow the identity checks and examples in `docs/workflows/GIT_WORKFLOW.md#branch-naming`.
- If another agent can be contacted directly, send it the issue, branch, intent, and expected file set. If paths or behavior overlap, wait for an acknowledgement and agree on ownership before writing. If direct contact is unavailable, use the GitHub issue/PR as the handshake and do not proceed on overlapping files without acknowledgement.
- Re-check remote branches, issues, PRs, and overlapping diffs immediately before pushing and again before merging.
- Integrate through a pull request. Update from `origin/main`, resolve conflicts on the feature branch, run proportionate validation, and prefer squash merge. Do not force-push shared branches, bypass required checks, or merge another agent's unreviewed work.
- After merge, close the coordination claim, update the relevant docs/ADR, and remove the branch only when it is safe and recoverable from the merged commit.

Detailed procedures are in `docs/workflows/AGENT_WORKFLOW.md` and `docs/workflows/GIT_WORKFLOW.md`.

## Change quality

- Keep commits single-purpose and explain why in the message.
- Preserve unrelated work and never discard uncommitted changes you did not create.
- Test in proportion to risk. For Unity changes, include Editor version, platform, commands/checks run, and any manual scene verification in the PR.
- A task is not complete until intent, implementation, verification, and handoff are all legible to the other agent.

## Agent skills

### Issue tracker

Use GitHub issues and pull requests in the repository's `origin`; see `docs/agents/issue-tracker.md`.

### Triage labels

Use the shared triage vocabulary in `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository rooted at `CONTEXT.md`; see `docs/agents/domain.md`.

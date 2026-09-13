---
name: coordinate-agentic-unity-work
description: Deliver repository changes through isolated local work, local validation, pull-request review, and immediate safe merge. Use for any non-trivial write to code, assets/settings, documentation, Git history, or GitHub state; skip read-only questions that cannot affect shared work.
---

# Coordinate Local Agent Work

Protect intent and integration while the humans delegate local execution and Git mechanics to agents.

## Required context

Read the repository's `AGENTS.md`, `CONTEXT.md`, and `docs/PROJECT_INTENT.md`, plus relevant ADRs. `AGENTS.md` is the authority for the current integration protocol.

## Operating protocol

1. Translate the request into outcome, scope, non-goals, assumptions, and acceptance evidence. Append it to `docs/intent/INTENT_LOG.md` when non-trivial.
2. Fetch/prune `origin`, verify the pushing GitHub identity, and create a unique local `<github-login>_<branch-name>` branch or worktree from current `origin/main`. Preserve unrelated and unknown changes.
3. Implement and run the change locally on the current machine. Assume work on the other device is independent; issue creation, claims, active-work updates, and peer handshakes are unnecessary.
4. Keep commits single-purpose and update intent, documentation, and ADRs with behavior. Run focused checks first, then broader local validation proportional to risk.
5. Push the branch and open a pull request. Fetch again, review the complete PR diff, required checks, mergeability, and any actual overlap with changes on `origin/main`.
6. If paths, schemas, public behavior, or conflicts genuinely overlap, understand both intents and resolve the integration deliberately. Otherwise, independent work proceeds without waiting for acknowledgement.
7. Once the PR is correct, locally validated, current, and passing required checks, squash-merge it into `main` immediately. Confirm the merge on `origin/main` before cleaning up the branch or worktree.

## Reference repository boundary

`references/idp-unity-simulation` may be inspected only for UART receipt, framing, parsing, validation, and dispatch behavior. It is not a runtime dependency and must not supply gameplay, visuals, assets, scenes, or unrelated architecture. Read `docs/adr/0001-uart-reference-boundary.md` before using it.

## Blockers

Stop only for a failing required check, an unresolved merge conflict, or an actual overlapping decision that repository evidence cannot settle. Report the exact branch, paths, and decision needed.

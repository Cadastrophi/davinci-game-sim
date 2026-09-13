---
name: coordinate-agentic-unity-work
description: Coordinate concurrent agent work in this repository from captured intent through isolated branches, peer handshakes, pull requests, and safe merges. Use for any non-trivial write to code, Unity assets/settings, documentation, Git history, or GitHub state; skip read-only questions that cannot affect shared work.
---

# Coordinate Agentic Unity Work

Protect intent and integration while the humans delegate Git mechanics to agents.

## Required context

Read the repository's `AGENTS.md`, `CONTEXT.md`, `docs/PROJECT_INTENT.md`, and `docs/coordination/ACTIVE_WORK.md`. Read `docs/workflows/AGENT_WORKFLOW.md` before starting a write task and `docs/workflows/GIT_WORKFLOW.md` before changing branches, commits, remotes, pull requests, or merge state.

## Operating protocol

1. Translate the request into outcome, scope, non-goals, assumptions, and acceptance evidence. Append it to `docs/intent/INTENT_LOG.md` when non-trivial.
2. Fetch/prune `origin`; inspect open issues, pull requests, branches, the active-work mirror, and relevant ADRs. Do not treat a clean local checkout as proof that no peer is working.
3. Claim one narrow issue and publish the intended branch, paths/interfaces, and owner. If a direct peer-agent channel exists, send the same handshake there.
4. For overlap in files, Unity scenes/prefabs/settings, schemas, or public behavior, obtain the other agent's acknowledgement and agree on ownership/order before writing. With no direct channel, use the GitHub issue/PR and stop on overlap until acknowledged.
5. Verify the GitHub account used to push to `origin`, then create a unique `<github-login>_<branch-name>` branch from current `origin/main`, following `docs/workflows/GIT_WORKFLOW.md#branch-naming`. Preserve unrelated and unknown changes. Keep commits single-purpose and update intent/docs/ADRs with behavior.
6. Validate proportionately, fetch again, compare open PRs and overlapping paths, then update from `origin/main` on the feature branch.
7. Open a PR linked to the issue. Include intent, non-goals, coordination, validation, risk, and visual evidence for visible Unity changes.
8. Immediately before merge, re-check remote state and peer work. Prefer squash merge. Never bypass checks, force-push another agent's branch, or resolve conflicts without understanding both intents.
9. Close the claim and leave a handoff or follow-up owner. Completion means another agent can recover what changed, why, how it was verified, and what remains.

## Reference repository boundary

`references/idp-unity-simulation` may be inspected only for UART receipt, framing, parsing, validation, and dispatch behavior. It is not a runtime dependency and must not supply gameplay, visuals, assets, scenes, or unrelated architecture. Read `docs/adr/0001-uart-reference-boundary.md` before using it.

## Blockers

Continue on demonstrably disjoint work when a peer is unreachable. Stop before overlapping edits or merges and report the exact issue, branches, paths, and proposed ownership split. Ask the humans only for decisions the repository evidence cannot settle.

For the compact, reusable handshake and integration checklists, read `references/coordination-protocol.md`.

# Research synthesis and parallel delivery intent

- Date: 2026-09-13.
- Requested by: Justin.
- Coordination: https://github.com/Cadastrophi/davinci-game-sim/issues/1
- Branch: `justin/pose-trainer-plan`; isolated local worktree.
- Outcome: inspect the `justin/` branches, combine both collaborators' research, present consequential questions, and only after answers produce two master prompts that delegate disjoint feature work to subagents and integrate incremental PRs.
- Current scope: research reconciliation and delivery design, not product or firmware implementation; no master prompts issued before the decision gate.
- Evidence: friend discovery at `4af68b6`, FOC reference addition at `4c533bc`, current local pose-trainer research and latest user hardware clarifications.
- Ownership: parent owns `docs/plans/RESEARCH_SYNTHESIS.md` and this file; research subagent owns `docs/references/FRIEND_RESEARCH_RECONCILIATION.md`; delivery subagent owns `docs/references/PARALLEL_DELIVERY_RESEARCH.md`.
- Shared-file boundary: preserve friend's branch and its overlapping CONTEXT, product intent, indexes and ADRs. A later documentation integration needs peer acknowledgement. Separate intent entry avoids concurrently appending the shared log; link/record it in that log during the acknowledged integration.
- Completion evidence: source inventory, contradiction matrix, recommended consolidated scope, bounded subagent ownership, incremental PR gates, and explicit unanswered questions. User answers and a reconciled baseline are dependencies of the final launch prompts.

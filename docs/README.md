# Documentation index

The documentation is the shared memory for humans and agents. Update it in the same pull request as the change it explains.

## Product and domain

- `PROJECT_INTENT.md` — goal, boundaries, success signals, and unresolved decisions.
- `../CONTEXT.md` — stable domain language.
- `intent/INTENT_LOG.md` — append-only record of requested outcomes and interpretation.

## Accepted launch

- [launch/SPEC.md](launch/SPEC.md) — accepted behavior and acceptance evidence.
- [launch/CONTRACT.md](launch/CONTRACT.md) — cross-team interface blueprint.
- [launch/COORDINATION.md](launch/COORDINATION.md) — ownership and integration gates.
- [launch/RUN_STATUS.md](launch/RUN_STATUS.md) — current run deadline, delivery constraints and status.
- [launch/README.md](launch/README.md) — immutable package provenance and master prompts.

## Working together

- `workflows/AGENT_WORKFLOW.md` — end-to-end task lifecycle and cross-agent handshake.
- `workflows/GIT_WORKFLOW.md` — branches, commits, pull requests, conflicts, and merging.
- `coordination/ACTIVE_WORK.md` — local mirror of active ownership; GitHub remains authoritative.
- `coordination/HANDOFF_TEMPLATE.md` — required context when work changes hands.

## Decisions and references

- `adr/README.md` — architectural decision records.
- `references/UART_REFERENCE.md` — permitted use of the reference submodule.
- `agents/` — configuration consumed by Matt Pocock's engineering skills.

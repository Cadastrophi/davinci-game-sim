# Documentation map

Choose a route based on what you need. Historical launch records preserve delivery context; [AGENTS.md](../AGENTS.md) defines the current operating contract.

## Evaluate the project

- [Award-track evidence](showcase/README.md) — Agentic Engineering cases, Computer Use evidence status and submission improvements.
- [Run the demo](launch/LOCAL_DEMO.md) — local setup, keyboard controls, drills and hardware connection.
- [Hardware evidence](hardware/INPUT_HANDOFF.md) — input integration and device checks still to record.
- [Evidence record template](showcase/EVIDENCE_TEMPLATE.md) — capture an actual agent/hardware session with provenance.

## Understand the product

- [Project intent](PROJECT_INTENT.md) — accepted direction, boundaries and remaining validation.
- [Domain language](../CONTEXT.md) — telemetry, requested/applied pose, rebase and measurement vocabulary.
- [Accepted specification](launch/SPEC.md) — required behavior and acceptance evidence.
- [Architecture decisions](adr/README.md) — durable choices, including the browser-stack transition.

## Work on the implementation

- [Agent operating contract](../AGENTS.md) — current local validation and PR integration rules.
- [Shared interface contract](launch/CONTRACT.md) — input/experience boundary.
- [Hardware handoff](hardware/INPUT_HANDOFF.md) — serial, mapping and source composition.
- [Component handoffs](handoffs/) — scoped ownership, APIs, validation and delivery limitations.
- [Intent log](intent/INTENT_LOG.md) — append-only record of requested outcomes.
- [Handoff template](coordination/HANDOFF_TEMPLATE.md) — context to preserve when ownership changes.

## Recover the build history

- [Launch package](launch/README.md), [launch coordination](launch/COORDINATION.md) and [run status](launch/RUN_STATUS.md) — original prompts, delivery gates and deadline-era context.
- [Agent workflow](workflows/AGENT_WORKFLOW.md), [Git workflow](workflows/GIT_WORKFLOW.md) and [active-work mirror](coordination/ACTIVE_WORK.md) — earlier coordination procedures and ownership snapshots. These retain issue/handshake requirements that were made optional by the current AGENTS.md; inspect live PRs for current work.
- [UART reference boundary](references/UART_REFERENCE.md) — permitted upstream use.
- [Agent configuration](agents/) — supporting configuration for applicable device-level workflows.

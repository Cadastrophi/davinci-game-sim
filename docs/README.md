# Documentation index

The documentation is the shared memory for humans and agents. Update it in the same pull request as the change it explains.

## Product and domain

- `plans/POSE_TRAINER_PLAN.md` — current design interview, browser preference, proposed drills, and hardware-dependent milestones; read before planning the trainer.
- `references/WEB_POSE_TRAINER_RESEARCH.md` — primary-source platform comparison and reference-access limitations.
- `references/ROBOT_KINEMATICS_AUDIT.md` — measured-from-source DH model, incomplete limits, Jacobian defects, and UART contract.
- `PROJECT_INTENT.md` — goal, boundaries, success signals, and unresolved decisions.
- `../CONTEXT.md` — stable domain language and architectural boundary.
- `intent/INTENT_LOG.md` — append-only record of requested outcomes and interpretation.

## Working together

- `workflows/AGENT_WORKFLOW.md` — end-to-end task lifecycle and cross-agent handshake.
- `workflows/GIT_WORKFLOW.md` — branches, commits, pull requests, conflicts, and merging.
- `coordination/ACTIVE_WORK.md` — local mirror of active ownership; GitHub remains authoritative.
- `coordination/HANDOFF_TEMPLATE.md` — required context when work changes hands.

## Decisions and references

- `adr/README.md` — architectural decision records.
- `references/UART_REFERENCE.md` — permitted use of the reference submodule.
- `skills/INSTALLED_SKILLS.md` — provenance of project-local agent skills.
- `agents/` — configuration consumed by Matt Pocock's engineering skills.

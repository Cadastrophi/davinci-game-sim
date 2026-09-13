# Agent operating contract

Agents handle Git mechanics for Justin. Preserve the reason for every non-trivial change and leave work recoverable.

## Read before acting

1. Read `CONTEXT.md`, `docs/README.md`, `docs/PROJECT_INTENT.md`, and relevant ADRs.
2. For writes, follow `docs/workflows/AGENT_WORKFLOW.md` and `docs/workflows/GIT_WORKFLOW.md`.
3. Use applicable device-level skills; do not download or commit skill packages into this repository.

## Scope and intent

- Append non-trivial requests, scope and acceptance evidence to `docs/intent/INTENT_LOG.md` before implementation.
- The active product is the Babylon.js/TypeScript/Vite browser teleoperation trainer. `docs/launch/SPEC.md` defines behavior; `docs/PROJECT_INTENT.md` defines current scope. Historical Unity plans, hackathon deadlines and two-master ownership gates do not govern new work.
- `references/idp-unity-simulation` is a UART ingestion reference only. Preserve ADR 0001; create original gameplay, visuals and architecture.
- Record consequential decisions as ADRs and unresolved product choices in the project intent.

## Integration

- Work locally on a unique feature branch from current `origin/dev`. Keep `dev` and `prod` free of direct development.
- Follow `docs/workflows/GIT_WORKFLOW.md` for naming, review, promotion and recovery. Inspect live issues/PRs for relevant context; claims and peer acknowledgements are not prerequisites.
- Preserve unknown edits and commits. Resolve actual conflicts by understanding both intents.
- Run proportionate local checks and review the complete diff before integration. Honor required remote checks. Production promotion requires explicit release scope and acceptance evidence.
- A request for questions before merge pauses integration until those decisions are resolved.

## Completion

Record implementation, validation commands/results, limitations, decisions and next action in the PR or handoff. For visible changes include browser evidence; distinguish mock evidence from hardware evidence. Keep commits single-purpose and never discard uncommitted work you did not create.

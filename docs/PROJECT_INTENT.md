# Project intent

## Captured request

Two collaborators are building at a hackathon using agents concurrently and do not intend to operate Git flows manually. The repository must make intent, ownership, coordination, branching, review, and merging explicit enough that agents can perform those mechanics safely.

The updated product direction is a position-and-orientation trainer for a physical seven-DOF robot controller. It should provide free practice and several short exercises with stronger graphics and environment quality than the existing prototype, taking inspiration from a da Vinci simulator and Aimlabs. The user prefers a web application; Unity is a historical assumption being reconsidered.

## Current phase

Research and design interview. See `plans/POSE_TRAINER_PLAN.md` for confirmed intent, proposals and open hardware decisions. Do not implement the game until explicitly requested.

## Goals

- Provide a durable source of truth for product intent and domain language.
- Make concurrent agent work visible and collision-resistant.
- Make every change traceable from intent to issue, branch, pull request, validation, and decision.
- Prepare Unity-specific skills and repository conventions for later implementation.
- Preserve the UART parsing knowledge from the reference repository behind a clean adapter boundary.

## Non-goals and boundaries

- Do not copy game systems, graphics, scenes, assets, or unrelated architecture from `references/idp-unity-simulation`.
- Do not treat “similar to da Vinci” as permission to copy proprietary assets, code, branding, or protected content.
- Do not commit Unity-generated caches or build outputs.
- Do not make raw UART framing a dependency of gameplay or presentation code.

## Early success signals

- Both agents can identify who owns each active task and which files are likely to change.
- Work reaches `main` only through a current, validated pull request.
- A new agent can recover the reason for a change from the issue, intent log, PR, and any ADR.
- UART input can eventually be translated into transport-independent simulation commands.

## Open product decisions

Record answers here or promote durable answers to ADRs before implementation:

- Exact da Vinci simulator/reference experience being targeted and which qualities matter most.
- Unity Editor version and render pipeline.
- Target hardware and operating systems.
- Robot arm model, degrees of freedom, limits, and expected UART command grammar.
- Required physical accuracy, latency, frame rate, and visual acceptance criteria.
- Asset sourcing and licensing strategy.
- Single-player, training, assessment, telemetry, and hardware-in-the-loop requirements.

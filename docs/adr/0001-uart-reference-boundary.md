# 0001 — UART reference boundary

- Status: accepted
- Date: 2026-09-13
- Owners: Justin / Codex

## Context

The existing `Charly2312/idp-unity-simulation` repository contains prior work that can inform how robot-arm UART commands are received and parsed. The new simulator is intended to improve substantially on the previous game's visuals and experience, so importing unrelated implementation would blur product direction and architecture.

## Decision

Include the repository as `references/idp-unity-simulation` Git submodule. Consult it only for UART receipt, framing, parsing, validation, and command-dispatch semantics. Treat it as evidence, not as a runtime dependency or source of game implementation.

Translate learned behavior into an independently designed adapter and transport-independent simulation command model. Any reused code must be separately justified, license-compatible, minimal, attributed, and explicitly reviewed; default to reimplementation from documented behavior.

## Consequences

- The submodule is available for traceability without entering the production dependency graph.
- Visuals, assets, gameplay, scenes, prefabs, and unrelated architecture are excluded.
- Changes to the submodule pointer require a PR explaining what UART behavior changed and why the new revision is needed.

# Intent log

Append one compact entry for each non-trivial task. Do not rewrite earlier entries; add a correction that points to the superseded entry.

## 2026-09-13 — Repository governance bootstrap

- **Requested by:** Justin
- **Outcome:** Establish agent-first documentation, project-local skills, concurrent Git workflow, GitHub collaboration, and a UART-only reference submodule.
- **In scope:** `AGENTS.md`, documentation boilerplate, skill installation and creation, Git/GitHub initialization, collaborator invitation, reference submodule.
- **Out of scope:** Any simulator/game implementation or adoption of unrelated code from the reference repository.
- **Assumptions:** Repository name `davinci-game-sim`; private visibility by default; `main` is integration-only; `Cadastrophi` represents Justin.
- **Acceptance:** Another agent can determine intent, claim work, choose a branch, coordinate overlap, prepare a PR, merge safely, and understand the submodule boundary without asking a human to operate Git.

## Entry template

- **Date / issue:**
- **Requested by:**
- **Outcome:**
- **In scope:**
- **Out of scope:**
- **Constraints:**
- **Assumptions needing confirmation:**
- **Acceptance evidence:**
- **Supersedes / superseded by:**

## 2026-09-13 — Browser implementation launch and shared documentation reconciliation

- **Date / issue:** 2026-09-13; [coordination #1](https://github.com/Cadastrophi/davinci-game-sim/issues/1), [D0 #3](https://github.com/Cadastrophi/davinci-game-sim/issues/3).
- **Requested by:** Justin; Master E reports the user's relayed Master H acknowledgement and instruction to continue.
- **Outcome:** Execute the accepted two-master browser launch with bounded workers and incremental reviewed PRs; reconcile the former Unity bootstrap wording before the common application baseline.
- **In scope:** Shared documentation, domain terms, accepted browser ADR and run status. Master E owns experience, contracts, app wiring and sole serialized integration; Master H owns input, calibration, mapping and providers.
- **Out of scope for D0:** Application code, firmware/device changes, peer research integration and edits to the original six launch-package files.
- **Constraints:** Preserve launch-v1 at package SHA `397f4fa661d604c1ecba0b1dda8d88d92ca77c65`, integrated through PR #2 at `aef2b6756d789d6205fc5a04f4b1d03e213e6996`. Modes 1–5 precede constrained interactive incision. Delivery is localhost for this run; deadline and feature freeze are recorded in [run status](../launch/RUN_STATUS.md). Preserve historical records and the UART-only reference boundary. ADR 0002 remains reserved for peer research.
- **Acceptance evidence:** Shared docs consistently direct agents to the accepted browser specification and current run status; local links and diff checks pass; independent review and Master E publication remain required.
- **Supersedes:** The Unity-only product direction and bootstrap-only phase in the earlier governance entry for current implementation. That entry remains the historical record of its task. The prompt-preparation intent remains in [launch README](../launch/README.md#intent-and-evidence).

## 2026-09-13 — P0 common browser baseline (#4)

- Requested by Justin: proceed with E implementation concurrently with H on the other device, without making the user operate agent acknowledgements.
- E publishes one renderer-independent facade and runnable localhost baseline; H consumes it and owns input implementation. Missing chat ACK does not block E development; compatibility remains a reviewed integration gate.
- Scope: package/build configuration, shared DTOs, labelled visual replay bootstrap, camera application helper and seed fixtures. No serial parser or calibration implementation, and no claims of delivered modes or live hardware acceptance.
- Validation: typecheck, fixture tests, production build and browser replay check; independent current-head review before merge.

## 2026-09-13 — Concurrent experience and input implementation (#7, #9, #10, #12)

- Justin requests continued Master E implementation alongside H on a separate device; agent coordination is not a user-operated prerequisite.
- H confirmed baseline 34baec7 and launch-v1.1 in issue #1. H owns serial (#8), mapping (#11), providers/facade (#13); E owns scene (#7), training (#9), UI (#10) and app composition (#12), plus serialized reviewed integration.
- App scope: route UI and focus/Space events through shared facades, use collision-applied pose for transitions, apply cumulative camera displacement once, and latch interruptions until deliberate resume. H owns raw mock/replay generation and calibration.
- Acceptance: independent slice reviews, deterministic lifecycle/collision/camera tests, typecheck/build and integrated localhost browser verification. Live hardware evidence remains pending on H's device.

App integration also owns the small UI selection seam after dashboard handoff: desired source controls which setup fields are shown; telemetry continues to report the actual connected/input source. Serial setup must be selectable before a port connection changes input provenance. Interactive mock keyboard controls use H's manual source and clock; E does not implement calibration or packet generation.

## 2026-09-13 — Constrained incision demonstration (#27)

The five core modes and input composition passed combined tests/build and independent reviews before incision work began. Implement the user's accepted limited seam demonstration: applied-tip contact along a finite20-segment50mm seam opens actual pre-tessellated geometry. Patch half-width15mm, surfacey18mm, contact corridorz±2mm and depth0–3mm are disclosed implementation defaults. Protected structures remain blocking; no cuts during pause/staleness/Space or across interrupted strokes. This is neither arbitrary mesh cutting nor a biomechanical model. E owns additive DTO/UI integration, training worker owns contact/progress, scene worker owns geometry. Enable only after tests and browser verification before06:31UTC feature freeze.

## 2026-09-13 — Shift controller recenter (#31)

User requests Shift held to recenter the controller only, freezing camera and applied instrument position/direction until release. Implement in E app routing using existing input pause/resume, without changing H input contracts. Shift takes precedence over Space; release rebases at the applied pose. Dwell/cutting and elapsed exercise time pause during recenter. Staleness, source changes, disconnect, blur or explicit pause cancel release-to-resume; both Shift keys and native setup typing remain correct. Verify real-facade no-jump behavior and keyboard/interruption cases.

## 2026-09-13 — Reliable home controls and visible UART stream (#33)

- **Requested by:** Justin.
- **Outcome:** Treat the raw pose held during Calibrate / set center as neutral at the simulator home pose; make Reset return the instrument and camera home; make Pause and Resume update reliably; expose the live UART/raw sample stream at the top right.
- **In scope:** App control anchoring and immediate command feedback, training reset pose ownership if required, compact raw-sample telemetry, focused tests, and operator documentation.
- **Out of scope:** UART framing/protocol changes, serial transmit, gameplay or scene redesign, and changes to #32's Shift-held recenter semantics.
- **Constraints:** Preserve the transport-independent input boundary and integrate after merged PR #32. A stale or missing sample must still prevent unsafe rebase/resume.
- **Acceptance evidence:** Deterministic red/green integration tests for center/reset and rapid pause/resume, formatter/UI evidence for live raw values, full tests/typecheck/build, and browser verification.

## 2026-09-13 — Local-first agent integration

- **Requested by:** Justin.
- **Outcome:** Remove issue-management and peer-acknowledgement gates; each device works independently, validates locally, opens a PR, reviews it, and immediately merges acceptable work into `main`.
- **In scope:** The root agent contract and its mandatory coordination skill.
- **Out of scope:** Application behavior, existing issue history, and unrelated active work.
- **Constraints:** Keep `main` integration-only, preserve isolated branches, require local validation and PR review, and resolve actual overlaps deliberately when they occur.
- **Acceptance evidence:** Future agents can complete independent local work without creating or managing issues, while every change still passes through a reviewed, passing PR before merge.
- **Supersedes:** The issue-claim, active-work mirror, and mandatory peer-handshake requirements in the 2026-09-13 repository governance bootstrap entry.

## 2026-09-13 — Single-arm first-person navigation presentation (#37)

- **Requested by:** Justin.
- **Outcome:** Replace the table/slab presentation in direction alignment, obstacle navigation, and camera/navigation with an original first-person anatomical cavity and one moving side-mounted surgical instrument.
- **In scope:** Static generated navigation backdrop, camera-space procedural single-arm viewmodel, mode-specific scene switching, existing interactive 3D targets/protected bounding boxes, focused scene tests, and visual provenance.
- **Out of scope:** Input/calibration contract changes, UI redesign, serial framing, new scoring or collision rules, arbitrary anatomy simulation, and changes to the incision table/slab or cutting geometry.
- **Constraints:** WASD/QE and arrow-key input continues through the existing manual source and input facade used by serial-driven simulation. The first-person arm is presentation-only; applied world pose remains the authority for scoring and collision.
- **Acceptance evidence:** Navigation modes enable the cavity/arm and hide the table instrument; arm movement follows applied pose; incision restores the table/slab; focused and full tests, typecheck/build, and browser walkthrough pass.

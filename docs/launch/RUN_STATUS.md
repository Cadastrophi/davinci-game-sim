# Launch run status

Updated 2026-09-13 for D0. [Issue #1](https://github.com/Cadastrophi/davinci-game-sim/issues/1) remains authoritative for live coordination. This file records operational updates without rewriting the original six launch documents.

## Current constraints

- **Delivery:** localhost on the hardware-connected computer for this run. This later user instruction supersedes the original package's HTTPS hosting deliverable for the current run. The actual browser must still expose serial access in its execution context, and the friend selects the device and performs live tests. Future hosting requires an existing authorized destination.
- **Deadline:** 2026-09-13 07:31 UTC (15:31 Singapore time).
- **Feature freeze:** 2026-09-13 06:31 UTC (14:31 Singapore time); reserve the final hour for integration and rehearsal. Calculate remaining time from the current clock, not a new five-hour budget.
- **Scope:** Modes 1–5 first; constrained contact-driven incision afterward only if core acceptance and the remaining time permit it.

## Coordination evidence

- Original package SHA: `397f4fa661d604c1ecba0b1dda8d88d92ca77c65`.
- Package integration: [PR #2](https://github.com/Cadastrophi/davinci-game-sim/pull/2), merged main SHA `aef2b6756d789d6205fc5a04f4b1d03e213e6996`.
- Master E reports the user's relayed H acknowledgement and instruction to continue. E remains sole merge coordinator; H owns input/calibration/mapping/providers. This records the source of acknowledgement without impersonating H.
- D0: [issue #3](https://github.com/Cadastrophi/davinci-game-sim/issues/3), `Cadastrophi_reconcile-web-intent`; shared-document reconciliation prepared for independent review and E publication.

## Remaining gates

P0 is not delivered by this documentation change. E/H must agree exact exported facades and seed fixtures, review the baseline and record the same merged baseline SHA before dependent writers start. Preserve the review and ownership gates in [COORDINATION](COORDINATION.md).

No live hardware success, working modes or measured performance are asserted here. Record those results with exact source SHA and distinguish mock/replay evidence from device observations as runnable increments arrive.

## Concurrent execution clarification

Justin clarified during implementation that E and H should build concurrently on separate devices and that the user should not operate agent acknowledgements. E publishes the shared baseline contract; missing chat ACK does not block E development. E retains sole merging, independent reviews, exclusive ownership and interface compatibility validation at integration. This supersedes pre-writing/pre-worker ACK requirements for this run; consumers use the published merged baseline SHA.

D0 merged in PR #5. P0 issue #4 establishes launch-v1.1 DTOs and a temporary labelled visual replay. The temporary provider has no calibration or serial behavior and is replaced when H's input facade lands.

## Implementation progress

H posted its own ACK in issue #1 and both lanes consume baseline `34baec7` / `launch-v1.1`. P0 merged through PR #6; original scene through PR #14 (`0ae4118`); free/reach and conservative collision through PR #15 (`9931063`). Dashboard PR #16 is reviewed; app composition #12 is in progress. Alignment #17 follows as its own reviewed increment.

Synthetic checks cover clock-driven staleness, cumulative camera displacement, applied-pose transition arguments, continuous dwell, swept translation/rotation collision, terminal results and stale async connection intents. These are not live-device acceptance. H reported no attached ttyACM/ttyUSB device; hardware verification remains pending.

Core modes are merged through navigation PR #21 (`3805bb2`). Serial PR #20 is merged at `6045b1f`; E independently ran parser/transport tests, typecheck/build and a combined current-main suite. H mapping/facade corrections are combined on E's app feature branch for verification, pending their PR integration.

App #12 now composes real H input with training/scene/UI. Independent app and UI reviews found no blockers; 141 combined tests pass and production build passes (Babylon chunk-size warning remains). Browser mock checks verified rendering, keyboard movement and serial-setup selection before connection. A real-facade integration test verifies world-pose freeze, idempotent cumulative pan, release direction/position rebase and explicit resume after staleness. See LOCAL_DEMO.md for operation. No live hardware result is asserted.

## Core delivery and revised priority

Core app PR #26 merged at `7d6de67`, including all five modes and H input mapping/facade PRs #22/#23. H was notified to fetch and run the localhost MVP before 06:00 UTC. At 05:55 UTC H relayed the user's revised priority: roughly 60 minutes remaining and an integrated hardware-testable MVP within 12 minutes (06:07 UTC). Core delivery met that integration target. Incision remains a separate increment and does not block hardware testing. Live device acceptance is still pending.

H reported at 06:02 UTC that its hardware-test checkout is pinned to merged `7d6de67`, all five modes and serial setup are visible, and typecheck/build pass. No device was detected; real controller connection/calibration remains pending. Keep that checkout stable during live testing.

## Incision verification

The sixth mode is enabled after independent training, scene and UI reviews. Combined 157 tests, typecheck and production build pass. Chrome mock walkthrough visibly opened 50% then 100% of the predefined seam; protected contact stopped the tool and Reset restored closed geometry/0% coverage. Browser console had no errors. The scene material was darkened after visual inspection to retain tissue color under the existing lights. This is a constrained pre-tessellated contact demonstration, not arbitrary cutting or clinical validation. Serial cleanup PR #25 merged at `71f7139` after independent 15-test transport verification.

## Shift recenter follow-up (#31)

User requested controller-only recenter on Shift. E app routing freezes camera and applied tool pose until release and rebases through the unchanged H input facade. Shift interrupts Space; stale/disconnected/focus-loss interruptions require explicit resume. Recenter pauses dwell, cutting and exercise time. Independent review found no blockers; all 168 tests and production build pass, including 11 focused real-facade/key-routing cases. This does not assert live hardware verification.

# 0003 — Browser training launch

- Status: accepted
- Date: 2026-09-13
- Owners: Justin and Jinyu; Master E integration, Master H input

## Context

The bootstrap described a future Unity simulator. The user subsequently settled a browser training experience and authorized the [two-master launch package](../launch/README.md), with modes 1–5 prioritized within the remaining hackathon time.

## Decision

Use Babylon.js, TypeScript and Vite with lightweight HTML/CSS UI. Keep receive-only telemetry, calibration and mapping behind H's renderer-independent input facade; E owns shared contracts, application wiring, rendering, training and sole serialized integration. The original six launch documents at `397f4fa661d604c1ecba0b1dda8d88d92ca77c65` define the accepted scope. Follow [run status](../launch/RUN_STATUS.md) for subsequent operational constraints.

## Consequences

The active implementation follows the browser stack rather than the historical Unity plan. Browser device access and actual-device validation become explicit acceptance gates. Rendering and scoring consume calibrated/applied game state, never raw UART framing. Reference use remains bounded by [ADR 0001](0001-uart-reference-boundary.md). Existing Unity skills and historical records remain available without dictating the current implementation.

## Alternatives considered

Continuing the Unity-only bootstrap plan conflicts with the user's settled browser choice. Importing the reference game's implementation conflicts with its UART-only boundary. Neither is part of this launch.

## Follow-up

Agree the exact P0 facade/fixtures with H, independently review and merge the baseline, then pin its merged SHA before dependent writing. ADR 0002 is reserved for peer research and is not replaced by this record.

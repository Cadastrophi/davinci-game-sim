# 0004 — Dev/prod workflow and durable work records

- Status: accepted
- Date: 2026-09-13
- Owner: Justin

## Context

Justin requested a working configuration, pre-merge questions, dev/prod branches and safe retirement of main. Concurrent-friend and hackathon constraints no longer apply.

## Decision

Use dev for integration and prod for reviewed releases. Preserve intent logs, validation, PR review and handoffs. Supersede the ownership/deadline portions of ADR 0003 and historical launch governance; retain the browser architecture and behavioral boundaries. Historical records remain evidence, not current instructions.

## Consequences

Feature PRs target dev. Production promotion preserves ancestry with a merge commit. Main deletion is conditional on the explicit migration gate in the Git workflow. Existing local-only commits remain recoverable until their integration decision is made. Outstanding hardware behavior and release-scope questions are documented before promotion.

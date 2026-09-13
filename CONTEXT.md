# Project context

## Purpose

Build a Unity-based simulator that approaches the visual clarity, environmental fidelity, and interaction quality associated with a da Vinci-style simulator experience. The current Unity prototype is considered too simple, particularly in graphics and presentation.

This document names the domain. Product intent and open questions live in `docs/PROJECT_INTENT.md`; durable technical decisions live in `docs/adr/`.

## Domain language

- **Simulator**: the Unity application being built in this repository.
- **Robot arm**: the physical or simulated mechanism controlled through commands.
- **UART command**: a serialized command received through the UART-facing input boundary.
- **Command parser**: the component that turns UART input into validated domain commands.
- **Command ingestion**: transport-facing receipt, buffering, framing, parsing, validation, and dispatch.
- **Simulation command**: a transport-independent, validated instruction consumed by simulation logic.
- **Reference repository**: `references/idp-unity-simulation`, used only to understand UART parsing and ingestion behavior.
- **Fidelity**: the agreed visual, spatial, physical, and interaction quality of the simulator; exact acceptance criteria remain to be defined.

## Architectural boundary

UART transport details must terminate at an adapter boundary. Simulation and presentation code should consume transport-independent commands, not raw serial bytes or assumptions copied from the reference repository.

## Current state

Repository governance, documentation, and skills are being established. Game implementation is intentionally out of scope for this bootstrap.

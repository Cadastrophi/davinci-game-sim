# Project context

## Purpose

Build a browser-accessible game that teaches the basics of teleoperation with a physical, single-hand pose controller and a virtual scalpel. The target experience takes functional inspiration from a da Vinci-style skills simulator while remaining an independently designed game.

This document names the domain. Product intent and open questions live in `docs/PROJECT_INTENT.md`; durable technical decisions live in `docs/adr/`.

## Domain language

- **Simulator**: the browser application being built in this repository.
- **Controller**: the fixed physical pose-sensing device connected through a USB-to-UART adapter.
- **Virtual scalpel**: the single simulated end effector controlled by the controller pose.
- **Software clutch**: the spacebar-held mode that freezes the virtual scalpel while the user repositions the controller, then rebases control without a jump.
- **UART command**: a serialized command received through the UART-facing input boundary.
- **Command parser**: the component that turns UART input into validated domain commands.
- **Command ingestion**: transport-facing receipt, buffering, framing, parsing, validation, and dispatch.
- **Simulation command**: a transport-independent, validated instruction consumed by simulation logic.
- **Reference repository**: `references/idp-unity-simulation`, used only to understand UART parsing and ingestion behavior.
- **Fidelity**: the agreed visual, spatial, physical, and interaction quality of the simulator; exact acceptance criteria remain to be defined.

## Architectural boundary

UART transport details must terminate at an adapter boundary. Simulation and presentation code should consume transport-independent commands, not raw serial bytes or assumptions copied from the reference repository.

## Current state

Repository governance is established. Product discovery for a five-hour browser prototype is captured in `docs/specs/TELEOP_SIMULATOR_DISCOVERY.md`; implementation has not started.

# Project context

## Purpose

Build a robot pose trainer for a physical seven-joint controller with six movable joints and a fixed final joint, with free practice and several short exercises inspired by a da Vinci-style simulator experience. Pose means position and orientation together.

This document names the domain. Product intent and open questions live in `docs/PROJECT_INTENT.md`; durable technical decisions live in `docs/adr/`.

## Domain language

- **Simulator**: the training application that displays controller movement and evaluates exercises.
- **Robot controller**: the physical seven-joint arm the learner moves to supply tool position and orientation; J6 is currently fixed.
- **UART command**: a serialized command received through the UART-facing input boundary.
- **Command parser**: the component that turns UART input into validated domain commands.
- **Command ingestion**: transport-facing receipt, buffering, framing, parsing, validation, and dispatch.
- **Simulation command**: a transport-independent, validated instruction consumed by simulation logic.
- **Reference repository**: `references/idp-unity-simulation`, used only to understand UART parsing and ingestion behavior.
- **Fidelity**: the agreed visual, spatial, physical, and interaction quality of the simulator; exact acceptance criteria remain to be defined.
- **Pose**: the position and orientation of a defined point/frame on the robot controller, relative to a defined reference frame.
- **Pose target**: a desired position and orientation together with tolerances defining successful alignment.
- **Free practice**: an untimed training mode for exploring the controller's movement and wrist rotation.
- **Dwell**: the continuous interval for which the measured pose remains within a target's required tolerances.
- **Training drill**: a short exercise focused on one or more controller skills, such as translation, wrist alignment, or combined pose acquisition.
- **Reachable pose**: a position-orientation combination produced by at least one permitted robot configuration; position alone is insufficient.
- **Robot configuration**: the seven joint coordinates, interpreted with the arm's calibration and any joint coupling.
- **Mechanical singularity**: a configuration where the robot loses instantaneous motion capability for the task being trained.
- **Pointing direction**: the unit vector along the calibrated instrument axis, independent of twist about that axis.
- **Axial twist**: rotation about the instrument's own pointing axis; excluded from initial scoring until complete orientation is validated.
- **Position-and-direction target**: a desired tool-tip position and pointing direction, with axial twist unconstrained.

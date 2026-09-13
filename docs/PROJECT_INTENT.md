# Project intent

## Captured request

Build a small browser game that teaches the basics of teleoperation. A single immutable physical controller reports six-degree-of-freedom pose data over a USB-to-UART adapter. The game maps that pose to a virtual scalpel and provides two exercises: move from point A to point B, then repeat while avoiding a collidable barrier.

The target is a hosted HTTPS link opened in Microsoft Edge on Windows 11, with immediate access to the real hardware for testing. Delivery is time-boxed to five hours and will be developed concurrently by two GPT-6 Astra agents on separate computers.

## Current phase

Discovery is captured for peer review and decomposition into two coordinated implementation prompts. Game implementation is explicitly authorized after the review confirms the shared requirements and ownership split.

## Goals

- Provide a durable source of truth for product intent and domain language.
- Make concurrent agent work visible and collision-resistant.
- Make every change traceable from intent to issue, branch, pull request, validation, and decision.
- Prepare implementation skills and repository conventions for later development.
- Preserve the UART parsing knowledge from the reference repository behind a clean adapter boundary.
- Connect to the hardware from Edge through Web Serial after an explicit user-selected device grant.
- Calibrate and map one controller to one virtual scalpel with predictable, low-latency motion.
- Use Space as a software clutch so the user can rebase the controller without a scalpel jump.
- Provide two complete navigation exercises with clear start, success, restart, connection, and collision feedback.
- Produce a transferable HTTPS URL that works on the Windows 11 test machine.

## Non-goals and boundaries

- Do not copy game systems, graphics, scenes, assets, or unrelated architecture from `references/idp-unity-simulation`.
- Do not treat “similar to da Vinci” as permission to copy proprietary assets, code, branding, or protected content.
- Do not commit Unity-generated caches or build outputs.
- Do not make raw UART framing a dependency of gameplay or presentation code.
- Do not claim clinical, credentialing, surgical-training, or commercial simulator equivalence.
- Do not add patient-side arms, dual controllers, hardware clutching, gripper mechanics, suturing, energy tools, user accounts, or backend services to the five-hour prototype.
- Do not modify controller firmware.

## Early success signals

- Both agents can identify who owns each active task and which files are likely to change.
- Work reaches `main` only through a current, validated pull request.
- A new agent can recover the reason for a change from the issue, intent log, PR, and any ADR.
- UART input can eventually be translated into transport-independent simulation commands.
- The user can select the USB serial device in Edge and see valid live poses at the configured baud rate.
- Calibration identifies neutral pose, usable axis mapping, and motion scale on the actual hardware.
- Holding Space freezes the virtual scalpel and releasing it rebases control without a jump.
- Exercise 1 completes by navigating the scalpel from A to B.
- Exercise 2 reports barrier contact while requiring a path around the obstacle to B.
- The deployed HTTPS link loads and connects on the target Windows 11 Edge browser.

## Settled constraints

- Audience: game users learning basic teleoperation in simulation.
- Hardware: one fixed hand controller; firmware cannot change; USB-to-UART adapter; immediate testing access.
- Stream shape: `[x, y, z, yaw, pitch, roll, 0]`; angles are degrees; the seventh field is a placeholder.
- Target: a hosted web application used in Microsoft Edge on Windows 11.
- Instrument: one virtual scalpel.
- Clutch: Space key, implemented in software.
- Exercises: direct A-to-B navigation and A-to-B navigation around a collidable obstacle.
- Schedule: five hours with two concurrent implementation agents.

## Open product decisions

Record answers here or promote durable answers to ADRs before implementation:

- Whether the first release needs visible material cutting or uses a scalpel only as the navigation instrument.
- Whether barrier contact blocks motion, records a penalty, or does both; and whether the tip, blade, or whole instrument collides.
- Whether reaching B is position-only or includes an orientation tolerance and dwell time.
- Whether Space freezes both position and rotation while held and whether the timer continues.
- XYZ units, coordinate handedness, axis directions, controller reference point, usable ranges, and intended virtual motion scale.
- Verification that `15600` is the exact serial baud rate and confirmation of data bits, parity, stop bits, and flow control.
- Visual quality threshold and asset sourcing within the five-hour limit.
- Final choice between Babylon.js and Three.js after peer review of proposed ADR 0002.

# Project intent

## Accepted direction

The project is an original browser teleoperation-training game with agents handling Git mechanics. The accepted implementation uses Babylon.js, TypeScript and Vite: an anatomical Aimlabs-style arena; one physical controller and one virtual knife. This supersedes the earlier Unity-only bootstrap direction. The complete behavioral authority is [launch-v1 SPEC](launch/SPEC.md). Historical delivery evidence lives in [RUN_STATUS](launch/RUN_STATUS.md).

## Current phase

Stabilize the repository configuration before new activities: audit issues and merge risks, integrate changes through dev, preserve prod as the accepted release, and retire main only after migration checks pass. No hackathon deadline or concurrent-collaborator workflow applies. Preserve historical intent and work evidence.

## Goals

- Deliver runnable, reviewed increments: free practice, reach-and-hold, direction alignment, obstacle navigation, then camera/navigation drills.
- Preserve fixed tool world pose during Space pan/dolly and resume through a no-jump rebase.
- Add constrained, contact-driven tissue separation/deformation after modes 1–5 work.
- Keep telemetry receipt/calibration independent from rendering, collision handling and exercise measurement.
- Record evidence separately for deterministic mocks, visible interactions and actual connected hardware.

## Boundaries

The application receives immutable hardware telemetry only. It does not command firmware, motors or haptics. Unavailable roll is not a measured orientation component; pose-only input does not establish joint-limit or singularity proximity. Virtual metrics are not physical-arm accuracy or clinical validation.

Only UART ingestion evidence may be taken from `references/idp-unity-simulation`; preserve [ADR 0001](adr/0001-uart-reference-boundary.md). Create original assets and scenes and record provenance for sourced/generated artwork. Raster artwork does not replace interactive cutting geometry. Keep generated caches/build outputs out of Git.

## Success evidence

Each usable increment has an exact source SHA, review and proportionate checks. Core acceptance includes camera invariants, fresh-input dwell, collision sweep/recovery, disconnect/reconnect and deliberate resume. A device operator records live checks; mocks do not satisfy hardware acceptance. Frame time, packet age/rate and visible latency are measured separately.

## Remaining validation and decisions

- Verify live packet shape, degree-angle units, serial settings, physical axes/reference point and direction mapping against the connected device. User-confirmed baud is 115200 and XYZ units are mm; roll is unavailable.
- Resolve the release questions in [merge readiness](workflows/MERGE_READINESS.md), including pitch sign and first-person navigation scope.
- Tune reachable targets, collision margins/hysteresis and exercise tolerances against observed behavior and noise.
- Record actual browser/OS performance and hardware evidence. Future hosted delivery needs an existing authorized destination; it is not the current localhost delivery gate.

Engine selection and mode priority are settled. ADR [0003](adr/0003-browser-training-launch.md) records the architectural transition.

## Current release decisions

Production feature promotion waits for hardware verification; hardware is unavailable. Keep pitch +1 and defer first-person navigation. Run existing automated tests and builds in CI for dev/prod, but do not add behavioral tests until their public boundaries are agreed. Local FOC-reference commits are rejected; preserve the reference checkout files untouched.

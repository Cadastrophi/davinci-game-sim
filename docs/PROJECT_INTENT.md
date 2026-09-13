# Project intent

## Accepted direction

Justin and Jinyu are building an original browser teleoperation-training game with agents handling Git coordination. The user authorized executing the two-master launch: Babylon.js, TypeScript and Vite; an anatomical Aimlabs-style arena; one physical controller and one virtual knife. This supersedes the earlier Unity-only bootstrap direction. The complete behavioral authority is [launch-v1 SPEC](launch/SPEC.md); current delivery/time constraints live in [RUN_STATUS](launch/RUN_STATUS.md).

## Current phase

Implementation is authorized. The launch package is integrated through [PR #2](https://github.com/Cadastrophi/davinci-game-sim/pull/2). D0 reconciles shared documentation; the common P0 application baseline still requires the exact interface/fixture acknowledgement and review gates in [COORDINATION](launch/COORDINATION.md) and [CONTRACT](launch/CONTRACT.md). The user's relayed H acknowledgement is recorded as such; it is not a substitute for exact baseline SHA acknowledgement.

## Goals

- Deliver runnable, reviewed increments: free practice, reach-and-hold, direction alignment, obstacle navigation, then camera/navigation drills.
- Preserve fixed tool world pose during Space pan/dolly and resume through a no-jump rebase.
- Add constrained, contact-driven tissue separation/deformation after modes 1–5 work and only within the remaining time.
- Keep telemetry receipt/calibration independent from rendering, collision handling and exercise measurement.
- Record evidence separately for deterministic mocks, visible interactions and actual connected hardware.

## Boundaries

The application receives immutable hardware telemetry only. It does not command firmware, motors or haptics. Unavailable roll is not a measured orientation component; pose-only input does not establish joint-limit or singularity proximity. Virtual metrics are not physical-arm accuracy or clinical validation.

Only UART ingestion evidence may be taken from `references/idp-unity-simulation`; preserve [ADR 0001](adr/0001-uart-reference-boundary.md). Create original assets and scenes and record provenance for sourced/generated artwork. Raster artwork does not replace interactive cutting geometry. Keep generated caches/build outputs out of Git.

## Success evidence

Each usable increment has an exact source SHA, review and proportionate checks. Core acceptance includes camera invariants, fresh-input dwell, collision sweep/recovery, disconnect/reconnect and deliberate resume. The hardware-connected friend performs live checks; mocks do not satisfy hardware acceptance. Frame time, packet age/rate and visible latency are measured separately. Master E owns sole serialized merging, with Master H reviewing shared input boundaries.

## Remaining validation and decisions

- Verify live packet shape, degree-angle units, serial settings, physical axes/reference point and direction mapping against the connected device. User-confirmed baud is 115200 and XYZ units are mm; roll is unavailable.
- Agree exact baseline facade signatures, units/axes, freshness thresholds, synthetic knife twist and immutable fixtures with H before dependent writers start.
- Tune reachable targets, collision margins/hysteresis and exercise tolerances against observed behavior and noise.
- Record actual browser/OS performance and hardware evidence. Future hosted delivery needs an existing authorized destination; it is not the current localhost delivery gate.

Engine selection and mode priority are settled. ADR [0003](adr/0003-browser-training-launch.md) records the architectural transition.

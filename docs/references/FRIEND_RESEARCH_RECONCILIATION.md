# Peer research reconciliation — 2026-09-13

Status: review findings, not an accepted product specification or implementation authorization. This note compares the peer discovery branch with the ongoing pose-trainer interview. Only this file was added by the research subagent; no branch, source, firmware, or remote state was changed.

## Evidence and precedence

- **Peer brief:** `origin/justin/simulator-discovery-brief`, verified HEAD `4af68b6f44bedc23dd76f81f24f0c085b31eb940`. Primary documents: `docs/specs/TELEOP_SIMULATOR_DISCOVERY.md`, `docs/adr/0002-browser-native-prototype-stack.md`, `docs/intent/INTENT_LOG.md`, `docs/coordination/SIMULATOR_DISCOVERY_HANDOFF.md`. The handoff identifies discovery-content commit `bfc919a`; HEAD also contains coordination metadata.
- **Current interview:** local, uncommitted `docs/plans/POSE_TRAINER_PLAN.md` and `docs/references/ROBOT_KINEMATICS_AUDIT.md` in `/tmp/davinci-pose-trainer-plan`, branch `justin/pose-trainer-plan`. These capture the user's latest answers: J3 independent; J6 fixed; firmware deliberately sends zero roll because no roll encoder; J4/J5 ±pi/4 from DH neutral; Aimlabs-style plus realistic anatomy; several exercises; five hours; Chrome/USB serial.
- **Archived hardware primary source:** `references/foc-motor-test` at `b1a857e3bc9985f3f8a7deab6ec1876dd57b7017`, directly inspected for this review. This is not proof of the flashed firmware.
- **Governance:** root `AGENTS.md`, `docs/workflows/AGENT_WORKFLOW.md`, `docs/workflows/GIT_WORKFLOW.md`, and project-local research/coordination skills. Parent coordinator owns tracker review, combined intent, and publication. This research subtask owns only the new findings file by direct assignment.

Neither branch's use of “user-confirmed” automatically settles a contradiction between conversations. Preserve the provenance and resolve materially incompatible requirements with the humans. A recommendation is not upgraded to an accepted decision merely because it appears in an ADR.

## Agreements worth carrying forward

Both investigations support a five-hour browser-native prototype, one physical pose-input controller over USB serial, transport-independent game logic, simulated/replay input for parallel development, calibration before meaningful control/scoring, and a clean boundary excluding browser motor commands. Both keep Unity reference use limited to UART ingestion and reject proprietary assets, surgical-competence claims, advanced tissue physics, and a patient-side robot. Both recommend disjoint input-versus-experience ownership, an explicit shared contract, early live-hardware testing, and small milestones. These are a substantial common baseline, not two incompatible projects. Sources: both planning documents' scope, architecture, milestones, and coordination sections.

## Material differences and resolution proposals

| Topic | Peer brief at 4af68b6 | Current interview/planning | Reconciliation |
| --- | --- | --- | --- |
| Runtime | Hosted HTTPS on Windows 11 Edge, hardware available immediately | Chrome with USB-to-TTL; web preferred | Compatible technically; confirm which real machine/browser is the acceptance target. Keep desktop Chromium scope and early HTTPS probe. |
| Engine | TypeScript/Vite/Babylon.js/native HTML; ADR explicitly **proposed** | TypeScript/React/R3F/Three.js **proposed** | Choose one once; no accepted engine exists. Renderer/library choice can be delegated to the coordinator if humans agree; do not build both. |
| Visual promise | Neutral training workspace prioritizing legibility | Explicit Aimlabs plus realistic surgical/anatomical setting | Plain gray-box alone does not meet the current art direction. Use one original anatomically styled field with readable training overlays; no tissue simulation required. |
| Tool | One virtual scalpel, cutting unresolved | No clamp/pinch; proposed symmetric metallic probe | Blade implies meaningful axial orientation and collider extent unavailable in current telemetry. Recommend round probe/navigation instrument unless humans specifically retain a scalpel. |
| Exercises | Two A→B tasks; second introduces barrier/collision | Free practice plus several short position-and-orientation drills | Can combine free practice, reach-and-hold, approach alignment, and obstacle navigation, but final count and orientation gate need agreement. |
| Firmware | “Cannot be changed” is user-confirmed in peer record | Full FK orientation/joint telemetry suggested as future option | Treat immutable firmware as current implementation constraint pending explicit correction. Do not make a firmware upgrade a hidden prerequisite. |
| Pose availability | “Fixed six-degree-of-freedom input device”; roll displayed | Six movable joints, fixed J6, transmitted roll unavailable | Correct shared language: six movable joints, five meaningful reported pose components. Do not construct a supposedly measured full orientation by treating zero roll as real. |
| UART | User-supplied 15600 baud; exactly seven bracketed numbers; degrees; seventh ignored; no required CR | Archived source 115200 baud, mm/degrees, newline, nominal output interval | Live-device contract outranks archived defaults. Keep baud configurable; verify actual connection. Bracket framing accommodates optional newline and arbitrary chunking. XYZ physical units remain unverified on device. |
| Mapping | Relative anchored mapping plus Space clutch | Physical pose matching, score before display magnification, reachability limits | Clutch changes the task: virtual navigation across rebases is not absolute physical pose reproduction. Separate virtual-task scores from physical workspace claims. |
| Obstacle behavior | Proposed blocking plus contact episodes, blade/tip sweep | Primarily target/direction gates; physical path feasibility | Decide visual penalty versus blocking. Blocking with a non-haptic controller creates requested/applied divergence. Do not silently equate collision detection with physical feedback. |
| Joint diagnostics | No joint packets and immutable firmware | DH sampling and live singularity/limit diagnostics desired | Offline model exploration can remain research. The demo cannot reliably claim current configuration-specific warnings from this pose packet alone. Curated comfortable targets are a feasible provisional fallback. |

Sources: `TELEOP_SIMULATOR_DISCOVERY.md` sections User-confirmed constraints, Observed hardware stream, Proposed software-clutch semantics, Exercises, Visual and interaction scope, Open decisions; local `POSE_TRAINER_PLAN.md` Answers received, Fixed J6 revision, Scoring, Workspace, Milestones.

## Hardware facts rechecked against primary source

1. Archived FK reads seven joint angles and applies all seven transforms: `references/foc-motor-test/lib/forwardKinematics/forwardKinematics.cpp:61–108` at `b1a857e3`. The J6 transform is pure `Rz(q6)` at line 77. Full matrix orientation extraction is ZYX at lines 120–123. Therefore fixed J6 and zero Cartesian Euler roll are not synonymous. User-reported forced-zero behavior differs from this archive.
2. Archived output prints XYZ, yaw/pitch/roll converted to degrees, literal seventh zero, and a newline: the same file at lines 143–154. Serial baud is 115200 in `include/boardConfig.h:83`. This corroborates field order and degree semantics, but does not invalidate the peer's actual-device claim of 15600. The device must settle baud.
3. Source DH distances are documented as millimetres in `include/kinematicsConfig.h:53–57`; FK position is the resulting matrix translation. The unused identity end-effector transform at lines 83–88 and FK chain termination do not establish an actual probe-tip offset. Physical XYZ units, reported point, axis map, and tool offset must be validated on the current assembly.
4. Peer sample `[232.54, -4.51, 130.12, 170.32, 45.93, 0.00, 0]` contains exactly 47 ASCII characters. At the assumed 8-N-1/15600 setting, payload transmission is `47*10/15600 = 30.13 ms`, maximum `33.19 packets/s` before delimiters/extra output. The arithmetic is correct; the 8-N-1 setting and actual rate are not independently measured. This makes an unverified p95 latency promise below 50 ms particularly risky.
5. For ZYX orientation, the transformed local +X axis is `(cos(yaw)cos(pitch), sin(yaw)cos(pitch), -sin(pitch))`, independent of Euler roll. A physical tool pointing along +Z generally requires the missing roll component. A browser may define a five-component virtual mapping, but must not advertise it as verified physical shaft orientation unless calibration establishes that interpretation. Sources: FK Euler extraction above and current plan's explicit convention analysis.

No hardware execution, serial measurement, firmware modification, or new workspace certification occurred in this review.

## Important cleanup before producing executable prompts

- Consolidate `POSE_TRAINER_PLAN.md` rather than handing its contradictory old and superseding sections to implementers. It still contains keyed-roll targets/full-quaternion scoring, a simpler chamber, optional firmware proposals, and scoring ownership in both workstreams despite the newer direction-only revision.
- Keep ADR 0002 proposed until one stack is selected, then update outdated Unity-only context consistently. Do not mechanically merge two competing purpose statements.
- Remove “six-degree-of-freedom input” as a telemetry guarantee. Include explicit capability/validity semantics; unavailable roll is not a measured angle.
- Separate `physical position`, `calibrated controller position`, `requested virtual pose`, and `applied virtual pose`. Document how clutch, scaling, smoothing, collision blocking, scoring, and target feasibility use those spaces.
- Give every shared contract, app entrypoint, package/lockfile, deployment config, and shared stylesheet exactly one custodian. Mock/replay fixtures belong to that contract baseline, not independent divergent copies.
- Specify subagent ownership inside each master owner's scope. More agents should mean more independent deliverables/tests/assets, not concurrent edits to the same feature branch. Merge one reviewed, current PR at a time through one integration owner.

## Minimal human decision frontier

Ask these compactly after presenting the combined recommendation; do not reopen confirmed J3 independence or unavailable-roll facts.

1. **Product reconciliation:** Should the first release be one anatomical Aimlabs-style scene, a round probe, free practice plus reach/align/barrier drills, rather than the peer's neutral scalpel-only two-exercise scope? Recommendation: anatomical probe version, no cutting; gate alignment scoring on a truthful direction mapping.
2. **Control fidelity and immutable firmware:** Is firmware definitely frozen for this demo, and is a calibrated yaw/pitch virtual direction acceptable if actual physical shaft direction cannot be reconstructed? Recommendation: frozen firmware, honest virtual pointing semantics where necessary, no axial-twist scoring or live singularity/limit claims; prioritize physical direction calibration before choosing fallback.
3. **Demo hardware:** Is Windows 11 Edge + hosted HTTPS now the acceptance environment, and can someone verify the supplied 15600 setting plus XYZ units/axes against a short movement capture? Recommendation: editable baud starting with supplied value, bracket parser, first-hour real-device gate; do not require the human to guess an Euler convention.
4. **Interaction defaults:** Confirm Space freezes position+orientation/rebases on release while timer runs, and choose whether barrier contact is penalty-only or physically blocks the virtual instrument. Recommendation for schedule and non-haptic clarity: contact feedback plus one penalty per contact episode, no cutting, avoid blocking unless explicitly desired.

J3 ranges, fixed J6 angle, and remaining DH validation are necessary for a validated model-based workspace feature, but need not block the read-only browser demo if that feature is explicitly deferred. Engine selection can be presented as one coordinator recommendation rather than another lengthy human questionnaire.

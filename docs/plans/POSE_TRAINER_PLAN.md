# Robot pose trainer — design interview and provisional plan

Status: discovery; 2026-09-13. User preferences are recorded below. Engine, scoring thresholds, and schedule remain proposals until the interview resolves them. This document authorizes no game or firmware implementation.

## Captured intent

Build a visually polished training environment inspired by Intuitive's simulator and the feel of Aimlabs. The existing robot arm has no pinching/clamping end effector. Train tool position and wrist orientation together, with free practice and scored target exercises. Account for physical joint limits, reachable poses, and singular configurations. The user prefers a web application and requests a platform comparison and implementation plan.

References supplied by the user:

- https://learning.intuitive.com/program-details?programId=3522
- https://www.youtube.com/watch?v=teRQr2qquJA

Direct browser inspection confirmed the linked program's broader simulator curriculum and the video's box-like peg/ring training scene. See the research note for the specific observations and their limits.

## Answers received

- **Physical input:** the user confirms a real, moving seven-DOF robot arm controller emitting XYZ/yaw/pitch/roll over UART. Plan around that existing pose stream. The referenced firmware controls four motors locally; this is not assumed to be an unpowered device.
- **Demo breadth:** the user chooses several short training exercises. Propose free practice plus three short drills built on shared scoring and target-generation primitives.
- **Delivery constraints:** five hours; Chrome; USB serial-to-TTL adapter connected to the physical robot controller. Main concern is achieving a good-looking 3D environment.
- **Visual direction:** Aimlabs-style presentation combined with realistic surgical anatomy. Proposed implementation: one anatomically styled operative field, metallic probe, realistic tissue materials and lighting, plus clean target overlays and fast drill feedback. Deformable tissue mechanics are not established requirements.
- **Hardware update:** J0–3 form the serial linkage; J4–6 form the gimbal. J4 and J5 each have a usable range of ±pi/4 relative to their DH-neutral positions. J6 is fixed. The user reports XYZ/yaw/pitch telemetry with roll always zero.
- **Further hardware clarification:** J3 moves independently. Roll is explicitly replaced with zero in the running firmware because there is no roll encoder. This is unavailable telemetry, not a measured zero orientation.
- **Still open:** usable J3 range, fixed J6 angle, physical pointing-axis convention, scored tool point, and whether joint telemetry or complete FK orientation can be emitted.

## Revision — fixed J6 and direction-only training

This revision supersedes all earlier requirements below for roll-specific keyed targets or full-quaternion orientation scoring. The demo recommendation is a five-component task: tool-tip position (three components) and pointing direction (two), with no score for axial twist until the orientation pipeline is validated. This is a task definition, not a claim that the mechanism has exactly five independent movable joints. J3 is confirmed independent, so the current mechanism has six movable joints and one fixed joint. The source-model geometric Jacobian for J0–5 has rank six at an illustrative configuration with q6=0; physical range coverage remains unverified.

Use a circular halo with a target normal/cone, an axially symmetric probe and a short axis guide. Measure angular error as `acos(clamp(dot(actualDirection, targetDirection), -1, 1))` for unit directions. Preserve direction sign so pointing backward is not rewarded. Require both tip distance and pointing-angle tolerance during dwell. Quaternion orientation may still be useful for rendering or deriving the axis when a complete valid rotation is available; full quaternion distance is not the score for this task.

Yaw/pitch can define direction only with an agreed frame/axis convention. For standard ZYX Euler angles and a local +X pointing axis, direction is `(cos(yaw)*cos(pitch), sin(yaw)*cos(pitch), -sin(pitch))`, independent of Euler roll. The source's final J6 rotation is about local Z, so do not assume that firmware Euler roll, J6 rotation and axial probe twist mean the same thing. Confirm or explicitly remap the physical pointing axis. A substituted zero roll may discard information needed to reconstruct a local +Z tool axis.

Fixing J6 does not generally make FK-derived world-frame Euler roll zero. The archived FK calculates roll from the complete rotation matrix. An illustrative matrix calculation with q=[0.2,0.8,0.5,0.3,0.2,0.1,0] radians produces Euler roll≈9.654 degrees despite q6=0; this establishes the distinction algebraically, not feasibility of that configuration on current hardware. The user confirms the running firmware substitutes zero. Treat that field as unavailable, not a real angle. If J6 is locked at a known calibrated angle and the six movable joints are measured, complete FK orientation is computable without a J6 encoder. Emit that orientation, a calibrated unit tool-direction vector, or measured joints with the locked-angle configuration rather than guessing missing orientation.

Proposed firmware contract: preserve measured q0–q5, substitute the actual fixed q6 in the kinematic model, apply calibrated DH/base/tool transforms, and derive position plus quaternion (or direction) from the resulting matrix. Never equate an absent J6 encoder with zero Cartesian roll. Validate several physical poses before enabling complete orientation scoring. No firmware edit has been authorized or performed in this planning session.

Drill adaptations: reach-and-hold in an operative field; align the probe to a tissue target normal; traverse a short series of position-and-direction gates through an anatomical corridor. Optional later tracing exercise follows a surface with approach-angle guidance. Tasks needing independently controlled axial twist, such as keyed insertion or controlled curved-needle driving, are outside this demo's scored capability.

For workspace sampling hold J6 at its actual locked angle, apply J4/J5 bounds in DH-neutral coordinates, and convert carefully to the firmware's calibrated joint coordinates using its fixed offsets. Do not apply ±pi/4 to raw encoder values or to global yaw/pitch. Resolve J3 constraints, then assess the Jacobian of the chosen position-and-direction task (maximum rank five) and filter model-feasible targets and transitions. A missing scored roll dimension is not itself a task singularity.

Reference for joint count versus task rank: [Modern Robotics, singularities](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-3-singularities/).

## Hardware findings that affect the plan

The firmware reference at `b1a857e3bc9985f3f8a7deab6ec1876dd57b7017` emits `[x,y,z,yaw,pitch,roll,0]` in millimetres and degrees, newline-delimited at 115200 baud. It attempts pose output on intervals greater than 10 ms; this is not a measured delivery-rate guarantee. The last zero is not a gripper measurement or seventh-joint angle.

One Unity parser (`MouseWoundTest.cs`) assumes incoming radians and converts to degrees. Another (`KnifeMovement.cs`) expects seven fields. Both serial-processing calls are commented out at the pinned Unity revision. Therefore agree an explicit wire contract with the firmware actually on the device; do not silently inherit the Unity unit assumption. Transport/legacy-parser evidence is in `../references/UART_REFERENCE.md`; detailed motor-model findings are in `../references/ROBOT_KINEMATICS_AUDIT.md`.

Declared joint bounds (radians) are J0 [-0.785, 0.785], J1 [-0.006, 1.600], J2 [0.004, 2.627]. J3 has equal lower/upper bounds at -0.751; J4–6 have no active bound declarations. Their meaning and hardware correspondence need confirmation. The existing Jacobian computes only three columns and disagrees with the FK chain. A reliable full workspace map or singularity boundary cannot yet be calculated from these incomplete constraints.

Continue initial pose visualization and scoring using the existing UART stream. For initial targets, a manually curated comfortable-pose library can be a provisional fallback, with transitions checked on the actual arm. Adding calibrated q0–q6, sequence and sample timestamps enables accurate configuration-specific diagnostics later.

## Current recommendation, pending answers

Use a desktop browser application with TypeScript, a small React shell, and Three.js through React Three Fiber. Use a fixed camera for the first exercise and an original, clean training chamber: strong depth cues, restrained floor grid, soft shadows, a visible tool tip, and an asymmetric target that communicates roll as well as pointing direction. Judge success by pose acquisition and stability, not clicking or grasping.

Use direct Web Serial for a USB-connected Chrome/Edge demo if the device enumerates as an accessible serial port. Retain a transport boundary for replay and a later localhost bridge. Keep rendering independent of telemetry arrival; keep scoring tied to fresh timestamped measurements rather than a smoothed display. Physical motor control remains on the existing controller unless a later explicit design expands that boundary.

## Product sequence

1. **Connection and calibration:** select the input, show sample age and quality, establish the physical reference frame and tool-tip offset, then verify axes and rotations against a known pose. Calibration is a required dependency of meaningful scores.
2. **Free practice:** move through the training chamber with optional trail, reference axes, comfortable-workspace overlay, and orientation guide. Use no timer or punitive scoring. Provide an input replay for development and demonstration fallback.
3. **Reach and hold:** acquire a sequence of positions and remain within a generous orientation range while dwelling. Teach translation and steadiness first.
4. **Wrist alignment:** hold the tool position in a comfortable region while matching changing keyed orientations. Choose positions and rotations from verified feasible poses so this drill does not demand impossible decoupling.
5. **Pose circuit:** acquire successive targets requiring both position and full orientation, then hold both tolerances continuously for a short dwell. Display the two errors and dwell progress separately. A later extension is continuous tracking through oriented gates after segment-crossing and swept-path scoring are defined.
6. **Results:** expose completion time, positional accuracy, angular accuracy, dwell stability, misses, and tracking outages. Add a composite score only when the underlying metrics and difficulty bands are meaningful.

Target orientation must be visible: a sphere alone cannot communicate rotation, and a round ring cannot communicate roll. Start with an arrow and a keyed notch/flat, paired with a ghost tool. If the physical task treats an axis as symmetric, score the equivalent orientations rather than arbitrarily penalizing the user.

## Provisional scoring contract

For positions in one calibrated frame, position error is the Euclidean distance between actual and target tool-tip position. For normalized quaternions, angular error is `2 * acos(clamp(abs(dot(q_actual, q_target)), 0, 1))`. The absolute value makes `q` and `-q` equivalent. Avoid subtracting Euler-angle components: wraparound and representation singularities can produce misleading scores.

A target completes only when both errors remain below their tolerances for the whole dwell interval and measurements stay fresh. Early usability candidates are 10 mm, 10 degrees, and 0.5 seconds; these are tunable proposals, not measured hardware capability or accepted requirements. Use hysteresis to reduce boundary flicker. A stale/disconnected stream interrupts dwell and suspends scoring.

Keep physical and display scale distinct. Score physical errors before any display magnification. A large virtual chamber must not imply that the user can physically reach beyond the calibrated workspace.

## Workspace and singularity plan

1. Establish one canonical robot model: DH convention, all variable-joint transforms, calibrated angle signs/offsets, base transform, actual tool transform, and units. Preserve firmware provenance in the hardware note.
2. Obtain every usable joint interval and any coupling, mechanical stop, cable, table-clearance, or self-collision restriction. A declaration in source code does not prove that firmware enforces it or that it matches this physical assembly.
3. Validate FK against measured reference poses. Validate a full tool Jacobian with finite differences in both position and rotation, using the same calibrated model.
4. Sample legal joint configurations, evaluate FK, and record full reachable poses with their generating configurations. This produces feasible position-orientation pairs; independently sampling XYZ and arbitrary rotation does not.
5. Filter configurations by limits, clearance, and Jacobian conditioning. Normalize translation versus rotation with an explicit characteristic length before comparing singular values or condition numbers. Evaluate the Jacobian for independent movable coordinates if joints are locked or coupled.
6. Use well-conditioned configurations with generous limit margins for initial exercises. Add difficult but feasible regions only as a separate progression choice. A workspace sample cloud approximates coverage; it is not an exact boundary or a collision certificate.
7. Check a continuous permitted joint-space path between target configurations. Two individually reachable poses can lie on disconnected feasible routes or require crossing a collision/limit/singularity region. For early trials use nearby validated configurations around a known comfortable start.

A mechanical singularity is loss of task-motion rank in the robot Jacobian. An Euler-angle singularity is a coordinate representation problem. A hard stop is a separate joint-limit problem. The interface must distinguish them. Current XYZ plus Euler telemetry cannot uniquely recover joint configuration for this redundant chain, so it cannot reliably reveal live limit margins or singularity proximity; joint telemetry is required for those features.

The audited DH model already yields a positional singularity at calibrated elbow q2≈68.7621 degrees, within the declared J2 interval, and another when the wrist centre lies on the base axis. The derivation is recorded in the hardware audit. These are model-only findings; the full physical workspace and wrist-orientation restrictions remain unverified.

## Milestones and decision gates

### Five-hour build allocation (proposal)

| Elapsed time | Graphics/training agent | Input/kinematics agent | Joint integration gate |
| --- | --- | --- | --- |
| 0:00–0:25 | Lock camera, art direction and one arena composition | Verify a recorded/live packet, units and calibration | Shared pose type and replay fixture agreed |
| 0:25–1:30 | Build arena materials, lighting, shadows, tool and readable targets using replay | Connect Web Serial; validate parsing, axes, rotations and freshness | Real physical motion drives tool by 1:30 |
| 1:30–2:45 | Free practice and three drills using shared targets/dwell engine | Scoring math, current-packet behavior; validated target library; joint diagnostics only if confirmed model/telemetry allow | Complete playable session |
| 2:45–4:00 | Tune composition, target readability, tool highlights, feedback, audio and results | Test reconnect, recorded regressions, target feasibility, performance and failures | Full hardware demo rehearsal |
| 4:00–5:00 | Fix observed usability/visual issues | Fix observed integration failures | Feature freeze, second rehearsal, replay fallback |

The arena is shared across modes. A curated palette, bevelled original geometry, good material response, a fixed view and useful shadows are the main visual investment. Avoid spending the deadline on a full robot mesh, soft-tissue physics, multi-arm interactions or a second renderer. These are exclusions proposed for the five-hour scope, not claims about what the engines can do.

The initial browser screen should show the full arena with a compact timer/score band, drill name and two distinct positional/angular feedback indicators. Keep packet/DH diagnostics in a development panel. Confirm the proposed environment and visible tool before implementation.

| Milestone | Deliverable | Evidence needed to proceed |
| --- | --- | --- |
| Hardware contract | Confirmed signals, transforms, limits, tool frame and operating mode | Several recorded poses match physical measurements |
| Input proof | Browser displays a coordinate frame from live or recorded telemetry | Stream rate, sample age, disconnect behavior and end-to-end latency measured on demo laptop |
| Training slice | Practice and one reachable pose target in a simple chamber | Target can be acquired repeatedly; quaternion scoring and dwell behave correctly |
| Reachability | Validated FK/Jacobian and constrained target library | Numerical checks plus manually validated target sequences |
| Visual polish | Lighting, depth cues, keyed orientation targets, restrained feedback | Novice can explain the target orientation and complete an exercise |
| Demo readiness | Repeatable session, result summary and replay fallback | Full session on target hardware; reconnect and input-loss checks |

Performance proposals: sustained 60 FPS on the demo laptop and measured input-to-display latency below 50 ms at the 95th percentile. These are acceptance candidates, not browser guarantees. Record sensor sampling, serial transport, parsing and rendering delays separately when possible.

After agreement, split two-agent implementation by stable contracts: one owns the browser training scene, UI and scoring; the other owns telemetry adapters, calibration and pure kinematics. Agree on timestamped pose/joint sample types and coordinate frames first. Both can develop against the same replay fixtures. Serialize changes to shared contracts and integration configuration.

## First interview round

- **Q1 — Physical interaction:** answered: real moving seven-DOF controller, XYZ/yaw/pitch/roll UART input.
- **Q2 — Demo promise:** answered: several short exercises; proposed trio is reach-and-hold, wrist alignment, and a combined pose circuit, plus free practice.
- **Q3 — Delivery constraints:** answered: five hours, Chrome, USB serial-to-TTL adapter; graphics quality is the main concern.
- **Q4 — Hardware declaration:** confirm the current assembly and supply missing usable joint limits or couplings after the repository audit identifies exactly what is absent.

Next frontier issued: Q4 visual direction (precision lab / reference box / anatomy); Q5 actual J3–6 ranges, J3 coupling and confirmation of J0–2 bounds; Q6 feasibility of adding calibrated joint telemetry; Q7 visible/scored tool point. Question numbering in the chat supersedes the older first-round numbering above.

Later questions depend on these answers: camera/virtual-tool mapping, tool-tip reference, rotation symmetry, tolerances, assisted learning versus assessment, target selection, progression and scoring weights. No engine ADR is accepted during this first round.

## Coordination

Work is isolated on `justin/pose-trainer-plan` in a separate Git worktree. The original checkout was on `justin/add-foc-motor-reference` when inspected. Remote fetch succeeded; GitHub UI showed zero open issues and zero open PRs at inspection. The connector cannot access this private repository. This round creates local planning documents only; a shared issue/PR should accompany publishing once the interview scope is settled. Existing hardware-reference branch and submodules are unchanged by this planning work.

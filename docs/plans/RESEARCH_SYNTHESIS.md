# Simulator research synthesis and launch decision gate

Status: proposed synthesis, awaiting user answers. Date: 2026-09-13. No product implementation or final launch prompts are authorized by this document. Coordination: [issue #1](https://github.com/Cadastrophi/davinci-game-sim/issues/1).

This is the review entry point combining both discovery tracks. Where the older local plan contradicts this synthesis, use this document's explicit decision statuses; neither document turns an unresolved recommendation into an accepted requirement. After answers, consolidate the shared product docs and ADRs in an acknowledged PR before feature agents start.

## Latest clarification — mode selection in progress

This section supersedes conflicting earlier recommendations and unanswered-question entries below; it records Justin's follow-up after the first synthesis.

- **Accepted:** Babylon.js + TypeScript + Vite; firmware cannot be modified; browser only receives controller telemetry; actual baud is **115200**, XYZ units **mm**. Hosting account and final hardware acceptance browser still need an operational handoff; acceptance of the stack is not a named deployment credential.
- **Tool:** either tool is acceptable, including a knife/scalpel. Cutting is unnecessary in navigation modes but must be visible/functionally present in a cutting mode. Cutting fidelity and whether it is a must-have in the five-hour release remain decisions.
- **Space behavior:** Justin specifies camera control, not merely a frozen-camera rebase: while held, controller motion adjusts the camera with the instrument world pose fixed; on release, the camera remains fixed and controller motion drives the instrument. Rebase the instrument mapping on release to avoid a jump. Instrument screen position can change when the camera moves even though its world pose is fixed. Camera pan/dolly/orbit mapping and a separate controller-recenter gesture remain unresolved.
- **Reference terminology:** the Intuitive da Vinci Si manual distinguishes camera control from master clutching: camera control redirects masters to the endoscope; master clutching repositions masters while instruments stay still. Preserve the requested Space-as-camera-control behavior rather than copying the older rebase-only proposal. Source: [manufacturer manual hosted by the Johns Hopkins dVRK project](https://dvrk.lcsr.jhu.edu/downloads/manuals/davinci-si-user-manual.pdf), footswitch panel section. Search-extracted manual text was available; full PDF fetch exceeded the tool size limit.
- **Haptics evidence:** source motors run (`src/main.cpp:322–333`), and contact/piercing/cutting impedance states exist (`include/impControlConfig.h:7–33`). However initialization (`main.cpp:287`), `loopImpControl()` (`:337`), and motor-current application (`:339–353`) are commented out. Impedance input uses `Serial` (`lib/impControl/impControl.cpp:89`), not the telemetry's `Serial2`; custom Commander registrations are commented despite an active command loop. This archive does not demonstrate a live game-feedback path. Given the confirmed receive-only contract, game-triggered motor feedback is out of scope; visual/audio feedback and existing device-local resistance are distinct. No hardware writes or tests performed.
- **Git observation:** a fresh fetch now shows `origin/main` at `ed8d460`, updating authenticated-account branch naming. Earlier repository-state table is the initial inspection snapshot. Future prompts must use the current account-based convention and current baseline, not a stale branch prefix or SHA.

### Proposed six-mode lineup (not yet accepted)

| Mode | Player task | Scored evidence / scope |
| --- | --- | --- |
| Free practice | Explore tool motion and Space camera control | No competitive score; calibration/status/optional trail |
| Reach and hold | Acquire successive target locations and dwell | Time, positional error, steadiness; position-only entry level |
| Direction alignment | Align a virtual instrument direction at a target | Pointing error and dwell; no axial-roll score, gated on honest validated mapping |
| Obstacle course | Navigate through a short anatomical corridor around protected structures | Completion, path length and contact episodes; blocking vs penalty still open |
| Camera and navigation | Reposition camera with Space to locate the next target, then resume tool control | Complete sequence, clutch transitions and no-jump control; tool remains fixed in world during camera adjustment |
| Incision tracing | Draw a prescribed superficial incision with a virtual knife on a practice tissue patch | Path coverage/deviation, permitted-depth/contact rules and visible persistent cut track; no claim of realistic tissue mechanics or haptic cutting |

Recommended priority: first five modes built from shared navigation primitives; incision tracing as the next slice unless user makes cutting a must-have. Full arbitrary mesh slicing, separating/deforming tissue, bleeding and physical cutting-force feedback are not implied by a visible incision track.

Current interview frontier: select mandatory versus stretch modes and incision fidelity; define Space camera mapping and whether a separate rebase-only gesture is wanted; settle obstacle penalty/blocking. Implementation prompts remain gated until this round is resolved.

## Evidence inventory and repository state

| Source | Revision and content | Authority / limitation |
| --- | --- | --- |
| Friend discovery | `origin/justin/simulator-discovery-brief` at `4af68b6f44bedc23dd76f81f24f0c085b31eb940`; discovery content commit `bfc919a`; [brief](https://github.com/Cadastrophi/davinci-game-sim/blob/4af68b6f44bedc23dd76f81f24f0c085b31eb940/docs/specs/TELEOP_SIMULATOR_DISCOVERY.md), [ADR 0002](https://github.com/Cadastrophi/davinci-game-sim/blob/4af68b6f44bedc23dd76f81f24f0c085b31eb940/docs/adr/0002-browser-native-prototype-stack.md), handoff, intent | Research branch records its own user-confirmed requirements and a live sample; not hardware measurements by this reviewing agent. Babylon ADR is proposed. |
| Justin planning | Local `justin/pose-trainer-plan` based on `af0d598`; [interview](POSE_TRAINER_PLAN.md), [web research](../references/WEB_POSE_TRAINER_RESEARCH.md), [hardware audit](../references/ROBOT_KINEMATICS_AUDIT.md) | Uncommitted research includes latest direct user answers. Older keyed/full-roll scoring paragraphs are superseded, not current requirements. |
| Hardware reference branch | `justin/add-foc-motor-reference` at `4c533bc`; local `main` at `64afb7d` includes reference and closure metadata | Local main is two commits ahead of fetched `origin/main` (`af0d598`). These changes are not assumed available to the other computer. Preserve and integrate through reviewed PRs, not a direct main push. |
| Firmware source | `references/foc-motor-test` at `b1a857e3bc9985f3f8a7deab6ec1876dd57b7017` | Archived implementation, not necessarily flashed firmware. Use for model/protocol evidence only; no firmware edits in this phase. |
| Unity source | `references/idp-unity-simulation` at `82355ee9af89de9c26101af1f07744565ddcc88c` | UART ingestion evidence only, under ADR 0001. No gameplay/scene/asset reuse. |
| Independent audits | [Reconciliation](../references/FRIEND_RESEARCH_RECONCILIATION.md), [parallel delivery](../references/PARALLEL_DELIVERY_RESEARCH.md) | Bounded research subagents; recommendations, not launch instructions. |

Fetched all origin branches before review: the only remote `justin/` branch was the friend discovery branch. Other `justin/` branches above are local. GitHub UI showed zero open issues and PRs before creating issue #1. The connector could not access this private repo; authenticated browser inspection succeeded. No peer branch or shared file was changed by this synthesis.

## Agreed foundation

- A browser-based, single-controller teleoperation learning game; original presentation inspired by da Vinci training and Aimlabs, not a clinical simulator or a claim of surgical competence.
- One physical controller, no clamp/gripper requirement, read-only browser telemetry. Existing motor control remains in the device; the browser sends no movement commands.
- Five-hour implementation target and two masters on separate computers, with subagents for disjoint tasks.
- Bracketed text `[x,y,z,yaw,pitch,roll,placeholder]`, angles in degrees, final field semantically unused. Frame across arbitrary serial chunks, tolerate whitespace/newlines, reject malformed or non-finite packets, and bound buffers with resynchronization.
- Live samples from friend's brief have roll `0.00`; Justin confirms firmware deliberately sends zero because the roll encoder is absent. Represent orientation availability explicitly; zero is not measured physical roll.
- J0–3 serial linkage, J3 independently movable, J4/J5 each ±pi/4 from DH neutral, J6 physically fixed. Six movable joints do not imply that the transmitted packet contains a complete measured orientation.
- Freshness-aware scoring, explicit calibration, replay/mock input, visible connection diagnostics, and real-device testing early.

## Differences and recommended resolution

| Topic | Discovery tracks | Proposed resolution / remaining gate |
| --- | --- | --- |
| Renderer | Local: Three.js/R3F/React. Friend: Babylon.js/Vite/TypeScript/native UI. Neither accepted. | Recommend Babylon.js/Vite/TypeScript for one game-oriented scene and barriers. One renderer and build configuration; do not run two scaffolds. User may veto; no graphics quality guarantee follows from engine choice. |
| Browser / delivery | Local: USB-connected Chrome. Friend: hosted HTTPS link on Windows 11 Edge with hardware immediately available. | Treat Windows Edge as hardware acceptance target and Chrome as development support, pending confirmation. First deployed serial probe in 45 minutes. |
| Visual direction | Latest Justin: Aimlabs plus realistic surgical anatomy. Friend: neutral training volume. | Preserve explicit anatomical direction: one original anatomically styled field with readable targets and lighting. Neutral boxes are only a diagnostic fallback, not the final visual goal. |
| Tool | Local: symmetric probe recommendation. Friend: user-selected scalpel. | Ask which visible tool. Scalpel can be a navigation prop without cutting; no score requiring unmeasured axial blade twist. |
| Exercises | Local: free practice plus position/direction exercises. Friend: A→B and A→B around obstacle. | Combine into free practice, reach-and-hold, barrier navigation, and a short direction-alignment drill gated on validation. This meets several-exercise intent through shared primitives. |
| Firmware | Local: optional later telemetry upgrade. Friend: immutable firmware. | Recommend immutable firmware for this build. Complete FK orientation/live joint diagnostics are not demo dependencies without measured joints. |
| Orientation scoring | Local: direction-only after mapping validation. Friend: orientation displayed, position-only level 1, full six-DOF wording. | Position-only first exercise; enable direction drill only with a validated mapping. Declare unobserved axial rotation; synthetic visual attitude is not physical measurement. |
| Baud / units | Archived firmware: 115200, mm, degrees. Friend: supplied 15600; XYZ units unconfirmed. | Keep baud editable and verify real connection settings. Do not overwrite live-device contract with source assumptions. Confirm mm before reporting mm accuracy. |
| Framing | Archived firmware newline; friend says CR not required. | Bracket extraction works with or without newline/CR. No clarification needed solely to choose framing. |
| Clutch / reachability | Friend: Space rebase. Local: physical absolute workspace/pose practice. | Recommend clutched virtual navigation. This changes the training metric: virtual targets can be reached across rebases; the physical DH cloud is not the virtual scene boundary. Confirm intended training mode. |
| Collision | Friend proposes blocking, contact episodes, blade/tip volume and swept tests. Local had no collision decision. | Recommend conservative tip/short-shaft capsule, stop virtual penetration, count continuous contact once, and show requested vs applied pose. No simulated physical resistance or cutting. Needs approval with tool choice. |

Babylon supplies scene/rendering and collision-related facilities, but our swept moving/rotating tool tests and gameplay response still need explicit design and validation. [Official specifications](https://www.babylonjs.com/specifications/). Web Serial selection requires user activation, and `getPorts()` lists previously granted ports rather than granting new devices. Read chunks are not packet boundaries. [Official Web Serial guide](https://developer.chrome.com/docs/capabilities/serial).

## Hardware and kinematic conclusions

The archived FK is standard DH with positions in mm, angles internally in radians and emitted Euler angles in degrees. The Unity parser's radians assumption must not propagate into this app. Source paths and tables are recorded in the hardware audit.

Known fixed J6 can be a constant in FK if all six movable joint angles are measured. Fixing J6 does not guarantee world-frame Euler roll is zero. Our model calculation reaches rank six at an illustrative J0–5 configuration, but does not establish physical limits or observable roll in the current packet. Firmware emitting zero loses information; neither adding quaternions nor calibration can recover arbitrary missing orientation without additional assumptions/data.

Under standard ZYX, yaw/pitch determines a local +X axis without roll; it does not generally determine the source model's local +Z shaft direction. Choose and validate an honest virtual pointing mapping, or label orientation drills unavailable. Do not claim full physical instrument alignment based on two angles and a substituted zero.

The archived Jacobian omits transforms/offsets and leaves columns uninitialized. It cannot supply correct live full-pose singularity diagnostics. The source-model positional singularities include calibrated q2≈68.7621 degrees and wrist-centre radial distance rho=0; those are analytical model results, not device safety guarantees. DH-neutral offsets, actual J3 limits, fixed J6 angle, tool reference point and forbidden regions remain incomplete.

With immutable pose-only firmware, defer live joint-margin and singularity warnings. Optional offline model visualizations must be labelled model-only. Use comfortable calibration and user-verified target paths for the demo. Missing J3/J6 details block validated physical-workspace features, not all virtual navigation work. Software clutch permits rebasing and therefore decouples the virtual arena from the absolute physical workspace.

## Proposed common contract before feature work

One baseline PR defines the renderer/scaffold, test commands, immutable fixtures and versioned interfaces. The input master specifies hardware semantics; the experience/integration master is sole shared-file writer after peer acknowledgement.

Contract must distinguish:

- Raw samples: source identity, decoded values/units, monotonic receive time; no fabricated device timestamp or sequence number. A local sequence may exist if labelled as local.
- Calibrated requested pose: virtual position, supported direction/attitude representation, validity/capability fields, source freshness, calibration revision and clutch state.
- Applied pose: final game pose after collision response; requested pose remains available for mismatch feedback.
- Exercise state: timers/dwell, pause/resume, contact episodes and metrics. Gameplay owns these; serial code does not.
- Mapping configuration: axis/sign mapping, input versus virtual units, tool offset, calibration and clutch anchors. Rendering scale is separate.

Scoring uses applied unsmoothed pose, valid input and the chosen coordinate space. Report virtual path metrics as virtual rather than claiming physical mm when units/mapping are unconfirmed. Stale/disconnected/hidden-page input interrupts dwell; resume requires deliberate rebase. Simulated fixtures are labelled simulated and cannot satisfy the live-hardware acceptance gate.

## Proposed master/subagent structure

Master names are role labels, not branch prefixes; the final prompts map each role to Justin or Jinyu explicitly. Identity and branch ownership come from the actual publishing account.

| Role | Exclusive scope after baseline | Delegation |
| --- | --- | --- |
| Experience master, sole integrator | App entrypoint, shared contracts, package/lock/build/deploy/CI config, top-level docs and composition | Coordinates/reviews; may delegate one shared-file task with exclusive ownership, never competing writers |
| Experience: scene worker | `src/scene/**`, `public/assets/anatomy/**`, associated scene tests | Anatomy, lighting, camera, visible tool/targets; no exercise state or serial access |
| Experience: training worker | `src/training/**`, associated tests | Exercises, collision response, target lifecycle, dwell/scoring; consumes contracts |
| Experience: UI worker | `src/ui/**`, associated UI styles/tests | Menus, instructions, connection display, HUD/results; invokes master-wired APIs |
| Input master | `src/input/index.ts`, input integration and hardware acceptance records | Reviews input workers, owns physical calibration validation |
| Input: serial worker | `src/input/serial/**`, parser/transport tests | Permission lifecycle, bracket framer, validation, disconnect/diagnostics |
| Input: mapping worker | `src/input/mapping/**`, mapping tests | Axes/units, capabilities, calibration, clutch, requested-pose publication |
| Input: fixtures/geometry worker | `src/input/sources/**`, `tests/fixtures/input/**`, `src/kinematics/**` if approved | Mock/replay source, adversarial packets; kinematics only as explicitly scoped model work |

Use at most three active workers per master initially, bounded by actual tool slots. These are useful parallel tasks, not a requirement to fill slots. Masters prioritize integration and review. Workers must not recursively spawn uncontrolled pools, broaden file ownership, update dependency files, or merge main. When an environment shares a filesystem, each coding worker gets an isolated branch/worktree and one narrow issue/PR. If worktrees are unavailable, serialize writers; read-only reviewers may still work concurrently.

The shared GitHub coordination issue, not chat memory or a locally edited ACTIVE_WORK file, is the cross-computer authority. Every claim records owner, branch, expected paths, contracts and baseline SHA. Both masters acknowledge the initial split. Check at task start, before changing an interface, before push, before review and before merge; silence never approves an overlap. Continue disjoint work when blocked. Reassign ownership explicitly rather than editing another worker's files.

## Incremental PR and demo sequence

| Slice | Dependencies | Visible result and acceptance |
| --- | --- | --- |
| 0. Reconciled docs + minimal baseline | User answers, peer acknowledgement, reviewed reference/doc reconciliation | One stack, contract fixtures, scripts, CI and deployment arrangement. Remote main contains the agreed baseline; no competing scaffolds. |
| 1. Replay-driven anatomical scene | Baseline | Hosted or local preview shows tool, targets and readable depth cues; replay labelled as such. Scene worker can progress while serial work runs. |
| 2. Live serial connection | Baseline; integrator wires input facade | Actual Windows/Edge device selection, valid packet rate/age, editable settings, error recovery. Target ≤45 minutes from build start. |
| 3. Calibration + clutch + free practice | Live transport and scene | Hardware drives the virtual tool, no release/reconnect jump, axis checks recorded. |
| 4. Reach-and-hold + result screen | Applied-pose contract + free practice | Repeatable exercise end to end; no stale-data dwell credit. |
| 5. Barrier navigation | Tested reach primitive + collision tests | Cannot tunnel through defined obstacles; continuous contacts counted once, requested/applied mismatch legible. |
| 6. Direction drill + final polish | Orientation validation for drill; other polish independent | Direction exercise only if truthful mapping passes; otherwise visible unsupported status. Full live rehearsal, reconnect, performance evidence and replay fallback. |

Each row may contain small independently testable PRs, not one giant master branch. Branch new slices from current origin/main after dependencies merge; avoid long stacked branches under squash merges. Both masters coordinate reviews; only the experience integrator merges after fresh peer review and checks on the current PR head. Review does not mean one agent approving its own work under the same account; if account policy blocks formal approval, preserve explicit peer evidence and obey required checks without bypassing them.

Serialize merges and shared-file integration, not all implementation. Re-fetch immediately before every merge; integrate current main into the feature branch; rerun relevant tests; stale reviews/changes need re-review. No worker force-pushes another's branch or blindly resolves conflicts. A clean Git merge alone is not a successful integration: exercise/replay/serial contract tests must pass. Keep main runnable after every PR and record the preview/deployment commit for each visible slice.

Early stop conditions: no real input by the first gate reduces optional scope; it does not turn replay into hardware evidence. Missing orientation validation disables that scored mode. Missing hosting authority leaves a local build and a precise deployment blocker, not a falsely claimed URL. Do not buy assets, change firmware, or alter device safety settings to meet the deadline.

## Questions to resolve before the two launch prompts

1. **Game scope/tool:** Keep the explicit Aimlabs/anatomical direction. Use friend's scalpel (navigation only, no cutting), or a round probe? Recommended mode set is free practice, reach-and-hold, obstacle navigation, and validated direction alignment.
2. **Training mapping:** Is this clutched virtual teleoperation rather than strict reproduction of absolute physical poses? Recommend Space freezes position and rotation; release rebases without a jump; timer continues during intentional clutching, while disconnect/focus loss pauses and requires safe resume.
3. **Hardware/observability:** Is firmware immutable for this demo? If yes, accept no axial-roll scoring or live joint/singularity claims, with direction scoring gated on an honest validated mapping. Can XYZ units and the reported physical point/axis be supplied, or should the first hardware milestone establish them?
4. **Actual serial/target:** Confirm Windows 11 Edge as the hardware acceptance target (Chrome also supported for development), the actual baud rate (friend says 15600; source says 115200), and serial framing settings. Keep settings editable; do not infer from a packet alone.
5. **Collision behavior:** Recommend a conservative tip/short-shaft capsule, blocking virtual penetration plus one penalty per contact episode, and a visible requested-pose ghost; does that match the intended exercise? No physical force feedback is produced.
6. **Stack/deployment:** Accept Babylon.js + TypeScript + Vite and one static HTTPS build? Which existing deployment account/host can the integrator use? Do not create paid resources or claim authorization from a research note.

Actual J3 bounds and fixed J6 angle remain recorded but are deferred unless validated workspace analysis is required in the five-hour release. No need to delay basic rendering/virtual navigation on these facts once the product scope is accepted.

## After answers

Record accepted decisions, obtain peer acknowledgement for overlapping shared docs, and publish one reconciled specification/baseline. Only then produce two launch prompts with exact role-to-human assignment, baseline SHA, issue links, exported contracts, worker boundaries, PR gates, deployment procedure and stop conditions. Prompt files should reference that source of truth rather than duplicate divergent schemas. User asked for prompts after clarification, not execution of them during this review.

# Teleoperation simulator discovery brief

## Purpose of this document

This is the handoff source for the agent that will review the findings and generate two master prompts for two GPT-6 Astra subscriptions working on separate computers. It records user-confirmed facts, research findings, recommendations, risks, acceptance evidence, and unresolved decisions. The reviewer should not need the original conversation.

## Product goal

Create a small game for learning basic teleoperation in simulation. The game uses a physical, single-hand pose controller as a fixed six-degree-of-freedom input device. A hosted browser application maps the live pose to one virtual scalpel.

This is an independently designed game inspired by the functional shape of a da Vinci-style Skills Simulator experience. It is not intended to reproduce the commercial software internally, control a real patient-side robot, teach a surgical procedure, or establish clinical competence.

## Reference-system translation

The reference video is `Davinci surgical skills simulator overview`: <https://www.youtube.com/watch?v=teRQr2qquJA>. Sampled frames show physical master controls and foot controls driving wristed virtual instruments inside exercise environments. The video does not reveal the proprietary internal software architecture and had no accessible transcript during research.

Published descriptions say the commercial Skills Simulator attaches as a backpack to a da Vinci Si or Si-e surgeon console and permits virtual practice without the patient-side cart or physical instruments. It provides physics-based virtual exercises and quantitative performance measurements. Relevant exercise categories include instrument manipulation, camera and clutch control, needle control, suturing, energy/dissection, and multi-arm integration.

Sources:

- Intuitive Skills Simulator overview: <https://manuals.intuitive.com/systems_i_a/skills_simulator>
- Pilot study describing the backpack, exercises, and measurements: <https://pmc.ncbi.nlm.nih.gov/articles/PMC3771788/>
- Current SimNow product overview: <https://www.intuitive.com/en-us/products-and-services/da-vinci/learning/simnow/library>

The functional translation for this project is:

| Reference function | This project |
| --- | --- |
| Surgeon master controls | One custom pose controller |
| Console-to-simulator link | USB-to-UART adapter exposed through Web Serial |
| Simulator backpack | Hosted browser game running locally in Edge |
| Wristed virtual instruments | One virtual scalpel controlled by pose mapping |
| Physical clutch | Hold Space to freeze and rebase controller mapping |
| Foot/camera/grip controls | Omitted from the five-hour scope |
| Exercise library | Two original navigation exercises |
| Commercial score and curriculum | Simple transparent timing, path, and collision feedback |

## User-confirmed constraints

- The purpose is a game for learning basic teleoperation in simulation.
- There is one controller and one virtual scalpel.
- The controller firmware cannot be changed.
- The controller acts like a fixed spatial mouse and reports position and orientation.
- There is no hardware clutch. The Space key will act as a software clutch.
- Exercise 1 moves the scalpel end effector from point A to point B.
- Exercise 2 moves from A to B around a barrier and detects object collision.
- The deliverable must be a hosted web application link transferable to a Windows 11 machine and opened in Microsoft Edge.
- The Windows hardware is available for immediate testing throughout implementation.
- The page needs a way to select a USB serial device, refresh device availability, and connect at `15600` baud as supplied.
- The stream is text-based and has no required carriage-return ending.
- The implementation window is five hours.
- Two GPT-6 Astra subscriptions on two separate computers will work concurrently.

## Observed hardware stream

The user provided this live output:

```text
[232.54, -4.51, 130.12, 170.32, 45.93, 0.00, 0]
[232.54, -4.54, 130.12, 170.26, 45.93, 0.00, 0]
[232.54, -4.23, 130.12, 170.43, 45.90, 0.00, 0]
[232.54, -4.51, 130.12, 170.32, 45.89, 0.00, 0]
[232.54, -4.54, 130.12, 170.26, 45.92, 0.00, 0]
```

Authoritative field order supplied by the user:

```text
[x, y, z, yaw, pitch, roll, placeholder]
```

- Orientation units: degrees.
- Seventh field: currently `0` and has no gameplay meaning.
- Position units: not yet confirmed.
- Packet text visibly includes `[` and `]`; these delimiters can frame packets even without CR or newline.

Serial reads return arbitrary byte chunks. A single read may contain part of a packet or multiple packets. The adapter should therefore accumulate decoded text, extract complete text between `[` and `]`, retain an incomplete suffix, and parse only complete seven-number packets. It should tolerate whitespace, reject non-finite values, report invalid-packet counts, and never allow malformed input to block rendering.

At 8-N-1, the provided 47-character sample takes approximately 30.1 ms to serialize at 15,600 baud. That implies a theoretical ceiling near 33.2 packets per second before other bytes and overhead. Render at the display frame rate while consuming the newest complete pose. Do not create fake precision through aggressive interpolation. Measure the real update rate and visible latency during the first hardware test.

### Conflict with the upstream UART reference

The permitted upstream investigation in `docs/references/UART_REFERENCE.md` records a different protocol: `x,y,z,yaw,pitch,roll` with millimetre positions and radian orientation, plus a separate seven-field variant where the last value can mean camera control. It also records a particular axis remap and a 115200-baud default.

Those details are not this hardware contract. Specifically:

- Do not convert these already-degree angles from radians.
- Do not interpret the seventh value as a camera flag.
- Do not copy the upstream axis mapping or first-packet origin behavior without calibration evidence.
- Do not silently substitute the upstream 115200 baud for the user-supplied 15600 baud.
- Do not copy upstream gameplay, scenes, assets, or architecture.

## Browser serial behavior

The Web Serial API is a direct fit for a USB-to-UART adapter exposed by Windows as a serial port. The deployed page must run in a secure context, normally HTTPS.

Required interface behavior:

1. Detect `"serial" in navigator` and give a clear unsupported or policy-blocked message when absent.
2. Provide an explicit **Add / Connect device** button. Its click handler calls `navigator.serial.requestPort()` so Edge can show the device chooser.
3. Provide **Refresh permitted devices** using `navigator.serial.getPorts()`. Refresh cannot authorize an unseen device; the user must use the chooser once for a new device.
4. Open the selected port with the configured baud rate. Start with `15600`, display it, and make it editable for hardware diagnosis.
5. Show connection state, valid packet rate, last valid pose, invalid packet count, and a useful disconnect/error message.
6. Listen for serial connect/disconnect events and safely cancel/release the reader when closing.
7. Pause pose application on disconnect or page focus loss. Reconnect and recalibrate/rebase deliberately so the scalpel cannot jump.
8. Keep the serial layer read-only for this prototype; the game has no requirement to send controller commands or firmware updates.

Known deployment risk: Microsoft Edge enterprise policy may block the Serial API for all sites or selected sites. Test the actual Windows browser and organization policy in the first milestone.

## Recommended architecture

Proposed ADR 0002 recommends TypeScript, Vite, Babylon.js, WebGL, native HTML/CSS controls, and Web Serial. This is a proposed decision for peer review.

```text
USB controller
  -> Web Serial byte stream
  -> text accumulator and bracket framing
  -> seven-number packet parser and validation
  -> hardware-independent RawPose sample
  -> calibration + coordinate conversion + software clutch
  -> requested virtual pose
  -> scalpel control and swept collision
  -> exercise state, feedback, metrics, and rendering
```

Suggested module contracts:

- `SerialTransport`: permission, open/close, read loop, device events, and status only.
- `BracketPacketFramer`: turns arbitrary decoded text chunks into complete packet strings.
- `PosePacketParser`: converts exactly seven finite values into `RawPose`; ignores the placeholder semantically.
- `PoseCalibration`: neutral sample, axis map/signs, position scale, rotation alignment, and range display.
- `ClutchedPoseMapper`: maps raw pose to requested virtual pose and rebases on Space release.
- `ScalpelController`: applies requested pose and exposes tip/blade collision geometry.
- `ExerciseController`: explicit states for instructions, calibration, ready, running, success, paused, and results.
- `Metrics`: elapsed time, controller or tool path length, collision contact episodes, and completion.

The gameplay layer must depend on `RawPose` or a calibrated pose, never on serial strings or browser-port objects. A keyboard-driven simulated pose source should implement the same interface so both agents can work and validate without monopolizing the hardware.

## Proposed software-clutch semantics

Pending user confirmation:

- On Space-down, freeze virtual position and rotation at the current scalpel pose.
- While Space remains held, continue observing hardware samples but do not move the scalpel.
- On Space-up, record the current controller pose as the new raw anchor and the frozen scalpel pose as the new virtual anchor.
- Subsequent controller deltas start from those anchors, avoiding a jump.
- The exercise timer continues while clutching, matching the idea that clutch use costs task time.
- Disconnect or loss of window focus freezes control and requires an explicit safe resume/rebase.

## Exercise definitions

### Exercise 1 — Reach the target

Required core:

- Clear point A/start state and point B/goal volume.
- One visible virtual scalpel controlled by the calibrated pose.
- Start, reset, pause/disconnect, running, success, and result feedback.
- Elapsed time and scalpel-tip path length.

Recommended completion rule pending confirmation: the scalpel tip remains inside B for 0.5 seconds. Orientation is displayed but is not required for success in the first level.

### Exercise 2 — Navigate around a barrier

Required core:

- Reuse the same controller, calibration, scalpel, camera, and goal logic.
- Place a visible barrier so the direct A-to-B route is obstructed.
- Detect contact and expose clear visual feedback and a collision metric.

Recommended collision rule pending confirmation: use a deliberate blade/tip collision volume, block penetration, highlight the contact, and count one error for each continuous contact episode. Check the swept path from the last applied pose to the requested pose so a thin obstacle cannot be skipped between serial samples. If blocking causes the physical pose to diverge from the applied scalpel pose, show a faint requested-pose marker or otherwise make the mismatch legible.

## Visual and interaction scope

The five-hour prototype should prefer legibility over asset volume:

- Fixed or gently angled perspective camera with strong depth cues.
- Neutral training workspace, clear A/B markers, obvious barrier, readable scalpel silhouette, contact highlight, and minimal status overlay.
- Simple original/generated geometry and materials. Do not use da Vinci logos, trade dress, proprietary models, recorded interface assets, or copied scenes.
- Desktop layout for Edge. Mobile and cross-browser support are outside the time box.

## Risks in priority order

| Risk | Why it matters | Early mitigation |
| --- | --- | --- |
| Wrong baud or serial settings | No useful input; 15600 is unusual and still unverified | Deploy a diagnostic connection page first; keep baud editable |
| Unknown XYZ units and axes | Tool motion may be inverted, rotated, or wildly scaled | Guided neutral/range calibration with numeric visualization |
| Euler rotation convention | Correct numbers can still yield incorrect combined orientation or discontinuities | Test isolated yaw/pitch/roll motions and angle wrapping on hardware |
| Packet framing without CR | Chunk boundaries do not equal packet boundaries | Accumulate text and frame with brackets |
| Web Serial permissions/policy | The finished scene may be unable to connect in managed Edge | Test HTTPS device selection on the actual Windows machine immediately |
| Update-rate latency/jitter | A fixed spatial mouse may feel imprecise; smoothing can increase delay | Measure packet rate, render newest pose, use minimal configurable filtering |
| Collision tunnelling | Roughly 33 Hz input can jump over thin obstacles | Swept segment/capsule tests between applied poses |
| Blocking mismatch | The physical controller keeps moving when the virtual tool is blocked | Define reconciliation and show requested vs applied pose if needed |
| Concurrent integration | Two computers can collide on shared files or contracts | Own disjoint paths and agree interface/commit before coding |
| Scope expansion into cutting | Material cutting can consume the entire five-hour window | Treat scalpel as navigation instrument unless visible cutting is explicitly required |
| Deployment timing | Hardware APIs require HTTPS and cannot be fully tested in an ordinary preview environment | Deploy the probe during the first 45 minutes and reuse the same host |

## Five-hour delivery plan

| Window | Deliverable and gate |
| --- | --- |
| 0:00–0:45 | Minimal HTTPS deployment, Edge Web Serial selector, editable baud, packet/framerate diagnostics, and real hardware proof |
| 0:45–2:00 | Calibration, pose mapping, Space clutch, keyboard/mock input, and visible scalpel movement |
| 2:00–3:30 | Exercise 1 completion plus Exercise 2 obstacle/collision behavior |
| 3:30–5:00 | Integration, real-hardware repetitions, presentation polish, results, failure recovery, and final deployment |

Stop or reduce scope if the hardware probe is not working after the first gate. A polished scene without live input does not satisfy the goal.

## Recommended two-agent ownership split

The reviewing agent will generate the final master prompts. The prompts should preserve these ownership rules:

### Agent A — hardware input and control contract

Own only the transport and controller-facing modules, their focused tests, and a small diagnostic panel:

- Web Serial permission/open/close/read/reconnect behavior.
- Text decoding, bracket framing, packet validation, diagnostics.
- Raw pose type, calibration model, coordinate conversion, and Space clutch.
- Mock/keyboard/replay pose source using the same consumer interface.
- A concise integration document naming the exact exported interface and commit.

Agent A should avoid scene composition, exercise visuals, collision design, final page layout, and deployment configuration unless specifically assigned after handshake.

### Agent B — game, exercises, presentation, and deployment

Own only browser game composition and deployable user experience:

- Babylon/Vite scaffold after the stack decision is accepted.
- Camera, lights, training workspace, scalpel representation, A/B targets, barrier.
- Exercise state machine, dwell completion, collision response and metrics.
- Native status/instructions/results UI and responsive desktop layout.
- Deployment configuration and validation link.
- Mock pose integration until Agent A publishes the agreed contract.

Agent B should avoid serial parsing and hardware calibration internals.

### Required integration handshake

Before either implementation agent edits shared files, record:

- Each issue, branch, human owner, and exact expected paths.
- The agreed pose-source interface and coordinate/rotation conventions.
- Which agent owns package/build configuration and application composition.
- Which agent merges or cherry-picks the other branch and in what order.
- A no-overlap acknowledgement for shared type files, entry points, styles, deployment config, and documentation.

The likely seam is a pull-based latest-pose snapshot plus status/events for connection and clutch state. The reviewing agent should make this contract concrete in both prompts and assign one owner for its source file.

## Acceptance checklist for the implementation prompts

Both master prompts must include:

- Repository context and the branch/issue workflow from `AGENTS.md`.
- A unique branch and non-overlapping owned file list.
- The full hardware packet contract and explicit warnings about radians, the seventh field, upstream mapping, and arbitrary serial chunks.
- A first-hour HTTPS hardware-test gate.
- The shared pose-source interface and mock source.
- Concrete completion evidence rather than a request to “make it work.”
- A requirement to preserve unrelated work and coordinate before touching overlap.
- A final handoff with commit, tests, hardware results, deployment result, known limitations, and integration order.

## Open decisions for the reviewer to preserve

These must remain visible in the two prompts unless Justin answers them before implementation:

1. Is visible cutting required, or is the scalpel only the navigation instrument?
2. Does barrier contact block motion, count a penalty, or both; and does collision apply to the tip, blade, or whole instrument?
3. Does reaching B require orientation or only position/dwell?
4. Does holding Space freeze both position and rotation, and does the exercise timer continue?
5. Is `15600` confirmed on the real device, and what are the data bits, parity, stop bits, and flow control?
6. What units and coordinate convention apply to XYZ, and what controller point is being measured?

Unless answered, use the documented recommendations for gameplay behavior, keep serial settings editable, and require hardware calibration rather than inventing an axis map.

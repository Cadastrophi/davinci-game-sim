# Web robot pose trainer: research for planning

Date: 2026-09-13. Status: research and recommendations, not accepted product decisions. No game implementation or hardware testing performed.

## Reference access and verified inspiration

The research fetcher could not retrieve the supplied pages, but the parent agent subsequently inspected both in the user's browser. The [Intuitive learning program](https://learning.intuitive.com/program-details?programId=3522) is Da Vinci Xi System Basics v10 and lists legacy and SimNow 2.0 exercises covering ring manipulation, needle targeting, camera/clutch control, multi-arm relocation, energy and retraction. This is a broader curriculum than a single game. Only visible program content was inspected; no course activity or assessment was started.

The linked [video](https://www.youtube.com/watch?v=teRQr2qquJA) is Ahmed Ghazi MD's 8:23 simulator overview. Paused frames around 5:02 and 6:42 show metallic instrument shafts in a brown box-like training volume with black pegs, green/yellow rings, block structures and a curved needle. These observations establish the visible scene vocabulary in those frames, not a full transcript or exhaustive reconstruction. It is practical to adapt the spatial training cues to a single non-grasping tool using original geometry.

Independent first-party evidence does establish the relevant training pattern. Intuitive describes a virtual practice environment, EndoWrist manipulation exercises, quantitative metrics, immediate feedback and progress tracking. Its current SimNow page describes structured progression and personalized scoring feedback. This supports adapting the learning loop to this arm, but does not establish the exact rules of the linked exercise. [Original Skills Simulator overview](https://manuals.intuitive.com/systems_i_a/skills_simulator), [SimNow](https://www.intuitive.com/en-gb/products-and-services/da-vinci/education/simnow).

## Verified web and engine capabilities

| Choice | Verified capabilities and constraints | Project interpretation |
| --- | --- | --- |
| Native web: TypeScript + Three.js | Three.js renders using WebGL 2; it provides quaternion math for orientation and angular distances. [Renderer](https://threejs.org/docs/pages/WebGLRenderer.html), [Quaternion](https://threejs.org/docs/pages/Quaternion.html) | A strong fit for a custom target arena and ordinary web UI. This is the provisional recommendation when the team favors web development. |
| Native web: Babylon.js | Engine includes WebGL/WebGPU support, scene graph, cameras, lights, PBR, GUI, picking, collisions and web physics integration. [Specifications](https://www.babylonjs.com/specifications/) | A credible alternative when a more integrated game engine is useful; no demonstrated need to change to it purely for pose scoring. |
| Unity desktop | This comparison has not benchmarked a native Unity prototype. | Reasonable if the team needs Unity asset/editor workflows or desktop-specific integrations. Better graphics are not assured merely by selecting an engine. |
| Unity Web | Unity 6.0 documents browser socket and managed-thread limitations; JavaScript interop is available. [Technical limitations](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-technical-overview.html), [Networking](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-networking.html), [JavaScript interoperability](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-interactingwithbrowserscripting.html) | A Unity export still needs a browser hardware integration path. It does not remove Web Serial permission or browser lifecycle constraints. |

### Direct USB serial

Chrome officially supports Web Serial on desktop Windows, macOS, Linux and ChromeOS. The application asks the user to select a device after a click; previously granted devices can be listed with `getPorts()`. Input is a byte stream and may arrive in arbitrary chunks, so message boundaries need explicit parsing. Correct serial settings and disconnect handling matter. [Chrome Web Serial guide](https://developer.chrome.com/docs/capabilities/serial).

The specification exposes serial access in secure contexts and dedicated workers, while `requestPort()` is window-only. A viable design is: request permission from a visible Connect button, then have a dedicated worker discover the granted port and own reading/parsing. HTTPS deployment and localhost development are appropriate; ordinary HTTP on a LAN IP must not be assumed equivalent to localhost. [Web Serial specification](https://wicg.github.io/serial/), [Secure Contexts specification](https://www.w3.org/TR/secure-contexts/).

**Recommendation:** choose current desktop Chrome as the initial supported hardware-demo browser and feature-detect `navigator.serial`. Validate the actual USB device/driver/browser combination before promising additional platforms. Web Serial support should not be assumed universal.

### Local bridge alternative

Node SerialPort provides serial access in Node.js/Electron with Linux, macOS and Windows bindings; WebSocket defines browser-server bidirectional messaging. Together these support a local serial-reader process feeding the web application. [SerialPort](https://serialport.io/docs/), [WebSocket protocol](https://datatracker.ietf.org/doc/html/rfc6455).

**Recommendation:** use this fallback if direct browser access fails, another process must own the device, or the device requires a native integration. The bridge runs on the computer attached to the arm, not on the website's cloud server. For the simplest demo, serve both UI and transport from localhost. For a remotely hosted UI, explicitly test local-network permissions, secure transport and origin restrictions on the intended browser; do not assume a public HTTPS page can connect to arbitrary local endpoints. Bind the bridge to loopback and authorize the intended UI origin/session.

## What “realtime” should mean here

Browser lifecycle documentation permits freezing/suspending work and page discard. A worker does not convert the browser into a deterministic realtime controller. [Chrome page lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api).

**Engineering recommendation:** the browser is suitable for responsive telemetry visualization and scoring, subject to measurement on the target laptop. If motor commands or haptics are involved, deterministic servo timing, hardware limits and watchdog behavior belong in the device/controller layer. A read-only sensed arm and an actuated remote arm are materially different designs; resolve this before selecting a transport contract.

Keep hardware sample arrival, kinematics/scoring and rendering as separate stages. Score from timestamped valid samples, render the latest pose, and stop dwell accumulation when samples are stale or a device disconnects. Render interpolation may improve appearance but should not manufacture scored measurements. Suggested initial targets such as 60 FPS and under 50 ms input-to-display latency are hypotheses for a spike, not proven performance or medical standards. Measure latency distribution, jitter, packet loss, parse errors and reconnect behavior.

## Pose scoring and reachability

Three.js expects normalized quaternions; its source computes orientation distance as `2 * acos(abs(clamp(dot(q1, q2), -1, 1)))`. This treats a quaternion and its negative as the same rotation. [Quaternion source](https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js).

**Recommended scoring:** separately expose position error (distance in physical units) and orientation error (degrees). Award a hit only while both thresholds hold for a continuous dwell interval using fresh telemetry. An asymmetric ghost tool or axis marker is needed if roll matters; a sphere alone cannot visually communicate full orientation. Do not let a weighted score compensate for completely wrong orientation. Thresholds, dwell and any smoothing need calibration against observed hardware noise and intended difficulty.

A robot singularity is a configuration where the Jacobian loses rank relative to the maximum it achieves. Fewer than six independent degrees of freedom cannot generally realize arbitrary six-dimensional end-effector poses. Manipulability characterizes directional motion capability; it is not synonymous with distance to a joint limit. [Modern Robotics: singularities](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-3-singularities/), [Manipulability](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-4-manipulability/).

**Recommended modeling workflow:** obtain the actual DH convention/table, joint types, zero offsets, axis directions, units, base/tool frames, measured joint limits and any coupling. Validate forward kinematics against measured configurations. Build task-relevant Jacobians, then assess rank and suitably scaled singular values/conditioning; translation and rotation use different units, so a raw mixed-unit condition-number threshold is not portable. For underactuated mechanisms evaluate the supported task rather than treating every configuration as singular because a six-row Jacobian lacks six independent columns.

Generate initial targets by sampling joint configurations inside limits and mapping them through forward kinematics; retain the generating configuration as evidence of model reachability. This does not certify a collision-free path or physical reachability when calibration/model assumptions are wrong. Filter joint margins and collision geometry, retain nearby validated transition paths, and add harder near-limit/near-singular targets only as intentional difficulty. Do not independently randomize position and arbitrary orientation. Workspace is an envelope of reachable poses, not merely a bounding box of tip positions.

## Questions that determine the plan

1. Does the hardware only report a manually moved arm/gimbal, or does software command powered motion? Are there separate master and slave arms?
2. What variables are actually reported: joint angles, encoder ticks, tool position, orientation, or commands? At what rate, with what timestamps and units?
3. How many independent axes are sensed and controlled? Does the gimbal provide all three orientation components, including roll?
4. Where is the actual DH table/diagram, and what are measured joint limits, tool offset, home pose and mechanical constraints?
5. Which laptop/OS/browser must work at the hackathon, and how much time remains?

Provisional direction: a desktop web pose-training arena with free practice and pose-matching drills, direct USB serial where confirmed, a replaceable local-bridge adapter if needed, and a pure kinematics/scoring core independent of renderer and hardware. Confirm hardware semantics first; no benchmark or exact workspace computation has yet been performed.

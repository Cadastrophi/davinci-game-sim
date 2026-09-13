# Accepted product specification — launch-v1

## Product and limits

Build an original browser teleoperation-training game: one physical controller, one virtual knife, one polished anatomical practice field with clear Aimlabs-like targets and feedback. It is not a validated medical simulator. Avoid copying proprietary assets, branding or scenes. `references/idp-unity-simulation` is UART-ingestion evidence only, not a source of gameplay or visuals.

Use TypeScript, Vite, Babylon.js/WebGL and lightweight native HTML/CSS UI. Web Serial is receive-only; do not acquire a writer, send contact commands, change modem-control lines experimentally, change firmware, or modify motors. Target desktop Chrome and Windows 11 Edge, with the actual connected machine as the live acceptance environment. Serve a static HTTPS build using an existing authorized account; host/credentials are not yet specified. Ask the human only for unavailable hosting access; continue local/mock work while that is resolved. Do not purchase resources, make the private repository public, or add accounts/backends.

## Input truth

- Expected stream from the peer live-packet handoff and archived source: `[x,y,z,yaw,pitch,roll,0]`, seven finite numbers, brackets, optional surrounding whitespace/newlines; yaw/pitch in degrees. Verify shape and angle units in the first connected-device check. Justin directly confirmed XYZ mm and roll deliberately replaced with zero/unavailable. Last field has no gameplay meaning in the handoff.
- Baud: 115200. Initial editable diagnostic defaults: 8 data bits, no parity, 1 stop bit, no flow control; these latter settings require actual-device verification, not a claim of user confirmation.
- Parse arbitrary byte chunks with bounded framing and recovery; count malformed packets, report packet age/rate, consume newest complete sample. Use monotonic receive times; do not call them hardware sampling timestamps.
- Six movable joints J0–5; J3 independent; J4/J5 ±pi/4 from DH neutral; J6 fixed. Pose-only data cannot establish complete joint configuration, live limit margins or singularity proximity. No such live claims in this build. Fixed J6 does not prove physical Euler roll zero.
- Confirm physical axes and reference point on the device. Yaw/pitch may define a calibrated virtual pointing mapping; it is not necessarily measured physical shaft direction. Label virtual mapping versus physically validated mapping. Do not synthesize a measured full orientation from zero roll.
- Archived FOC code runs motors, but impedance initialization/loop/current application are commented out (`src/main.cpp:287,337–353`); its impedance parser uses `Serial`, versus telemetry `Serial2`. Hardware capability is not a browser-feedback interface. Existing physical resistance may remain; app feedback is visual/audio only.

## Controls and terminology

**Tool pose:** instrument position and supported direction in game-world coordinates. **Requested pose:** calibrated input demand. **Applied pose:** game pose after collision handling. **Camera adjustment:** Space-held pan/dolly, distinct from instrument movement. **Roll unavailable:** axial orientation is not scored as a measured signal.

In normal mode the camera position and orientation are fixed; controller movement drives the tool. On Space-down snapshot the applied tool pose, raw controller anchor and camera position. While Space is held:

- Freeze tool world position and attitude; no tool motion, cutting or dwell credit.
- Map controller translation to camera-local horizontal/vertical pan and forward/back dolly with bounded gains/travel. Ignore controller yaw/pitch for the camera. Keep camera orientation and lens FOV fixed; dolly is translation, not FOV zoom. No orbit, automatic look-at rotation, or camera roll.
- Tool screen position may change as the camera moves; world pose must not change.

On Space-up leave camera fixed at its new position; rebase raw-to-tool mapping from the newest fresh sample and frozen applied pose so release creates no tool jump. No Shift recenter shortcut was approved; do not add one. Supply explicit reset/calibrate controls for setup and recovery.

Prevent Space page-scroll during active gameplay, ignore auto-repeat and editable-field focus, and handle key release outside the window. Blur, hidden page, disconnect, stale input, and invalid calibration enter paused state, clear held-input state, interrupt dwell, suspend cutting, and require deliberate fresh-input resume/rebase. Intentional Space camera adjustments count toward elapsed exercise time; outages/explicit pause do not. These timer rules are implementation defaults, not a clinical metric.

## Mode sequence and success evidence

| Priority | Mode | Completion and evidence |
| --- | --- | --- |
| Core 1 | Free practice | Live tool, camera adjustment, reset, optional trail and clear telemetry status; no competitive score |
| Core 2 | Reach and hold | Sequence of reachable targets; continuous fresh-input dwell; time, position error, steadiness and retry |
| Core 3 | Direction alignment | Position plus pointing tolerance; no axial-roll score; mark virtual-direction semantics or gate mode until mapping is validated |
| Core 4 | Obstacle navigation | Navigate around protected volumes; swept collision, contact episodes, path/time metrics and results |
| Core 5 | Camera and navigation | Reposition view with Space to locate targets, then acquire them; verify constant tool world pose during pan/dolly and no release jump |
| After core | Incision | Contact-driven visible tissue separation and deformation along a constrained practice incision; cut coverage, deviation and depth feedback |

Modes 1–5 have priority over incision. The user prefers actual separation/deformation for incision: a painted texture/decal alone does not meet that preference. Implement a limited, original practice patch with a bounded cut path, progressively separated geometry/wound edges and stable local deformation driven by blade contact. A pre-tessellated seam with progressive opening is acceptable as a disclosed constrained demonstration; do not claim arbitrary mesh cutting or biomechanical accuracy. Avoid expensive whole-organ physics, bleeding systems and freeform severance in the time box. If it fails the remaining time budget, keep it disabled with an honest limitation rather than calling a static animation interactive cutting.

Use generated textures/concepts if the image skill/tool is available; agent-written geometry/shaders/mesh updates implement cutting. Record provenance/licenses and maintain readable target contrast. Do not let asset generation block the first working scene; use original procedural materials until assets arrive. Tissue may look realistic without a physically accurate model. No needle threading, suturing, clamping, multi-arm or energy simulation is required.

## Collision and scoring

Exact commercial collision behavior is unverified. Approved fallback: virtual blocking, one penalty per continuous contact episode, visible contact feedback and a faint requested-tool ghost when applied/requested poses differ. Use a conservative tip/short-blade capsule and documented collision margins. Check swept movement, including rotation of collider extent, so thin obstacles cannot be skipped by packet jumps. Do not teleport through or blindly snap out of obstacles on subsequent packets. Define release hysteresis and verify recovery.

Navigation surfaces are non-cuttable. Only incision mode exposes designated cuttable tissue; protected structures remain blocking. Coordinate cutting contact response explicitly so the generic obstacle layer does not prevent every incision or allow cuts in navigation modes.

Scores use unsmoothed applied pose, fresh valid samples and calibrated game-world units. Render interpolation must not generate scored measurements. Initial tunable tolerances: 10 virtual mm, 10 degrees, 0.5 seconds dwell; revise against observed noise. Display scaling/rebasing means virtual accuracy is not automatically physical arm accuracy. Direction error is `acos(clamp(dot(unitActual,unitTarget),-1,1))`; preserve sign. Both required tolerances must hold throughout dwell; do not reward wrong orientation through weighted compensation. Random target positions/directions must come from validated comfortable sets, not unsupported arbitrary full poses.

## Delivery acceptance

Aim for 60 FPS on the actual demo machine; measure, do not promise. Record packet rate, sample age, frame times and visible latency separately. Receive timestamps alone cannot establish sensor-to-display latency. Test real connection on HTTPS within 45 minutes of launch; mock mode remains useful but cannot satisfy hardware acceptance. Publish each runnable increment with source SHA and test evidence. Reserve the last hour for integration/rehearsal; no new cutting subsystem during feature freeze.

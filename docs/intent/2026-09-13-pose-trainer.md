# Intent — pose trainer planning

Requested by Justin on 2026-09-13 using grill-me, grill-with-docs and research.

Outcome: research and plan a browser-preferred training arena for a real seven-DOF robot controller that transmits XYZ/yaw/pitch/roll over UART. The controller has no pinching/clamping tool. Include free practice, several short scored exercises, orientation accuracy, and a plan for kinematics-based reachability and singularity constraints.

In scope: primary-source research, UART/model inspection, design questions, glossary updates and a provisional plan. Out of scope: game code, firmware changes, hardware commands, deployment, or prematurely accepting an engine choice.

Evidence and next questions: `../plans/POSE_TRAINER_PLAN.md`. The supplied pages were inspected in the browser after research-tool retrieval failed. Specific video frames and the program's exercise list were reviewed; no complete game reconstruction is claimed.

Confirmed during interview: five-hour build, Chrome through USB serial-to-TTL, several short exercises, and graphics quality as the primary concern.

Further clarification: combine Aimlabs presentation with realistic surgical anatomy. J0–3 form the serial linkage; J4–6 the gimbal. J4/J5 each permit ±pi/4 from DH neutral; J6 is fixed, and roll telemetry is reported as zero. Revise the training proposal to position plus pointing direction, without scoring axial twist. Clarify J3 mobility and telemetry conventions before asserting physical loss of orientation capability or computing the constrained workspace.

Subsequent answers: J3 moves independently; running firmware explicitly substitutes zero roll due to the missing roll encoder. Record six movable joints plus fixed J6. A known fixed J6 angle can replace its measurement in FK; actual Cartesian orientation should be derived from the full calibrated chain, not forced to zero. Request J3 usable limits and the actual J6 locked angle. Keep initial direction-only scoring as a scope recommendation pending orientation validation.

Coordination: this entry is separate from the shared append-only log because the hardware-reference task owns that log. Integrate a pointer when the planning branch is published.

# Master prompt H — hardware input, mapping and workers

You are the hardware/input master for our browser teleoperation game in `Cadastrophi/davinci-game-sim`, working on or with the controller-connected computer. Implement the input lane using bounded Astra subagents and small reviewed PRs. Another master runs `MASTER_EXPERIENCE.md` and is the sole merge coordinator. You do not scaffold a competing app, own scoring, or merge main. Do not create another experience master.

## First actions

1. Read repository `AGENTS.md`, required context/workflows, project-local coordination skill, then `docs/launch/README.md`, `SPEC.md`, `CONTRACT.md`, and `COORDINATION.md` completely. Load relevant project skills for actual changes. These docs supersede earlier research proposals for baud, engine, Space behavior and mode priority; preserve unrelated repository rules and UART-only reference boundaries.
2. Inspect state, fetch origin, inspect issues/PRs and verify your actual push account. Use `<github-login>_<task-name>` branches, not a guessed Justin prefix. Preserve unknown changes and local reference branches; never develop on main.
3. Post role H, human/account, documentation SHA, actual hardware/browser availability and ownership in issue #1. Verify E has the same package SHA. Review its docs/baseline PR and ACK exact input/scene/training facade semantics and fixtures. E alone writes `src/contracts/**`, root dependencies/build/deploy and app composition. Do not silently alter shared files to make your tests pass.
4. Create narrow input issues. Provide E the minimal typed contract and realistic fixture requirements from `CONTRACT.md`. While baseline is pending, inspect code and design tests read-only. After baseline merges, record its SHA and begin isolated workers.

## Delegate disjoint slices

Start serial and mapping workers; add fixtures/provider worker if slots and stable dependencies permit. Follow shared allowlists and per-worker branch/worktree/issue rules. You own the `src/input/index.ts` facade, input integration tests and hardware evidence. Review and hand off PRs to E instead of merging. Workers may not recursively spawn writers or take each other's paths.

- Serial worker owns `src/input/serial/**`: secure-context feature detection, user-gesture device request, granted-port refresh, 115200 receive-only connection, incremental bounded bracket parser, malformed-packet counters, timestamps/rate/status and clean cancellation/disconnect. No outbound writes or experimental DTR/RTS changes.
- Mapping worker owns `src/input/mapping/**`: physical mm/degrees to calibrated virtual frame, explicit direction availability, neutral/gain/sign calibration, tool/camera switch anchors, fresh-input pause/resume and no-jump rebasing. Camera output is translation only; ignore yaw/pitch while Space is held. No camera rendering or global key handlers.
- Provider worker owns `src/input/sources/**` and `tests/fixtures/input/**`: deterministic mock/replay implementations of the same facade, sample provenance, split/noisy/invalid packet fixtures and timing tests. Remove duplication with E's temporary bootstrap provider through an E-owned wiring PR.

## Hardware facts and boundaries

Current wire contract is seven bracketed finite numbers `[x,y,z,yaw,pitch,roll,0]` at 115200 baud, XYZ mm and angles degrees. Roll zero is deliberately unavailable, not measured. Seventh field unused. Initial diagnostic defaults 8-N-1/no flow control need device verification; expose settings rather than secretly substituting archived values. No required CR; framing uses brackets across arbitrary chunks.

Firmware is immutable and the app only receives. Source FOC motors/impedance capability does not authorize sending forces, states or target commands. Do not open a writer or probe unknown command bytes. Report existing physical resistance separately from virtual contact feedback. No firmware/motor changes, and no live singularity/joint-limit claims from pose-only data. The archived Jacobian is not validated for the current arm; do not wire it into safety feedback.

J3 is independent; J4/J5 ±pi/4 from DH neutral; J6 fixed. Calibration cannot generally recover missing physical orientation. Validate XYZ axes/reference point and yaw/pitch mapping on the actual arm; provide direction as `virtual-mapped` or `physical-validated` with evidence. Never emit fake measured roll. Use normalized direction/math internally, handle angle wrap, and distinguish host receive age from sensor latency.

## Integration and real-device gate

Have E deploy/wire the diagnostic facade early and test on actual desktop Chrome/Windows Edge, aiming within 45 minutes of launch. The human selects the browser device and performs requested bounded movements; never claim remote access to another computer's USB. Record browser/OS/serial settings, known movements, packet rate, age, errors and calibration result. If hardware is absent, state that and continue tests/replay without pretending live acceptance passed.

E supplies current applied tool pose at camera entry/exit/resume. Space-held translation produces cumulative pan/dolly offsets from the raw entry anchor; repeated render reads must not accumulate additional movement. Hold tool world pose fixed. On release use newest fresh raw data and the frozen applied tool pose as new anchors. Camera yaw/pitch never changes. Missing/stale data, disconnect or blur pauses and requires deliberate fresh resume; no automatic jump. E owns scene bounds, camera translation application, keyboard routing, collision and scores.

Test fragmented/multiple/oversized packets, debug noise, non-finite values, units, wraps, unavailable roll, sample age, cancellation/reconnect, repeated camera snapshots, Space release and reset while blocked. Put hardware records in `docs/hardware/**` with exact source SHA and distinguish fixtures from observed measurements.

## PR delivery and completion

Deliver serial first, then calibration/camera mapping and providers as narrow dependent PRs. You wire input exports in `src/input/index.ts`; E wires app imports/composition separately. Your cross-input tests live in `tests/input-integration/**`, not E's app integration or e2e directories. Before pushing/review, refresh main, inspect competing claims and test current interfaces. Request shared changes in issue #1 with exact API migration and tests. Continue disjoint work while waiting; never seize app/contract/merge ownership.

Review E's interface and behavioral PRs independently, particularly camera freeze/rebase, scoring freshness and unsupported orientation. Send E `READY` with PR/head SHA, checks, contract revision and real-device evidence. After each merge refresh from the recorded main SHA before new work.

Persist through safe input-lane work and integration support; reserve final time for hardware rehearsals and failure recovery. Report implemented capabilities, PRs/commits, automated tests, measured hardware results, known limitations and next blockers. Do not claim game-triggered haptics, six measured orientation components, or live physical safety certification. Do not start unrelated product features or user-visible tasks.

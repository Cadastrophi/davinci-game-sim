# Parallel delivery research and proposed operating plan

Status: recommendations for synthesis, not implementation authorization or launch prompts.

## Evidence and provenance

- Repository operating contract: `AGENTS.md`.
- Existing task/branch/peer protocol: `docs/workflows/AGENT_WORKFLOW.md`, `docs/workflows/GIT_WORKFLOW.md`, and `.agents/skills/coordinate-agentic-unity-work/references/coordination-protocol.md`.
- Friend's discovery: `origin/justin/simulator-discovery-brief` at `4af68b6f44bedc23dd76f81f24f0c085b31eb940`, `docs/specs/TELEOP_SIMULATOR_DISCOVERY.md`.
- Justin's evolving planning draft: `docs/plans/POSE_TRAINER_PLAN.md` in the local `justin/pose-trainer-plan` worktree. This is uncommitted research, not an accepted specification.

The repository requires one accountable writer per branch, narrow issue claims, explicit acknowledgement for overlapping interfaces, fresh collision checks, reviewed PR integration, and preservation of unrelated work. These are established rules. The lane names, paths, feature order, and staffing below are proposed applications of those rules.

## Conclusion

Use two master agents as coordinators of one product, not independent app builders. Master E owns experience, application composition, and the merge queue. Master H owns hardware input, mapping, and geometric evidence. Both review each other's boundaries. Their subagents implement bounded leaf tasks on separate branches/worktrees; they do not receive blanket authority to expand scope, change shared contracts, merge main, or launch unlimited descendants.

More agents can accelerate independent code, tests, and visual assets after the contract baseline exists. They cannot safely parallelize unanswered product decisions, app scaffolding, package lockfiles, public interfaces, or the merge queue.

## Resolve before launch

The two research streams agree on browser-based USB pose input, a five-hour window, transport independence, replay/mock input, calibration, and no browser motor commands. They disagree or differ in scope on:

- Babylon.js/native HTML versus Three.js/React Three Fiber; select one renderer and UI approach.
- Scalpel with two A-to-B navigation exercises versus a symmetric probe with free practice and position/direction drills.
- Neutral lab presentation versus anatomical surgical setting.
- Position-only success versus required approach-direction accuracy.
- Collision blocking/penalty geometry, and clutch/rebase behavior.
- Firmware cannot change in the friend brief versus proposed future joint/full-orientation telemetry in Justin's draft.
- Live friend-supplied 15,600-baud bracketed packets versus archived 115,200-baud/newline firmware evidence; units and tool frame remain unconfirmed.

These are not issues that agents should independently default in opposite ways. Synthesis must distinguish current-device evidence from archived code, identify which user confirmed each requirement, and publish one accepted answer. Full roll cannot be inferred by treating its placeholder zero as a measurement. Advanced live singularity/limit displays cannot be promised without sufficient configuration telemetry.

## Shared baseline: one owner, one reviewed PR

Master E owns the baseline, after Master H acknowledges the input seam. Keep it small enough to deliver an actual working page early:

1. Chosen engine/UI scaffold, one package manager/lockfile, test/typecheck/build commands, deployment configuration, and a minimal CI check.
2. One shared contract module and a documented mapping convention: position units/frame/point, orientation availability and representation, receive time, freshness, source/connection state, calibration and clutch states.
3. Distinguish raw hardware pose, calibrated requested virtual pose, and collision-limited applied virtual pose. Scene/collision owns applied pose; transport never owns gameplay collision.
4. A tiny valid replay/mock fixture and consumer example that moves a visible tool in a basic scene. Do not scaffold two alternate apps or duplicate mock implementations.
5. Approved scope, exact ownership table, issue dependency map, human owner/account mapping, and one HTTPS deployment target.

Baseline contract details are decisions to agree, not a pretext to implement broad abstractions. A latest-sample snapshot and explicit status/events are sufficient candidates. Mark unmeasured orientation components unavailable. Host receive timestamps are not device capture timestamps and cannot establish sensor-to-display latency alone.

Both masters acknowledge the baseline commit SHA and contract revision before dependents start writing. Hardware protocol investigation, visual references, and test-case design can proceed read-only while this PR is prepared.

## Proposed exclusive ownership

Paths are illustrative until the baseline fixes the repository structure. Every issue must replace them with exact paths/globs and named exported interfaces.

| Owner | Exclusive implementation responsibilities | Candidate paths |
| --- | --- | --- |
| Master E, shared-file custodian | App wiring, dependency/build/deploy config, contract source changes, CI, documentation indexes | `src/app/`, `src/contracts/`, root package/lock/build files, `.github/workflows/` |
| E scene worker | Scene, camera, lights, tissue/arena materials, tool/target visualization; no exercise state machine | `src/scene/`, `public/assets/scene/` |
| E training worker | Exercise state, target completion, collision policy/math, dwell, metrics, results data | `src/training/` |
| E UI worker, later wave | Controls/instructions/HUD/results presentation against accepted state interfaces | `src/ui/` |
| Master H transport worker | Permission lifecycle, serial read loop, bracket framing, parser, packet diagnostics | `src/input/serial/` |
| H mapping worker | Calibration, unit/axis mapping, pose validity, software clutch/rebase, mock/replay provider after baseline handoff | `src/input/mapping/`, `src/input/sources/` |
| H geometry worker, conditional later wave | Pure FK/model checks, model-feasible target library and restrictions; no claimed live diagnostics without necessary data | `src/kinematics/` |

Tests live beside the owned module or in equally exclusive test paths. Component styles stay component-local. One author owns each fixture; consumers request additions rather than editing it concurrently.

The older Justin schedule assigns some scoring math to the input lane; this conflicts with the final scene/training ownership. Supersede that assignment: all success, dwell, collision, and score policy belongs to E. H exposes calibrated data, uncertainty/freshness, and any validated feasibility predicates. E may consume those predicates but must not duplicate the kinematic model.

Input diagnostics should be data/status provided by H; final page composition and styling belong to E. If H builds a diagnostic component, its single isolated directory and public props must be assigned explicitly. Do not let both lanes create competing connection panels.

## Incremental PR dependency plan

| Slice | Owner and dependency | Visible result and required evidence |
| --- | --- | --- |
| P0 — shared baseline | E; peer acknowledgement from H | Hosted page loads, visible mock-driven tool, build/test checks pass; both masters record same contract SHA |
| P1 — serial vertical slice | H; after P0 | User gesture device chooser, editable confirmed/default baud, live packet/status data through agreed provider; framing/parser tests and actual Windows/Edge hardware verification |
| P2 — visual practice | E scene worker; after P0, parallel with P1 | Chosen environment, depth cues, readable tool/targets, free movement via mock; screenshots and frame-time observations |
| P3 — calibrated live practice | H mapping worker + small E wiring PR; P1 and P2 ready | Actual arm drives tool with verified axes/units, freshness/disconnect handling, agreed clutch; physical checklist and no-jump resume/rebase evidence |
| P4 — first complete drill | E training worker; may build logic against P0 fixtures, integrates after P3 | Instructions → start → acquisition/dwell → results → retry; tests for reset/pause/stale sample behavior; real-device playthrough |
| P5 — second/third accepted exercise | E training worker; after P4 primitives | Additional original challenge, agreed collision/orientation semantics; crossing/contact tests and playthrough |
| P6 — hardening and polish | Disjoint workers, after playable slice | Failure recovery, readability, performance, replay fallback; repeated final hosted hardware rehearsal |

P1 should reach the deployed diagnostic page as early as possible; do not make serial verification wait for anatomical art. P2 may merge before P1. E wires H's completed exports in small integration PRs rather than asking H to edit app entrypoints. Work based on unmerged experimental interfaces is discouraged; publish the small contract baseline first.

Each independently reviewable slice is its own issue, branch, and PR, rather than one five-hour mega-branch per master. Keep main usable after every merge, using explicit feature flags only where needed and clearly labeling mock/replay mode. A successful CI build is not proof that live USB input works.

## Subagent operating limits

- Each master starts with at most two implementation workers when independent ready tasks exist. Reserve available capacity for review/integration and do not assume the two subscriptions share a runtime or agent mailbox.
- Respect actual session slot limits; if the two masters share one pool, allocate a combined cap before spawning. The user wants useful parallelism, not a fixed maximum regardless of dependencies.
- A worker receives one outcome, exact paths, base commit, contract version, acceptance evidence, dependencies, and a prohibition on edits outside its ownership.
- Give every writing worker its own worktree and branch. Distinct directories in one checkout do not make concurrent Git staging/committing safe.
- Master coordinators do not concurrently edit a worker's branch. Worker hands off exact commit, state, tests, and remaining risks; master acknowledges before taking over if needed.
- Workers return test evidence and a PR/handoff; only the designated integrator merges to main. Subagents may review different authors' PRs but do not self-approve their own changes.
- A worker cannot recursively spawn writers by default. Request a bounded split from its master first so new claims fit the ownership ledger and slot budget.

## Cross-machine coordination and merge serialization

Use a GitHub coordination issue as shared memory, with per-slice child issues or linked issues. Chat messages and local `ACTIVE_WORK.md` are supplementary. A claim includes human owner, distinct master/worker identifier, branch, expected files and public behavior, base SHA, contract version, dependency PRs, and intended validation.

Before editing overlapping interfaces obtain explicit acknowledgement naming their owner and integration order. Clearly disjoint acknowledged-baseline work need not wait for a redundant approval on every edit; existing workflow allows it. Branch prefix follows authenticated human ownership, not an assumption that every `justin/` branch belongs to Justin's current agent. Friend's research already demonstrates that branch names alone do not establish authorship.

Master E is the proposed sole merge coordinator. No external scheduling service is required: each merge request goes into the coordination issue, E fetches and checks outstanding claims/diffs/PRs, obtains independent review, updates the PR to current main, reruns checks, then squash-merges one PR at a time. After each merge, record the resulting main SHA and notify dependents to refresh. Do not blindly cherry-pick peer commits in place of reviewed PRs.

If the integrator hands off, record explicit release and new-owner acknowledgement before another master merges. Never treat a timeout or silent peer as permission to seize merge ownership. Review capacity is a gate, not optional overhead: H reviews E boundary changes and E reviews H boundary changes, with a non-author worker helping when suitable.

## Blocked behavior

- Missing hardware facts: continue mock visuals and pure parser tests; leave physical accuracy claims blocked. Never substitute archived units/baud for current-device evidence without a visible, testable configuration choice.
- Missing peer acknowledgement for overlap: post exact paths/contracts and proposed split, then work only on disjoint tasks. Do not wait while occupying workers with no ready work.
- Missing GitHub/auth access: preserve local branches/commits and report the access problem. Do not claim a PR or shared ownership acknowledgement exists and do not push directly to main as a workaround.
- Broken main/build after merge: pause later merges, diagnose against the last known-good SHA, and propose a focused fix PR. Do not perform destructive reset or silently discard peer intent.
- Input not demonstrated at the first hardware gate: prioritize connectivity/calibration; reduce exercise breadth before expanding art or architecture. A mock-only demo is a disclosed fallback, not completion of live-controller scope.
- Deadline pressure: freeze new features and integrate/test the accepted smallest slice; never bypass required review or invent safety/kinematic guarantees.

## Launch-prompt readiness gate

The two final prompts should be generated only after the synthesis questions are answered. They must point to one accepted spec and contract revision, name each master and merge authority, bound subagent delegation, assign exact paths, enumerate staged PRs and dependencies, require actual hardware evidence, and include failure/coordination stop conditions. Do not embed divergent copies of the full specification in two prompts; reference one canonical source and repeat only critical non-negotiable boundaries.

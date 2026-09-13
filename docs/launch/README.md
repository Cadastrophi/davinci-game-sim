# Two-Astra launch package

Revision: launch-v1, 2026-09-13. Prepared at Justin's request; preparing these documents does not start implementation.

Give [MASTER_EXPERIENCE.md](MASTER_EXPERIENCE.md) to Justin's Astra and [MASTER_HARDWARE.md](MASTER_HARDWARE.md) to Jinyu's Astra on the hardware-connected computer. Roles may be swapped explicitly, but there must be exactly one of each. Both prompts can be submitted concurrently once both agents can read this package from the same Git commit. Do not paste both into one agent or launch duplicate masters.

Both prompts depend on [SPEC.md](SPEC.md), [CONTRACT.md](CONTRACT.md), and [COORDINATION.md](COORDINATION.md). The package is self-contained for launch; older research is evidence, not a competing specification. The shared coordination surface is [issue #1](https://github.com/Cadastrophi/davinci-game-sim/issues/1).

## Getting the same package on both computers

The documentation branch is `Cadastrophi_prepare-launch-prompts`. If its PR has merged, fetch and use the merged package from current `origin/main`. Otherwise fetch the branch, inspect its SHA and read this directory there (an isolated worktree is preferable). Both masters post the same documentation SHA in issue #1. A branch name is a locator, not an immutable version: compare actual SHAs. The experience master arranges peer-reviewed integration of this documentation before the implementation baseline PR; do not base feature work on an unmerged documentation branch or blindly cherry-pick peer research.

The original estimate was five hours; prompt preparation does not reset the hackathon clock. At launch, establish the actual remaining time and one shared deadline, then shorten the PR plan and incision cutoff accordingly. The prompts authorize implementation when the user submits them as a task. This preparation task makes no application, firmware, device, hosting or repository-settings changes.

## What the user settled

Modes 1–5 first; incision mode afterward. Anatomical Aimlabs-style environment, knife allowed. Space adjusts camera pan/dolly only, never camera yaw/pitch; release resumes tool control without a jump. Immutable, receive-only firmware, 115200 baud, mm, unavailable roll. Babylon.js/TypeScript/Vite. Collision fallback is virtual blocking, a contact penalty, and a requested-pose ghost. Cutting should visibly separate and deform tissue, not merely paint a line. Seven-field bracket framing and degree angles are carried from the peer's live-packet handoff and source audit; verify against the connected device in the first milestone.

## Intent and evidence

This is the durable intent record for prompt preparation: synthesize both discovery tracks into two non-overlapping master briefs, bounded worker delegation, progressive visible PRs, and one merge authority. Scope is new `docs/launch/**`; earlier uncommitted research, the friend's branch, root shared docs and hardware-reference commits remain preserved. Link this entry in the shared intent log during acknowledged documentation reconciliation.

Evidence: friend discovery `justin/simulator-discovery-brief` at `4af68b6f44bedc23dd76f81f24f0c085b31eb940`, source firmware `Jin-underworld/FOC_motor_test` at `b1a857e3bc9985f3f8a7deab6ec1876dd57b7017`, and Justin's subsequent answers captured in this package. Source firmware is not guaranteed to match the flashed device. The confirmed 115200/mm/camera-only Space/no-roll behavior supersedes conflicting earlier proposals.

No primary reference inspected established the exact proprietary simulator's collision resolution. Its [official overview](https://manuals.intuitive.com/systems_i_a/skills_simulator) establishes exercise categories and feedback, not a contact algorithm. Use the approved fallback without claiming identical behavior. Raster generation may produce textures/concepts, but separation/deformation requires interactive geometry code.

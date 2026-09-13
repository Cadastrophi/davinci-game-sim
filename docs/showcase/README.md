# Evidence walkthrough

This guide supports the selected **Best example of Agentic Engineering** and **Best example of Computer Use** tracks. The supplied category screenshot names the tracks but supplies no scoring rubric. The goal here is to make contributions and outcomes independently inspectable.

Evidence inventory checked against `main` at `74363b6` on 2026-09-13. That identifies the audited source, not a claim that this documentation task ran a hardware session. Use an exact reviewed commit for the final demo, especially if demonstrating a different production branch.

## Agentic Engineering

### 1. Divide the work around an executable contract

Master E owned the experience and integration; Master H owned telemetry and calibrated input. The [launch contract](../launch/CONTRACT.md) and [baseline PR #6](https://github.com/Cadastrophi/davinci-game-sim/pull/6) established the shared boundary. Serial, mapping and facade work then arrived through [PR #20](https://github.com/Cadastrophi/davinci-game-sim/pull/20), [PR #22](https://github.com/Cadastrophi/davinci-game-sim/pull/22), and [PR #23](https://github.com/Cadastrophi/davinci-game-sim/pull/23).

Inspect [the serial handoff](../handoffs/serial-input.md) and [mapping handoff](../handoffs/input-mapping.md): each names an owner, baseline, allowed paths, interfaces, checks and next owner. This is a concrete example of agents delivering compatible work across a hardware/software boundary.

### 2. Use issues as shared coordination memory

The input integration record links [serial issue #8](https://github.com/Cadastrophi/davinci-game-sim/issues/8), [mapping issue #11](https://github.com/Cadastrophi/davinci-game-sim/issues/11), and [facade issue #13](https://github.com/Cadastrophi/davinci-game-sim/issues/13). The actual cross-agent conversation lives in [issue #1](https://github.com/Cadastrophi/davinci-game-sim/issues/1). Two concrete exchanges show the mechanism: [H reviews the exact application commit](https://github.com/Cadastrophi/davinci-game-sim/issues/1#issuecomment-5651524144), and [E reports integration while preserving H's active hardware-test version](https://github.com/Cadastrophi/davinci-game-sim/issues/1#issuecomment-5651579889). The comments identify source commits, review status and the next action, letting work proceed without silently changing the device under test.

The evidence supports deliberate coordination. It does not establish a measured percentage reduction in conflicts or time saved. The linked exchanges make ownership and integration order inspectable; they do not prove zero conflicts.

This is development history: [PR #38](https://github.com/Cadastrophi/davinci-game-sim/pull/38) later simplified the operating contract to local validation and optional issue claims. [AGENTS.md](../../AGENTS.md) governs current work; historical launch and coordination records explain the earlier process.

### 3. Show a review that changed the result

Independent parent review found that a successful disposal retry could retain a stale serial error. The [serial handoff](../handoffs/serial-input.md#verification-and-next-owner) records the finding; [PR #25](https://github.com/Cadastrophi/davinci-game-sim/pull/25) delivered the correction. Inspect [transport tests](../../src/input/serial/transport.test.ts) for the regression coverage.

This case connects a reviewer finding to a fix and a repeatable check. It is stronger evidence of engineering judgment than a count of agents or generated lines.

### 4. Make hardware uncertainty testable

The [input integration tests](../../tests/input-integration/input.test.ts), [mapping tests](../../src/input/mapping/index.test.ts), and [recenter integration tests](../../tests/app-integration/recenter.test.ts) exercise freshness, rebasing and recovery with deterministic inputs. The [hardware handoff](../hardware/INPUT_HANDOFF.md) separately identifies what must be observed on the connected device.

[Issue #35](https://github.com/Cadastrophi/davinci-game-sim/issues/35) records the reported physical-axis mismatch; [PR #40](https://github.com/Cadastrophi/davinci-game-sim/pull/40) changes the default mapping. This is a traceable hardware-informed correction. The issue report alone does not prove who operated the computer or supply a complete live validation recording.

## Computer Use

Computer use becomes visible when the evidence shows **what the agent saw, which UI action it took, what changed, and how it verified the outcome**. A photo of hardware or a code diff cannot establish that sequence by itself.

| Candidate case | Evidence already located | What still needs to be attached |
| --- | --- | --- |
| Browser verification of the training loop | [E reports a Chrome mock walkthrough](https://github.com/Cadastrophi/davinci-game-sim/issues/1#issuecomment-5651619212) covering incision progress, protected contact and reset at `04fbf5f`. | The corresponding tool-session excerpt or video. This is a written report of browser validation using synthetic input, not live hardware evidence. |
| Connect and inspect controller telemetry | [Hardware checklist](../hardware/INPUT_HANDOFF.md), [demo controls](../launch/LOCAL_DEMO.md#physical-controller), serial implementation and tests. | A session excerpt showing the agent operating the browser, the selected source/device state and actual incoming telemetry. |
| Diagnose axis/direction mapping | [Issue #35](https://github.com/Cadastrophi/davinci-game-sim/issues/35) and [PR #40](https://github.com/Cadastrophi/davinci-game-sim/pull/40). | Before/after footage linking a known physical movement, visible raw pose and virtual movement; identify human observations and agent actions. |
| Verify interruption and recovery | [Recenter tests](../../tests/app-integration/recenter.test.ts), [input handoff](../hardware/INPUT_HANDOFF.md#live-check-record-to-complete-on-the-controller-machine). | A recorded device session showing the observed interruption, paused state, deliberate recovery and resulting instrument pose. |

**Current inventory:** source, tests, PRs and written handoffs are linked above. This audit did not locate a committed recording that establishes the complete agent-operated computer-use sequence. The hardware handoff contains pending checks; treat these as evidence to complete, not completed results. Existing recordings can fill the gap once their source, participants and tested commit are identified.

## Capture one convincing case

1. Pick one real task with a visible success criterion, such as correcting an axis mismatch. Show the starting problem.
2. Record the relevant computer window and the physical controller in the same timeline. Label who is acting: human moves hardware; agent observes/operates UI or edits code; identify any human intervention.
3. Show the agent's observation, action, feedback and correction. Keep a continuous excerpt of the verification, including any failure and recovery.
4. Link the resulting issue/PR, exact source commit, focused check and recording timestamps. Label serial, synthetic and replay inputs accurately.
5. Add an evidence record using [the template](EVIDENCE_TEMPLATE.md), then replace the corresponding missing-evidence entry above with its link.

Keep concise stills beside their evidence record; link larger recordings from an accessible submission location. Verify access as a judge would. Use descriptive filenames such as `axis-mapping-before-after.png`; captions should state what is visible and the recording timestamp. There are no placeholder images or invented measurements in this guide.

## Highest-value improvements before submission

| Priority | Improvement | Completion evidence |
| --- | --- | --- |
| 1 | Put a 60–90 second hardware-and-screen demonstration near the top of the root README. | Accessible video, tested commit, labelled agent/human roles and input source. |
| 2 | Add one complete computer-use case, preferably a real diagnosis and recovery. | Observation → UI action → feedback → correction → verified outcome, with timestamps. |
| 3 | Feature the linked coordination exchange and review-driven correction in the demo narration. | Show the exact comments above, PR #25 and its regression test together. |
| 4 | Record measured behavior on the demo computer. | Browser/OS/device, method, samples and results. Keep packet age, packet rate, frame time and end-to-end latency distinct. |
| 5 | Freeze the submission version and test the judge's route. | Reviewed commit or release, matching demo recording, clean-install commands and accessible links. |

Keep the product story in the README and supporting evidence here. The existing `src/`, `tests/`, `docs/hardware/` and `docs/handoffs/` boundaries already expose the architecture well. Moving runtime files just before the demonstration would add migration work; this organization adds a clear entry point while preserving those working boundaries.

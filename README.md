# Da Vinci game simulator

**A physical controller becomes a virtual instrument for repeatable teleoperation practice. Built by coordinating coding agents across hardware input and a browser training arena.**

Move, point, hold a target, navigate obstacles, adjust the camera, and open a constrained tissue seam. The application receives controller pose telemetry over Web Serial and maps it into an original Babylon.js scene. A keyboard/mock lane makes the training loop accessible without the hardware.

[Run the demo](docs/launch/LOCAL_DEMO.md) · [Award-track evidence](docs/showcase/README.md) · [Hardware setup and checks](docs/hardware/INPUT_HANDOFF.md) · [Documentation map](docs/README.md)

## Two tracks, one engineering story

| Track | What this project demonstrates | Start with the evidence |
| --- | --- | --- |
| **Best example of Agentic Engineering** | Experience and hardware agents divided ownership around a shared input contract, delivered independently testable increments, reviewed integration, and fixed a discovered lifecycle defect. | [Evidence walkthrough](docs/showcase/README.md#agentic-engineering): issues, merged PRs, handoffs and regression tests. |
| **Best example of Computer Use** | Hardware integration creates a concrete observe–act–verify task: operate the browser, inspect UART telemetry, calibrate the mapping, and verify the virtual response to a physical movement. | [Computer-use evidence status](docs/showcase/README.md#computer-use): existing engineering records and the recordings still needed to demonstrate agent-operated UI work. |

The repository contains the application and automated checks. Live-device results must be tied to a recorded device session; synthetic replay is labelled as synthetic. This is a training prototype with virtual metrics, not a clinically validated simulator. Input is receive-only: the browser does not command motors or force feedback.

## Try it locally

Requires Node.js 22.12 or newer, as declared in [package.json](package.json).

```bash
git clone git@github.com:Cadastrophi/davinci-game-sim.git
cd davinci-game-sim
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. Start with the interactive synthetic controller: focus the arena, use **WASD / Q / E** to move and **arrow keys** to point. **Space** adjusts the camera while holding the tool fixed; **Shift** recenters the controller while holding both camera and tool fixed. Follow the [demo guide](docs/launch/LOCAL_DEMO.md) for calibration, drills, incision, and pause/recovery behavior.

For the physical controller, run on its connected computer in a Web Serial-capable browser, choose **Serial → Connect device**, and follow the [hardware checklist](docs/hardware/INPUT_HANDOFF.md). Default baud is 115200; verify actual framing and mapping on the device. The telemetry display distinguishes source, packet rate, age, and validity.

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

The reference submodules are optional for running the browser app. To inspect the pinned references, use `git submodule update --init --recursive`; the Unity reference is limited to UART ingestion evidence by [ADR 0001](docs/adr/0001-uart-reference-boundary.md).

## How the parts fit

```text
Physical controller → Web Serial → bounded parser → calibrated input facade
Synthetic input ──────────────────────────────────→ same facade
    → requested tool pose → collision / training → applied pose → scene + UI
```

Keeping input independent from rendering let agents work on each side of a shared contract. Tests can replay timing, stale input, and reconnect cases without pretending those fixtures prove physical-device performance.

## Repository map

| Path | Purpose |
| --- | --- |
| [src/contracts/](src/contracts/) | Shared input and simulation interfaces. |
| [src/input/](src/input/) | Serial transport, packet parsing, calibration, mock and replay sources. |
| [src/training/](src/training/) | Drill state, collisions, measurements and constrained incision. |
| [src/scene/](src/scene/) | Original arena, instrument and tissue rendering. |
| [src/app/](src/app/) / [src/ui/](src/ui/) | Application composition, controls and telemetry display. |
| [tests/](tests/) | Integration tests and deterministic fixtures; focused tests also live beside source. |
| [docs/showcase/](docs/showcase/) | Short evidence walkthrough and prioritized submission improvements. |
| [docs/launch/](docs/launch/) / [docs/hardware/](docs/hardware/) | Accepted specification, demo instructions and hardware handoff. |
| [docs/handoffs/](docs/handoffs/) / [docs/adr/](docs/adr/) | Agent delivery records and consequential decisions. |
| [AGENTS.md](AGENTS.md) | Agent operating contract; reusable skills are installed at device scope. |
| [references/](references/) | Pinned upstream references, separate from application code. |

Contributors: start with [AGENTS.md](AGENTS.md), [domain language](CONTEXT.md), and the [documentation index](docs/README.md). The active stack is Babylon.js, TypeScript and Vite; [ADR 0003](docs/adr/0003-browser-training-launch.md) explains the transition from the historical Unity plan.

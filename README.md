# Da Vinci game simulator

An original browser teleoperation-training game built with Babylon.js, TypeScript and Vite. The accepted experience is an anatomical practice arena with one virtual knife, modes 1–5 first, and constrained interactive incision afterward. Implementation is authorized; this documentation increment does not itself deliver a runnable game.

Start with [project intent](docs/PROJECT_INTENT.md), [accepted specification](docs/launch/SPEC.md), and [current run status](docs/launch/RUN_STATUS.md). Agents must also read [AGENTS.md](AGENTS.md) and the [documentation index](docs/README.md).

The current delivery target is localhost on the hardware-connected computer. Setup/run commands will accompany the runnable application baseline. Live hardware acceptance is separate from mock/replay evidence.

## Clone

```bash
git clone --recurse-submodules <repository-url>
```

For an existing clone:

```bash
git submodule update --init --recursive
```

The reference submodule supplies UART-ingestion evidence only; see [ADR 0001](docs/adr/0001-uart-reference-boundary.md).

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

## Run the browser baseline

Node 22.12+ or 24 LTS, then `npm ci` and `npm run dev`. Open http://127.0.0.1:5173 on the same computer. `npm test`, `npm run typecheck`, and `npm run build` validate the project; `npm run preview` serves a production build.

The first baseline is explicitly labelled replay and is not live hardware acceptance. E owns `src/contracts/index.ts` (launch-v1.1); H implements `InputFacade` in `src/input/index.ts`. Source units are virtual mm with +X right, +Y up, +Z toward the viewer; raw yaw/pitch remain degrees until H maps them. All clocks use the injected monotonic performance clock.

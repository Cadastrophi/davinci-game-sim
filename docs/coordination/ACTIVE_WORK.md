# Active work mirror

GitHub issues and pull requests in `origin` are the authoritative coordination surface. This file is a quick local mirror and can briefly lag behind the remote.

| Issue | Human owner | Agent | Branch | Expected paths / interfaces | Status | Last sync (UTC) |
| --- | --- | --- | --- | --- | --- | --- |
| [#12](https://github.com/Cadastrophi/davinci-game-sim/issues/12) | Justin / `Cadastrophi` | Master E | `Cadastrophi_app-controls` | App composition, event routing, shared logs | in progress | 2026-09-13 |
| [#17](https://github.com/Cadastrophi/davinci-game-sim/issues/17) | Justin / `Cadastrophi` | E training worker | `Cadastrophi_direction-drill` | `src/training/**`, alignment handoff | in progress | 2026-09-13 |
| [#8](https://github.com/Cadastrophi/davinci-game-sim/issues/8) | Jinyu / `Jin-underworld` | H serial worker | `Jin-underworld_serial-input` | `src/input/serial/**` | in progress | 2026-09-13 |
| [#11](https://github.com/Cadastrophi/davinci-game-sim/issues/11) | Jinyu / `Jin-underworld` | H mapping worker | `Jin-underworld_input-mapping` | `src/input/mapping/**` | in progress | 2026-09-13 |
| [#13](https://github.com/Cadastrophi/davinci-game-sim/issues/13) | Jinyu / `Jin-underworld` | Master H | `Jin-underworld_input-facade` | Input facade/providers, hardware evidence | in progress | 2026-09-13 |

Status values: `claimed`, `in progress`, `blocked`, `review`, or `merged`.

Remove merged rows after their handoff/intent/ADR record is sufficient. Never treat absence from this file as proof that no concurrent work exists; inspect GitHub.

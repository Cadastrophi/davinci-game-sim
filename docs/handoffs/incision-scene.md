# Incision scene — issue 27

Owner: Master E scene worker, branch `Cadastrophi_incision-scene`, worktree `/private/tmp/davinci-e-incision-scene`. Base is the reviewed additive-contract commit `8d5fd2a86af4dbdaa30e61244030e70194eca7e3`; the same contract is now merged at `382204caadd06fa04365f91e247f958ef7aeddc8`. Parent owns updating the publication branch onto current main, review and integration.

## Delivered behavior

The existing SceneFacade consumes the optional incision DTO only when `exercise.mode` is `incision`. Two independent pre-tessellated half meshes meet at the initial seam; no triangle connects opposite sides. Cut segments displace seam vertices up to 3 mm per side and curl nearby tissue upward by up to 0.66 mm, tapering to unchanged outer edges. Interior walls descend to y=14 and expose a dark recessed tissue core. The patch has outer walls and rests above the decorative anatomy.

The implementation supports the agreed fixed horizontal patch only: seam x=-25..25, y=18, z=0, outer half-width 15 mm and 20 cut segments. Each segment has a midpoint station. Its midpoint opens only when marked cut; shared boundaries open only when both adjacent segments are cut. This keeps uncut segments closed, gives an isolated cut a tapered opening and leaves the two finite seam endpoints pinned. It is a constrained seam demonstration, not arbitrary mesh cutting or biomechanics.

Rendering never advances cut state, generates contact or awards coverage. It rebuilds position/normal buffers only when the cut mask changes. Repeated snapshots are inert; reset cut masks restore the original positions. Leaving incision hides the complete patch, and the normal scene remains available. Scene disposal releases these meshes and materials with the parent scene.

## Validation

- `npm test -- src/scene`: 6 tests passed, including 3 new focused incision tests.
- Tests check independent half topology, marked-segment-only opening, fixed outer vertices, surrounding deformation, recessed walls, bounded mesh count, snapshot immutability, hidden state and reset restoration.
- `npm run typecheck`: passed.
- `git diff --check`: passed.
- No assets copied or generated; all geometry/materials are original procedural work.

Parent must combine training/UI and browser-check incision visibility, actual contact-driven opening, reset, mode exit and frame time. No browser or hardware acceptance is claimed by these headless checks. Write scope was `src/scene/**` plus this handoff; no app/input/training/contracts were edited.

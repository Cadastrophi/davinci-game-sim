# Issue 7 — Procedural anatomical scene

- Owner: Master E scene worker; branch `Cadastrophi_anatomical-scene`.
- Base: `34baec7aecd9ecdb601aeceec1715587205655d6`; contract `launch-v1.1`.
- Intent: provide the original anatomical practice arena, virtual knife and snapshot-driven feedback without taking input, exercise or camera-control ownership.
- Scope: `src/scene/**` and this handoff only. No sourced assets, textures or reference-repository content were used.

## App integration

Import `createScene` from `src/scene/index.ts`, pass the center viewport canvas and call `render(SceneSnapshot)` once per app animation frame. The scene starts no animation loop or keyboard listeners. App owns resize-event routing and calls `resize()` when viewport dimensions change. Call `dispose()` on teardown; it releases both scene and engine. The existing replay bootstrap should be replaced by E app wiring, not composed as a second Babylon engine on the same canvas.

Camera starts at the contract home with contract forward direction. Snapshot rendering changes position only; orientation and FOV remain fixed. App remains responsible for camera bounds. All scene coordinates are virtual mm.

## Geometry and behavior

The tissue pad is original vertex-colored geometry with shallow lobules, small branching vessels and a rolled metal tray on a dark teal drape. Anatomy is illustrative and has no collision authority. Decorative tissue is approximately y=0–7 mm, within x ±68 and z ±43. Training owns all obstacles and target positions.

The knife tip is exactly the applied pose position. Its blade extends 16 mm backward along the supplied pointing direction within radius 2 mm; the handle extends farther and is decorative. This matches the agreed short-blade collision approximation, not a full-handle collider. Local -Z is forward. Synthetic twist uses world up with an X reference near vertical; it is a display convention, not measured roll. Null/degenerate direction renders the default -Z direction and must retain the UI's unavailable-direction label.

Targets show their positional-tolerance ring, a center point, a vertical depth guide, and an arrow when direction is supplied. The scene applies no scoring or input smoothing. Amber boxes match the supplied obstacle bounds; active contact strengthens their visibility. A faint requested knife appears only on mismatch. The optional trail holds at most 96 vertices, avoids duplicate positions and resets on mode change/ready/off. It is a visual history, not a path metric.

## Verification

- `npm ci`: passed, zero reported vulnerabilities.
- `npm test`: 6 passed, including 3 NullEngine scene integration tests.
- Scene tests exercise camera translation without rotation/FOV or tool movement, tip placement and pointing orientation, ghost visibility, obstacle removal, bounded trail/mesh count, target placement and disposal.
- `npm run build`: typecheck and production build passed. The baseline entry does not import the new scene yet, so its bundle output does not measure the integrated scene size.
- Parent acceptance still required: wire the scene and inspect actual WebGL output, target/knife readability, canvas resizing, shadows and frame time. Headless tests do not verify visual quality or live hardware.

The next owner is Master E for independent review, app wiring and browser acceptance. This worker does not push, publish a PR or merge.

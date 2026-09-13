# Issue #37 — first-person navigation presentation

## Intent and ownership

Justin requested a single-arm first-person presentation for Direction alignment, Obstacle navigation, and Camera & navigation. Incision retains the existing table, slab, and cut geometry. This branch owns scene-only presentation paths and consumes the existing contracts without modification.

## Visual implementation

- `public/assets/environment/anatomical-cavity-navigation.png` is a static original backdrop generated with OpenAI's built-in image generation tool on 2026-09-13.
- Prompt intent: a non-graphic, non-clinical, warm endoscopic cavity with an open central navigation corridor; the supplied screenshots were mood/composition references only. The prompt explicitly excluded copied UI, instruments, logos, text, blood, gore, and the meat slab.
- The single arm is original procedural Babylon.js geometry rather than a copied reference asset. The revised model uses a tapered dark cannula, brushed-metal shaft, articulated wrist ball, paired clevis rails, transverse pivot pin/caps, twin tendons, curved jaws and individual serration teeth. It is camera-space presentation only and follows applied pose with bounded screen movement.
- `align`, `obstacle`, and `camera` use the first-person presentation. Other modes preserve the existing table view, including `incision`.

## Behavioral boundary

Targets and protected volumes stay real world-space meshes. Training, swept collision, scoring, camera controls, mapping, and UART ingestion are unchanged. WASD/QE and arrow keys already create timestamped mock samples through the same input facade consumed by serial samples.

## Validation record

- Focused scene test: 4 passing tests, including navigation-mode presentation switching, applied-pose arm movement, and incision restoration.
- Full suite: 19 files / 181 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; the pre-existing Babylon bundle-size warning remains.
- Codex in-app browser walkthrough at `http://127.0.0.1:5174`: Direction alignment showed the revised wristed grasper over the cavity backdrop; repeated `D` presses changed the mock stream from X 0.0 to X 10.1 and advanced the measured path to 30.3 mm; Constrained incision restored the table/slab and seam geometry. Frame telemetry remained about 16.6–16.7 ms during the walkthrough.

This work does not claim clinical anatomy, physical-arm accuracy, live hardware validation, or measured end-to-end controller latency.

# 0002 — Browser-native prototype stack

- Status: proposed
- Date: 2026-09-13
- Owners: Justin / reviewing agent

## Context

The first playable release has a five-hour implementation window, one physical pose controller, one virtual scalpel, two compact navigation exercises, and an HTTPS deployment target used in Microsoft Edge on Windows 11. The repository contains no Unity game implementation that must be preserved.

Hardware access from the deployed page depends on the Web Serial API. A Unity Web build would still need a JavaScript interoperability layer for Web Serial, while a browser-native stack can use the API directly.

## Proposed decision

Build the prototype with TypeScript, Vite, Babylon.js, WebGL, native HTML/CSS controls, and the Web Serial API. Deploy static output over HTTPS.

Keep four boundaries explicit:

1. Web Serial transport and byte buffering.
2. Bracketed-packet framing, numeric parsing, and validation.
3. Hardware-independent pose, calibration, and software-clutch state.
4. Rendering, exercise state, collision feedback, and results.

## Consequences

- Edge can request and open the serial device directly from a user gesture.
- The five-hour effort avoids a Unity-to-JavaScript serial bridge and Unity Web build overhead.
- Babylon.js provides a browser-oriented scene and rendering layer, but the scalpel still needs purpose-built collision volumes and swept collision checks.
- The prototype remains tied to browsers that implement Web Serial and to HTTPS or another secure context.
- Choosing this proposal requires updating Unity-specific wording and workflows when implementation begins; repository Git coordination rules remain unchanged.

## Alternatives considered

- **Three.js:** feasible and lightweight, but expects the application to supply more gameplay and collision behavior. It remains a reasonable fallback if the implementers have materially stronger Three.js experience.
- **Unity Web:** mature editor and physics workflow, but adds browser interop for Web Serial and build overhead without reusable Unity gameplay in this repository.
- **Godot Web:** offers an editor-driven engine, but provides no clear schedule advantage for the narrow browser and Web Serial scope.

## Evidence

- Web Serial requires a secure context and provides `requestPort()`, `getPorts()`, serial read streams, and connect/disconnect events: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API>
- The browser prompts for device selection through `navigator.serial.requestPort()` and opens the selected port with an explicit baud rate: <https://developer.chrome.com/docs/capabilities/serial>
- Microsoft Edge can centrally allow or block serial API access through policy: <https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/DefaultSerialGuardSetting>
- Unity Web supports desktop Edge, while browser JavaScript interoperation requires a JavaScript plug-in or direct script call: <https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-browsercompatibility.html> and <https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-interactingwithbrowserscripting.html>
- Three.js describes itself as the 3D system while application gameplay and collision behavior remain application concerns: <https://threejs.org/manual/en/game.html>

## Follow-up

- Peer-review the recommendation before accepting this ADR.
- Confirm that the deployment host permits Web Serial through its response policy and serves HTTPS.
- Run the first deployed hardware probe before investing in presentation or exercise polish.

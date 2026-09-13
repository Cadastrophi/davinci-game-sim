# UART reference repository

`references/idp-unity-simulation` is pinned as a Git submodule to preserve an auditable source for robot-arm UART command ingestion.

## Permitted questions

- Where serial/UART data enters the Unity application.
- How input is buffered, framed, delimited, decoded, validated, and dispatched.
- Which command names, argument shapes, numeric units, ranges, and error behaviors are observed.
- How malformed, partial, duplicated, delayed, or unknown commands are handled.

## Prohibited adoption

Do not use the submodule as a source for graphics, assets, scenes, prefabs, gameplay, UI, shaders, physics choices, project settings, or general architecture. Do not add it as a Unity package or runtime dependency.

## Investigation record template

- **Pinned commit:**
- **Files inspected:**
- **Observed input/framing:**
- **Observed command grammar:**
- **Observed validation/error behavior:**
- **Uncertainties:**
- **Independent design decision / ADR:**
- **Tests derived from behavior:**

Update this document after the submodule is inspected; cite exact paths and the pinned commit rather than relying on memory.

## Bootstrap investigation — 2026-09-13

- **Pinned commit:** `82355ee9af89de9c26101af1f07744565ddcc88c` (`main` at the time the submodule was added).
- **Unity version:** `6000.1.3f1`, from `ArmRobot/ProjectSettings/ProjectVersion.txt`.
- **Files inspected:**
  - `ArmRobot/Assets/Scripts/Controller.cs`
  - `ArmRobot/Assets/Scripts/MouseWoundTest.cs`
  - `ArmRobot/Assets/Scripts/KnifeMovement.cs`
- **Observed transport:** `System.IO.Ports.SerialPort`; Windows defaults `COM3` or `COM5`; `115200` baud; ASCII; DTR and RTS enabled; 200 ms read timeout.
- **Observed framing/threading:** a background thread blocks on `ReadLine()` with newline set to `\n`, trims non-blank lines, and enqueues them in a `ConcurrentQueue<string>`. Timeout is ignored, closed-port errors stop the loop, and I/O errors are treated as transient. Shutdown clears the run flag, joins for up to 300 ms, then closes and disposes the port.
- **Observed queue policy:** `Controller.cs` drains at most five messages per Unity frame. `MouseWoundTest.cs` instead drains the queue and uses only the newest packet, preventing stale pose updates. `KnifeMovement.cs` drains at most five.
- **Observed packet shapes:** `MouseWoundTest.cs` accepts bracketed or unbracketed comma-separated data with at least six invariant-culture floats: `x, y, z, yaw, pitch, roll`. Position is interpreted as millimetres; orientation is interpreted as radians and converted to degrees. `KnifeMovement.cs` expects exactly seven values, with the seventh acting as a camera-control flag (`1.0`) versus pose data.
- **Observed mapping:** position deltas are mapped from robot axes to Unity as `(robot Y, robot Z, -robot X)` and millimetres are converted to metres. The first packet establishes position and rotation origins. Orientation can be origin-relative or incremental.
- **Observed validation/error behavior:** the newer six-value parser uses `TryParse` and silently rejects short or non-numeric packets. The seven-value parser warns on wrong arity and catches `FormatException`. There is no checksum, sequence number, explicit version, bounds checking, reconnect strategy, cancellation token, or structured error channel.
- **Important caveat:** calls to `ProcessSerialData()` and `serialMove()` are commented out at the pinned revision. The code documents intended parsing behavior but is not evidence that pose packets are currently applied during `Update()`.
- **Independent design direction:** separate serial transport, line framing, packet parsing, validation, and Unity-main-thread dispatch. Define a versioned command/pose contract and deterministic parser tests before connecting it to simulation behavior.
- **Tests to derive later:** partial line and timeout; blank line; six versus seven fields; brackets/whitespace; invariant decimal separator; invalid numeric token; NaN/infinity and range rejection; latest-packet policy; axis/unit conversion; first-packet origin; clean shutdown; disconnect/reconnect.

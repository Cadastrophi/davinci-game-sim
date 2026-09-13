# Teleoperation training context

The domain is a controller-driven practice arena with targets, protected obstacles and a virtual instrument. Product requirements live in [project intent](docs/PROJECT_INTENT.md) and the [accepted specification](docs/launch/SPEC.md).

## Language

**Simulator:** The original teleoperation-training application in this repository; its virtual performance measures are not validated clinical or physical-arm accuracy measures.

**Controller:** The physical robot arm whose reported pose supplies the user's input.

**Telemetry packet:** A received controller pose report.
_Avoid_: UART command, motor command.

**Raw pose sample:** A validated controller report with position, supported angles, source and host receive time. Placeholder roll is unavailable.

**Tool pose:** The virtual instrument's world position and supported pointing direction.

**Requested pose:** The calibrated input demand before contact handling.

**Applied pose:** The virtual instrument pose after contact handling; the pose used for exercise measurements.

**Camera adjustment:** A Space-held pan/dolly interval during which the tool world pose stays fixed.
_Avoid_: Tool clutch, camera orbit.

**Rebase:** Re-anchoring controller input to the current applied pose so control resumes without a discontinuity.

**Virtual mapped direction:** A calibrated pointing direction used by the game without asserting measured physical shaft orientation.

**Physically validated direction:** A pointing mapping supported by recorded checks on the connected device. It does not imply measured axial roll.

**Contact episode:** A continuous encounter with a protected obstacle, producing one penalty until contact is released.

**Dwell:** Continuous eligible time within all required target tolerances.

**Protected obstacle:** A blocking volume that cannot be cut.

**Cuttable tissue:** The designated practice patch whose geometry can separate and deform through instrument contact in incision mode.

**Reference repository:** `references/idp-unity-simulation`, retained solely as evidence for UART receipt, framing, parsing, validation and dispatch.

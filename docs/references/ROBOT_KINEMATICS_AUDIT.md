# Robot kinematics evidence — planning only

Source: `references/foc-motor-test` at commit `b1a857e3bc9985f3f8a7deab6ec1876dd57b7017`. Paths below are relative to this reference. Read-only source inspection; no firmware execution, hardware access, or changes to the reference. The source expresses a model, not proof that the currently assembled device or flashed firmware matches it.

## Model and observability

**User update after audit:** J0–3 form the serial linkage, with J3 independently movable; J4/J5 each permit ±pi/4 from DH neutral, and J6 is now fixed. Running firmware explicitly substitutes zero roll because no roll encoder is installed. The archived seven-joint model below remains source evidence; it is not a complete description of this updated hardware. Fixed J6 value, J3 angle limits and neutral-coordinate conversion remain to be resolved. A known fixed joint angle is sufficient for FK without its encoder, provided all movable angles are measured and the model is calibrated. Treat the transmitted zero as unavailable orientation information.

A parent-agent geometric Jacobian calculation for the six movable joints J0–5 at illustrative q=[0.2,0.8,0.5,0.3,0.2,0.1,0] rad gave rank six with J6 fixed. Linear rows were scaled by 300 mm; the 6x6 determinant was approximately 0.0833872. This demonstrates generic six-dimensional capability of the archived mathematical model, not a verified physical workspace or an assertion that this illustrative configuration obeys the user's DH-neutral bounds. The same FK configuration yields Euler roll≈9.654 degrees despite fixed q6=0.

- `include/kinematicsConfig.h:13–14` declares 7 joints and 4 active joints. Seven AS5600 sensor objects are instantiated and initialized (`lib/sensorHelper/sensorHelper.cpp:9–16,46–53`). FK reads all seven (`lib/forwardKinematics/forwardKinematics.cpp:64–77`). Four motor loops run (`src/main.cpp:322–333`). Thus four actuators must not be confused with four sensed degrees of freedom.
- Joint labels are base J0, shoulder J1, elbow J2, compensator J3, pitch J4, no-motor J5 and J6 (`include/motorConfig.h:49–103`). J4's label mentions a motor but its setup is absent/commented; the code establishes sensing, not installed actuation, for J4–6.
- FK implements **standard DH**, `Rz(theta) Tz(d) Tx(a) Rx(alpha)`, visibly from the matrix in `lib/forwardKinematics/forwardKinematics.cpp:49–58`. Distances are millimetres, angles radians. Effective theta is sensor-calibrated q plus THETA plus DH_ZERO_OFFSET (`:71–77`). The seventh transform is pure `Rz(q6)` with no translation.

| Joint | a (mm) | d (mm) | alpha (degrees) | Fixed theta offset (degrees) |
| --- | ---: | ---: | ---: | ---: |
| J0 | 0 | 160.3 | 90 | 0 |
| J1 | 160.5 | 0 | -180 | 0 |
| J2 | 152.61 | 0 | 90 | -37.5 |
| J3 | 0 | 92.65 | -90 | -90 |
| J4 | 0 | 0 | 90 | -90 |
| J5 | 0 | 0 | -90 | 0 |
| J6 | 0 | 0 | 0 | 0 |

Table combines the live arrays in `include/kinematicsConfig.h:53–57` with `forwardKinematics.cpp:77`; do not use the older commented DH tables. Base transform adds +62.5 mm in Z (`kinematicsConfig.h:75–80`). `T6E` is identity and unused by the live FK (`:83–88`; `forwardKinematics.cpp:101–108`). Confirm the intended scored tool point: current model locates the wrist centre, with no distal tool offset.

Derived from this model: position depends on J0–2; J3–6 provide wrist orientation at a common centre. A standalone geometric-Jacobian arithmetic check using these arrays at illustrative, **unconstrained** q = [0.2,0.8,1.2,0.3,0.4,0.5,0.6] rad produced rank 6 for the 6×7 Jacobian (linear rows divided by 300 mm solely for numerical scaling). This proves generic full-pose capability of the mathematical model, not reachability of that configuration on the hardware. Independent physical mobility, couplings, current limits, and calibration remain unverified.

## Limits are incomplete and not enforced by the shown loop

| Joint | Declared lower, upper (radians) | Status |
| --- | --- | --- |
| J0 | -0.785, +0.785 | Defined, `include/motorConfig.h:54–55` |
| J1 | -0.006, 1.600 | Defined, `:62–63` |
| J2 | 0.004, 2.627 | Defined, `:70–71` |
| J3 | -0.751, -0.751 | Identical bounds, `:78–79`; not a usable motion range |
| J4–6 | none | Example macros are commented, `:86–103` |

Target clamping is commented out (`src/main.cpp:302–306`). Home checks/calls and button-wait are also commented while completion messages remain (`:241–284`). These declarations cannot establish current physical hard stops or firmware enforcement. FK uses `_normalizeAngle` after calibration (`sensorHelper.cpp:121–152`); signed negative limits need a consistent unwrapped/calibrated coordinate convention before comparisons. J6 reads `JOINT0_SENSOR_DIRECTION` instead of `JOINT6_SENSOR_DIRECTION` (`:145`); both currently equal CCW, so latent configuration defect, not presently a sign mismatch.

## Existing Jacobian cannot validate full-pose targets

`lib/forwardKinematics/jacobianMatrix.cpp:45–69` builds only three transforms and stops at J3 origin, excluding the 92.65 mm wrist offset. It also omits the THETA and DH_ZERO_OFFSET additions used by FK. `Jacobian` storage is 6×7 (`jacobianMatrix.h:14–16`), but only columns 0–2 are assigned (`jacobianMatrix.cpp:150–163`), leaving the other four uninitialized. Joint-velocity population also fills only three entries (`:34–41`) while multiplication consumes seven (`:201–212`). The determinant check (`:374–393`) covers only the outdated 3×3 translational model; it is not an orientation singularity calculation or a full-model conditioning test.

Plan to rebuild a geometric Jacobian from the same calibrated full DH chain, validate all columns against FK finite differences, and assess position and angular conditioning with explicit scaling. Sample targets in validated joint space, then apply collision, joint-margin, and trajectory checks; Cartesian position alone cannot identify the current redundant configuration. No complete reachable or collision-free workspace is justified by the present limits.

## Telemetry and browser implications

`src/main.cpp:381–407` prints pose after >10,000 microseconds then resets the time after printing: nominal up-to-about-100 Hz, not measured 100 Hz or guaranteed latency. Seven sensor reads are sequential. Serial2 uses 115200 (`include/boardConfig.h:83`; `src/main.cpp:96–101`), with debug output on the same stream.

`lib/forwardKinematics/forwardKinematics.cpp:143–154` emits newline-delimited `[x, y, z, yaw, pitch, roll, 0]`, positions in mm and angles in degrees (2 decimals). Orientation extraction is ZYX Euler (`:120–123`), mathematically Rz(yaw) Ry(pitch) Rx(roll). Final zero is a literal placeholder, not measured grip or seventh joint. No joint angles, timestamp, sequence number, calibration identifier, or validity flags are sent by the active loop. Raw joint debug printing exists but is disabled (`src/main.cpp:384–387`; `sensorHelper.cpp:159–167`).

This stream can drive a visual pose trainer. For current joint-limit warnings, configuration-specific singularity scoring, or redundant-arm visualization, transmit calibrated q0–q6 (ideally timestamp/sequence/model version) as well. Pose alone is insufficient to recover a unique 7-joint configuration. Use rotation matrices/quaternions after conversion for scoring so Euler gimbal lock is not mislabeled a mechanical singularity. Coordinate mapping to the browser needs a documented axis/unit calibration; this source only defines robot-base coordinates.

## Derived positional singularities (model only)

Reducing the live standard-DH chain to the modelled wrist centre gives, with calibrated q in radians and lengths in mm:

```text
A = 160.5
B = sqrt(152.61^2 + 92.65^2) = 178.53245
c = radians(37.5) + atan2(92.65, 152.61) = 1.20012445 rad
phi = q1 - q2 + c
rho = A*cos(q1) + B*cos(phi)
x = rho*cos(q0)
y = rho*sin(q0)
z = 222.8 + A*sin(q1) + B*sin(phi)
det(J_position) = -rho*A*B*sin(q2-c)
```

Consequently the translational model is singular at `q2 = c mod pi` or `rho = 0`. The first relevant elbow value is approximately **68.7621 degrees**, inside the declared J2 range. A model example of the base-axis case is q1=1.2, q2≈0.4975145 rad, with rho≈0 and z≈541.1863 mm, also inside the declared J1/J2 intervals. The research agent cross-checked the analytical determinant with FK finite differences.

These are mathematical results for the source's calibrated model and wrist-centre point, not certified physical target locations. Tool offsets, actual coupling and forbidden regions still need confirmation. Positional singularities are only part of the full pose analysis; the wrist's orientation singularities still require the complete Jacobian and actual movable-joint constraints.

## Remaining hardware questions

1. Does this commit match the currently flashed hardware, and can all seven joint sensors and passive wrist axes be used while a person freely moves the handle?
2. What are the measured calibrated hard/comfortable limits for J3–6, and are the J0–2 bounds accurate? Is the compensator mechanically coupled or constrained?
3. What point and axis of the handle should be the scored pose? Is tool roll physically meaningful, or should initial drills score direction only?
4. Can firmware telemetry be extended to raw/calibrated joint angles, timestamps and validity? What USB/UART adapter and desktop OS will the demo use?
5. Are there body/table/self-collision regions or cable restrictions, and does the browser only consume telemetry while motor/force control stays on the device?

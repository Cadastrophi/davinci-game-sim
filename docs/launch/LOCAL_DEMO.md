# Local demonstration

Use Node 22.12 or newer. From the reviewed checkout, run `npm ci`, then `npm run dev`. Open http://127.0.0.1:5173. For the built version, run `npm run build` then `npm run preview`. The demo runs locally; no hosting account is needed.

## Controls

The default source is an interactive synthetic controller. Click the field to focus it. WASD moves across the field; Q/E moves down/up; arrow keys change virtual pointing direction. Taps make fine steps and holds move continuously. These are virtual inputs, not hardware observations.

Hold Space and move to pan/dolly the camera. Tool world position and direction remain fixed; camera orientation and FOV remain fixed. Release keeps the new view and rebases the tool without a jump. Space does not capture typing or setup controls.

Hold Shift to reposition/recenter the controller while both camera and instrument stay fixed. Release Shift to resume without a position or direction jump. Shift takes precedence over Space; press Space again afterward to adjust the camera. Recenter pauses exercise time, dwell and cutting. Stale input, source changes, disconnect or lost focus cancel automatic release-to-resume; release Shift and explicitly Resume after recovery. Shift in setup fields retains normal typing behavior.

Select a drill to start. Reach requires a continuous 0.5-second hold within 10 mm; alignment also requires direction within 10 degrees. Obstacle navigation blocks the short blade against protected volumes and counts one contact episode until separation. Camera navigation requires a new camera adjustment of at least 5 mm requested displacement before each target acquisition. Protected volumes are non-cuttable.

Hold the controller in its neutral position, then choose Calibrate / set center. That raw pose becomes the simulator home position. Resume rebases after a pause without moving the instrument. Reset clears the current exercise and returns both the instrument and camera home. If an obstacle drill cannot start because the blade overlaps a protected volume, Reset or use Free practice to move clear and retry.

A stale stream, source change, blur or hidden page pauses control. Fresh data alone never resumes it; choose Resume or calibrate deliberately. Background-tab throttling can trigger this pause. Intentional Space adjustments count elapsed time; outages and explicit pauses do not.

Replay is a 40-second synthetic event sequence with truthful replay provenance. It ends with a stale-input pause. Select another source and Replay again to restart. It is not a recording from the physical controller.

## Constrained incision

The sixth mode opens an actual pre-tessellated tissue seam. It is a constrained demonstration with a fixed 50 mm seam, 20 segments and a 30 mm wide patch, not arbitrary mesh cutting or a clinical tissue model. Move the applied tip within 2 mm of the seam and 0–3 mm below its surface. Coverage comes from movement through that corridor; holding still does not cut. The two surface halves separate and curl outward where segments are cut, revealing recessed walls and interior.

For a mock demonstration from a fresh page: select Constrained incision, click the field, and use A/D along the seam. The initial tip is on its center at the surface. Move toward each end to open the whole seam; use Q/E for depth. Protected volumes flank the patch and remain blocking. Coverage, depth and seam offset appear above the field. Reset restores uncut geometry while preserving the tip pose. Space, pause and stale input cannot cut or join a stroke across an interruption.

## Physical controller

On the controller computer, choose Serial, then Connect device in a Web Serial-capable browser. Select the actual port. Defaults are 115200 baud, 8 data bits, no parity, one stop bit and no flow control; confirm framing on the actual device. Center the controller, select the correct axis permutation/signs/gains, then calibrate. Device input is receive-only.

The top-right stream panel reports the live raw XYZ, yaw/pitch and packet sequence; it is labelled UART STREAM for the serial source. The bottom telemetry bar reports input provenance, rate, age and validity; the selected setup source can differ while waiting for connection. Direction remains virtual-mapped unless independently validated; roll is unavailable. See [H's checklist](../hardware/INPUT_HANDOFF.md) for live acceptance. Automated fixtures and browser mock checks are not live-device evidence.

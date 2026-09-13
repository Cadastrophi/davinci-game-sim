# Serial input handoff — issue #8

Owner: Master H serial worker, `Jin-underworld_serial-input`. Parent owns publication and Master E owns merging. Base: `34baec7aecd9ecdb601aeceec1715587205655d6`; shared contract `launch-v1.1`.

## Intent and boundaries

Implement the authorized receive-only browser input lane behind H's facade. This slice writes only `src/input/serial/**` and this handoff. It does not own shared contracts, calibration, app/UI wiring, scoring, firmware or output controls. Parent records the shared intent/coordination entries. No reference source code was copied.

## Integration API

`src/input/serial/index.ts` exports `createSerialTransport({ now?, onSample, onState?, serial?, secureContext? })`, plus `SerialStatus`, `SerialAccess` and `SerialPortLike` for injection. Omitting serial/context uses the browser environment; explicit `serial: null` models missing support. All time uses the injected monotonic clock, or `performance.now()`.

The returned object has `requestDevice()`, `refreshGrantedDevices()`, `connect(deviceId, settings?)`, `disconnect()`, `dispose()`, `getStatus(nowMs?)`, and `latestSample()`. Request/connect return shared `Result`; disconnect/dispose return promises. Status is `Omit<InputStatus, 'calibration'>` with source `serial`. `onState` reports connection/error changes; poll status for advancing age/rate/counters. `onSample` receives the latest valid shared `RawPoseSample` from each read. Connected state is emitted before any samples. Callbacks should not throw.

Device IDs are opaque session-local descriptors, with USB VID/PID labels when available. Call `requestDevice()` directly from a user gesture. Granted devices can be refreshed without opening them. Transport opens only the validated 115200-baud, 7/8-data-bit, 1/2-stop-bit, none/even/odd parity, no-flow-control settings. Defaults remain 8-N-1 pending hardware verification. No writer or modem-control API is acquired or called.

## Parsing and timing semantics

One ASCII bracket candidate is retained, at most 512 bytes including brackets. Overflow or nested opening brackets abandon the old candidate and count one invalid candidate; surrounding noise does not count as a packet. A closing bracket validates exactly seven finite decimal fields. Signs, decimal exponents and ASCII whitespace are accepted; empty/nonfinite/hex/partial fields are rejected. No newline is required. Reconnect clears any incomplete packet.

Every valid packet advances lifetime sequence and rate counters, while only the newest valid pose per read is emitted. Invalid packets do not refresh the latest sample. XYZ are mm, yaw/pitch degrees, and output roll is always `null`. The separately exported parser's `ParsedPose.wireRoll` and `unused` are diagnostic values, never measured orientation or controls.

Receive time belongs to the read containing the closing bracket. It is not a sensor timestamp. Before any sample, age is null; otherwise status computes age on demand. Age alone does not establish connection or eligibility: H must also gate connection, calibration and deliberate resume. `latestSample()` retains the last valid sample for diagnostics after disconnect; reconnect does not synthesize or re-emit it. H enforces the contract's strict freshness interval `0 <= age < 250 ms`.

Packet rate is a bounded approximation over the current 100 ms bin and previous nine bins, counting all valid packets. It is zero when disconnected and expires naturally during silence. Invalid count and sequence persist for this transport's lifetime; rate clears on connect.

## Lifecycle behavior

One session owns one reader. Disconnect marks that session stopped before cancelling; it waits for a pending open, cancels a pending read, waits for lock release, and closes. Concurrent disconnect/dispose calls share cleanup. Pending selection after disposal is discarded. Samples resolving after disconnect are ignored. Connect during an existing connection/cleanup fails explicitly.

Stream EOF reports disconnected; read errors report error and close the session. There is no automatic reconnect or repeated read-retry loop. USB removal is detected through the readable stream error. A caller must reconnect and H must require deliberate fresh resume. An API-level close failure is surfaced as a cleanup error and retains session ownership; reconnect stays blocked until another disconnect successfully retries cleanup. Cleanup cannot impose a wall-clock guarantee on a browser/device `open()` or `close()` that never settles.

## Verification and next owner

Automated tests cover byte splits, multiple packets, nested/noisy/oversized/malformed recovery, finite decimal grammar, unavailable roll, receive timing/rate, reader cancellation, duplicate disconnect, reconnect, pending-open cancellation, disposal during selection, queued-read suppression, stream error/EOF, failed open, opaque devices and unsupported contexts. The fake port throws on any writer or signal access and verifies the reader is unlocked before close.

Validation performed on Node v24.19.0:

- Native smoke against the actual TypeScript production files, using `node --experimental-transform-types --input-type=module` and a local import-resolution hook: PASS for bounded overflow/recovery, newest-packet sequence, unavailable roll, cancellation/unlock, reconnect and disposal.
- Additional native lifecycle assertions: PASS for retained ownership after transient close failure, successful cleanup retry, blocked reconnect during failed cleanup, and disconnect during pending open.
- `git diff --check`: PASS.
- Full TypeScript check at `e3836f1`: PASS. Command: `/home/underworld/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/davinci-h-deps/node_modules/typescript/bin/tsc --noEmit`.
- Full Vitest suite at `e3836f1`: PASS, 7 test files and 57 tests, 3.42 seconds. Command: `/home/underworld/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/vitest/vitest.mjs run`.

Automated checks are complete; no code corrections were needed after dependency installation. Parent coordinates independent review and the READY handoff for draft PR #20. No physical device or browser serial acceptance is claimed. Parent integrates the factory into `src/input/index.ts`, reviews these changes, publishes the PR and supplies it to E. Actual hardware still needs settings/packet/axis/rate verification.

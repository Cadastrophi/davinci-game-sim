# Coordination protocol

## Peer handshake

```text
Issue/outcome:
Human owner / agent:
Branch:
Expected paths and interfaces:
Dependencies on your work:
Overlap found:
Requested acknowledgement or proposed split:
```

An acknowledgement should identify the agreed file/interface owner and integration order. Silence is not acknowledgement when work overlaps.

## Collision check

- Fetch and prune `origin`.
- Inspect open issues, PRs, remote branches, and `docs/coordination/ACTIVE_WORK.md`.
- Compare expected paths, not only existing diffs; two agents may not have pushed yet.
- Compare contracts, Unity scenes/prefabs/project settings, serialized data, and build configuration even when filenames differ.
- Repeat immediately before push and merge.

## Handoff check

- Branch and exact commit are named.
- Working tree state and unpushed commits are disclosed.
- Completed and remaining work are separated.
- Decisions, assumptions, failures, and validation are recorded.
- Receiver fetches, verifies the commit, inspects state, and acknowledges before writing.

## Merge gate

- Intent and acceptance criteria are still current.
- One accountable owner exists.
- Required peer acknowledgement is recorded.
- Feature branch includes current `origin/main`.
- Automated and manual checks are recorded and passing, or exceptions are explicit.
- No new overlapping PR/branch has appeared.
- Conflict resolution preserved both documented intents.
- Follow-up ownership and documentation are complete.

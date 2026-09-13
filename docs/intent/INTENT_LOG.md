# Intent log

Append one compact entry for each non-trivial task. Do not rewrite earlier entries; add a correction that points to the superseded entry.

## 2026-09-13 — Repository governance bootstrap

- **Requested by:** Justin
- **Outcome:** Establish agent-first documentation, project-local skills, concurrent Git workflow, GitHub collaboration, and a UART-only reference submodule.
- **In scope:** `AGENTS.md`, documentation boilerplate, skill installation and creation, Git/GitHub initialization, collaborator invitation, reference submodule.
- **Out of scope:** Any simulator/game implementation or adoption of unrelated code from the reference repository.
- **Assumptions:** Repository name `davinci-game-sim`; private visibility by default; `main` is integration-only; `Cadastrophi` represents Justin.
- **Acceptance:** Another agent can determine intent, claim work, choose a branch, coordinate overlap, prepare a PR, merge safely, and understand the submodule boundary without asking a human to operate Git.

## 2026-09-13 — Single-controller teleoperation game discovery

- **Requested by:** Justin
- **Outcome:** Preserve the complete discovery record for a five-hour, browser-accessible teleoperation game and hand it to a reviewing agent to generate two coordinated GPT-6 Astra implementation prompts.
- **In scope:** Da Vinci Skills Simulator functional translation; Web Serial feasibility; the immutable seven-field UART pose stream; one virtual scalpel; software clutch; two navigation exercises; engine comparison; architecture; milestones; risks; open decisions; and a safe two-agent ownership split.
- **Out of scope:** Physical patient-side arms, two-handed control, firmware changes, clinical or surgical-training claims, proprietary assets/code/branding, advanced tissue simulation, suturing, energy tools, scoring equivalence, user accounts, and backend services.
- **Constraints:** Windows 11 Microsoft Edge; hosted HTTPS link; USB-to-UART adapter; `15600` baud as supplied pending hardware verification; bracket-delimited ASCII packets without a required CR terminator; one fixed controller; immediate hardware access; five-hour implementation window; two agents on separate computers.
- **Assumptions needing confirmation:** XYZ units and axis directions; whether navigation alone or visible cutting is required; collision response and collider extent; target orientation; exact Space behavior; and whether `15600` is the verified baud rate rather than `115200` or another common setting.
- **Acceptance evidence:** A reviewer can recover every known requirement, distinguish decisions from recommendations, identify technical risks, and generate two non-overlapping implementation prompts without relying on chat history.
- **Supersedes / superseded by:** Refines the product direction in the repository-governance bootstrap entry; does not supersede the UART reference boundary.

## Entry template

- **Date / issue:**
- **Requested by:**
- **Outcome:**
- **In scope:**
- **Out of scope:**
- **Constraints:**
- **Assumptions needing confirmation:**
- **Acceptance evidence:**
- **Supersedes / superseded by:**

---
name: coordinate-agentic-unity-work
description: Deliver repository changes through isolated local work, documented intent, validation and reviewed integration. Use for non-trivial writes to code, assets, settings, docs or Git state.
---

# Deliver local agent work

Read AGENTS.md, CONTEXT.md, docs/PROJECT_INTENT.md and relevant ADRs. Follow docs/workflows/AGENT_WORKFLOW.md for intent and handoff, and docs/workflows/GIT_WORKFLOW.md for branch naming, dev integration, prod promotion and main retirement.

Before implementation, record the requested outcome, scope and acceptance evidence in docs/intent/INTENT_LOG.md. Preserve unrelated work. Validate locally and review the complete change before integration; honor explicit pre-merge questions. Do not infer hardware acceptance from mock tests.

The historical skill name is retained for compatibility; the current runtime is Babylon.js/TypeScript/Vite. No peer claim, acknowledgement or hackathon deadline is required. UART reference use remains governed by ADR 0001.

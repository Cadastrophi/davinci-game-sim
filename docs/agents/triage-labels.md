# Triage label vocabulary

Use the repository's exact configured labels when they exist. Until labels are created, use these canonical names in issue text without assuming remote mutation permission:

| Role | Label | Meaning |
| --- | --- | --- |
| Needs clarification | `triage: needs-info` | Intent or acceptance criteria are insufficient. |
| Ready | `triage: ready` | Scoped and safe to claim. |
| In progress | `triage: in-progress` | Owned by one human/agent pair. |
| Blocked | `triage: blocked` | Cannot progress without a named dependency or decision. |
| Review | `triage: review` | Implementation is ready for review/integration. |

Do not create, rename, or delete remote labels unless the user has authorized it.

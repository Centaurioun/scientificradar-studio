# Google AI Studio — Optional Engineering Reports

This directory is a **repository-local exchange area** between Google AI Studio / Antigravity and the owner/ChatGPT reviewers. Google AI may run in an independent sandbox and may not have GitHub Issue/PR access.

## Required after the next substantive completion run

- `COMPLETION_AUDIT.md` — **one** factual, evidence-based run report recording imported SHA, exported/committed SHA if any, every task-ID status, exact files, test commands/counts and remaining blockers.
- Update `docs/GOOGLE_AI_STUDIO_IMPLEMENTATION_PLAYBOOK.md` accurately if its ledger is outdated or overclaims S0–S7 completion.

## Optional only when there is actual evidence to share

- `BUGS.md` — reproducible defects, steps, screenshots/trace references and severity, not a generic bug brainstorm.
- `TEST_EVIDENCE.md` — detailed browser paths and machine-readable results if the main report is too long.
- `ARCHITECTURE_NOTES.md` — material tradeoffs, migration schema, licenses, limitations of IndexedDB and math/table extensions.
- `DECISIONS.md` — owner decisions needed before paid services / real production integration.

**Do not create empty files to fill this directory.** Use relative paths and commit small reviewable text. If a report points to a local sandbox screenshot, make clear if the artifact is not exported or cannot be opened by the owner. Do not commit secrets, identifiable user data, real manuscripts, temporary AI Studio artifacts or large binaries.

## File format for a report

- Imported repository SHA and date.
- Task IDs and evidence-backed status (`VERIFIED` / `IMPLEMENTED NOT VERIFIED` / `PARTIAL` / `BLOCKED` / `DEFERRED`).
- Specific changed files and behavioral contracts.
- Red/green proof when a regression was fixed; negative tests.
- Actual commands, exit codes, number of passing/failing tests.
- Browser engine/profile/viewport and real persistence/reload results.
- GitHub synchronized? Confirm branch+SHA **only if independently verified**.
- Known limitations, deferred provider connections and prioritized next action.

Start from `docs/GOOGLE_AI_STUDIO_REMAINING_WORK.md`.

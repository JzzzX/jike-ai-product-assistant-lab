# Demo Release v0.9 (2026-02-25)

## Scope
- `apps/podcast-highlighter`
- `apps/community-curator`

## Delivered
- Podcast:
  - audio `multipart/form-data` upload transcription path
  - segment-aligned highlight timestamps
  - run-metric driven evaluate payload
  - one-click end-to-end flow in UI
- Community:
  - summary `short/long` mode wiring
  - cluster `k` control with structured evidence/disagreement output
  - draft generation tied to selected cluster evidence
  - run-metric driven evaluate payload
  - one-click end-to-end flow in UI
- Ops:
  - sample eval script aligned to new request payloads

## Validation
- `pnpm typecheck`
- `pnpm eval:samples` (requires both demo apps running)

## Known Gaps (for v1.0)
- ESLint not initialized in the two Next apps (`next lint` opens interactive setup)
- no automated browser E2E yet
- no persistent run storage (currently in-memory/session only)

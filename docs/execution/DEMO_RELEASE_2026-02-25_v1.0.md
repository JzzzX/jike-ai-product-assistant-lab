# Demo Release v1.0 (2026-02-25)

## Delta from v0.9
- Added executable lint baseline in offline environment:
  - `pnpm lint` now runs non-interactively across apps.
- Added automated release smoke check:
  - `pnpm smoke:v1` boots both demos, validates API pipelines, verifies saved run artifacts, and shuts down servers.
- Added run persistence:
  - Podcast and Community `POST /api/evaluate` now write run reports to `evaluation/runs/*.json`.
  - Response now includes `savedRunPath`.

## Validation Commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm smoke:v1`
- `pnpm eval:samples`

## Known Limits
- Due offline package constraints in current environment, Next.js ESLint plugin config is not installed from npm.
- TypeScript quality is enforced by `pnpm typecheck`; smoke and sample eval cover runtime contract regressions.

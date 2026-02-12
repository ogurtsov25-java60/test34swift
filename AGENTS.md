# AGENTS.md

## Project goal
Build an iOS (SwiftUI) app + TypeScript backend for Hebrew learning (CEFR A1–C1) with:
- daily plan (no topic selection),
- voice conversation lessons,
- lesson report JSON,
- SRS (spaced repetition),
- local notifications (MVP).

## Non-negotiable rules
- Follow docs/PRD.md exactly.
- Do not change API contracts without updating packages/shared schemas and docs/API.md.
- Keep changes small and testable. Prefer many small PRs over one big PR.
- Validate all incoming/outgoing API payloads with shared schemas.
- If something is ambiguous, implement a sensible default consistent with PRD.md.

## Repo structure
- packages/shared: Zod schemas + TypeScript types used by backend (and optionally exported for clients).
- services/api: Fastify + TypeScript + PostgreSQL.
- apps/ios: SwiftUI app.

## Commands (must keep working)
Backend:
- pnpm -C services/api dev
- pnpm -C services/api test
- pnpm -C services/api lint

Shared:
- pnpm -C packages/shared test
- pnpm -C packages/shared lint

## Coding standards
- TypeScript strict mode.
- Zod for runtime validation.
- Return meaningful errors (HTTP status + machine-readable code + message).
- Add unit tests for: curriculum progression, SRS updates, level upgrade eligibility.

## Implementation order (must follow)
1) packages/shared schemas + types
2) backend DB + migrations + seed curriculum skeleton A1–C1
3) backend endpoints (/today, /lesson/*, /srs/*, /level-status)
4) iOS UI scaffolding (Today/Lesson/Summary/SRS)
5) iOS local notifications settings
6) voice pipeline integration

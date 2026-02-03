# SI-7: API Endpoint – Create Hand (POST /api/hands)

## Summary
Implements `POST /api/hands` so users can save completed poker hands with players and action history. Uses Zod for request validation, Clerk for auth, and a single Neon transaction for hand + hand_players + hand_actions inserts.

## Rationale
- **Zod**: Validates `CreateHandRequest` (hand, players, actions) and returns 400 with `error.details` (flatten) on failure.
- **Auth**: `requireAuth(req)` returns 401 when no Clerk token.
- **Transaction**: `sql.transaction([...])` ensures all-or-nothing insert; no partial data on failure (AC4).
- **FKs**: Same `hand_id` (UUID) used for hand row and all player/action rows (AC5).

## Changes
- **api/package.json**: Added `zod` dependency.
- **api/hands/index.ts**: New POST handler with CreateHandRequest Zod schema, validation, auth, and transactional insert.
- **api/index.ts**: Route `/hands` and `/hands/` to hands handler.
- **api/poker/outs/calculate.ts**: Fixed `handleError` call to match API (error, res, statusCode) so api build passes.

## Tests run
- `cd api && npm install && npm run build` — pass.

## Manual verification
1. **201**: `POST /api/hands` with valid JSON body and Bearer token → 201, `{ hand_id: "<uuid>" }`.
2. **400**: Omit required field (e.g. `hand.table_size`) → 400, body has `error`, `details`.
3. **401**: Omit `Authorization` header → 401, `{ error: "Unauthorized" }`.

## Risk / rollout
- Depends on `DATABASE_URL` and existing hands/hand_players/hand_actions schema. RLS policies use `auth.user_id()`; if not set in Neon, inserts may be blocked (env-specific).
- No GET /api/hands in this PR; follow-up ticket if needed.

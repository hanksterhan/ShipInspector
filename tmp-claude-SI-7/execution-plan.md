# SI-7 Execution Plan

## Scope
- **Ticket**: SI-7 – API Endpoint Create Hand (POST /api/hands)
- **Target**: Implement POST handler in api layer; Zod validation; Clerk auth; transactional insert (hands, hand_players, hand_actions).

## Steps

1. **Add Zod to api** – `api/package.json` add `zod` dependency.
2. **Create api/hands/index.ts** – Single default export handler:
   - Parse path: only handle POST for /hands.
   - Auth: call requireAuth(req); on throw return 401.
   - Body: parse with Zod (CreateHandRequest schema); on fail return 400 with error details.
   - DB: use Neon sql from server (import sql from "../../server/src/config/database"); generate hand id (uuid); run transaction: insert hands, then hand_players, then hand_actions; on any error rollback.
   - Success: return 201 with `{ hand_id: string }`.
3. **Wire route in api/index.ts** – Add branch for normalizedPath === "/hands" or "/hands/" and method === "POST", delegate to hands handler.
4. **Verification** – Run api build, lint; add minimal integration test or manual curl for 201/400/401.

## Target Files
- `api/package.json` – add zod
- `api/hands/index.ts` – new file (POST handler + Zod schema)
- `api/index.ts` – register /hands POST route

## Validation Commands
- `cd api && npm install && npm run build`
- `cd server && npm run build` (if api imports server)
- Lint/typecheck per project

## Out of Scope
- RLS/auth.user_id() configuration (existing DB setup)
- GET /api/hands (future ticket)
- Changing server hand routes

# SI-7 Acceptance Criteria Verification Map

| AC# | Criterion | Unit Test | Integration Test | Manual Steps | Observability |
|-----|-----------|-----------|------------------|--------------|---------------|
| AC1 | Valid hand data with players and actions creates a hand and returns 201 with hand_id | Assert 201, body.hand_id present | POST /api/hands with valid body → 201, hand_id | 1. Send valid JSON 2. Check response | Log: hand created |
| AC2 | Invalid data (missing required fields) returns 400 with Zod validation error details | Assert 400, body has error/details | POST with missing fields → 400, Zod message | 1. Omit required field 2. Check 400 body | N/A |
| AC3 | Missing auth token returns 401 Unauthorized | Assert 401 when no auth | POST without Authorization → 401 | 1. No Bearer token 2. Check 401 | N/A |
| AC4 | Failed transaction rolls back completely (no partial data saved) | Mock DB to fail on 2nd insert, assert no hand row | N/A or E2E with fault injection | 1. Force error mid-transaction 2. Query DB for orphan rows | N/A |
| AC5 | Created hand has correct foreign keys between hand, players, and actions tables | Assert inserted rows have hand_id matching hand.id | POST then GET/list → verify relations | 1. Create hand 2. Query hand_players, hand_actions for hand_id | N/A |

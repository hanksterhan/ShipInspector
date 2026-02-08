# Playwright E2E Tests

End-to-end tests for ShipInspector using Playwright. All tests require authentication via Clerk since they exercise protected routes.

## How Authentication Works

Tests authenticate automatically using Clerk's Backend API:

1. The **setup project** (`auth.setup.ts`) runs before all tests
2. It creates a sign-in token for the test user via Clerk's Backend API (`CLERK_SECRET_KEY`)
3. It signs in through the app's Clerk frontend SDK using the ticket strategy
4. It saves the browser storage state (cookies, localStorage) to `e2e/.auth/storage-state.json`
5. All test projects load this storage state, so Clerk recognizes the session

The test user is `playwright-test@sipoker.club` (ID: `user_39OwkE873fI5GYnqYefsQHBcI7v`).

## Prerequisites

`CLERK_SECRET_KEY` must be set in `web/.env`. Tests are skipped if it's not available.

## Running Tests

```bash
# Headless (runs auth setup automatically)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

## Test Coverage

- **equity-calculator.spec.ts** (3 tests): Equity Calculator UI, card picker modal, console errors
- **hand-recorder.spec.ts** (3 tests): Hand Recorder rendering, game settings form, navigation
- **hand-library.spec.ts** (3 tests): Hand Library rendering, empty state/list display, console errors

**Total: 9 critical path tests**

## Viewing Results

```bash
# HTML report
npx playwright show-report

# Screenshots on failure
open test-results/
```

# Playwright E2E Tests

End-to-end tests for ShipInspector using Playwright. All tests require authentication via Clerk since they exercise protected routes.

## Running Tests Locally

### UI Mode (Recommended)

```bash
# Start dev server
npm run dev

# In another terminal, open Playwright Test UI
npx playwright test --ui

# Sign in via browser when prompted
# Tests will execute with your authenticated session
```

### Headless Mode with Stored Session

```bash
# First time: establish your session
npx playwright test --ui
# Sign in and let tests run

# Subsequent runs (if session persists):
npx playwright test
```

### With Clerk Testing Token (CI/Automation)

```bash
export CLERK_TESTING_TOKEN="your-testing-token"
npx playwright test
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

# Video recordings
open playwright-report/
```

## Important Notes

- Tests navigate to protected routes and will see auth redirect without a valid session
- Screenshots are auto-captured on failure for debugging
- Use `--ui` mode for development and iteration
- All 9 tests should pass with valid authentication


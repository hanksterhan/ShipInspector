# Ship Inspector

A utility to help track poker hands that have been played.

- This project started out as a vibe coding project where I enjoyed prompting the agent to build out a functioning web application.
- Cursor and I built on top of a Lit JS/Spectrum Web Components/Webpack stack for the client and a simple Express server for the backend, and we had implementing Rust via WASM to calculate hand equities quickly and trying to get the app to be responsive.
- Then, on January 30, I discovered Agentic Workflows. I learned how to orchestrate an entire fleet of agents to plan and build software with hard gates for acceptance criteria.
- I quickly learned that I will most likely never write a manual line of code again.
- I ship at the speed of inference and trust that my agentic team builds in enough testing.
- The stack is now completely re-written. Not a single line is written by me. I don't even know what the tech stack is - I'd have to ask my team what they did, I just asked them to research the best modern practices, reach consensus, and implement.
- I haven't cared enough to tweak the look of the application - maybe I should finish optimizing it for agents, then they could gamble to pay off their tokens.
- In the meantime, time to turn this into AR.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (comes with Node.js)

### Quick Start

1. **Install dependencies** across all packages:

```bash
npm install
```

2. **Build the packages** (includes the shared library, API, and web client):

```bash
npm run build
```

3. **Start the local API** (in one terminal):

```bash
npm run dev:api
```

The API starts on http://localhost:3000 and uses the production routes and Clerk guards. Set `VITE_API_URL=http://localhost:3000` in `web/.env`. Keep each environment setting on its own line. Saved hands also require `DATABASE_URL` in `api/.env` or the root `.env`.

4. **Start the web client** (in another terminal):

```bash
cd web
npm run dev
```

The web app will open on http://localhost:4000 with Vite hot reload enabled.

### Build All Packages

To build everything at once:

```bash
npm run build
```

This builds in order: `common` → `server` → `web`, ensuring dependencies are satisfied.

## Development Commands

### Web Client (`cd web`)

```bash
npm run dev              # Start Vite dev server (port 4000)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Run Prettier
npm run format:check     # Check formatting
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Watch mode for tests
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests in interactive UI mode
```

Run a single test file:

```bash
npm run test src/stores/useHandRecorderStore.test.ts
```

### Server (`cd server`)

```bash
npm run start            # Build and start Express server
npm run test             # Run Jest unit tests
npm test -- hand.spec.ts # Run specific test
npm run lint             # Run Prettier checks
```

### Common Library (`cd common`)

```bash
npm run build            # Build TypeScript interfaces
npm run lint             # Run Prettier checks
```

## Rate Limiting

The API uses Redis-backed rate limiting (Upstash) with an automatic in-memory fallback.

### Configuration

| Env Var                       | Default  | Description                       |
| ----------------------------- | -------- | --------------------------------- |
| `UPSTASH_REDIS_REST_URL`      | (none)   | Upstash Redis REST endpoint       |
| `UPSTASH_REDIS_REST_TOKEN`    | (none)   | Upstash Redis auth token          |
| `RATE_LIMIT_WINDOW_MS`        | `900000` | Global window (ms, default 15min) |
| `RATE_LIMIT_MAX`              | `100`    | Max requests per global window    |
| `RATE_LIMIT_STRICT_WINDOW_MS` | `900000` | Strict window (ms)                |
| `RATE_LIMIT_STRICT_MAX`       | `500`    | Max requests per strict window    |

### Behavior

- **Redis available**: Sliding window rate limiting via sorted sets, persistent across cold starts and function instances.
- **Redis unavailable** (env vars missing or connection failure): Falls back to in-memory rate limiting per instance.
- All responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
- Rate-limited responses (429) also include a `Retry-After` header.

### Local Development

No Redis configuration is needed locally. The API falls back to in-memory rate limiting and logs a warning at startup.

## Structured Logging

All API requests produce structured JSON log entries sent to stdout.

### Log Fields

| Field            | Description                                    |
| ---------------- | ---------------------------------------------- |
| `timestamp`      | ISO 8601 timestamp                             |
| `requestId`      | UUID correlating all logs for a single request |
| `level`          | `info`, `warn`, or `error`                     |
| `message`        | Human-readable log message                     |
| `method`         | HTTP method                                    |
| `endpoint`       | Request URL path                               |
| `userId`         | Clerk user ID (set after auth)                 |
| `statusCode`     | HTTP response status                           |
| `latencyMs`      | Total request duration                         |
| `wasmLoadTimeMs` | Time to load WASM module (0 if cached)         |
| `computeTimeMs`  | WASM computation time                          |
| `dbQueryTimeMs`  | Database query time                            |

### Querying Logs

In Vercel, filter by `requestId` to see all log entries for a single request, or by `level: "error"` to find failures.

---

## Built by the Agentic Team

This project has been orchestrated, architected, planned, and executed by a fleet of specialized AI agents working in coordinated workflows. From early-stage research and consensus-building through full-stack implementation with continuous verification, every pull request ships with the speed of inference and the rigor of hard gates and test coverage.

What started as a vibe coding project has become a testament to agentic software engineering at scale. Today's poker app tomorrow's AR experience.

_Delivered with 🤖 by Claude Haiku, Sonnet, and Opus across the agentic team._

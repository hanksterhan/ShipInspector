# Ship Inspector
A utility to help track poker hands that have been played.

## Usage

### Build Common Library

```bash
cd common
npm run build
```

### Start up the server

```bash
cd server
npm run watch
```

### Start up the web app in a new terminal window

```bash
cd web
npm run start
```

### Helpful commands

#### Lint
```bash
cd web
npm run lint
```

#### Test on Server
```bash
cd server
npm test -- hand.spec.ts
```

## Rate Limiting

The API uses Redis-backed rate limiting (Upstash) with an automatic in-memory fallback.

### Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `UPSTASH_REDIS_REST_URL` | (none) | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | (none) | Upstash Redis auth token |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Global window (ms, default 15min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per global window |
| `RATE_LIMIT_STRICT_WINDOW_MS` | `900000` | Strict window (ms) |
| `RATE_LIMIT_STRICT_MAX` | `500` | Max requests per strict window |

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

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp |
| `requestId` | UUID correlating all logs for a single request |
| `level` | `info`, `warn`, or `error` |
| `message` | Human-readable log message |
| `method` | HTTP method |
| `endpoint` | Request URL path |
| `userId` | Clerk user ID (set after auth) |
| `statusCode` | HTTP response status |
| `latencyMs` | Total request duration |
| `wasmLoadTimeMs` | Time to load WASM module (0 if cached) |
| `computeTimeMs` | WASM computation time |
| `dbQueryTimeMs` | Database query time |

### Querying Logs

In Vercel, filter by `requestId` to see all log entries for a single request, or by `level: "error"` to find failures.
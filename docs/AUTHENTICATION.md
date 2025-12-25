# Authentication and Rate Limiting

This document describes the session-based authentication and rate limiting implementation for the Ship Inspector API.

## Overview

All API endpoints (except authentication endpoints) require session-based authentication using cookies. Rate limiting is applied globally and per-route to prevent abuse.

## Authentication

### Session-Based Authentication

The API uses Express sessions with HTTP-only cookies for authentication. When you log in, a session cookie is set that must be included in subsequent requests.

### Getting a Session

1. **Login** - POST `/auth/login`
   ```json
   {
     "email": "admin@example.com",
     "password": "your-password"
   }
   ```
   
   Response:
   ```json
   {
     "user": {
       "userId": "admin_1234567890",
       "email": "admin@example.com",
       "role": "admin"
     }
   }
   ```
   
   The server sets a session cookie (`connect.sid`) that is automatically sent with subsequent requests.

2. **Register** - POST `/auth/register`
   ```json
   {
     "email": "user@example.com",
     "password": "password123",
     "inviteCode": "ABC12345"
   }
   ```
   
   **Note**: Registration requires a valid invite code (admin-only feature).

### Using Session Cookies

The session cookie is automatically managed by browsers. For command-line tools like `curl`, you need to:

1. **Save cookies from login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com","password":"your-password"}' \
     -c cookies.txt
   ```

2. **Use saved cookies in subsequent requests:**
   ```bash
   curl -X GET http://localhost:3000/admin/users \
     -b cookies.txt
   ```

   Or use `-c` and `-b` together to save and reuse cookies:
   ```bash
   # Login and save cookie
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com","password":"your-password"}' \
     -c cookies.txt
   
   # Use cookie for authenticated request
   curl -X PUT http://localhost:3000/admin/users/user_123/role \
     -H "Content-Type: application/json" \
     -d '{"role":"admin"}' \
     -b cookies.txt
   ```

### Creating Admin Users

Admin users are created using the `create-admin` script:

```bash
npm run create-admin
```

This requires environment variables in `.env`:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

**⚠️ IMPORTANT**: Change default credentials in production!

## Rate Limiting

Rate limits are applied at multiple levels:

### Global Rate Limiter
- **Limit**: 100 requests per 15 minutes (default)
- **Applies to**: All endpoints
- **Environment Variables**:
  - `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 900000 = 15 minutes)
  - `RATE_LIMIT_MAX`: Maximum requests per window (default: 100)

### Strict Rate Limiter (Expensive Operations)
- **Limit**: 20 requests per 15 minutes (default)
- **Applies to**: 
  - `/poker/hand/evaluate`
  - `/poker/hand/compare`
  - `/poker/equity/calculate`
- **Environment Variables**:
  - `RATE_LIMIT_STRICT_WINDOW_MS`: Time window (default: 900000)
  - `RATE_LIMIT_STRICT_MAX`: Maximum requests (default: 20)

### Auth Rate Limiter
- **Limit**: 5 requests per 15 minutes (default)
- **Applies to**: 
  - `/auth/login`
  - `/auth/register`
- **Environment Variables**:
  - `RATE_LIMIT_AUTH_WINDOW_MS`: Time window (default: 900000)
  - `RATE_LIMIT_AUTH_MAX`: Maximum requests (default: 5)

## Environment Variables

Add these to your `.env` file:

```env
# Session Configuration
SESSION_SECRET=your-session-secret-change-in-production

# Admin User Creation (for create-admin script)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

# Rate Limiting (optional - defaults shown)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_STRICT_WINDOW_MS=900000
RATE_LIMIT_STRICT_MAX=20
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=5
```

## Protected Endpoints

All endpoints except `/auth/*` require authentication:

- `POST /poker/hand/evaluate` - Requires auth + strict rate limit
- `POST /poker/hand/compare` - Requires auth + strict rate limit
- `POST /poker/equity/calculate` - Requires auth + strict rate limit
- `GET /auth/me` - Requires auth (no special rate limit)

## Error Responses

### Authentication Errors
- `401 Unauthorized` - Missing or invalid session
- `401 Unauthorized` - Session expired
- `403 Forbidden` - Admin access required (for admin-only endpoints)

### Rate Limit Errors
- `429 Too Many Requests` - Rate limit exceeded
  ```json
  {
    "error": "Too many requests, please try again later.",
    "retryAfter": 900
  }
  ```

## Swagger Documentation

The Swagger UI at `/api-docs` includes:
- Security requirements for each endpoint
- Updated documentation for all protected endpoints
- Session-based authentication (cookies are handled automatically in the browser)

## Implementation Notes

- **User Storage**: Uses SQLite database (`server/data/users.db`)
- **Password Hashing**: Uses bcryptjs with 10 rounds
- **Session Expiration**: Default 24 hours (configured in session middleware)
- **Rate Limiting**: Uses `express-rate-limit` with IP-based tracking
- **Session Storage**: Uses express-session with default in-memory store

## Testing with curl

### Example: Login and Get User List

```bash
# 1. Login and save session cookie
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  -c cookies.txt

# 2. Use session cookie for protected endpoint
curl -X GET http://localhost:3000/admin/users \
  -b cookies.txt
```

### Example: Promote User to Admin

```bash
# 1. Login (if not already logged in)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  -c cookies.txt

# 2. Get your user ID
curl -X GET http://localhost:3000/admin/users \
  -b cookies.txt | jq '.users[] | select(.email=="your-email@example.com") | .userId'

# 3. Promote yourself to admin (replace USER_ID with your actual user ID)
curl -X PUT http://localhost:3000/admin/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  -b cookies.txt
```

### Example: Check Current User

```bash
curl -X GET http://localhost:3000/auth/me \
  -b cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```


# Authentication and Rate Limiting

This document describes the JWT authentication and rate limiting implementation for the Ship Inspector API.

## Overview

All API endpoints (except authentication endpoints) now require JWT authentication. Rate limiting is applied globally and per-route to prevent abuse.

## Authentication

### Getting a Token

1. **Login** - POST `/auth/login`
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
   
   Response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "userId": "1",
       "username": "admin"
     }
   }
   ```

2. **Register** (optional) - POST `/auth/register`
   ```json
   {
     "username": "newuser",
     "password": "password123"
   }
   ```

### Using the Token

Include the token in the `Authorization` header for all protected endpoints:

```
Authorization: Bearer <your-token-here>
```

### Default Credentials

- **Username**: `admin` (or set via `ADMIN_USERNAME` env var)
- **Password**: `admin123` (or set via `ADMIN_PASSWORD` env var)

**⚠️ IMPORTANT**: Change the default password in production!

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

### Database Rate Limiter
- **Limit**: 10 requests per 15 minutes (default)
- **Applies to**: 
  - `/db/equity-cache/seed`
  - `/db/equity-cache/stats`
- **Environment Variables**:
  - `RATE_LIMIT_DB_WINDOW_MS`: Time window (default: 900000)
  - `RATE_LIMIT_DB_MAX`: Maximum requests (default: 10)

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Default Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Rate Limiting (optional - defaults shown)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_STRICT_WINDOW_MS=900000
RATE_LIMIT_STRICT_MAX=20
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_DB_WINDOW_MS=900000
RATE_LIMIT_DB_MAX=10
```

## Protected Endpoints

All endpoints except `/auth/*` require authentication:

- `POST /poker/hand/evaluate` - Requires auth + strict rate limit
- `POST /poker/hand/compare` - Requires auth + strict rate limit
- `POST /poker/equity/calculate` - Requires auth + strict rate limit
- `POST /db/equity-cache/seed` - Requires auth + database rate limit
- `GET /db/equity-cache/stats` - Requires auth + database rate limit
- `GET /auth/me` - Requires auth (no special rate limit)

## Error Responses

### Authentication Errors
- `401 Unauthorized` - Missing or invalid token
- `401 Unauthorized` - Token expired

### Rate Limit Errors
- `429 Too Many Requests` - Rate limit exceeded
  ```json
  {
    "error": "Too many requests, please try again later.",
    "retryAfter": 900
  }
  ```

## Swagger Documentation

The Swagger UI at `/api-docs` now includes:
- Authentication button to add your JWT token
- Security requirements for each endpoint
- Updated documentation for all protected endpoints

## Implementation Notes

- **User Storage**: Currently uses in-memory storage. In production, replace with a proper database.
- **Password Hashing**: Uses bcryptjs with 10 rounds
- **Token Expiration**: Default 24 hours (configurable via `JWT_EXPIRES_IN`)
- **Rate Limiting**: Uses `express-rate-limit` with IP-based tracking

## Testing

Example using curl:

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Use token for protected endpoint
curl -X POST http://localhost:3000/poker/hand/evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hole":"14h 14d","board":"12h 11h 10h"}'
```


# Role-Based Access Control (RBAC)

This document describes the Role-Based Access Control (RBAC) system implemented in Ship Inspector.

## Overview

The RBAC system provides fine-grained access control through user roles stored in the database. Roles are checked on every request to ensure proper authorization.

## User Roles

The system supports three roles:

### 1. **User** (`user`)
- **Default role** for all new registrations
- **Capabilities**:
  - Access authenticated endpoints (poker hand evaluation, equity calculations)
  - View own profile information
  - Register with invite code
  - Login and logout

### 2. **Admin** (`admin`)
- **Full system access**
- **Capabilities**:
  - All user capabilities, plus:
  - **User Management**:
    - View all users in the system
    - View users by role
    - Get user details by ID
    - Promote/demote users (change roles)
    - Cannot demote themselves (safety feature)
  - **Invite Code Management**:
    - Create new invite codes
    - View all invite codes
    - View unused invite codes
    - View used invite codes with usage tracking
  - **System Administration**:
    - Full access to all endpoints
    - Can manage other admins

### 3. **Moderator** (`moderator`)
- **Intermediate role** (reserved for future use)
- **Current capabilities**:
  - Same as regular users
  - Role exists in the system but has no additional permissions yet
- **Future potential**:
  - Content moderation
  - Limited user management
  - View-only access to certain admin features

## Database Schema

Users table includes:
- `user_id` - Unique identifier
- `email` - User email (unique)
- `password_hash` - Hashed password
- `role` - User role (`user`, `admin`, or `moderator`)
- `created_at` - Account creation timestamp
- `updated_at` - Last role update timestamp

## API Endpoints by Role

### Public Endpoints (No Authentication)
- `POST /auth/login` - Login
- `POST /auth/register` - Register (requires invite code)

### User Endpoints (Authenticated)
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout
- `POST /poker/hand/evaluate` - Evaluate poker hand
- `POST /poker/hand/compare` - Compare poker hands
- `POST /poker/equity/calculate` - Calculate equity
- `GET /db/equity-cache/stats` - View equity cache statistics

### Admin-Only Endpoints

#### User Management
- `GET /admin/users` - Get all users
- `GET /admin/users/role/:role` - Get users by role
- `GET /admin/users/:userId` - Get user by ID
- `PUT /admin/users/:userId/role` - Update user role

#### Invite Code Management
- `POST /invite-codes` - Create new invite code
- `GET /invite-codes` - Get all invite codes (with stats)
- `GET /invite-codes/unused` - Get unused invite codes
- `GET /invite-codes/used` - Get used invite codes

## Creating an Admin User

Admin users are created using a manual script that reads credentials from `.env`:

### Setup

1. **Set environment variables** in `.env`:
   ```env
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your-secure-password-here
   ```

2. **Run the admin creation script**:
   ```bash
   npm run create-admin
   ```

   The script will:
   - Validate email format
   - Enforce minimum password length (8 characters)
   - Check if admin already exists
   - Create admin user with `role: 'admin'` in database

### Security Notes

- **Never commit `.env` file** to version control
- Use strong passwords (minimum 8 characters enforced)
- Admin credentials are stored securely (bcrypt hashed)
- Script can be run multiple times safely (won't create duplicates)

## Role Management

### Promoting a User to Admin

As an admin, you can promote any user:

```bash
PUT /admin/users/{userId}/role
Content-Type: application/json

{
  "role": "admin"
}
```

### Demoting an Admin

Admins can demote other admins, but **cannot demote themselves**:

```bash
PUT /admin/users/{userId}/role
Content-Type: application/json

{
  "role": "user"
}
```

**Safety Feature**: If an admin tries to demote themselves, the request will be rejected with a 400 error.

### Promoting to Moderator

```bash
PUT /admin/users/{userId}/role
Content-Type: application/json

{
  "role": "moderator"
}
```

## Middleware

### `authenticateSession`
- Verifies user has active session
- Adds `user` object to request with `userId`, `email`, and `role`
- Used for all authenticated endpoints

### `requireAdmin`
- Checks if user has `admin` role in database
- Returns 403 if user is not admin
- Used for admin-only endpoints

### `requireRole(role)`
- Generic middleware for any specific role
- Example: `requireRole('moderator')`
- Currently not used but available for future moderator features

## Security Features

### 1. **Database-Backed Roles**
- Roles stored in database, not hardcoded
- Roles checked on every request (fresh from database)
- Supports multiple admins

### 2. **Self-Demotion Protection**
- Admins cannot accidentally lock themselves out
- Attempting to demote yourself returns 400 error

### 3. **Session-Based Authentication**
- Roles included in session
- Session validated on each request
- Role changes take effect on next login (or immediately if checked from DB)

### 4. **Invite-Only Registration**
- All new users require valid invite code
- Invite codes are single-use
- Only admins can create invite codes

### 5. **Audit Trail**
- `created_at` tracks when user was created
- `updated_at` tracks when role was last changed
- Invite codes track who used them and when

## Example Usage

### Check Current User Role

```bash
GET /auth/me
```

Response:
```json
{
  "user": {
    "userId": "user_1234567890_abc123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### List All Users (Admin Only)

```bash
GET /admin/users
```

Response:
```json
{
  "users": [
    {
      "userId": "admin_1234567890",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": 1234567890000,
      "updatedAt": null
    },
    {
      "userId": "user_1234567890_abc123",
      "email": "user@example.com",
      "role": "user",
      "createdAt": 1234567891000,
      "updatedAt": null
    }
  ],
  "total": 2
}
```

### Promote User to Admin

```bash
PUT /admin/users/user_1234567890_abc123/role
Content-Type: application/json

{
  "role": "admin"
}
```

Response:
```json
{
  "user": {
    "userId": "user_1234567890_abc123",
    "email": "user@example.com",
    "role": "admin",
    "createdAt": 1234567891000,
    "updatedAt": 1234567892000
  },
  "message": "User role updated successfully"
}
```

## Role Comparison

| Feature | User | Moderator | Admin |
|---------|------|-----------|-------|
| Login/Logout | ✅ | ✅ | ✅ |
| Use Poker Tools | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| Create Invite Codes | ❌ | ❌ | ✅ |
| View Invite Codes | ❌ | ❌ | ✅ |
| View All Users | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ✅ |
| Promote/Demote Users | ❌ | ❌ | ✅ |

## Future Enhancements

Potential moderator capabilities (not yet implemented):
- View user list (read-only)
- View invite code usage (read-only)
- Content moderation features
- Limited administrative actions

## Migration Notes

If you have an existing database:
- The `role` column is automatically added via migration
- Existing users default to `role: 'user'`
- Admin users should be created using the `create-admin` script
- No data loss occurs during migration

## Troubleshooting

### "Admin access required" error
- Verify user has `role: 'admin'` in database
- Check session is valid (try logging out and back in)
- Ensure you're using the correct user account

### Cannot demote yourself
- This is a safety feature to prevent lockout
- Have another admin demote you, or manually update database

### Role changes not taking effect
- Roles are checked from database on each request
- If using session-based checks, logout and login again
- The middleware always checks the database, so changes should be immediate


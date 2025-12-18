# Admin User Management

This document explains how to use the Better Auth admin plugin for user management.

## Features

The admin plugin provides the following features:
- **Create User**: Admin users can create new users with email/password
- **Delete User**: Admin users can permanently delete users (hard delete)
- Other features available: List users, ban/unban users, update roles, impersonate users, etc.

## Configuration

### 1. Server Configuration

The admin plugin is configured in `src/lib/auth.ts`:

```typescript
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "sales-agent",
    }),
  ],
});
```

### 2. Client Configuration

The admin client plugin is configured in `src/lib/auth-client.ts`:

```typescript
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});
```

## Database Schema

The admin plugin adds the following fields:

**User table:**
- `banned` (boolean): Whether the user is banned
- `banReason` (text): Reason for the ban
- `banExpires` (timestamp): When the ban expires

**Session table:**
- `impersonatedBy` (varchar): ID of admin impersonating this session

## Usage

### Creating Users (Admin Only)

**In UI Components:**
The `AddUserModal` component in `/users` page allows admins to create new users.

**Programmatically:**
```typescript
import { createUser } from "~/lib/admin-helpers";

const result = await createUser({
  email: "[email protected]",
  password: "secure-password",
  name: "John Doe",
  role: "sales-agent", // or "admin", "sales-manager", "manager"
});

if (result.success) {
  console.log("User created:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### Deleting Users (Admin Only)

**In UI Components:**
The `UserActions` component in the users list has a delete option with confirmation dialog.

**Programmatically:**
```typescript
import { removeUser } from "~/lib/admin-helpers";

const result = await removeUser(userId);

if (result.success) {
  console.log("User deleted:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### Using the Better Auth API Directly

You can also use the Better Auth API directly on the client:

```typescript
import { authClient } from "~/lib/auth-client";

// Create user
const { data, error } = await authClient.admin.createUser({
  email: "[email protected]",
  password: "password123",
  name: "Jane Smith",
  role: "sales-agent",
});

// Delete user
const { data, error } = await authClient.admin.removeUser({
  userId: "user-id",
});

// List all users
const { data: users } = await authClient.admin.listUsers({
  query: {
    limit: 100,
    offset: 0,
  },
});
```

## Additional Admin Features

The Better Auth admin plugin provides many more features:

### Ban/Unban Users
```typescript
// Ban user
await authClient.admin.banUser({
  userId: "user-id",
  banReason: "Spamming",
  banExpiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
});

// Unban user
await authClient.admin.unbanUser({
  userId: "user-id",
});
```

### Set User Role
```typescript
await authClient.admin.setRole({
  userId: "user-id",
  role: "admin",
});
```

### Set User Password
```typescript
await authClient.admin.setUserPassword({
  userId: "user-id",
  newPassword: "new-password",
});
```

### Impersonate User
```typescript
// Start impersonation
await authClient.admin.impersonateUser({
  userId: "user-id",
});

// Stop impersonation
await authClient.admin.stopImpersonating();
```

### List User Sessions
```typescript
const { data: sessions } = await authClient.admin.listUserSessions({
  userId: "user-id",
});
```

### Revoke Sessions
```typescript
// Revoke specific session
await authClient.admin.revokeUserSession({
  sessionToken: "token",
});

// Revoke all sessions for a user
await authClient.admin.revokeUserSessions({
  userId: "user-id",
});
```

## Security

- All admin endpoints require authentication with a user that has the `admin` role
- Users are checked against the `adminRoles` configuration
- The Better Auth plugin handles all permission checks automatically
- Delete operations are hard deletes (permanently remove from database)

## References

- [Better Auth Admin Plugin Documentation](https://www.better-auth.com/docs/plugins/admin)
- Server config: `src/lib/auth.ts`
- Client config: `src/lib/auth-client.ts`
- Admin helpers: `src/lib/admin-helpers.ts`
- UI components: `src/app/(admin)/users/_components/`

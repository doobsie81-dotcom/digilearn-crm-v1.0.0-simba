# Role Permissions Management Guide

This guide explains how to use the role permissions system in the DigiLearn CRM application.

## Overview

The application uses a flexible role-based access control (RBAC) system with conditional permissions. Permissions can be assigned to roles and can include conditions for fine-grained access control.

## Components

### 1. **Permissions Management UI** (`src/app/(admin)/roles/_client.tsx`)

A comprehensive interface for managing role permissions with:
- **Grid Layout**: Subjects list on the left, permissions management on the right
- **Role Selection**: Dropdown to select which role to configure
- **Subject Search**: Filter subjects by name
- **Permission Toggles**: Switch controls for each action (create, read, update, delete, manage)
- **Conditional Permissions**: Switches for conditions that apply to specific actions
- **Save Functionality**: Persist changes to the database

### 2. **tRPC Mutations** (`src/trpc/routers/role-permissions.ts`)

#### `getAll` Query
Retrieves all role permissions with abilities check example:
```typescript
const canManageUsers = can(ctx.userPermissions, "User", "manage");
```

#### `updateRolePermissions` Mutation
Updates permissions for a specific role and subject:
```typescript
await trpc.rolePermissions.updateRolePermissions.mutateAsync({
  role: "sales-agent",
  subject: "Lead",
  permissions: [
    {
      action: "read",
      enabled: true,
      conditions: [
        {
          conditionIndex: 0,
          enabled: true,
          condition: { ownerId: "${id}" }
        }
      ]
    }
  ]
});
```

### 3. **Abilities Helper** (`src/lib/abilities.ts`)

Utility functions for checking permissions:

#### `can(userPermissions, subject, action, conditions?)`
Check if user has a specific permission:
```typescript
if (can(ctx.userPermissions, "Lead", "create")) {
  // User can create leads
}
```

#### `cannot(userPermissions, subject, action, conditions?)`
Inverse of `can`:
```typescript
if (cannot(ctx.userPermissions, "Deal", "delete")) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

#### `filterByAbility(items, userPermissions, subject, action, userId)`
Filter items based on permissions:
```typescript
const accessibleLeads = filterByAbility(
  allLeads,
  ctx.userPermissions,
  "Lead",
  "read",
  ctx.user.id
);
```

## Permission Structure

### Subjects
- **Lead**: Lead management
- **Deal**: Deal management
- **User**: User account management
- **Company**: Company records
- **Report**: Reporting features
- **Quote**: Quote management
- **Invoice**: Invoice management

### Actions
- **create**: Create new records
- **read**: View records
- **update**: Modify existing records
- **delete**: Remove records
- **manage**: Full access (grants all actions)

### Conditions
Conditions allow fine-grained access control. Example:
```json
{
  "ownerId": "${id}"
}
```
This condition means the permission only applies to records where `ownerId` matches the user's ID.

## Usage Examples

### Example 1: Basic Permission Check in tRPC
```typescript
export const createLead = protectedProcedure
  .input(leadSchema)
  .mutation(async ({ ctx, input }) => {
    // Check permission
    if (cannot(ctx.userPermissions, "Lead", "create")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to create leads",
      });
    }

    // Create lead
    const lead = await db.insert(leads).values(input);
    return lead;
  });
```

### Example 2: Conditional Permission Check
```typescript
export const updateLead = protectedProcedure
  .input(updateLeadSchema)
  .mutation(async ({ ctx, input }) => {
    // Get the lead
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, input.id),
    });

    // Check if user can manage all leads
    if (can(ctx.userPermissions, "Lead", "manage")) {
      // Can update any lead
      await db.update(leads).set(input).where(eq(leads.id, input.id));
      return;
    }

    // Check if user can update their own leads
    const canUpdateOwnLeads = can(ctx.userPermissions, "Lead", "update", {
      ownerId: ctx.user.id,
    });

    if (canUpdateOwnLeads && lead.ownerId === ctx.user.id) {
      // Can update own lead
      await db.update(leads).set(input).where(eq(leads.id, input.id));
      return;
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only update your own leads",
    });
  });
```

### Example 3: Filter Data by Permissions
```typescript
export const getLeads = protectedProcedure.query(async ({ ctx }) => {
  // Get all leads
  const allLeads = await db.query.leads.findMany();

  // Filter based on user permissions
  // If user has "manage" permission, returns all leads
  // If user has conditional permission, returns only matching leads
  const accessibleLeads = filterByAbility(
    allLeads,
    ctx.userPermissions,
    "Lead",
    "read",
    ctx.user.id
  );

  return accessibleLeads;
});
```

### Example 4: UI Component Permission Check
```typescript
"use client";

import { can } from "~/lib/abilities";
import { useSession } from "next-auth/react";

export function LeadActions() {
  const { data: session } = useSession();
  const userPermissions = session?.userPermissions;

  const canCreateLeads = can(userPermissions, "Lead", "create");
  const canDeleteLeads = can(userPermissions, "Lead", "delete");

  return (
    <div>
      {canCreateLeads && (
        <Button onClick={handleCreate}>Create Lead</Button>
      )}
      {canDeleteLeads && (
        <Button onClick={handleDelete}>Delete Lead</Button>
      )}
    </div>
  );
}
```

## How Conditions Work

When a permission has conditions, the `${id}` placeholder is replaced with the actual user ID at runtime.

**Database Storage:**
```json
{
  "role": "sales-agent",
  "subject": "Lead",
  "action": "read",
  "conditions": "{\"ownerId\":\"${id}\"}"
}
```

**Runtime Check:**
```typescript
// For user with ID "user-123"
const canRead = can(userPermissions, "Lead", "read", {
  ownerId: "user-123"
});

// This checks if the lead's ownerId matches "user-123"
```

## Setting Up Permissions

1. **Navigate to Role Permissions Page** (Admin only)
2. **Select a Role** from the dropdown
3. **Choose a Subject** from the left sidebar
4. **Toggle Actions** using the switches
5. **Enable Conditions** if needed (only available when action is enabled)
6. **Click "Save Permissions"** to persist changes

## Best Practices

1. **Always check permissions** in tRPC procedures before performing actions
2. **Use `can` helper** instead of manually checking permissions
3. **Filter data** using `filterByAbility` for list queries
4. **Combine role checks** with permission checks when needed
5. **Use conditions** for row-level security (e.g., "only own records")
6. **Test permissions** thoroughly for each role

## Permission Hierarchy

1. **Admin role**: Bypasses most permission checks
2. **"manage" action**: Grants all actions for a subject
3. **Specific actions**: Grant individual permissions
4. **Conditions**: Further restrict permissions to specific records

## Troubleshooting

### User can't see data they should have access to
- Check if the role has the correct permissions in the database
- Verify conditions are properly configured
- Ensure `filterByAbility` is using the correct subject and action

### Permission changes not taking effect
- Refresh the page or re-login to get updated permissions
- Check if the mutation succeeded in the database
- Verify the tRPC query is refetching after mutation

### Conditional permissions not working
- Ensure the condition JSON matches exactly
- Check that the field name in the condition matches the database column
- Verify `${id}` is being replaced with the actual user ID

## Additional Resources

- See `src/examples/abilities-usage.ts` for comprehensive examples
- Check `src/lib/abilities.ts` for helper function implementations
- Review `src/trpc/routers/role-permissions.ts` for API implementation

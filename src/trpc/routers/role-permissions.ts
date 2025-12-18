import { and, eq } from "drizzle-orm";
import z from "zod";
import { db } from "~/db";
import { permissions, UserRoles } from "~/db/schema";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/trpc/init";
import { TRPCError } from "@trpc/server";
import { can, getUserPermissions } from "~/lib/get-user-permissions";

export const permissionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/permissions" } })
    .query(async ({ ctx }) => {
    // Example: Check if user has permission using the abilities helper
    // This checks if the user can "manage" the "User" subject
    const abilities = await getUserPermissions(ctx.user, ctx.userPermissions)
    const canManageUsers = can(abilities,  "manage", "User");
    
    // Alternative: Check if user can read permissions
    const canReadPermissions = can(abilities, "read", "Role");

    // Only admins or users with User management permissions can view role permissions
    if (ctx.user.role !== "admin" && !canManageUsers && !canReadPermissions) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to view role permissions",
      });
    }

    const rolePermissions = await db.query.permissions.findMany();

    return rolePermissions;
  }),

  updateRolePermissions: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/permissions/role" } })
    .input(
      z.object({
        role: z.enum(UserRoles),
        subject: z.string(),
        permissions: z.array(
          z.object({
            action: z.string(),
            enabled: z.boolean(),
            conditions: z
              .array(
                z.object({
                  conditionIndex: z.number(),
                  enabled: z.boolean(),
                  condition: z.record(z.string(), z.any()),
                })
              )
              .optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins can update role permissions
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update role permissions",
        });
      }

      const { role, subject, permissions: permissionsInput } = input;

      // Delete existing permissions for this role and subject
      await db
        .delete(permissions)
        .where(
          and(eq(permissions.role, role), eq(permissions.subject, subject))
        );

      // Insert new permissions
      const permissionsToInsert = [];

      for (const perm of permissionsInput) {
        if (!perm.enabled) continue;

        // Validate action is one of the allowed values
        const validActions: readonly string[] = ["create", "read", "update", "delete", "manage"];
        if (!validActions.includes(perm.action)) {
          continue;
        }

        const action = perm.action as "create" | "read" | "update" | "delete" | "manage";

        // Check if this permission has conditions
        const hasConditions = perm.conditions && perm.conditions.length > 0;

        if (hasConditions) {
          // Insert a permission for each enabled condition
          for (const conditionItem of perm.conditions!) {
            if (conditionItem.enabled) {
              permissionsToInsert.push({
                role,
                subject,
                action,
                conditions: JSON.stringify(conditionItem.condition),
                inverted: false,
              });
            }
          }

          // Also insert the base permission without conditions if no conditions are enabled
          const anyConditionEnabled = perm.conditions!.some((c) => c.enabled);
          if (!anyConditionEnabled) {
            permissionsToInsert.push({
              role,
              subject,
              action,
              conditions: null,
              inverted: false,
            });
          }
        } else {
          // No conditions, just insert the permission
          permissionsToInsert.push({
            role,
            subject,
            action,
            conditions: null,
            inverted: false,
          });
        }
      }

      // Insert all permissions
      if (permissionsToInsert.length > 0) {
        await db.insert(permissions).values(permissionsToInsert);
      }

      return { success: true, count: permissionsToInsert.length };
    }),
});

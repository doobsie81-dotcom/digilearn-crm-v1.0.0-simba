import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, or, and, inArray, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";
import { tasks, leads, deals, leadActivities, taskComments } from "~/db/schema";
import { db } from "~/db";
import {
  addTaskSchema,
  taskStatusSchema,
  referenceTypeSchema,
  tasksBulkUpdate,
} from "~/validation/tasks";
import { can, getUserPermissions } from "~/lib/get-user-permissions";

export const taskRouter = createTRPCRouter({
  // 1. CREATE TASK
  createTask: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/tasks" } })
    .input(addTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify reference exists and user has permission
      // so we'll always have a lead id.
      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.leadId),
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      if (input.dealId) {
        const deal = await db.query.deals.findFirst({
          where: eq(deals.id, input.dealId),
        });

        if (!deal) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
        }
      }

      // create an activity for this.
      const [activity] = await db
        .insert(leadActivities)
        .values({
          subject: input.title,
          leadId: input.leadId,
          dealId: input.dealId,
          assignedTo: input.assignedTo || ctx.user.id,
          status: "scheduled",
          type: "task",
          createdBy: ctx.user.id,
        })
        .$returningId();

      // get the highest position
      const highestPositionTask = await db.query.tasks.findFirst({
        where: eq(tasks.status, input.status),
        orderBy: (task, { asc }) => asc(task.position),
      });
      // now calculate position
      const position = highestPositionTask
        ? highestPositionTask.position + 1000
        : 1000;

      const [task] = await db
        .insert(tasks)
        .values({
          title: input.title,
          description: input.description,
          status: input.status,
          activityId: activity.id,
          leadId: input.leadId,
          dealId: input.dealId,
          dueDate: input.dueDate || new Date(),
          position,
        })
        .$returningId();

      return { id: task.id, message: "Task created successfully" };
    }),

  // 2. UPDATE TASK
  updateTask: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/tasks/{id}" } })
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: taskStatusSchema.optional(),
        assignedTo: z.string().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.id),
        with: {
          activity: {
            with: {
              assignedToUser: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              createdByUser: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check permissions
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isCreator = task.activity.createdByUser.id === ctx.user.id;
      const isAssigned = task.activity?.assignedToUser?.id === ctx.user.id;

      if (!isAdmin && !isSalesManager && !isCreator && !isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this task",
        });
      }

      const { id, ...updateData } = input;

      await db.update(tasks).set(updateData).where(eq(tasks.id, id));

      return { message: "Task updated successfully" };
    }),

  // 3. DELETE TASK
  deleteTask: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/tasks/{id}" } })
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.id),
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Only admin, sales-manager, or creator can delete
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      //const isCreator = task.createdBy === ctx.user.id;

      if (!isAdmin && !isSalesManager) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this task",
        });
      }

      await db.delete(tasks).where(eq(tasks.id, input.id));

      return { message: "Task deleted successfully" };
    }),

  // 4. GET TASKS (with filters)
  getTasks: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/tasks" } })
    .input(
      z.object({
        status: taskStatusSchema.nullish(),
        referenceType: referenceTypeSchema.nullish(),
        assignedTo: z.string().nullish(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      const acitivitiesMatch = [];

      const abilities = await getUserPermissions(ctx.user, ctx.userPermissions);

      const ruleConditions = abilities.rulesFor("read", "LeadActivity")[0]
        .conditions;

      const allowed = can(abilities, "read", "LeadActivity");

      const owner = ruleConditions?.createdBy;

      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view activities",
        });
      }

      if (allowed && owner && owner !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own activities",
        });
      }

      if (owner) {
        acitivitiesMatch.push(
          or(
            eq(leadActivities.createdBy, owner as string),
            eq(leadActivities.assignedTo, owner as string)
          )
        );
      }

      if (input.status) {
        conditions.push(eq(tasks.status, input.status));
      }
      // if (input.referenceType) {
      //   conditions.push(eq(tasks.referenceType, input.referenceType));
      // }
      // if (input.assignedTo) {
      //   conditions.push(eq(tasks.assignedTo, input.assignedTo));
      // }

      // Non-admins and non-managers can only see their own tasks
      // if (ctx.user.role === "sales-agent") {
      //   conditions.push(
      //     or(
      //       eq(tasks.assignedTo, ctx.user.id),
      //       eq(tasks.createdBy, ctx.user.id)
      //     )!
      //   );
      // }

      // If we have activity-related filters, resolve matching activity IDs first
      if (acitivitiesMatch.length > 0) {
        const matchingActivities = await db.query.leadActivities.findMany({
          where: and(...acitivitiesMatch),
          columns: { id: true },
        });

        const activityIds = matchingActivities.map((a) => a.id);

        // If no activities match, return empty result early
        if (activityIds.length === 0) {
          return [];
        }

        // Filter tasks by activityId matching found activity IDs
        conditions.push(inArray(tasks.activityId, activityIds));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const tasksList = await db.query.tasks.findMany({
        where: whereClause,
        limit: input.limit,
        offset: input.offset,
        with: {
          activity: {
            with: {
              assignedToUser: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              lead: true,
              deal: true,
              createdByUser: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
      });

      return tasksList;
    }),

  // 5. GET LEAD TASKS (with authorization)
  getLeadTasks: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads/{leadId}/tasks" } })
    .input(
      z.object({
        leadId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Fetch the lead
      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.leadId),
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      // Check authorization
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isAssignedAgent = lead.ownerId === ctx.user.id;

      if (!isAdmin && !isSalesManager && !isAssignedAgent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view tasks for this lead",
        });
      }

      // Fetch tasks for this lead
      const leadTasks = await db.query.tasks.findMany({
        where: and(eq(tasks.leadId, input.leadId)),
        with: {
          activity: {
            with: {
              assignedToUser: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              createdByUser: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
      });

      return leadTasks;
    }),

  // 6. GET DEAL TASKS (with authorization)
  getDealTasks: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/deals/{dealId}/tasks" } })
    .input(
      z.object({
        dealId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Fetch the deal
      const deal = await db.query.deals.findFirst({
        where: eq(deals.id, input.dealId),
      });

      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Check authorization
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isAssignedAgent = deal.assignedTo === ctx.user.id;

      if (!isAdmin && !isSalesManager && !isAssignedAgent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view tasks for this deal",
        });
      }

      // Fetch tasks for this deal
      const dealTasks = await db.query.tasks.findMany({
        where: and(eq(tasks.dealId, input.dealId)),
        with: {
          activity: {
            with: {
              assignedToUser: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              createdByUser: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
      });

      return dealTasks;
    }),
  bulkUpdate: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/tasks/bulk-update" } })
    .input(tasksBulkUpdate)
    .mutation(async ({ ctx, input }) => {
      const tasksPayload = input.tasks;
      const tasksToUpdate = await db.query.tasks.findMany({
        where: inArray(
          tasks.id,
          tasksPayload.map((task) => task.id)
        ),
        with: {
          activity: {
            columns: { leadId: true, assignedTo: true, createdBy: true },
          },
        },
      });

      const refIds = new Set(tasksToUpdate.map((task) => task.activity.leadId));
      if (refIds.size !== 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All tasks must belong to the same reference",
        });
      }

      // Check permissions
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isCreator = tasksToUpdate.some(
        (task) => task.activity.createdBy === ctx.user.id
      );
      const isAssigned = tasksToUpdate.some(
        (task) => task.activity.assignedTo === ctx.user.id
      );

      if (!isAdmin && !isSalesManager && !isCreator && !isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this task",
        });
      }

      const updatedTasks = await Promise.all(
        tasksPayload.map(async (task) => {
          const { status, id, position } = task;
          return await db
            .update(tasks)
            .set({ status, id, position })
            .where(eq(tasks.id, id));
        })
      );

      return { data: updatedTasks };
    }),

  // 7. GET TASK BY ID
  getTaskById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/tasks/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.id),
        with: {
          activity: {
            with: {
              assignedToUser: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              createdByUser: {
                columns: {
                  id: true,
                  name: true,
                },
              },
              lead: true,
              deal: true,
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check permissions
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isCreator = task.activity.createdByUser.id === ctx.user.id;
      const isAssigned = task.activity?.assignedToUser?.id === ctx.user.id;

      if (!isAdmin && !isSalesManager && !isCreator && !isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this task",
        });
      }

      return task;
    }),

  // 8. ADD COMMENT TO TASK
  addComment: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/tasks/{taskId}/comments" } })
    .input(
      z.object({
        taskId: z.string(),
        comment: z.string().min(1, "Comment cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task exists and user has permission
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.taskId),
        with: {
          activity: {
            with: {
              assignedToUser: { columns: { id: true } },
              createdByUser: { columns: { id: true } },
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check permissions - anyone who can view the task can comment
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isCreator = task.activity.createdByUser.id === ctx.user.id;
      const isAssigned = task.activity?.assignedToUser?.id === ctx.user.id;

      if (!isAdmin && !isSalesManager && !isCreator && !isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to comment on this task",
        });
      }

      const [comment] = await db
        .insert(taskComments)
        .values({
          taskId: input.taskId,
          comment: input.comment,
          commentedBy: ctx.user.id,
        })
        .$returningId();

      return { id: comment.id, message: "Comment added successfully" };
    }),

  // 9. GET TASK COMMENTS
  getComments: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/tasks/{taskId}/comments" } })
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify task exists and user has permission
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, input.taskId),
        with: {
          activity: {
            with: {
              assignedToUser: { columns: { id: true } },
              createdByUser: { columns: { id: true } },
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // Check permissions
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isCreator = task.activity.createdByUser.id === ctx.user.id;
      const isAssigned = task.activity?.assignedToUser?.id === ctx.user.id;

      if (!isAdmin && !isSalesManager && !isCreator && !isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view comments for this task",
        });
      }

      const comments = await db.query.taskComments.findMany({
        where: eq(taskComments.taskId, input.taskId),
        with: {
          commentedByUser: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [desc(taskComments.createdAt)],
      });

      return comments;
    }),

  // 10. DELETE COMMENT
  deleteComment: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/tasks/comments/{id}" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await db.query.taskComments.findFirst({
        where: eq(taskComments.id, input.id),
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Only admin, sales-manager, or comment author can delete
      const isAdmin = ctx.user.role === "admin";
      const isSalesManager = ctx.user.role === "sales-manager";
      const isAuthor = comment.commentedBy === ctx.user.id;

      if (!isAdmin && !isSalesManager && !isAuthor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this comment",
        });
      }

      await db.delete(taskComments).where(eq(taskComments.id, input.id));

      return { message: "Comment deleted successfully" };
    }),
});

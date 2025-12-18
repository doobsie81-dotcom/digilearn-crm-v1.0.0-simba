import {
  eq,
  and,
  like,
  inArray,
  desc,
  isNull,
  notInArray,
  sql,
  or,
  asc,
} from "drizzle-orm";
import z from "zod";
import { createleads, leadInfoSchema } from "~/validation/leads";
import { db } from "~/db";
import {
  companies,
  contactRoleEnum,
  contacts,
  leadActivities,
  leadContacts,
  leadQualificationCriteria,
  leads,
  leadSourceEnum,
  leadStatusEnum,
  user,
} from "~/db/schema";
import { NewContact } from "~/db/types";
import { createTRPCRouter, protectedProcedure, baseProcedure } from "~/trpc/init";
import { TRPCError } from "@trpc/server";
import { LeadStatus } from "~/data";
import { can, getUserPermissions } from "~/lib/get-user-permissions";
import { subject } from "@casl/ability";

export const leadsRouter = createTRPCRouter({
  // Public endpoint to create lead without authentication
  createLeadPublic: baseProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/public/leads",
        protect: false,
      }
    })
    .input(createleads)
    .mutation(async (opts) => {
      try {
        const { lead, contacts: contactsList } = opts.input;

        const result = await db.transaction(async (tx) => {
          // create company first..
          let exisitingCompany = null;
          if (lead.companyId) {
            exisitingCompany = await db.query.companies.findFirst({
              where: eq(companies.id, lead.companyId),
            });
            if (!exisitingCompany) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Selected Company does not exist.",
              });
            }
          }
          // if no exisitingCompany, we create..
          let company = null;
          if (exisitingCompany) {
            company = { id: exisitingCompany.id };
          } else {
            [company] = await tx
              .insert(companies)
              .values({
                name: lead.companyName,
                city: lead.city,
                province: lead.province,
                region: lead.region,
                ownershipType: lead.ownershipType,
                schoolType: lead.schoolType,
                churchDenomination: lead.churchDenomination,
                district: lead.district,
                // ownerId is omitted (will default to null in schema)
              })
              .$returningId();
          }

          // insert primary contact if provided
          const primaryContact = contactsList.find((c) => c.isPrimary) as
            | NewContact
            | undefined;

          if (!primaryContact) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Primary contact is required",
            });
          }

          let newPrimaryContact = null;

          if (!primaryContact.id) {
            [newPrimaryContact] = await tx
              .insert(contacts)
              .values({
                companyId: company.id,
                firstName: primaryContact.firstName,
                lastName: primaryContact.lastName,
                email: primaryContact.email,
                phoneNumber: primaryContact.phoneNumber,
                jobTitle: primaryContact.jobTitle,
                // ownerId is omitted (will default to null in schema)
              })
              .onDuplicateKeyUpdate({
                set: { firstName: primaryContact.firstName },
              })
              .$returningId();
          } else {
            newPrimaryContact = { id: primaryContact.id };
          }

          // Insert lead without ownerId
          const [newLead] = await tx
            .insert(leads)
            .values({
              ownerId: null, // No owner for public leads
              name: lead.name,
              companyId: company.id,
              primaryContactId: newPrimaryContact!.id,
              source: lead.source,
              estimatedValue: lead.estimatedValue?.toString(),
            })
            .$returningId();
          const leadId = newLead.id;

          // 4. Link primary contact to lead
          await tx.insert(leadContacts).values({
            leadId,
            contactId: newPrimaryContact!.id,
            role: "primary",
            isPrimary: true,
          });

          // Insert contacts if provided
          let insertedContacts: { id: string }[] = [];
          const additionalContacts = contactsList.filter((c) => !c.isPrimary);
          if (additionalContacts && additionalContacts.length > 0) {
            const contactsData = additionalContacts.map((contact) => ({
              companyId: company.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phoneNumber: contact.phoneNumber,
              jobTitle: contact.jobTitle,
              id: contact.id,
              // ownerId is omitted (will default to null in schema)
            }));

            await tx
              .insert(contacts)
              .values(contactsData)
              .onDuplicateKeyUpdate({
                set: { firstName: sql`values(${contacts.firstName})` },
              });

            insertedContacts = await tx
              .select({ id: contacts.id })
              .from(contacts)
              .where(
                or(
                  ...contactsData.map((c) =>
                    and(
                      eq(contacts.firstName, c.firstName),
                      eq(contacts.lastName, c.lastName),
                      eq(contacts.companyId, company.id)
                    )
                  )
                )
              );

            // Link additional contacts to lead
            await tx.insert(leadContacts).values(
              insertedContacts.map((contact, idx) => ({
                leadId,
                contactId: contact.id,
                role: additionalContacts[idx].role ?? "other",
                isPrimary: false,
              }))
            );
          }

          return {
            lead: newLead,
            contacts: insertedContacts,
          };
        });
        return result;
      } catch (error) {
        console.error("Error creating lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while creating the lead",
        });
      }
    }),
  createLead: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/leads" } })
    .input(createleads)
    .mutation(async (opts) => {
      try {
        const userId = opts.ctx.userId;
        const userRole = opts.ctx.user.role;
        const { lead, contacts: contactsList } = opts.input;

        // Determine the ownerId based on assignment logic
        let ownerId: string | null = null;

        if (lead.assignedTo === "self") {
          // User selected "assign to myself"
          ownerId = userId!;
        } else if (lead.assignedTo) {
          // User selected a specific sales agent
          ownerId = lead.assignedTo;
        } else {
          // No assignment specified
          if (userRole === "sales-agent") {
            // Sales agents auto-assign to themselves
            ownerId = userId!;
          }
          // Admins and sales-managers can leave leads unassigned (ownerId remains null)
        }

        const result = await db.transaction(async (tx) => {
          // create company first..
          let exisitingCompany = null;
          if (lead.companyId) {
            exisitingCompany = await db.query.companies.findFirst({
              where: eq(companies.id, lead.companyId),
            });
            if (!exisitingCompany) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Selected Company does not exist.",
              });
            }
          }
          // if no exisitingCompany, we create..
          let company = null;
          if (exisitingCompany) {
            company = { id: exisitingCompany.id };
          } else {
            [company] = await tx
              .insert(companies)
              .values({
                name: lead.companyName,
                city: lead.city,
                province: lead.province,
                region: lead.region,
                ownershipType: lead.ownershipType,
                schoolType: lead.schoolType,
                churchDenomination: lead.churchDenomination,
                district: lead.district,
                ownerId: userId!,
              })
              .$returningId();
          }

          // insert primary contact if provided
          const primaryContact = contactsList.find((c) => c.isPrimary) as
            | NewContact
            | undefined;

          if (!primaryContact) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Primary contact is required",
            });
          }

          let newPrimaryContact = null;

          if (!primaryContact.id) {
            [newPrimaryContact] = await tx
              .insert(contacts)
              .values({
                companyId: company.id,
                firstName: primaryContact.firstName,
                lastName: primaryContact.lastName,
                email: primaryContact.email,
                phoneNumber: primaryContact.phoneNumber,
                jobTitle: primaryContact.jobTitle,
                ownerId: userId!,
              })
              .onDuplicateKeyUpdate({
                set: { firstName: primaryContact.firstName },
              })
              .$returningId();
          } else {
            newPrimaryContact = { id: primaryContact.id };
          }

          // Insert lead
          const [newLead] = await tx
            .insert(leads)
            .values({
              ownerId: ownerId,
              name: lead.name,
              companyId: company.id,
              primaryContactId: newPrimaryContact!.id,
              source: lead.source,
              estimatedValue: lead.estimatedValue?.toString(),
            })
            .$returningId();
          const leadId = newLead.id;

          // 4. Link primary contact to lead
          await tx.insert(leadContacts).values({
            leadId,
            contactId: newPrimaryContact!.id,
            role: "primary",
            isPrimary: true,
          });

          // Insert contacts if provided
          let insertedContacts: { id: string }[] = [];
          const additionalContacts = contactsList.filter((c) => !c.isPrimary);
          if (additionalContacts && additionalContacts.length > 0) {
            const contactsData = additionalContacts.map((contact) => ({
              companyId: company.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phoneNumber: contact.phoneNumber,
              jobTitle: contact.jobTitle,
              ownerId: userId!,
              id: contact.id,
            }));

            await tx
              .insert(contacts)
              .values(contactsData)
              .onDuplicateKeyUpdate({
                set: { firstName: sql`values(${contacts.firstName})` },
              });

            insertedContacts = await tx
              .select({ id: contacts.id })
              .from(contacts)
              .where(
                or(
                  ...contactsData.map((c) =>
                    and(
                      eq(contacts.firstName, c.firstName),
                      eq(contacts.lastName, c.lastName),
                      eq(contacts.companyId, company.id)
                    )
                  )
                )
              );

            // Link additional contacts to lead
            await tx.insert(leadContacts).values(
              insertedContacts.map((contact, idx) => ({
                leadId,
                contactId: contact.id,
                role: additionalContacts[idx].role ?? "other",
                isPrimary: false,
              }))
            );
          }

          // Create initial activity
          // await tx.insert(leadActivities).values({
          //   leadId,
          //   contactId: newPrimaryContact!.id,
          //   type: "note",
          //   status: "completed",
          //   subject: "Lead created",
          //   description: `Lead created from ${lead.source}`,
          //   createdBy: userId!,
          //   completedAt: new Date(),
          // });

          return {
            lead: newLead,
            contacts: insertedContacts,
          };
        });
        return result;
      } catch (error) {
        console.error("Error creating lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while creating the lead",
        });
      }
    }),
  getMany: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads" } })
    .input(
      z.object({
        status: z.array(z.enum(leadStatusEnum)).optional(),
        includeArchived: z.boolean().nullish(),
        source: z.enum(leadSourceEnum).optional(),
        searchTerm: z.string().optional(),
        ownerId: z.string().optional(),
        unassignedOnly: z.boolean().optional(), // Filter for unassigned leads
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      })
    )
    .query(async (opts) => {
      try {
        const {
          status,
          source,
          searchTerm,
          includeArchived,
          ownerId,
          unassignedOnly,
          page,
          pageSize,
        } = opts.input;
        const { ctx } = opts;

        const abilities = await getUserPermissions(
          ctx.user,
          ctx.userPermissions
        );

        const ruleConditions = abilities.rulesFor("read", "Lead")[0].conditions;

        const allowed = can(abilities, "read", "Lead");

        const owner = ruleConditions?.ownerId ?? ownerId;

        // If user is not allowed to view other leads, they MUST specify their own ID
        if (!allowed && !owner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must specify your own user ID to view leads",
          });
        }

        // Enforce that non-allowed users can only view their own leads
        if (!allowed && owner && owner && owner !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own leads",
          });
        }
        // Build query conditions
        const conditions = [];
        // Apply ownership filter if user can only see their own leads
        if (owner) {
          conditions.push(eq(leads.ownerId, ctx.user.id));
        }

        // Filter for unassigned leads (where ownerId is null)
        if (unassignedOnly) {
          conditions.push(isNull(leads.ownerId));
        }

        if (status && status.length) {
          conditions.push(inArray(leads.status, status));
        }

        if (source) {
          conditions.push(eq(leads.source, source));
        }

        if (!includeArchived) {
          conditions.push(
            notInArray(leads.status, ["converted", "unqualified"] as Extract<
              LeadStatus,
              "converted" | "unqualified"
            >[])
          );
        }

        // Calculate offset for pagination
        const offset = (page - 1) * pageSize;

        if (!searchTerm) {
          // Get total count
          const totalCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(leads)
            .where(conditions.length ? and(...conditions) : undefined);

          const totalCount = Number(totalCountResult[0]?.count ?? 0);

          // Get paginated data with proper ordering by company name
          const items = await db
            .select()
            .from(leads)
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(asc(companies.name))
            .limit(pageSize)
            .offset(offset)
            .then(async (results) => {
              // Get the lead IDs in order
              const leadIds = results.map((r) => r.leads.id);

              if (leadIds.length === 0) return [];

              // Fetch full lead data with relations, maintaining order
              const fullLeads = await db.query.leads.findMany({
                where: inArray(leads.id, leadIds),
                with: {
                  primaryContact: true,
                  company: true,
                  contactAssociations: true,
                  qualification: true,
                  activities: true,
                  assignee: true,
                },
              });

              // Restore the original order from the join query
              const leadMap = new Map(fullLeads.map((lead) => [lead.id, lead]));
              return leadIds.map((id) => leadMap.get(id)!).filter(Boolean);
            });

          return {
            items,
            pagination: {
              page,
              pageSize,
              totalCount,
              totalPages: Math.ceil(totalCount / pageSize),
            },
          };
        }

        // With search term: manual joins to search across lead and company names
        const searchPattern = `%${searchTerm}%`;

        const searchConditions = and(
          ...conditions,
          or(
            like(leads.name, searchPattern),
            like(companies.name, searchPattern)
          )
        );

        // Get total count for search results
        const totalCountResult = await db
          .select({ count: sql<number>`count(distinct ${leads.id})` })
          .from(leads)
          .leftJoin(companies, eq(leads.companyId, companies.id))
          .where(searchConditions);

        const totalCount = Number(totalCountResult[0]?.count ?? 0);

        // Get paginated search results
        const rows = await db
          .select({
            lead: leads,
            company: companies,
            primaryContact: contacts,
            qualification: leadQualificationCriteria,
            assignee: user,
          })
          .from(leads)
          .leftJoin(companies, eq(leads.companyId, companies.id))
          .leftJoin(contacts, eq(leads.primaryContactId, contacts.id))
          .leftJoin(
            leadQualificationCriteria,
            eq(leads.id, leadQualificationCriteria.leadId)
          )
          .leftJoin(user, eq(leads.ownerId, user.id))
          .where(searchConditions)
          .limit(pageSize)
          .offset(offset);

        // For one-to-many relations (contactAssociations, activities),
        // we still need separate queries to avoid cartesian products
        const leadIds = rows.map((row) => row.lead.id);

        if (leadIds.length === 0) {
          return {
            items: [],
            pagination: {
              page,
              pageSize,
              totalCount: 0,
              totalPages: 0,
            },
          };
        }

        // Fetch one-to-many relations
        const allContactAssociations = await db.query.leadContacts.findMany({
          where: inArray(leadContacts.leadId, leadIds),
        });

        const allActivities = await db.query.leadActivities.findMany({
          where: inArray(leadActivities.leadId, leadIds),
        });

        // Group by leadId for efficient lookup
        const contactAssocsByLeadId = allContactAssociations.reduce(
          (acc, assoc) => {
            if (!acc[assoc.leadId]) acc[assoc.leadId] = [];
            acc[assoc.leadId].push(assoc);
            return acc;
          },
          {} as Record<string, typeof allContactAssociations>
        );

        const activitiesByLeadId = allActivities.reduce(
          (acc, activity) => {
            if (!acc[activity.leadId]) acc[activity.leadId] = [];
            acc[activity.leadId].push(activity);
            return acc;
          },
          {} as Record<string, typeof allActivities>
        );

        // Map to consistent structure with all relations
        const items = rows.map((row) => ({
          ...row.lead,
          company: row.company!,
          primaryContact: row.primaryContact!,
          qualification: row.qualification,
          assignee: row.assignee!,
          contactAssociations: contactAssocsByLeadId[row.lead.id] || [],
          activities: activitiesByLeadId[row.lead.id] || [],
        }));

        return {
          items,
          pagination: {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        };
      } catch (error) {
        console.error("Error fetching leads:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching leads",
        });
      }
    }),
  getLead: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads/{id}" } })
    .input(z.string())
    .query(async (opts) => {
      try {
        const id = opts.input;
        const { ctx } = opts;

        const lead = await db.query.leads.findFirst({
          where: and(eq(leads.id, id), isNull(leads.deletedAt)),
          with: {
            assignee: true,
            company: true,
            primaryContact: true,
            contactAssociations: {
              with: {
                contact: true,
              },
            },
            activities: {
              orderBy: [desc(leadActivities.createdAt)],
              limit: 50,
              with: {
                contact: true,
              },
            },
            qualification: true,
            tagAssociations: {
              with: {
                tag: true,
              },
            },
          },
        });

        if (!lead) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        const abilities = await getUserPermissions(
          ctx.user,
          ctx.userPermissions
        );

        const canRealLead = can(abilities, "read", subject("Lead", lead));
        const canManageLead = can(abilities, "manage", subject("Lead", lead));

        // If user has manage or unrestricted read permission, allow access
        if (canRealLead || canManageLead) {
          return lead;
        }

        // User doesn't have permission to view this lead
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this lead",
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching the lead",
        });
      }
    }),
  updateLead: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/leads/{id}" } })
    .input(
      z.object({
        id: z.string(),
        lead: leadInfoSchema.partial().extend({
          emailVerified: z.boolean().optional(),
          phoneNumberVerified: z.boolean().optional(),
          status: z.enum(leadStatusEnum).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, lead } = input;

        const leadToUpdate = await db.query.leads.findFirst({
          where: eq(leads.id, id),
        });

        if (!leadToUpdate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead was not found",
          });
        }

        const abilities = await getUserPermissions(
          ctx.user,
          ctx.userPermissions
        );

        const canUpdateLead = can(
          abilities,
          "update",
          subject("Lead", leadToUpdate)
        );

        if (!canUpdateLead) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this lead",
          });
        }

        const updatedLead = await db
          .update(leads)
          .set({
            ...lead,
            estimatedValue: lead.estimatedValue?.toString(),
          })
          .where(eq(leads.id, id))
          .execute();

        return updatedLead;
      } catch (error) {
        console.error("Error updating lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while updating the lead",
        });
      }
    }),
  addContact: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/leads/{leadId}/contacts" } })
    .input(
      z.object({
        leadId: z.string(),
        // Option 1: Link existing contact
        existingContactId: z.string().optional(),

        // Option 2: Create new contact
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        email: z.string().email().max(255).optional(),
        phoneNumber: z.string().max(50).optional(),
        jobTitle: z.string().max(100).optional(),

        role: z.enum(contactRoleEnum),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.leadId),
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      let contactId = input.existingContactId;

      await db.transaction(async (tx) => {
        // Create new contact if not using existing
        if (!contactId) {
          if (!input.firstName || !input.lastName || !input.email) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "firstName, lastName, and email required for new contact",
            });
          }

          const [contact] = await tx
            .insert(contacts)
            .values({
              companyId: lead.companyId,
              firstName: input.firstName,
              lastName: input.lastName,
              email: input.email,
              phoneNumber: input.phoneNumber,
              jobTitle: input.jobTitle,
              ownerId: ctx.user!.id!,
            })
            .$returningId();

          contactId = contact.id;
        }

        // Link contact to lead
        await tx.insert(leadContacts).values({
          leadId: input.leadId,
          contactId: contactId!,
          role: input.role,
          notes: input.notes,
          isPrimary: false,
        });

        // Create activity
        await tx.insert(leadActivities).values({
          leadId: input.leadId,
          contactId: contactId,
          type: "note",
          status: "completed",
          subject: "Contact added to lead",
          description: `Added ${input.role} contact`,
          createdBy: ctx.user.id,
          completedAt: new Date(),
        });
      });

      return { contactId };
    }),
  // setPrimaryContact: protectedProcedure
  //   .input(
  //     z.object({
  //       leadId: z.string(),
  //       contactId: z.string(),
  //     })
  //   )
  //   .mutation(async (opts) => {
  //     const { leadId, contactId } = opts.input;

  //     return await db.transaction(async (tx) => {
  //       // First unset primary from all contacts for this lead
  //       await tx
  //         .update(contacts)
  //         .set({ isPrimary: false })
  //         .where(eq(contacts.leadId, leadId));

  //       // Set the specified contact as primary
  //       const [updatedContact] = await tx
  //         .update(contacts)
  //         .set({ isPrimary: true })
  //         .where(and(eq(contacts.id, contactId), eq(contacts.leadId, leadId)))
  //         .execute();

  //       if (!updatedContact) {
  //         throw new TRPCError({
  //           code: "NOT_FOUND",
  //           message: "Contact not found",
  //         });
  //       }

  //       return updatedContact;
  //     });
  //   }),
  getLeadContacts: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads/{leadId}/contacts" } })
    .input(
      z.object({
        leadId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const associations = await db.query.leadContacts.findMany({
        where: eq(leadContacts.leadId, input.leadId),
        with: {
          contact: true,
        },
      });

      return associations;
    }),
  deleteContact: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/leads/{leadId}/contacts/{contactId}",
      },
    })
    .input(
      z.object({
        leadId: z.string(),
        contactId: z.string(),
      })
    )
    .mutation(async (opts) => {
      const { leadId, contactId } = opts.input;

      // First get the contact to check if it's primary
      const leadContact = await db.query.leadContacts.findFirst({
        where: and(
          eq(leadContacts.contactId, contactId),
          eq(leadContacts.leadId, leadId)
        ),
        with: { contact: true },
      });

      if (!leadContact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      await db
        .delete(leadContacts)
        .where(
          and(
            eq(leadContacts.contactId, contactId),
            eq(leadContacts.leadId, leadId)
          )
        );

      // If the deleted contact was primary, find another contact to make primary
      if (leadContact.isPrimary) {
        const nextPrimary = await db.query.contacts.findFirst({
          where: and(
            eq(leadContacts.leadId, leadId),
            eq(leadContacts.isPrimary, false)
          ),
        });

        if (nextPrimary) {
          await db
            .update(leadContacts)
            .set({ isPrimary: true })
            .where(eq(leadContacts.contactId, nextPrimary.id));
        }
      }

      return { success: true };
    }),
  // qualify: protectedProcedure
  //   .input(
  //     z.object({
  //       leadId: z.string(),
  //       budget: z.number().min(0).max(25),
  //       authority: z.number().min(0).max(25),
  //       need: z.number().min(0).max(25),
  //       timeline: z.number().min(0).max(25),
  //       notes: z.string().optional(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const totalScore =
  //       input.budget + input.authority + input.need + input.timeline;
  //     const isQualified = totalScore >= 60;

  //     await db.transaction(async (tx) => {
  //       const existing = await tx.query.leadQualificationCriteria.findFirst({
  //         where: eq(leadQualificationCriteria.leadId, input.leadId),
  //       });

  //       if (existing) {
  //         await tx
  //           .update(leadQualificationCriteria)
  //           .set({
  //             authority: input.authority,
  //             need: input.need,
  //             timeline: input.timeline,
  //             notes: input.notes,
  //             qualifiedBy: ctx.user!.id!,
  //             qualifiedAt: new Date(),
  //           })
  //           .where(eq(leadQualificationCriteria.id, existing.id));
  //       } else {
  //         await tx.insert(leadQualificationCriteria).values({
  //           leadId: input.leadId,
  //           authority: input.authority,
  //           need: input.need,
  //           timeline: input.timeline,
  //           notes: input.notes,
  //           qualifiedBy: ctx.user!.id!,
  //           qualifiedAt: new Date(),
  //         });
  //       }

  //       await tx
  //         .update(leads)
  //         .set({
  //           status: isQualified ? "qualified" : "unqualified",
  //           qualificationScore: totalScore,
  //         })
  //         .where(eq(leads.id, input.leadId));
  //     });

  //     return { qualified: isQualified, score: totalScore };
  //   }),

  updateAssignee: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/leads/{id}/assignee" } })
    .input(
      z.object({
        id: z.string(),
        assignee: z.string().nullable(), // Can be null for unassigned
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only admin and sales-manager can update assignee
      const sessUser = ctx.user;
      if (sessUser.role !== "admin" && sessUser.role !== "sales-manager") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update lead assignee",
        });
      }

      // If assignee is provided, verify the user exists
      if (input.assignee) {
        const userExists = await db.query.user.findFirst({
          where: eq(user.id, input.assignee),
        });
        if (!userExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User was not found",
          });
        }
      }

      // Verify the lead exists
      const leadExists = await db.query.leads.findFirst({
        where: eq(leads.id, input.id),
      });
      if (!leadExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead was not found",
        });
      }

      // Update the lead assignee
      await db
        .update(leads)
        .set({
          ownerId: input.assignee,
        })
        .where(eq(leads.id, input.id));

      return { success: true };
    }),
});

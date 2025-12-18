import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql, or, like, isNull, inArray } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import {
  companies,
  contacts,
  deals,
  invoices,
  leads,
  quotes,
} from "~/db/schema";
import {
  addCompanySchema,
  csvCompanyRecordSchema,
} from "~/validation/companies";
import { deduplicateCompanies } from "~/lib/companies-helpers";
import { LeadsService } from "../services/leads";
//import { NewCompany } from "~/db/types";

interface ImportError {
  row: number;
  firstname?: string;
  lastname?: string;
  company?: string;
  error: string;
}

export const companiesRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/companies" } })
    .input(addCompanySchema)
    .mutation(async ({ input, ctx }) => {
      const [company] = await db
        .insert(companies)
        .values({
          ...input,
          ownerId: ctx.user!.id!,
        })
        .$returningId();

      return { id: company.id };
    }),

  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/companies/{id}" } })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        website: z.string().url().optional().or(z.literal("")),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        zipCode: z.string().optional(),
        industry: z.string().optional(),
        description: z.string().optional(),
        // to add the other stuff
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const existing = await db.query.companies.findFirst({
        where: eq(companies.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "company not found",
        });
      }

      await db.update(companies).set(updateData).where(eq(companies.id, id));

      return { success: true };
    }),
  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/companies/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const company = await db.query.companies.findFirst({
        where: and(eq(companies.id, input.id), isNull(companies.deletedAt)),
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      // Get all related data with counts
      const [contactsData, leadsData, dealsData, quotesData, invoicesData] =
        await Promise.all([
          db.query.contacts.findMany({
            where: eq(contacts.companyId, input.id),
            orderBy: [desc(contacts.createdAt)],
            with: {
              leadAssociations: {
                with: {
                  lead: true,
                },
              },
            },
          }),
          db.query.leads.findMany({
            where: eq(leads.companyId, input.id),
            orderBy: [desc(leads.createdAt)],
            limit: 10,
          }),
          db.query.deals.findMany({
            where: eq(deals.companyId, input.id),
            orderBy: [desc(deals.createdAt)],
            limit: 10,
          }),
          db.query.quotes.findMany({
            where: eq(quotes.clientId, input.id),
            orderBy: [desc(quotes.createdAt)],
            limit: 10,
          }),
          db.query.invoices.findMany({
            where: eq(invoices.clientId, input.id),
            orderBy: [desc(invoices.createdAt)],
            limit: 10,
          }),
        ]);

      // Calculate totals
      const totalRevenue = invoicesData
        .filter((inv) => inv.paymentStatus === "Paid")
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      const totalQuoteValue = quotesData.reduce(
        (sum, q) => sum + parseFloat(q.total),
        0
      );

      const totalDealValue = dealsData.reduce(
        (sum, d) => sum + parseFloat(d.value),
        0
      );

      return {
        company,
        contacts: contactsData,
        leads: leadsData,
        deals: dealsData,
        quotes: quotesData,
        invoices: invoicesData,
        stats: {
          totalRevenue,
          totalQuoteValue,
          totalDealValue,
          totalContacts: contactsData.length,
          totalLeads: leadsData.length,
          totalDeals: dealsData.length,
          totalQuotes: quotesData.length,
          totalInvoices: invoicesData.length,
        },
      };
    }),

  getStatistics: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/companies/statistics" } })
    .query(async () => {
    const allCompanies = await db.query.companies.findMany({
      where: isNull(companies.deletedAt),
    });

    const totalCompanies = allCompanies.length;

    // Get industries
    const industries = new Set(
      allCompanies.map((c) => c.industry).filter(Boolean)
    );

    // Calculate total revenue across all companies
    const [totalRevenue] = await db
      .select({ total: sql<number>`SUM(CAST(${invoices.total} AS DECIMAL))` })
      .from(invoices)
      .where(eq(invoices.paymentStatus, "Paid"));

    // Get active companies (with recent activity in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return {
      totalCompanies,
      totalIndustries: industries.size,
      totalRevenue: totalRevenue?.total ?? 0,
    };
  }),

  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/companies" } })
    .input(
      z
        .object({
          search: z.string().nullish(),
          industry: z.string().nullish(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.search) {
        conditions.push(
            or(
              like(companies.name, `%${input.search}%`),
            )
        );
      }

      if (input?.industry) {
        conditions.push(eq(companies.industry, input.industry));
      }

      //conditions.push(isNull(companies.deletedAt));

      const items = await db.query.companies.findMany({
        where: and(...conditions),
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
        orderBy: [desc(companies.createdAt)],
        with: {
          persons: {
            with: {
              leadAssociations: {
                columns: {
                  role: true,
                  isPrimary: true,
                },
              },
            },
            limit: 6,
          },
        },
      });

      // Get aggregated counts for each company
      const companiesWithCounts = await Promise.all(
        items.map(async (company) => {
          const [contactCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(contacts)
            .where(eq(contacts.companyId, company.id));

          const [leadCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(leads)
            .where(eq(leads.companyId, company.id));

          const [dealCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(deals)
            .where(eq(deals.companyId, company.id));

          const [quoteCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(quotes)
            .where(eq(quotes.clientId, company.id));

          const [invoiceCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(eq(invoices.clientId, company.id));

          const [totalRevenue] = await db
            .select({
              total: sql<number>`SUM(CAST(${invoices.total} AS DECIMAL))`,
            })
            .from(invoices)
            .where(
              and(
                eq(invoices.clientId, company.id),
                eq(invoices.paymentStatus, "Paid")
              )
            );

          return {
            ...company,
            _count: {
              contacts: contactCount?.count ?? 0,
              leads: leadCount?.count ?? 0,
              deals: dealCount?.count ?? 0,
              quotes: quoteCount?.count ?? 0,
              invoices: invoiceCount?.count ?? 0,
            },
            totalRevenue: totalRevenue?.total ?? 0,
          };
        })
      );

      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(and(...conditions));

      return {
        companies: companiesWithCounts,
        total: totalCount[0]?.count ?? 0,
      };
    }),
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/companies/{id}" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db.query.companies.findFirst({
        where: eq(companies.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "company not found",
        });
      }

      // Soft delete by setting isActive to false
      await db
        .update(companies)
        .set({ deletedAt: new Date() })
        .where(eq(companies.id, input.id));

      return { success: true };
    }),

  // Get companies for select dropdowns
  listForSelect: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/companies/select" } })
    .query(async () => {
    return await db.query.companies.findMany({
      where: isNull(companies.deletedAt),
      columns: {
        id: true,
        name: true,
      },
      orderBy: [companies.name],
    });
  }),
  importBulk: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/companies/import" } })
    .input(z.array(csvCompanyRecordSchema))
    .mutation(async ({ ctx, input }) => {
      const errors: ImportError[] = [];
      let successCount = 0;
      // create a set of companies so we don't repeat companies
      const companyMap = deduplicateCompanies(input);
      const companyNames = Array.from(companyMap.keys());

      // Fetch existing companies in batch
      const existingCompanies = await db
        .select({ id: companies.id, name: companies.name })
        .from(companies)
        .where(inArray(companies.name, companyNames));

      const existingCompanyMap = new Map(
        existingCompanies.map((c) => [c.name.toLowerCase(), c.id])
      );

      // Process each company and its contacts
      for (const [normalizedName, records] of companyMap.entries()) {
        try {
          let companyId: string;

          // Check if company exists, else create
          if (existingCompanyMap.has(normalizedName)) {
            companyId = existingCompanyMap.get(normalizedName)!;
          } else {
            const [newCompany] = await db
              .insert(companies)
              .values({
                name: records[0].company,
                province: records[0].province,
                region: records[0].region,
                city: records[0].city,
                ownerId: ctx.user.id,
              })
              .$returningId();

            companyId = newCompany.id;
          }
          // now we create the lead
          await LeadsService.createLead(
            db,
            {
              lead: {
                companyId,
                companyName: normalizedName,
                name: records[0].requirement,
                province: records[0].province,
                region: records[0].region,
                city: records[0].city,
                source: records[0].source,
              },
              contacts: records.map((r, i) => ({
                firstName: r.firstname,
                lastName: r.lastname,
                email: r.email,
                phoneNumber: r.phone,
                isPrimary: i === 0 ? true : false,
                role: i === 0 ? "primary" : "other",
              })),
            },
            ctx
          );
          successCount++;

          // this is n longer important as we're creating the contacts using the LeadsService
          // Process contacts for this company
          // for (const record of records) {
          //   try {
          //     // Validate record
          //     const validated = csvCompanyRecordSchema.parse(record);

          //     // Upsert contact (update if firstName + lastName exists, else insert)
          //     await db
          //       .insert(contacts)
          //       .values({
          //         firstName: validated.firstname,
          //         lastName: validated.lastname,
          //         email: validated.email,
          //         phoneNumber: validated.phone,
          //         companyId,
          //         ownerId: ctx.user.id,
          //       })
          //       .onDuplicateKeyUpdate({
          //         //target: [contacts.firstName, contacts.lastName, contacts.companyId],
          //         set: {
          //           email: validated.email,
          //           phoneNumber: validated.phone,
          //           updatedAt: new Date(),
          //         },
          //       });

          //     successCount++;
          //   } catch (error) {
          //     const errorMsg =
          //       error instanceof z.ZodError
          //         ? error.message
          //         : error instanceof Error
          //           ? error.message
          //           : "Unknown error";

          //     errors.push({
          //       row: input.indexOf(record) + 2, // +2 for header + 1-based indexing
          //       firstname: record.firstname,
          //       lastname: record.lastname,
          //       company: record.company,
          //       error: errorMsg,
          //     });
          //   }
          // }
        } catch (error) {
          // Company-level error
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          for (const record of records) {
            errors.push({
              row: input.indexOf(record) + 2,
              firstname: record.firstname,
              lastname: record.lastname,
              company: record.company,
              error: `Company error: ${errorMsg}`,
            });
          }
        }
      }
      return {
        success: successCount,
        failed: errors.length,
        errors,
      };
    }),
});

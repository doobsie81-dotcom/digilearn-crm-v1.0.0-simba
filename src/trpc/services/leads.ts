import { eq, sql } from "drizzle-orm";
import {
  companies,
  contacts,
  leadActivities,
  leadContacts,
  leads,
} from "~/db/schema";
import type { DbExecutor, NewContact } from "~/db/types";
import z from "zod";
import { createleads } from "~/validation/leads";
import { Context } from "../init";

type CreateLeadInput = z.infer<typeof createleads>;

export class LeadsService {
  static async createLead(
    db: DbExecutor,
    input: CreateLeadInput,
    ctx: Context
  ) {
    if (!ctx.user) {
      throw new Error("Unauthorised");
    }
    const { lead, contacts: contactsList } = input;
    const result = await db.transaction(async (tx) => {
      // create company first..
      let exisitingCompany = null;
      if (lead.companyId) {
        exisitingCompany = await db.query.companies.findFirst({
          where: eq(companies.id, lead.companyId),
        });
        if (!exisitingCompany) {
          throw new Error("Selected Company does not exist.");
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
            region: lead.region,
            province: lead.province,
            city: lead.city,
            ownerId: ctx.user!.id,
          })
          .$returningId();
      }

      // insert primary contact if provided
      const primaryContact = contactsList.find((c) => c.isPrimary) as
        | NewContact
        | undefined;

      if (!primaryContact) {
        throw new Error("Primary contact is required");
      }

      const [newPrimaryContact] = await tx
        .insert(contacts)
        .values({
          companyId: company.id,
          firstName: primaryContact.firstName,
          lastName: primaryContact.lastName,
          email: primaryContact.email,
          phoneNumber: primaryContact.phoneNumber,
          jobTitle: primaryContact.jobTitle,
          ownerId: ctx.user!.id!,
        })
        .onDuplicateKeyUpdate({
          set: { firstName: primaryContact.firstName },
        })
        .$returningId();

      // Insert lead
      const [newLead] = await tx
        .insert(leads)
        .values({
          ownerId: ctx.user!.id!,
          name: lead.name,
          companyId: company.id,
          primaryContactId: newPrimaryContact.id,
          source: lead.source,
          //  estimatedValue: input.estimatedValue?.toString(),
        })
        .$returningId();
      const leadId = newLead.id;

      // 4. Link primary contact to lead
      await tx.insert(leadContacts).values({
        leadId,
        contactId: newPrimaryContact.id,
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
          ownerId: ctx.user!.id,
        }));

        insertedContacts = await tx
          .insert(contacts)
          .values(contactsData)
          .onDuplicateKeyUpdate({
            set: { firstName: sql`values(${contacts.firstName})` },
          })
          .$returningId();

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
      await tx.insert(leadActivities).values({
        leadId,
        contactId: newPrimaryContact.id,
        type: "note",
        status: "completed",
        subject: "Lead created",
        description: `Lead created from ${lead.source}`,
        createdBy: ctx.user!.id!,
        completedAt: new Date(),
      });

      return {
        lead: newLead,
        contacts: insertedContacts,
      };
    });

    return result;
  }
}

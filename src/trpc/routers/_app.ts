import { createTRPCRouter } from "../init";
import { leadsRouter } from "~/trpc/routers/leads";
import { pipelinesRouter } from "./pipelines";
import { usersRouter } from "./users";
import { settingsRouter } from "./settings";
import { dealsRouter } from "./deals";
import { quotesRouter, invoicesRouter } from "./accounting";
import { companiesRouter } from "./companies";
import { productsRouter } from "./products";
import { stakeholdersRouter } from "./stakeholders";
import { taskRouter } from "./tasks";
import { eventsRouter } from "./events";
import { emailsRouter } from "./emailing";
import { activitiesRouter } from "./activities";
import { notesRouter } from "./notes";
import { reportsRouter } from "./reports";
import { permissionRouter } from "./role-permissions";
import { tagsRouter } from "./tags";
import { callsRouter } from "./calls";
import { filesRouter } from "./files";
import { leadQualificationRouter } from "./lead-qualification";
import { raffleRouter } from "./raffle";
import { paymentTermsRouter } from "./payment-terms";
// import { personsRouter } from "./persons";

export const appRouter = createTRPCRouter({
  leads: leadsRouter,
  pipelines: pipelinesRouter,
  users: usersRouter,
  deals: dealsRouter,
  settings: settingsRouter,
  quotes: quotesRouter,
  invoices: invoicesRouter,
  companies: companiesRouter,
  products: productsRouter,
  stakeholders: stakeholdersRouter,
  tasks: taskRouter,
  events: eventsRouter,
  emailing: emailsRouter,
  activities: activitiesRouter,
  notes: notesRouter,
  reports: reportsRouter,
  rolePermissions: permissionRouter,
  tags: tagsRouter,
  calls: callsRouter,
  files: filesRouter,
  leadQualification: leadQualificationRouter,
  raffle: raffleRouter,
  paymentTerms: paymentTermsRouter,
  // persons: personsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

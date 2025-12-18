import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "~/db";
import { settings } from "~/db/schema";
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from "~/trpc/init";
import { settingsSchema } from "~/validation/settings";

export const settingsRouter = createTRPCRouter({
  getAll: baseProcedure
    .meta({ openapi: { method: "GET", path: "/settings" } })
    .query(async () => {
    const settings = await db.query.settings.findMany();

    if (!settings.length) {
      return {};
    }

    const settingsKeyVal: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsKeyVal[setting.key] = setting.value;
    });
    return settingsKeyVal;
  }),
  updateSetting: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/settings/{key}" } })
    .input(
      z.object({
        key: z.string().min(2).max(100),
        value: z.string().max(500),
      })
    )
    .mutation(async ({ input }) => {
      const { key, value } = input;

      await db
        .update(settings)
        .set({
          value,
        })
        .where(eq(settings.key, key));

      return { success: true };
    }),
  updateSettings: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/settings" } })
    .input(
      settingsSchema.partial().transform((obj) => ({ settings: obj }))
    )
    .mutation(async ({ input }) => {
      const { settings: updates } = input;

      await Promise.all(
        Object.keys(updates).map(async (key) => {
          // NEED TO INSERT IF NOT EXIST, run some sort of upsert statement here
          const record = await db.query.settings.findFirst({
            where: eq(settings.key, key),
          });
          if(record) {
            return db
              .update(settings)
              .set({ value: updates[key as keyof typeof updates] })
              .where(eq(settings.key, key));
          }
          return db
            .insert(settings)
            .values({ key, value: updates[key as keyof typeof updates] })
          }
        )
      );

      return { success: true };
    }),
});

import { NextResponse } from "next/server";
import { db } from "~/db";
import { SettingSchema } from "~/db/schema/settings-schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Check if installation is complete
    const setting = await db
      .select()
      .from(SettingSchema)
      .where(eq(SettingSchema.key, "is_installation_complete"))
      .limit(1);
    console.log(setting);

    const isComplete = setting.length > 0 && setting[0].value === "true";

    return NextResponse.json({
      isInstallationComplete: isComplete,
    });
  } catch (error) {
    console.error("Error checking installation status:", error);
    return NextResponse.json(
      { error: "Failed to check installation status" },
      { status: 500 }
    );
  }
}

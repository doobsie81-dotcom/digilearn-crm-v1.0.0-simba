import { NextRequest, NextResponse } from "next/server";
import { db } from "~/db";
import { SettingSchema } from "~/db/schema/settings-schema";
import { user } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify the user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user role to admin (first user is always admin)
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, userId));

    // Check if installation setting already exists
    const existingSetting = await db
      .select()
      .from(SettingSchema)
      .where(eq(SettingSchema.key, "is_installation_complete"))
      .limit(1);

    if (existingSetting.length > 0) {
      // Update existing setting
      await db
        .update(SettingSchema)
        .set({ value: "true" })
        .where(eq(SettingSchema.key, "is_installation_complete"));
    } else {
      // Insert new setting
      await db.insert(SettingSchema).values({
        key: "is_installation_complete",
        value: "true",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Installation completed successfully",
    });
  } catch (error) {
    console.error("Error completing installation:", error);
    return NextResponse.json(
      { error: "Failed to complete installation" },
      { status: 500 }
    );
  }
}

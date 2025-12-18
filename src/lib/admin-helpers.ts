"use server";

import { auth, getServerSession } from "~/lib/auth";
import { headers } from "next/headers";
import { UserRoles } from "~/db/schema";

/**
 * Create a new user (admin only)
 */
export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: (typeof UserRoles)[number] | typeof UserRoles[number][];
}) {
  try {
    const newUser = await auth.api.createUser({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        //role: data?.role ? data.role : "sales-agent",
      },
    });

    console.log("New User", newUser);

    return { success: true, data: newUser };
  } catch (error) {
    console.error("Failed to create user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

/**
 * List users method (admin only)
 * */
export async function listUsers(query: {
  searchValue?: string | undefined;
  searchField?: "name" | "email" | undefined;
  searchOperator?: "contains" | "starts_with" | "ends_with" | undefined;
  limit?: string | number | undefined;
  offset?: string | number | undefined;
  sortBy?: string | undefined;
  sortDirection?: "asc" | "desc" | undefined;
  filterField?: string | undefined;
  filterValue?: string | number | boolean | undefined;
  filterOperator?:
    | "contains"
    | "eq"
    | "ne"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | undefined;
}) {
  try {
    const users = await auth.api.listUsers({
      headers: await headers(),
      query,
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Failed to list users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list users",
    };
  }
}

/**
 * Delete a user (admin only)
 */
export async function removeUser(userId: string) {
  try {
    const deletedUser = await auth.api.banUser({
      body: {
        userId,
        banReason: "Deletion",
      },
      headers: await headers(),
    });

    return { success: true, data: deletedUser };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * Check if current user has admin permissions
 */
export async function checkIsAdmin() {
  try {
    const session = await getServerSession();

    return session?.user?.role === "admin";
  } catch {
    return false;
  }
}

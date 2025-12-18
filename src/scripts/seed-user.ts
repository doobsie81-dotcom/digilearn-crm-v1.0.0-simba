#!/usr/bin/env bun
import { parseArgs } from "node:util";
import readline from "node:readline";
import { auth } from "~/lib/auth";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function main() {
  // Ask upfront
  const confirm = (
    await prompt("Do you want to create a new user? (Y/N)")
  )?.toLowerCase();

  if (confirm !== "y") {
    console.log("❕Skipping user creation");
    process.exit(0);
  }

  const { values } = parseArgs({
    options: {
      name: { type: "string" },
      email: { type: "string" },
      password: { type: "string" },
    },
  });

  let { name, email, password } = values;
  if (!name) name = await prompt("Enter name:");
  if (!email) email = await prompt("Enter email:");
  if (!password) password = await prompt("Enter password:");

  if (!name || !email || !password) {
    console.log("❕Skipping user creation");
    process.exit(1);
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });
  } catch (error: unknown | Response | Error) {
    if (error instanceof Response) {
      const errorData = await error.json();
      console.error("❌ Failed to create user:", errorData.message);
      process.exit(1);
    }
    console.error(
      "❌ An unexpected error occured:",
      error instanceof Error ? error.message : "Fatal Error"
    );
    process.exit(1);
  }

  console.log(`✅ User "${name}" create successfully with email ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error seeding user:", error.message);
  process.exit(1);
});

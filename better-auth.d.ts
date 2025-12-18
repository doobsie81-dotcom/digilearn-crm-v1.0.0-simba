import { Permission } from "~/db/types";

declare module "better-auth" {
  interface Session {
    userPermissions: Permission[];
  }
  interface BetterAuthConfig {
    roles: {
      admin: {};
      "sales-agent": {};
      "sales-manager": {};
      manager: {};
    };
  }
}

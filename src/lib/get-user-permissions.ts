import {
  Lead,
  Deal,
  User,
  Company,
  Invoice,
  Quote,
  Permission,
  LeadActivity,
} from "~/db/types";
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  Subject as CaslSubject,
} from "@casl/ability";
import { auth } from "./auth";
import { permissionActionsEnum } from "~/db/schema";

export interface PermissionCondition {
  [key: string]: string | PermissionCondition;
}

type LeadSubject = Pick<Lead, "ownerId"> | "Lead";
type DealSubject = Pick<Deal, "assignedTo"> | "Deal";
type UserSubject = Pick<User, "role"> | "User";
type RoleSubject = "Role";
type ReportSubject = "Report";
type CompanySubject = Company | "Company";
type InvoiceSubject = Invoice | "Invoice";
type QuoteSubject = Quote | "Quote";
type DashboardSubject = "Dashboard";
type LeadActivitySubject = LeadActivity | "LeadActivity";
type RaffleSubject = "Raffle";
type Action = (typeof permissionActionsEnum)[number];
type Subject =
  | LeadSubject
  | DealSubject
  | UserSubject
  | RoleSubject
  | ReportSubject
  | CompanySubject
  | InvoiceSubject
  | QuoteSubject
  | DashboardSubject
  | LeadActivitySubject
  | RaffleSubject
  | "all";

export type AppAbility = [Action, Subject];

export async function getUserPermissions(
  user: typeof auth.$Infer.Session.user | undefined,
  permissions: Permission[]
): Promise<MongoAbility<AppAbility>> {
  const { build, can, cannot } = new AbilityBuilder<MongoAbility<AppAbility>>(
    createMongoAbility
  );
  if (user != null) {
    if (user.role === "admin") {
      can("manage", "all");
      return build();
    }

    permissions.forEach((permission) => {
      const subject = permission.subject as CaslSubject;
      const conditions = permission.conditions
        ? PermissionHelper.parseCondition(JSON.parse(permission.conditions), {
            id: user.id,
            role: user.role,
          })
        : undefined;
      if (permission.inverted) {
        cannot(permission.action, subject, conditions);
      } else {
        can(permission.action, subject, conditions);
      }
    });
  }
  return build();
}

export function can(
  ability: MongoAbility<AppAbility> | null,
  action: Action,
  subject: Subject,
  resource?: string
): boolean {
  if (!ability) return false;
  return resource
    ? ability.can(action, subject, resource)
    : ability.can(action, subject);
}

class PermissionHelper {
  static parseCondition(
    condition: PermissionCondition | null,
    variables: Record<string, string>
  ): PermissionCondition | undefined {
    if (!condition) return undefined;
    const parsedCondition: PermissionCondition = {};
    for (const [key, rawValue] of Object.entries(condition)) {
      if (rawValue !== null && typeof rawValue === "object") {
        const value = this.parseCondition(rawValue, variables);
        if (typeof value === "undefined") {
          throw new ReferenceError(`Variable ${rawValue} is not defined`);
        }
        parsedCondition[key] = value;
        continue;
      }
      if (typeof rawValue !== "string") {
        parsedCondition[key] = rawValue;
        continue;
      }
      // find placeholder "${}""
      const matches = /\${(.*?)}/g.exec(rawValue);
      if (!matches) {
        parsedCondition[key] = rawValue;
        continue;
      }
      const value = variables[matches[1]];
      if (typeof value === "undefined") {
        throw new ReferenceError(`Variable ${rawValue} is not defined`);
      }
      parsedCondition[key] = value;
    }
    return parsedCondition;
  }
}

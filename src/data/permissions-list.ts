import { permissionActionsEnum } from "~/db/schema";
import { NewPermission } from "~/db/types";

export type Action = (typeof permissionActionsEnum)[number];

export interface Condition {
  description: string;
  condition: Record<string, string>;
  appliesTo: Action[];
}

export interface PermissionConfig {
  description: string;
  actions: Action[];
  conditions: Condition[];
}

type PermissionsList = Record<string, PermissionConfig>;

export const PERMISSIONS_LIST: PermissionsList = {
  Dashboard: {
    description: "Can view main dashboard",
    actions: ["read"],
    conditions: [],
  },

  Lead: {
    description:
      "Allows user to manage leads, including creating, editing, and deleting lead records.",
    actions: ["manage", "create", "read", "update", "delete"],
    conditions: [
      {
        description: "Only leads owned by the user",
        condition: {
          ownerId: "${id}",
        },
        appliesTo: ["read", "update"],
      },
    ],
  },
  Raffle: {
    description:
      "Allows user to manage raffles, including creating, editing, and deleting.",
    actions: ["manage", "create", "read", "update", "delete"],
    conditions: [
    ],
  },
  LeadActivity: {
    description:
      "Allows user to create notes, meetings, calls and task on the lead and deal.",
    actions: ["create", "read", "update"],
    conditions: [
      {
        description: "Can create meetings, notes, etc, for only their leads",
        condition: {
          leadId: "${id}",
        },
        appliesTo: ["create"],
      },
      {
        description:
          "Can view meetings, notes, etc, for only their leads or deals and activities",
        condition: {
          createdBy: "${id}",
        },
        appliesTo: ["read", "update"],
      },
    ],
  },
  Deal: {
    description:
      "Grants access to deal management functionalities such as adding new deals and updating existing ones.",
    actions: ["manage", "create", "read", "update", "delete"],
    conditions: [
      {
        description: "Only deals assigned to the user",
        condition: {
          assignedTo: "${id}",
        },
        appliesTo: ["read", "update"],
      },
      {
        description: "Only ongoing deals (not won or lost)",
        condition: {
          closedStatus: "ongoing",
        },
        appliesTo: ["read"],
      },
    ],
  },
  User: {
    description:
      "Enables user management capabilities, including viewing and modifying user accounts.",
    actions: ["manage", "create", "read", "update", "delete"],
    conditions: [
      {
        description: "Only their own user account",
        condition: {
          id: "${id}",
        },
        appliesTo: ["read"],
      },
    ],
  },
  Company: {
    description:
      "Provides permissions to handle company records, including creation and updates.",
    actions: ["manage", "create", "read", "update", "delete"],
    conditions: [],
  },
  Report: {
    description:
      "Allows access to reporting features, including generating and viewing reports.",
    actions: ["read", "create"],
    conditions: [], // we may have to
  },
  Quote: {
    description:
      "Grants permissions to manage quotes, including creating, editing, and deleting quote records.",
    actions: ["manage", "create", "read", "update", "delete"],
    conditions: [
      {
        description: "Only quotes created by the user",
        condition: {
          createdBy: "${id}",
        },
        appliesTo: ["read", "update"],
      },
    ],
  },
  Invoice: {
    description:
      "Grants permissions to manage invoices, including creating, editing, and deleting invoice records.",
    actions: ["manage", "create", "read", "update", "delete"],
    conditions: [
      {
        description: "Only invoices created by the user",
        condition: {
          createdBy: "${id}",
        },
        appliesTo: ["read", "update"],
      },
    ],
  },
} as const;

export const DEFAULT_PERMISSIONS: NewPermission[] = [];

export type PermissionSubject = keyof typeof PERMISSIONS_LIST;

"use client";

import { useAbility } from "~/hooks/use-ability";
import { subject } from "@casl/ability";
import { User, Lead, Deal } from "~/db/types";
import { trpc } from "~/trpc/client";
import AddOptionCombo from "./add-option";
import { UserRoundPlus } from "lucide-react";
import { cn } from "~/lib/utils";

interface AssigneeSelectorProps {
  currentAssignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  onAssigneeChange: (assigneeId: string | null) => void;
  isPending?: boolean;
  entityType: "Lead" | "Deal";
  entityId: string;
  layout?: "stacked" | "inline";
  readOnly?: boolean;
  showLabel?: boolean;
}

export function AssigneeSelector({
  currentAssignee,
  onAssigneeChange,
  isPending = false,
  entityType,
  entityId,
  layout = "inline",
  readOnly = false,
  showLabel,
}: AssigneeSelectorProps) {
  const abilities = useAbility();

  // Check if user can read users
  const canViewUsers = abilities.can(
    "read",
    subject("User", { id: "dummy_user_id" } as User)
  );

  const entityToCheck =
    entityType === "Deal"
      ? ({ assignedTo: currentAssignee?.id } as Deal)
      : ({ ownerId: currentAssignee?.id } as Lead);

  // Check if user can update the entity (for permission check)
  const canUpdate = abilities.can("update", subject(entityType, entityToCheck));

  // Determine read-only view based on explicit prop or missing permissions
  const isReadOnlyView = readOnly || !canViewUsers || !canUpdate;

  // Fetch sales agents and managers if user has permission
  const { data: users, isLoading: isLoadingUsers } =
    trpc.users.getByRole.useQuery(
      {
        roles: ["sales-agent", "sales-manager"],
      },
      { enabled: canViewUsers }
    );

  // If user cannot view users or update the entity, show readonly view
  if (isReadOnlyView) {
    return (
      <div
        className={cn(
          "flex gap-2",
          layout === "stacked"
            ? "flex-col items-start"
            : "flex-row items-center"
        )}
      >
        <div className="max-w-100 flex items-center">
          <UserRoundPlus className="h-4 w-4 mr-2" />
          <p className="text-sm truncate">Assignee</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {currentAssignee?.name || currentAssignee?.email || "Unassigned"}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching users
  if (isLoadingUsers) {
    return (
      <div className="flex items-center gap-2">
        <div className="max-w-100 flex items-center">
          <UserRoundPlus className="h-4 w-4 mr-2" />
          <p className="text-sm truncate">Assignee</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Prepare options including "Unassigned" option
  const options = [
    { label: "Unassigned", value: "" }, // Empty string for unassigned
    ...(users || []).map((user) => ({
      label: `${user.name || user.email}`,
      value: user.id,
    })),
  ];

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "stacked" ? "flex-col items-start" : "flex-row items-center"
      )}
    >
      {showLabel && (
        <div className="max-w-100 flex items-center">
          <UserRoundPlus className="h-4 w-4 mr-2" />
          <p className="text-sm truncate">Assignee</p>
        </div>
      )}
      <div className={cn("flex-1", layout === "stacked" && "w-full")}>
        <AddOptionCombo
          options={options}
          placeholder="Select assignee"
          onSelect={(value) => onAssigneeChange(value || null)}
          value={currentAssignee?.id || ""}
          isPending={isPending}
        />
      </div>
    </div>
  );
}

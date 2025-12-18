"use client";

import { Info } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Action,
  Condition,
  PERMISSIONS_LIST,
  PermissionSubject,
} from "~/data/permissions-list";
import { UserRoles } from "~/db/schema";
import { trpc } from "~/trpc/client";

const RolesClientPage = () => {
  const [searchSubject, setSearchSubject] = useState("");
  const [activeRole, setActiveRole] = useState<(typeof UserRoles)[number]>(
    UserRoles[0]
  );
  const [selectedSubject, setSelectedSubject] =
    useState<PermissionSubject>("Lead");

  const [permissionForm, setPermissionForm] = useState<
    Record<
      string,
      {
        enabled: boolean;
        conditions: Record<number, boolean>;
      }
    >
  >({});

  const utils = trpc.useUtils();

  const { data: rolePermissions, isLoading } =
    trpc.rolePermissions.getAll.useQuery();

  const updatePermissionsMutation =
    trpc.rolePermissions.updateRolePermissions.useMutation({
      onSuccess: (data) => {
        toast.success(
          `Updated ${data.count} permissions for ${activeRole} role`
        );
        // Invalidate and refetch permissions
        utils.rolePermissions.getAll.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const form = useForm({
    defaultValues: {
      role: activeRole,
      subject: selectedSubject,
      permissions: [] as Array<{
        action: string;
        enabled: boolean;
        conditions?: Array<{
          conditionIndex: number;
          enabled: boolean;
          condition: Record<string, string>;
        }>;
      }>,
    },
  });

  const filteredSubjects: PermissionSubject[] = useMemo(() => {
    return Object.keys(PERMISSIONS_LIST).filter((subject) =>
      subject.toLowerCase().includes(searchSubject.toLowerCase())
    ) as PermissionSubject[];
  }, [searchSubject]);

  const findSelectedActions = useCallback(
    (role: (typeof UserRoles)[number], subject: string) => {
      if (!rolePermissions) return [];
      const permissionsForRole = rolePermissions.filter(
        (perm) => perm.role === role && perm.subject === subject
      );
      return permissionsForRole;
    },
    [rolePermissions]
  );

  // Initialize form when subject or role changes
  useEffect(() => {
    if (isLoading || !rolePermissions) return;

    const selectedPermissions = findSelectedActions(
      activeRole,
      selectedSubject
    );
    const subjectData = PERMISSIONS_LIST[selectedSubject];

    const formData: Record<
      string,
      { enabled: boolean; conditions: Record<number, boolean> }
    > = {};

    subjectData.actions.forEach((action) => {
      const isEnabled = selectedPermissions.some(
        (perm) => perm.action === action
      );
      const conditionsState: Record<number, boolean> = {};

      subjectData.conditions.forEach((conditionItem, index) => {
        if (conditionItem.appliesTo.includes(action)) {
          const hasCondition = selectedPermissions.some((perm) => {
            if (perm.action !== action) return false;

            // Parse the condition from database if it exists
            try {
              const dbCondition = perm.conditions
                ? JSON.parse(perm.conditions)
                : null;
              const expectedCondition = conditionItem.condition;

              // Compare the parsed condition with the expected condition
              return (
                JSON.stringify(dbCondition) ===
                JSON.stringify(expectedCondition)
              );
            } catch (e) {
              // If parsing fails, fall back to string comparison
              return (
                perm.conditions === JSON.stringify(conditionItem.condition)
              );
            }
          });
          conditionsState[index] = hasCondition;
        }
      });

      formData[action] = {
        enabled: isEnabled,
        conditions: conditionsState,
      };
    });

    setPermissionForm(formData);
  }, [
    activeRole,
    selectedSubject,
    findSelectedActions,
    isLoading,
    rolePermissions,
  ]);

  const handleSubmit = async () => {
    const subjectData = PERMISSIONS_LIST[selectedSubject];

    // Transform permissionForm to the format expected by the mutation
    const permissionsArray = Object.entries(permissionForm).map(
      ([action, data]) => {
        const actionConditions = subjectData.conditions
          .map((conditionItem, index) => {
            if (
              conditionItem.appliesTo.includes(action as Action) &&
              data.conditions[index]
            ) {
              return {
                conditionIndex: index,
                enabled: data.conditions[index],
                condition: conditionItem.condition,
              };
            }
            return null;
          })
          .filter(
            (
              item
            ): item is {
              conditionIndex: number;
              enabled: true;
              condition: Condition['condition'];
            } => item !== null && item.enabled === true
          );

        return {
          action,
          enabled: data.enabled,
          conditions:
            actionConditions.length > 0 ? actionConditions : undefined,
        };
      }
    );

    try {
      await updatePermissionsMutation.mutateAsync({
        role: activeRole,
        subject: selectedSubject,
        permissions: permissionsArray,
      });
    } catch (error) {
      console.error("Failed to update permissions:", error);
    }
  };

  const togglePermission = (action: string, enabled: boolean) => {
    setPermissionForm((prev) => ({
      ...prev,
      [action]: {
        ...prev[action],
        enabled,
      },
    }));
    console.log(`Toggle ${action} for ${selectedSubject}:`, enabled);
  };

  const toggleCondition = (
    action: string,
    conditionIndex: number,
    enabled: boolean
  ) => {
    setPermissionForm((prev) => ({
      ...prev,
      [action]: {
        ...prev[action],
        conditions: {
          ...prev[action]?.conditions,
          [conditionIndex]: enabled,
        },
      },
    }));
    console.log(
      `Toggle condition ${conditionIndex} for ${action} on ${selectedSubject}:`,
      enabled
    );
  };

  const selectedSubjectData = PERMISSIONS_LIST[selectedSubject];

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Role Permissions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage permissions for each user role
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="role-select" className="text-sm font-medium">
                Select Role:
              </Label>
              <select
                id="role-select"
                value={activeRole}
                onChange={(e) =>
                  setActiveRole(e.target.value as (typeof UserRoles)[number])
                }
                className="px-3 py-2 border rounded-md bg-background"
              >
                {UserRoles.map((role) => (
                  <option key={role} value={role}>
                    {role
                      .split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid Layout: Subjects on Left, Permissions on Right */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Subjects List */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <h3 className="font-semibold">Subjects</h3>
            <Input
              placeholder="Search..."
              value={searchSubject}
              onChange={(e) => setSearchSubject(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSubjects.map((subject) => {
                  const subjectPerms = findSelectedActions(activeRole, subject);
                  const subjectData = PERMISSIONS_LIST[subject];
                  const isActive = selectedSubject === subject;

                  return (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-l-2 ${
                        isActive
                          ? "border-l-primary bg-muted/50 font-medium"
                          : "border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{subject}</span>
                        <span className="text-xs text-muted-foreground">
                          {subjectPerms.length}/{subjectData.actions.length}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filteredSubjects.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No subjects found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Permissions Management */}
        <Card className="col-span-12 lg:col-span-9">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{selectedSubject}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSubjectData.description}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{selectedSubjectData.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading permissions...
              </div>
            ) : (
              <div className="space-y-1">
                {/* Permissions List */}
                {selectedSubjectData.actions.map((action) => {
                  const isEnabled = permissionForm[action]?.enabled || false;
                  const applicableConditions =
                    selectedSubjectData.conditions.filter((cond) =>
                      cond.appliesTo.includes(action)
                    );

                  return (
                    <div key={action} className="border rounded-lg">
                      {/* Action Row */}
                      <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <Label
                              htmlFor={`permission-${action}`}
                              className="text-sm font-medium capitalize cursor-pointer"
                            >
                              {action}
                            </Label>
                          </div>
                        </div>
                        <Switch
                          id={`permission-${action}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            togglePermission(action, checked)
                          }
                        />
                      </div>

                      {/* Conditions (if applicable and action is enabled) */}
                      {applicableConditions.length > 0 && isEnabled && (
                        <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Conditions
                          </p>
                          {applicableConditions.map((conditionItem) => {
                            const conditionIndex =
                              selectedSubjectData.conditions.findIndex(
                                (cond) =>
                                  cond.description === conditionItem.description
                              );
                            const isConditionEnabled =
                              permissionForm[action]?.conditions?.[
                                conditionIndex
                              ] || false;

                            return (
                              <div
                                key={conditionIndex}
                                className="flex items-start justify-between gap-3 p-3 bg-background rounded border"
                              >
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm">
                                    {conditionItem.description}
                                  </p>
                                  {/* <p className="text-xs text-muted-foreground font-mono">
                                    {JSON.stringify(conditionItem.condition)}
                                  </p> */}
                                </div>
                                <Switch
                                  checked={isConditionEnabled}
                                  onCheckedChange={(checked) =>
                                    toggleCondition(
                                      action,
                                      conditionIndex,
                                      checked
                                    )
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={updatePermissionsMutation.isPending}
                  >
                    {updatePermissionsMutation.isPending
                      ? "Saving..."
                      : "Save Permissions"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RolesClientPage;

import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { UserRoles } from "~/db/schema";
const adminStatement = {
  ...defaultStatements,
} as const;
const ac = createAccessControl(adminStatement);
const newRole = ac.newRole;
export const adminRole = newRole({
  ...adminAc.statements,
});

type RoleHandlers = {
  [K in (typeof UserRoles)[number]]: ReturnType<typeof newRole>;
};

export const createCustomRoles = () => {
  return UserRoles.reduce((acc, role) => {
    if (role === "admin") {
      acc[role] = adminRole;
    } else {
      acc[role] = newRole({
        session: [],
        user: [],
      });
    }
    return acc;
  }, {} as RoleHandlers);
};

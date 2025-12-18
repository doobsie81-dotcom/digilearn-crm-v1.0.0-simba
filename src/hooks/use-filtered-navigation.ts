import { navigationSections } from "~/data/navigation";
import { useAbility } from "~/hooks/use-ability";
import { can } from "~/lib/get-user-permissions";
import { subject as caslSubject } from "@casl/ability";
import { User } from "~/db/types";

export function useFilteredNavigation() {
  const ability = useAbility();

  const getSubjectFromHref = (href: string) => {
    if (href.includes("/leads")) return "Lead";
    if (href.includes("/companies")) return "Company";
    if (href.includes("/quotes")) return "Quote";
    if (href.includes("/invoices")) return "Invoice";
    if (href.includes("/users")) return "User";
    if (href.includes("/raffles")) return "Raffle";
    if (href.includes("/reports")) return "Report";
    if (href.includes("/pipeline")) return "Deal";
    if (href.includes("/activities")) return "LeadActivity";
    if (href.includes("/tasks")) return "LeadActivity";
    if (href.includes("/calendar")) return "LeadActivity";
    return "all";
  };

  return navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const subject = getSubjectFromHref(item.href);
        if (subject === "User") {
          const dummyUser = { id: "dummy-non-existent-id" } as User;
          return can(ability, "read", caslSubject(subject, dummyUser));
        }
        return can(ability, "read", subject);
      }),
    }))
    .filter((section) => section.items.length > 0);
}

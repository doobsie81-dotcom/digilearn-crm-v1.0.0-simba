// src/providers/AbilityProvider.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { getUserPermissions } from "~/lib/get-user-permissions";
import { useAbilityStore } from "~/store/use-ability-store";
import { useSession } from "~/lib/auth-client";
import { Loader } from "lucide-react";

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const setAbility = useAbilityStore((s) => s.setAbility);
  const isInitialized = useAbilityStore((s) => s.isInitialized);
  const setInitialized = useAbilityStore((s) => s.setInitialized);

  useEffect(() => {
    async function getAbility() {
      if (!session?.user) {
        return null;
      }
      const ability = await getUserPermissions(
        session.user,
        session.userPermissions ?? []
      );
      if (ability) setAbility(ability);
      setInitialized(true);
    }
    getAbility();
  }, [session, setAbility, setInitialized]);

  if (!isInitialized) {
    return (
      <div className="grid place-items-center h-screen">
        <div className="space-y-4 text-center">
          <Loader className="h-8 w-8 animate-spin" />
          <p>Loading permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

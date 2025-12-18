import { useAbilityStore } from "~/store/use-ability-store";
import { MongoAbility } from "@casl/ability";
import { AppAbility } from "~/lib/get-user-permissions";

export function useAbility(): MongoAbility<AppAbility> {
  const ability = useAbilityStore((s) => s.ability);
  const isInitialized = useAbilityStore((s) => s.isInitialized);

  if (!isInitialized) {
    throw new Error(
      "useAbility() called before AbilityProvider initialized. Wrap your component tree in <AbilityProvider>."
    );
  }

  if (!ability) {
    throw new Error(
      "No ability found in AbilityProvider. Ensure user permissions are loaded correctly."
    );
  }

  return ability;
}

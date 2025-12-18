import { create } from "zustand";
import { MongoAbility } from "@casl/ability";
import { AppAbility } from "~/lib/get-user-permissions";

interface AbilityState {
  ability: MongoAbility<AppAbility> | null;
  setAbility: (ability: MongoAbility<AppAbility> | null) => void;
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
}

export const useAbilityStore = create<AbilityState>((set) => ({
  ability: null,
  setAbility: (ability) => set({ ability }),
  isInitialized: false,
  setInitialized: (value) => set({ isInitialized: value }),
}));

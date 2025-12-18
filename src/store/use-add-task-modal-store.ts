import { create } from "zustand";

interface TaskModalStoreProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useTaskModalStore = create<TaskModalStoreProps>()((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

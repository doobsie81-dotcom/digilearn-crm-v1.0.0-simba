import { create } from "zustand";

interface AddCompanyModalStoreProps {
  isOpen: boolean;
  companyId: string | null;
  onOpen: (companyId?: string) => void;
  onClose: () => void;
}

export const useAddCompanyModalStore = create<AddCompanyModalStoreProps>()(
  (set) => ({
    isOpen: false,
    companyId: null,
    onOpen: (companyId) => set({ isOpen: true, companyId: companyId || null }),
    onClose: () => set({ isOpen: false, companyId: null }),
  })
);

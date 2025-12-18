import { create } from 'zustand';

interface DealSheetStoreProps {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

export const useDealSheetStore = create<DealSheetStoreProps>()((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false })
}))

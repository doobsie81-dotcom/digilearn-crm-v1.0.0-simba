import { create } from 'zustand';

interface AddDealModalStoreProps {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

export const useAddDealModalStore = create<AddDealModalStoreProps>()((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false })
}))

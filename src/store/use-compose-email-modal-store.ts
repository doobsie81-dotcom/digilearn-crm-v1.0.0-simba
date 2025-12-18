import { create } from 'zustand';

interface ComposeEmailModalStoreProps {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

export const useComposeEmailModalStore = create<ComposeEmailModalStoreProps>()((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false })
}))

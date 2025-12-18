import { create } from 'zustand';

interface FileUploadModalStoreProps {
    isOpen: boolean;
    leadId?: string;
    dealId?: string;
    onOpen: (leadId?: string, dealId?: string) => void;
    onClose: () => void;
}

export const useFileUploadModalStore = create<FileUploadModalStoreProps>()((set) => ({
    isOpen: false,
    leadId: undefined,
    dealId: undefined,
    onOpen: (leadId?: string, dealId?: string) => set({ isOpen: true, leadId, dealId }),
    onClose: () => set({ isOpen: false, leadId: undefined, dealId: undefined })
}))

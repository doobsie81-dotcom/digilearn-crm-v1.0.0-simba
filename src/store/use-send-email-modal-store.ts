import { create } from 'zustand';

interface SendEmailModalStoreProps {
    isOpen: boolean;
    leadId?: string;
    dealId?: string;
    defaultTo?: { email: string; name?: string }[];
    onOpen: (data?: { leadId?: string; dealId?: string; defaultTo?: { email: string; name?: string }[] }) => void;
    onClose: () => void;
}

export const useSendEmailModalStore = create<SendEmailModalStoreProps>()((set) => ({
    isOpen: false,
    leadId: undefined,
    dealId: undefined,
    defaultTo: undefined,
    onOpen: (data) => set({ isOpen: true, ...data }),
    onClose: () => set({ isOpen: false, leadId: undefined, dealId: undefined, defaultTo: undefined })
}))

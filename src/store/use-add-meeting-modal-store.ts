import { create } from "zustand";

interface SlotInfo {
  start: Date;
  end: Date;
}

interface MeetingModalStoreProps {
  isOpen: boolean;
  slotInfo: SlotInfo | null;
  onOpen: (slotInfo?: SlotInfo) => void;
  onClose: () => void;
}

export const useAddMeetingModalStore = create<MeetingModalStoreProps>()((set) => ({
  isOpen: false,
  slotInfo: null,
  onOpen: (slotInfo) => set({ isOpen: true, slotInfo: slotInfo || null }),
  onClose: () => set({ isOpen: false, slotInfo: null }),
}));

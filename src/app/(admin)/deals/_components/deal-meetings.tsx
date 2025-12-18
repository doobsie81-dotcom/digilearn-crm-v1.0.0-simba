"use client";

import { trpc } from "~/trpc/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "~/components/ui/form";
import { toast } from "sonner";
import { AddMeetingValues, createMeetingSchema } from "~/validation/events";
import { AddMeetingModal } from "~/components/modals/add-meeting-modal";
import { useAddMeetingModalStore } from "~/store/use-add-meeting-modal-store";
import { DataCalendar } from "~/components/data-calendar";
import { useSession } from "~/lib/auth-client";
import { Contact } from "~/db/types";

interface DealMeetingsProps {
  id: string | null;
  leadId: string;
  contacts: Contact[];
}

export const DealMeetings = ({
  id,
  leadId,
  contacts = [],
}: DealMeetingsProps) => {
  const session = useSession();
  const onClose = useAddMeetingModalStore((state) => state.onClose);
  const utils = trpc.useUtils();
  const {
    data: meetings,
    isLoading: loadingMeetings,
    error: meetingsError,
  } = trpc.events.getDealMeetings.useQuery({
    dealId: id!,
  });

  const { mutateAsync: createMeeting, isPending: isCreatingMeeting } =
    trpc.events.schedule.useMutation();

  const handleOnCreateMeeting = async (data: AddMeetingValues) => {
    try {
      await createMeeting(data, {
        onSuccess: () => {
          utils.events.getDealMeetings.invalidate();
        },
      });
      toast.success("New task was created!");
      handleOnCloseTaskModal();
      addMeetingForm.reset();
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnCloseTaskModal = () => {
    onClose();
    addMeetingForm.reset();
  };

  const addMeetingForm = useForm<AddMeetingValues>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      subject: "",
      leadId: leadId,
      dealId: id!,
      assignedTo: "",
      scheduledAt: new Date(),
      platform: "in_person",
      attendees: session?.data?.user?.email ? [session?.data?.user.email] : [],
    },
  });

  if (!id) {
    return null;
  }

  return (
    <>
      {loadingMeetings ? (
        <div>
          <p>Loading Meetings</p>
        </div>
      ) : meetingsError ? null : (
        meetings && <DataCalendar data={meetings} />
      )}
      <Form {...addMeetingForm}>
        <AddMeetingModal
          onSubmit={handleOnCreateMeeting}
          onClose={handleOnCloseTaskModal}
          isSubmitting={isCreatingMeeting}
          contacts={contacts}
        />
      </Form>
    </>
  );
};

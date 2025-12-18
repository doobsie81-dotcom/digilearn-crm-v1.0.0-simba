"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import Modal from "../ui/modal";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { useState } from "react";

const verificationSchema = z.object({
  primaryEmail: z.email("Invalid email address"),
  primaryPhoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  emailVerified: z.boolean(),
  phoneNumberVerified: z.boolean(),
});

export type VerificationValues = z.infer<typeof verificationSchema>;

interface AddVerificationModalProps {
  isOpen: boolean;
  handleClose: () => void;
  leadId: string;
  initialData: {
    primaryEmail: string;
    primaryPhoneNumber: string;
    emailVerified: boolean;
    phoneNumberVerified: boolean;
  };
}

export default function AddVerificationModal({
  isOpen,
  handleClose,
  leadId,
  initialData,
}: AddVerificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: initialData,
  });

  const updateLeadMutation = trpc.leads.updateLead.useMutation({
    mutationKey: ['leads', { leadId }]
  });

  const onSubmit = async (data: VerificationValues) => {
    setIsSubmitting(true);
    try {
      await updateLeadMutation.mutateAsync({
        id: leadId,
        lead: {
          emailVerified: data.emailVerified,
          phoneNumberVerified: data.phoneNumberVerified,
        },
      });

      toast.success("Verification status updated successfully!");
      handleClose();
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Lead Verification"
      description="Update email and phone verification status for this lead"
    >
      <div className="mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Email Verification Switch */}
            <FormField
              control={form.control}
              name="emailVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Verified</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Mark as verified if email address has been confirmed
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Phone Verification Switch */}
            <FormField
              control={form.control}
              name="phoneNumberVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Phone Verified</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Mark as verified if phone number has been confirmed
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Verification"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
}
"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Contact } from "~/db/types";
import { useComposeEmailModalStore } from "~/store/use-compose-email-modal-store";
import Modal from "../ui/modal";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { LexEditor } from "../lexical-editor";
import { ComposeEmailFormValues } from "~/validation/emails";
import { X } from "lucide-react";
import { Button } from "../ui/button";

interface EmailComposerModal {
  onClose: () => void;
  onSubmit: (data: ComposeEmailFormValues) => void;
  contacts: Contact[];
}

export const EmailComposerModal = ({
  onClose,
  onSubmit,
  contacts,
}: EmailComposerModal) => {
  const isOpen = useComposeEmailModalStore((state) => state.isOpen);
  const form = useFormContext<ComposeEmailFormValues>();

  const { control, setValue, watch } = form;
  const recipients = watch("recipients");
  const [recipientInput, setRecipientInput] = useState("");

  const handleAddRecipient = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact && !recipients.some((r) => r === contact.email)) {
      setValue("recipients", [...recipients, contact.email]);
    }
    setRecipientInput("");
  };

  const handleRemoveRecipient = (recipient: string) => {
    setValue(
      "recipients",
      recipients.filter((r) => r !== recipient)
    );
  };

  const filteredContacts = recipientInput
    ? contacts.filter(
        (c) =>
          c.email.toLowerCase().includes(recipientInput.toLowerCase()) &&
          !recipients.some((r) => r === c.email)
      )
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Email"
      className="min-w-4xl"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Recipients */}
        <div>
          <label className="text-sm font-medium mb-2 block">Recipients</label>
          <div className="border rounded-md p-2 mb-2 min-h-10 flex flex-wrap gap-2 items-center bg-gray-50">
            {recipients.map((recipient) => (
              <Badge key={recipient} variant="secondary" className="gap-1">
                {recipient}
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => handleRemoveRecipient(recipient)}
                  className="ml-1 "
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
            <div className="relative flex-1 min-w-32">
              <Input
                type="text"
                placeholder="Add recipient..."
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                className="border-0 py-0 shadow-none focus-visible:ring-0"
              />
              {filteredContacts.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-md z-10 max-h-40 overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleAddRecipient(contact.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    >
                      {contact.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Subject */}
        <div>
          <FormField
            name="subject"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Subject</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Email subject"
                    className="mt-1"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Email Body */}
        <div>
          <FormField
            name="body"
            control={control}
            render={({ field }) => (
              <FormControl>
                <LexEditor onChange={field.onChange} />
              </FormControl>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Send Email</Button>
        </div>
      </form>
    </Modal>
  );
};

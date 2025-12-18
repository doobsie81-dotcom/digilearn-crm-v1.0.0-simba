"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "../ui/modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { LexEditor } from "../lexical-editor";
import { sendEmailSchema, SendEmailInput } from "~/validation/emails";
import { X, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { EMAIL_PRIORITIES } from "~/data/email-types";
import { useSendEmailModalStore } from "~/store/use-send-email-modal-store";
import { Contact } from "~/db/types";

interface SendEmailModalProps {
  contacts?: Contact[];
  onSuccess?: () => void;
}

export function SendEmailModal({
  contacts = [],
  onSuccess,
}: SendEmailModalProps) {
  const { isOpen, onClose, leadId, dealId, defaultTo } = useSendEmailModalStore();
  const [recipientInput, setRecipientInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SendEmailInput>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      to: [],
      cc: [],
      subject: "",
      body: "",
      isHtml: true,
      importance: "normal",
      leadId,
      dealId,
    },
  });

  // Update form when defaultTo changes
  useEffect(() => {
    if (defaultTo && defaultTo.length > 0) {
      form.setValue("to", defaultTo);
    }
    if (leadId) {
      form.setValue("leadId", leadId);
    }
    if (dealId) {
      form.setValue("dealId", dealId);
    }
  }, [defaultTo, leadId, dealId, form]);

  const sendEmailMutation = trpc.emailing.sendEmailViaGraph.useMutation({
    onSuccess: () => {
      toast.success("Email sent successfully!");
      form.reset();
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send email");
    },
  });

  // Filter contacts for autocomplete
  const getFilteredContacts = (input: string, type: "to" | "cc") => {
    if (!input.trim()) return [];
    const currentRecipients = form.getValues(type) || [];
    const existingEmails = currentRecipients.map((r) => r.email);
    
    return contacts.filter(
      (contact) =>
        !existingEmails.includes(contact.email) &&
        (contact.email.toLowerCase().includes(input.toLowerCase()) ||
          (contact.firstName && contact.firstName.toLowerCase().includes(input.toLowerCase())) ||
          (contact.lastName && contact.lastName.toLowerCase().includes(input.toLowerCase())))
    ).slice(0, 5);
  };

  const toSuggestions = getFilteredContacts(recipientInput, "to");
  const ccSuggestions = getFilteredContacts(ccInput, "cc");

  const handleAddRecipient = (type: "to" | "cc", emailOrContact?: string | Contact) => {
    const input = type === "to" ? recipientInput : ccInput;
    let emailToAdd: string;
    let nameToAdd: string | undefined;

    if (typeof emailOrContact === "string") {
      emailToAdd = emailOrContact;
    } else if (emailOrContact) {
      emailToAdd = emailOrContact.email;
      nameToAdd = `${emailOrContact.firstName || ""} ${emailOrContact.lastName || ""}`.trim() || undefined;
    } else {
      emailToAdd = input.trim();
    }

    if (!emailToAdd) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToAdd)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const currentRecipients = form.getValues(type) || [];
    const emailExists = currentRecipients.some((r) => r.email === emailToAdd);

    if (!emailExists) {
      form.setValue(type, [
        ...currentRecipients,
        { email: emailToAdd, name: nameToAdd },
      ]);
    }

    if (type === "to") {
      setRecipientInput("");
      setShowToSuggestions(false);
    } else {
      setCcInput("");
      setShowCcSuggestions(false);
    }
    setSelectedSuggestionIndex(-1);
  };

  const handleRemoveRecipient = (type: "to" | "cc", email: string) => {
    const currentRecipients = form.getValues(type) || [];
    form.setValue(
      type,
      currentRecipients.filter((r) => r.email !== email)
    );
  };

  // Handle input change with comma/semicolon detection
  const handleInputChange = (value: string, type: "to" | "cc") => {
    const delimiters = /[,;]/;
    
    if (delimiters.test(value)) {
      const emails = value.split(delimiters).map((e) => e.trim()).filter(Boolean);
      
      emails.forEach((email) => {
        handleAddRecipient(type, email);
      });
      
      if (type === "to") {
        setRecipientInput("");
      } else {
        setCcInput("");
      }
    } else {
      if (type === "to") {
        setRecipientInput(value);
        setShowToSuggestions(value.trim().length > 0);
      } else {
        setCcInput(value);
        setShowCcSuggestions(value.trim().length > 0);
      }
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "to" | "cc"
  ) => {
    const suggestions = type === "to" ? toSuggestions : ccSuggestions;
    const showSuggestions = type === "to" ? showToSuggestions : showCcSuggestions;

    if (e.key === "ArrowDown" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleAddRecipient(type, suggestions[selectedSuggestionIndex]);
      } else {
        handleAddRecipient(type);
      }
    } else if (e.key === "Escape") {
      if (type === "to") {
        setShowToSuggestions(false);
      } else {
        setShowCcSuggestions(false);
      }
      setSelectedSuggestionIndex(-1);
    } else if (e.key === "Tab" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleAddRecipient(type, suggestions[selectedSuggestionIndex]);
      } else if (suggestions[0]) {
        handleAddRecipient(type, suggestions[0]);
      }
    }
  };

  const onSubmit = (data: SendEmailInput) => {
    sendEmailMutation.mutate(data);
  };

  const recipients = form.watch("to") || [];
  const ccRecipients = form.watch("cc") || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Email"
      description="Send an email via Microsoft Outlook"
      className="max-w-3xl"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* To Recipients */}
          <FormField
            control={form.control}
            name="to"
            render={() => (
              <FormItem>
                <FormLabel>To</FormLabel>
                <FormControl>
                  <div className="border rounded-md p-2 min-h-10 flex flex-wrap gap-2 items-center bg-background">
                    {recipients.map((recipient) => (
                      <Badge
                        key={recipient.email}
                        variant="secondary"
                        className="gap-1"
                      >
                        {recipient.name || recipient.email}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveRecipient("to", recipient.email)
                          }
                          className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      type="email"
                      placeholder="Add recipient..."
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "to")}
                      onBlur={() => handleAddRecipient("to")}
                      className="border-0 py-0 shadow-none focus-visible:ring-0 flex-1 min-w-[200px]"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CC Recipients */}
          <FormField
            control={form.control}
            name="cc"
            render={() => (
              <FormItem>
                <FormLabel>CC (Optional)</FormLabel>
                <FormControl>
                  <div className="border rounded-md p-2 min-h-10 flex flex-wrap gap-2 items-center bg-background">
                    {ccRecipients.map((recipient) => (
                      <Badge
                        key={recipient.email}
                        variant="secondary"
                        className="gap-1"
                      >
                        {recipient.name || recipient.email}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveRecipient("cc", recipient.email)
                          }
                          className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      type="email"
                      placeholder="Add CC recipient..."
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "cc")}
                      onBlur={() => handleAddRecipient("cc")}
                      className="border-0 py-0 shadow-none focus-visible:ring-0 flex-1 min-w-[200px]"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subject */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Email subject" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="importance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMAIL_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Body */}
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <LexEditor onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sendEmailMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Email
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}

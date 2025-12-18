"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { ContactsValues } from "../modals/add-lead-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { contactRoleEnum } from "~/db/schema";
import PhoneNumberInput from "../phone-number-input";
import { SUPPORTED_JOB_TITLES } from "~/data/supported-job-titles";

const LeadContactsFormStep = ({
  onSubmit,
  handleBack,
  isSubmitting,
}: {
  onSubmit: (data: ContactsValues) => void;
  handleBack: () => void;
  isSubmitting: boolean;
}) => {
  const form = useFormContext<ContactsValues>();

  const addContact = () => {
    const currentContacts = form.watch("contacts");
    form.setValue("contacts", [
      ...currentContacts,
      {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        jobTitle: "",
        role: "other",
        isPrimary: false,
      },
    ]);
  };

  const removeContact = (index: number) => {
    const currentContacts = form.getValues("contacts");
    if (currentContacts.length === 1) {
      toast.error("At least one contact is required");
      return;
    }
    form.setValue(
      "contacts",
      currentContacts.filter((_, i) => i !== index)
    );
  };

  const setPrimaryContact = (index: number) => {
    const currentContacts = form.getValues("contacts");
    form.setValue(
      "contacts",
      currentContacts.map((contact, i) => ({
        ...contact,
        isPrimary: i === index,
      }))
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        {form.watch("contacts").map((contact, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg ${
              contact.isPrimary
                ? "border-primary bg-primary/5"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Contact {index + 1}</h4>
              <div className="flex gap-2">
                {!contact.isPrimary && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrimaryContact(index)}
                  >
                    Set as Primary
                  </Button>
                )}
                {contact.isPrimary && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Primary
                  </span>
                )}
                {form.watch("contacts").length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContact(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name={`contacts.${index}.firstName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contacts.${index}.lastName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contacts.${index}.jobTitle`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Job title" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORTED_JOB_TITLES.map((title) => (
                          <SelectItem
                            key={title}
                            value={title}
                            className="capitalize"
                          >
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contacts.${index}.email`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contacts.${index}.phoneNumber`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <PhoneNumberInput
                        placeholder="+263770000000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contacts.${index}.role`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactRoleEnum.map((role) => (
                          <SelectItem
                            key={role}
                            value={role}
                            className="capitalize"
                          >
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addContact}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Contact
      </Button>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default LeadContactsFormStep;

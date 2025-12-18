import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Check, ChevronsUpDown, User } from "lucide-react";
import { trpc } from "~/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { LeadContact, Contact } from "~/db/types";
import { addStakeholdersSchema } from "~/validation/stakeholders";
import CustomDatePicker from "./custom-date-picker";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { Slider } from "./ui/slider";
import { contactFrequencyEnum } from "~/db/schema";

type AssociatedContact = LeadContact & { contact: Contact };

interface Props {
  dealId: string;
  leadContacts: AssociatedContact[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type StakeholderFormValues = z.infer<typeof addStakeholdersSchema>;

export default function DealStakeholderManager({
  dealId,
  leadContacts,
  open,
  onOpenChange,
}: Props) {
  const [comboOpen, setComboOpen] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<AssociatedContact | null>(null);

  const form = useForm<StakeholderFormValues>({
    resolver: zodResolver(addStakeholdersSchema),
    defaultValues: {
      contactId: "",
      role: "",
      influence: 0,
      sentiment: "neutral",
      engaged: false,
      notes: "",
      dealId,
    },
  });

  const utils = trpc.useUtils();
  const createStakeholder = trpc.stakeholders.create.useMutation({
    onSuccess: () => {
      handleClose();
      setSelectedContact(null);
      utils.deals.getDealDetails.invalidate();
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const handleContactSelect = (leadContact: AssociatedContact) => {
    setSelectedContact(leadContact);
    form.setValue("contactId", leadContact.contactId);
    // Pre-fill role from LeadContact if available
    if (leadContact.role) {
      form.setValue("role", leadContact.role);
    }
    setComboOpen(false);
  };

  const onSubmit = async (data: StakeholderFormValues) => {
    try {
      await createStakeholder.mutateAsync({
        ...data,
        dealId,
        lastContactedAt: data.lastContactedAt
          ? new Date(data.lastContactedAt)
          : undefined,
      });
    } catch (error) {
      console.error("Error creating stakeholder:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Deal Stakeholder</SheetTitle>
          <SheetDescription>Manage your deal stakeholders</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6 px-4"
          >
            {/* Contact Selector */}
            <FormField
              control={form.control}
              name="contactId"
              render={() => (
                <FormItem className="flex flex-col">
                  <FormLabel>Contact</FormLabel>
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="justify-between h-auto"
                        >
                          {selectedContact ? (
                            <div className="flex items-center gap-2 flex-1 text-left">
                              <User className="w-4 h-4" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {selectedContact.contact.firstName}{" "}
                                  {selectedContact.contact.lastName}
                                </div>
                                {selectedContact.contact.email && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {selectedContact.contact.email}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {selectedContact.isPrimary && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Primary
                                  </Badge>
                                )}
                                {selectedContact.role && (
                                  <Badge variant="outline" className="text-xs">
                                    {selectedContact.role}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            "Select contact..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0">
                      <Command>
                        <CommandInput placeholder="Search contacts..." />
                        <CommandEmpty>No contacts found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {leadContacts.map((leadContact) => (
                            <CommandItem
                              key={leadContact.contact.id}
                              onSelect={() => handleContactSelect(leadContact)}
                              className="flex items-center gap-2"
                            >
                              <Check
                                className={
                                  selectedContact?.contact.id ===
                                  leadContact.contact.id
                                    ? "w-4 h-4 opacity-100"
                                    : "w-4 h-4 opacity-0"
                                }
                              />
                              <User className="w-4 h-4" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">
                                  {leadContact.contact.firstName}{" "}
                                  {leadContact.contact.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {leadContact.contact.email || "No email"}
                                </div>
                                {leadContact.contact.jobTitle && (
                                  <div className="text-xs text-muted-foreground">
                                    {leadContact.contact.jobTitle}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {leadContact.isPrimary && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Primary
                                  </Badge>
                                )}
                                {leadContact.role && (
                                  <Badge variant="outline" className="text-xs">
                                    {leadContact.role}
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stakeholder Role</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Decision Maker, Influencer"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Their specific role in this deal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Influence */}
              <FormField
                control={form.control}
                name="influence"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Influence: {field.value}%</FormLabel>
                      <span className="text-sm text-muted-foreground">
                        {field.value < 25
                          ? "Low"
                          : field.value < 75
                            ? "Medium"
                            : "High"}
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={25}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sentiment */}
              <FormField
                control={form.control}
                name="sentiment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentiment</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sentiment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="champion">Champion</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                        <SelectItem value="blocker">Blocker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Last Contacted */}
              <FormField
                control={form.control}
                name="lastContactedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Contacted</FormLabel>
                    <CustomDatePicker
                      trigger={
                        <FormControl>
                          <Button
                            variant="outline"
                            type="button"
                            className={cn(
                              "pl-3 text-left font-normal w-full",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      }
                      value={field.value}
                      onSelectChange={field.onChange}
                    />

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Frequency */}
              <FormField
                control={form.control}
                name="contactFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactFrequencyEnum.map((freq) => (
                          <SelectItem
                            key={freq}
                            value={freq}
                            className="capitalize"
                          >
                            {freq.split("-").join(" ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Engaged Checkbox */}
            <FormField
              control={form.control}
              name="engaged"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Actively Engaged</FormLabel>
                    <FormDescription>
                      Is this stakeholder actively participating in the deal?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this stakeholder..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStakeholder.isPending}
                className="flex-1"
              >
                {createStakeholder.isPending ? "Adding..." : "Add Stakeholder"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

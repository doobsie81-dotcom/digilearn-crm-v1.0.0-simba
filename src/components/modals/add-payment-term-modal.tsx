import { useFormContext } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  FormField,
  FormDescription,
  FormLabel,
  FormControl,
  FormMessage,
  FormItem,
} from "~/components/ui/form";
import Modal from "../ui/modal";
import { PaymentTermFormValues } from "~/validation/payment-types";
import { ChangeEvent } from "react";

const paymentTermTypeOptions = [
  { value: "cash", label: "Cash Payment" },
  { value: "3-term", label: "3 Term Plan" },
  { value: "4-term", label: "4 Term Plan" },
  { value: "6-term", label: "6 Term Plan" },
  { value: "9-term", label: "9 Term Plan" },
  { value: "custom-date", label: "Custom Date" },
  { value: "net-30", label: "Net 30 Days" },
  { value: "net-60", label: "Net 60 Days" },
  { value: "net-90", label: "Net 90 Days" },
  { value: "custom", label: "Custom Plan" },
] as const;

interface AddPaymentTermModalProps {
  onSubmit: (data: PaymentTermFormValues) => void;
  isPending: boolean;
  isOpen: boolean;
  onClose: () => void;
  editingTerm: string | null;
}

const AddPaymentTermModal = ({
  onSubmit,
  isPending,
  isOpen,
  onClose,
  editingTerm,
}: AddPaymentTermModalProps) => {
  const form = useFormContext<PaymentTermFormValues>();
  const selectedType = form.watch("type");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTerm ? "Edit Payment Term" : "Create Payment Term"}
      description="Configure payment terms that can be applied to invoices and quotations"
      className="min-w-xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentTermTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === "custom" && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Quarterly Payment Plan"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Give your custom plan a descriptive name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="interestRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interest Rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={field.value.toString()}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    field.onChange(parseFloat(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Interest applied to subtotal before tax (0% for cash)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional fields based on type */}
        {(selectedType?.includes("term") || selectedType === "custom") && (
          <div className="grid grid-cols-2 gap-4 items-start">
            <FormField
              control={form.control}
              name="numberOfTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Terms</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="3"
                      value={(field.value ?? 0).toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termLengthDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term Length (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      value={(field.value ?? 0).toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>e.g., 30 for monthly</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {(selectedType?.startsWith("net-") ||
          selectedType === "custom-date" ||
          selectedType === "custom") && (
          <FormField
            control={form.control}
            name="daysUntilDue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Days Until Due</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="User-friendly description of this payment term"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termsAndConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms and Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Legal terms for this payment option..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                These will appear on invoices and quotations
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4 items-end">
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
                <div>
                  <FormLabel>Active</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
                <div>
                  <FormLabel>Default</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {editingTerm ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPaymentTermModal;

import { useFormContext, useFieldArray } from "react-hook-form";
import Modal from "../ui/modal";
import { AddDealValues } from "~/validation/deals";
import { useAddDealModalStore } from "~/store/use-deal-sheet-store copy";
import { Lead, Product, User, Company } from "~/db/types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "~/lib/utils";
import { CalendarIcon, Check, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { ChangeEvent, useMemo, useState } from "react";
import { Slider } from "../ui/slider";
import { Toggle } from "../ui/toggle";
import { DocumentItems } from "../document-items";

interface AddNewDealProps {
  onClose: () => void;
  onSubmit: (data: AddDealValues) => void;
  isPending: boolean;
  leads: (Lead & { company: Company })[];
  stages?: { id: string; name: string; stageProbability: number }[];
  users: User[];
  products: Product[];
  isLoading: boolean;
  handleSearchProduct: (value: string) => void;
  searchValue: string;
  leadSearchValue: string;
  handleSearchLead: (value: string) => void;
  isLeadReadOnly?: boolean;
  isAssignedToReadOnly?: boolean;
}

const AddNewDealModal: React.FC<AddNewDealProps> = ({
  onClose,
  onSubmit,
  isPending,
  leads,
  stages = [],
  users,
  products,
  handleSearchProduct,
  searchValue,
  leadSearchValue,
  handleSearchLead,
  isLeadReadOnly = false,
  isAssignedToReadOnly = false,
}) => {
  const isOpen = useAddDealModalStore((state) => state.isOpen);
  const [isUsingItems, setUseItems] = useState(false);

  const form = useFormContext<AddDealValues>();

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const {
    fields: competitorFields,
    append: appendCompetitor,
    remove: removeCompetitor,
  } = useFieldArray({
    control: form.control,
    name: "competitors",
  });

  const calculateTotal = () => {
    const total = itemFields.reduce((total, item) => {
      const itemTotal =
        Number(item.quantity) * Number(item.unitPrice) + Number(item.tax || 0);
      const discount = ((Number(item.discount) || 0) / 100) * itemTotal;
      return total + (itemTotal - discount);
    }, 0);
    form.setValue("value", total);
    return total;
  };

  const totalValue = useMemo(() => calculateTotal(), [itemFields]);

  // const toggleContacts = () => {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Deal"
      description="Add a new deal to your sales pipeline"
      className="min-w-6xl"
    >
      {/* {!!form.formState.errors && (
        <ErrorMessage
          title="Form Errors"
          message={JSON.stringify(form.formState.errors) }
        />
      )} */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Main Deal Info */}
          <div className="md:col-span-2 space-y-4 border-r pr-6 border-border">
            <FormField
              control={form.control}
              name="leadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead/Client *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const lead = leads.find((l) => l.id === value);
                      form.setValue("title", lead?.name || "");
                    }}
                    value={field.value}
                    disabled={isLeadReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select lead/client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="mb-2">
                        <Input
                          placeholder="Search Lead"
                          value={leadSearchValue}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleSearchLead(e.target.value)
                          }
                        />
                      </div>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name}, {lead.company.name}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Enterprise Deal for Acme Corp"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the deal details..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div>
                <Toggle
                  onClick={() => {
                    setUseItems(!isUsingItems);
                    form.setValue("items", []);
                  }}
                  aria-label="Toggle Use Items"
                  variant="outline"
                >
                  Use Items
                  {isUsingItems && <Check className="h-4 w-4" />}
                </Toggle>
                <p className="text-muted-foreground text-sm">
                  If you use item, value will be calculated based on the
                  products/ services added to the deal.
                </p>
              </div>
              {isUsingItems ? (
                <DocumentItems products={products || []} />
              ) : (
                // <div>
                //   <div className="flex justify-between items-center mb-2">
                //     <h4 className="text-sm font-medium">Deal Items</h4>
                //     <Button
                //       type="button"
                //       variant="outline"
                //       size="sm"
                //       onClick={() =>
                //         appendItem({
                //           productId: "",
                //           description: "",
                //           quantity: "1",
                //           unitPrice: "0",
                //           discount: "0",
                //           tax: "0",
                //         })
                //       }
                //     >
                //       <Plus className="h-4 w-4 mr-2" /> Add Item
                //     </Button>
                //   </div>

                //   <div className="space-y-2">
                //     <div className="flex gap-2 items-start">
                //       <div className="grid grid-cols-12 gap-2 w-full">
                //         <div className="col-span-3">
                //           <p className="font-semibold text-sm">Item</p>
                //         </div>
                //         <div className="col-span-2">
                //           <p className="font-semibold text-sm">Quantity</p>
                //         </div>
                //         <div className="col-span-2">
                //           <p className="font-semibold text-sm">Unit Price</p>
                //         </div>
                //         <div className="col-span-2">
                //           <p className="font-semibold text-sm">Discount</p>
                //         </div>
                //         <div className="col-span-2">
                //           <p className="font-semibold text-sm">Tax</p>
                //         </div>
                //         <div className="col-span-1" />
                //       </div>
                //     </div>
                //     {itemFields.map((field, index) => (
                //       <div key={field.id} className="flex gap-2 items-start">
                //         <div className="grid grid-cols-12 gap-2 w-full">
                //           <div className="col-span-3">
                //             <FormField
                //               control={form.control}
                //               name={`items.${index}.description`}
                //               render={({ field }) => (
                //                 <FormItem>
                //                   <FormControl>
                //                     <Select
                //                       onValueChange={(value) => {
                //                         const product = products.find(
                //                           (p) => p.name === value
                //                         );
                //                         if (product) {
                //                           form.setValue(
                //                             `items.${index}.productId`,
                //                             product.id
                //                           );
                //                           form.setValue(
                //                             `items.${index}.description`,
                //                             product.name
                //                           );
                //                           form.setValue(
                //                             `items.${index}.unitPrice`,
                //                             parseFloat(product.price).toFixed(2)
                //                           );
                //                         }
                //                       }}
                //                       value={field.value}
                //                     >
                //                       <FormControl>
                //                         <SelectTrigger className="w-full">
                //                           <SelectValue placeholder="Select product" />
                //                         </SelectTrigger>
                //                       </FormControl>
                //                       <SelectContent>
                //                         <div className="mb-2">
                //                           <Input
                //                             placeholder="Search Product"
                //                             onChange={(
                //                               e: ChangeEvent<HTMLInputElement>
                //                             ) =>
                //                               handleSearchProduct(
                //                                 e.target.value
                //                               )
                //                             }
                //                             value={searchValue}
                //                           />
                //                         </div>
                //                         {products.map((product) => (
                //                           <SelectItem
                //                             key={product.id}
                //                             value={product.name}
                //                           >
                //                             {product.name}
                //                           </SelectItem>
                //                         ))}
                //                       </SelectContent>
                //                     </Select>
                //                   </FormControl>
                //                   <FormMessage />
                //                 </FormItem>
                //               )}
                //             />
                //           </div>
                //           <div className="col-span-2">
                //             <FormField
                //               control={form.control}
                //               name={`items.${index}.quantity`}
                //               render={({ field }) => (
                //                 <FormItem>
                //                   <FormControl>
                //                     <Input type="number" min={1} {...field} />
                //                   </FormControl>
                //                   <FormMessage />
                //                 </FormItem>
                //               )}
                //             />
                //           </div>
                //           <div className="col-span-2">
                //             <FormField
                //               control={form.control}
                //               name={`items.${index}.unitPrice`}
                //               render={({ field }) => (
                //                 <FormItem>
                //                   <FormControl>
                //                     <Input
                //                       type="number"
                //                       min={0}
                //                       step="0.01"
                //                       {...field}
                //                     />
                //                   </FormControl>
                //                   <FormMessage />
                //                 </FormItem>
                //               )}
                //             />
                //           </div>
                //           <div className="col-span-2">
                //             <FormField
                //               control={form.control}
                //               name={`items.${index}.discount`}
                //               render={({ field }) => (
                //                 <FormItem>
                //                   <FormControl>
                //                     <Input
                //                       type="number"
                //                       min={0}
                //                       max={100}
                //                       {...field}
                //                     />
                //                   </FormControl>
                //                   <FormMessage />
                //                 </FormItem>
                //               )}
                //             />
                //           </div>
                //           <div className="col-span-2">
                //             <FormField
                //               control={form.control}
                //               name={`items.${index}.tax`}
                //               render={({ field }) => (
                //                 <FormItem>
                //                   <FormControl>
                //                     <Input
                //                       type="number"
                //                       min={0}
                //                       max={100}
                //                       {...field}
                //                     />
                //                   </FormControl>
                //                   <FormMessage />
                //                 </FormItem>
                //               )}
                //             />
                //           </div>
                //           <div className="col-span-1 flex items-center justify-end">
                //             <Button
                //               type="button"
                //               variant="ghost"
                //               size="icon"
                //               onClick={() => removeItem(index)}
                //             >
                //               <Trash2 className="h-4 w-4 text-destructive" />
                //             </Button>
                //           </div>
                //         </div>
                //       </div>
                //     ))}
                //   </div>

                //   <div className="mt-4 p-4 bg-muted/50 rounded-md">
                //     <div className="flex justify-between">
                //       <span className="text-sm font-medium">Total Value:</span>
                //       <span className="font-semibold">
                //         ${totalValue.toFixed(2)}
                //       </span>
                //     </div>
                //   </div>
                // </div>
                <div>
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Value*</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Deal Value"
                            value={field.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : ""
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Deal Metadata */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="currentStageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage *</FormLabel>
                  <Select
                    onValueChange={(value: string) => {
                      field.onChange(value);
                      const stage = stages.find((stage) => stage.id === value);
                      form.setValue(
                        "probability",
                        stage?.stageProbability || 0
                      );
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
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
              name="probability"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Probability: {field.value}%</FormLabel>
                    <span className="text-sm text-muted-foreground">
                      {field.value < 30
                        ? "Low"
                        : field.value < 70
                          ? "Medium"
                          : "High"}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      disabled
                      min={0}
                      max={100}
                      step={5}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedCloseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Close Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
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
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isAssignedToReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user, index) => (
                        <SelectItem key={index} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pick stakeholders */}
            {/* <div>
              <div className="flex items-center py-2">
                <Label>Stakeholders</Label>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="ml-auto text-primary hover:text-primary/80"
                  onClick={toggleContacts}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stakeholder
                </Button>
              </div>
            </div> */}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Competitors</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendCompetitor({
                      competitorName: "",
                      competitorStrength: 50,
                      status: "active",
                      ourAdvantage: "",
                      theirAdvantage: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Competitor
                </Button>
              </div>

              <div className="space-y-2">
                {competitorFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-2 p-2 border rounded-md"
                  >
                    <FormField
                      control={form.control}
                      name={`competitors.${index}.competitorName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Competitor name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Strength:{" "}
                        {form.watch(`competitors.${index}.competitorStrength`)}%
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeCompetitor(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`competitors.${index}.competitorStrength`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[field.value || 0]}
                              onValueChange={(value) =>
                                field.onChange(value[0])
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Deal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddNewDealModal;

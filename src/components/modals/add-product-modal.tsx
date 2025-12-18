"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import Modal from "../ui/modal";
import { cn } from "~/lib/utils";
import { ProductFormValues } from "~/app/(admin)/products/_components/products-list";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => void;
  isPending: boolean;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: AddProductModalProps) {
  const form = useFormContext<ProductFormValues>();

  const watchedProductType = form.watch("productType");

  return (
    <Modal
      title="Add New Product"
      description="Create a new product or service for your catalog"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Type */}
        <div className="rounded-lg border-2 border-dashed p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Product Type *
                </FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => field.onChange("product")}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-2 p-4 transition-all",
                        field.value === "product"
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2",
                          field.value === "product"
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-300"
                        )}
                      >
                        {field.value === "product" && (
                          <div className="h-full w-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Physical Product</p>
                        <p className="text-xs text-muted-foreground">
                          Tangible items you sell
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => field.onChange("service")}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-2 p-4 transition-all",
                        field.value === "service"
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2",
                          field.value === "service"
                            ? "border-cyan-500 bg-cyan-500"
                            : "border-gray-300"
                        )}
                      >
                        {field.value === "service" && (
                          <div className="h-full w-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Service</p>
                        <p className="text-xs text-muted-foreground">
                          Services you provide
                        </p>
                      </div>
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        watchedProductType === "product"
                          ? "e.g., Premium Widget"
                          : "e.g., Consulting Services"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU / Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., PROD-001" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional internal reference
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe your product or service..."
                    className="min-h-[80px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Electronics, Consulting"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pricing & Unit</h3>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="kilogram">Kilogram</SelectItem>
                      <SelectItem value="gram">Gram</SelectItem>
                      <SelectItem value="use">Use</SelectItem>
                      <SelectItem value="litre">Litre</SelectItem>
                      <SelectItem value="hour">Hour</SelectItem>
                      <SelectItem value="metre">Metre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Final Price
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  After discount and tax
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                $
                {(
                  parseFloat(form.watch("price") || "0") -
                  parseFloat(form.watch("discount") || "0") +
                  parseFloat(form.watch("tax") || "0")
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Make this product available for selection
                  </FormDescription>
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

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";
import { Loader2 } from "lucide-react";

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: string[];
  onSave: (products: string[]) => void;
}

export function ProductSelectionModal({
  open,
  onOpenChange,
  selectedProducts,
  onSave,
}: ProductSelectionModalProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedProducts);

  const { data: products, isLoading } = trpc.products.listForSelect.useQuery(
    undefined,
    { enabled: open }
  );

  const handleToggle = (productName: string) => {
    setLocalSelection((prev) =>
      prev.includes(productName)
        ? prev.filter((p) => p !== productName)
        : [...prev, productName]
    );
  };

  const handleSave = () => {
    onSave(localSelection);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalSelection(selectedProducts);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Products</DialogTitle>
          <DialogDescription>
            Choose the products that match the lead&apos;s needs and requirements
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {products.map((product) => (
                  <Badge
                    key={product.id}
                    variant={
                      localSelection.includes(product.name)
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm transition-colors rounded-full",
                      localSelection.includes(product.name) &&
                        "bg-blue-500 hover:bg-blue-600"
                    )}
                    onClick={() => handleToggle(product.name)}
                  >
                    {product.name}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {localSelection.length} product{localSelection.length !== 1 ? "s" : ""} selected
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active products available. Please add products first.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={localSelection.length === 0}>
            Save Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

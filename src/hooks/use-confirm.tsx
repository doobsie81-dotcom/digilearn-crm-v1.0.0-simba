import { DialogContent } from "@radix-ui/react-dialog";
import { VariantProps } from "class-variance-authority";
import { JSX, useState } from "react";
import { Button, type buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Dialog } from "~/components/ui/dialog";

export const useConfirm = (
  title: string,
  message: string,
  variant: VariantProps<typeof buttonVariants>["variant"]
): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () => {
    return new Promise<boolean>((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(true);
    handleClose();
  };

  const ConfirmDialog = () => (
    <Dialog open={!!promise} onOpenChange={handleClose}>
      <DialogContent>
        <Card>
          <CardContent>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant={variant} onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmDialog, confirm];
};

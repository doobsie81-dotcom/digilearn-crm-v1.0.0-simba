"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { trpc } from "~/trpc/client";
import { Plus, Edit2, Trash2, Check, X, Percent } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import AddPaymentTermModal from "~/components/modals/add-payment-term-modal";
import {
  paymentTermSchema,
  PaymentTermFormValues,
} from "~/validation/payment-types";
import { PaymentTerm } from "~/db/types";

export default function PaymentTermsClient() {
  const utils = trpc.useUtils();
  const [paymentTerms] = trpc.paymentTerms.getAll.useSuspenseQuery({
    includeInactive: true,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState<string | null>(null);
  const [deletingTerm, setDeletingTerm] = useState<string | null>(null);

  const createMutation = trpc.paymentTerms.create.useMutation({
    onSuccess: () => {
      toast.success("Payment term created successfully");
      utils.paymentTerms.getAll.invalidate();
      setShowCreateDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create payment term");
    },
  });

  const updateMutation = trpc.paymentTerms.update.useMutation({
    onSuccess: () => {
      toast.success("Payment term updated successfully");
      utils.paymentTerms.getAll.invalidate();
      setEditingTerm(null);
      form.reset();
      setShowCreateDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update payment term");
    },
  });

  const deleteMutation = trpc.paymentTerms.delete.useMutation({
    onSuccess: () => {
      toast.success("Payment term deleted successfully");
      utils.paymentTerms.getAll.invalidate();
      setDeletingTerm(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete payment term");
    },
  });

  const form = useForm<PaymentTermFormValues>({
    resolver: zodResolver(paymentTermSchema),
    defaultValues: {
      type: "cash",
      interestRate: 0,
      isActive: true,
      isDefault: false,
      displayOrder: 0,
    },
  });

  const onSubmit = async (data: PaymentTermFormValues) => {
    if (editingTerm) {
      await updateMutation.mutateAsync({ ...data, id: editingTerm });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (term: PaymentTerm) => {
    setEditingTerm(term.id);
    form.reset({
      ...(term.type === "custom" && term.name ? { name: term.name } : {}),
      type: term.type,
      interestRate: parseFloat(term.interestRate),
      numberOfTerms: term.numberOfTerms || undefined,
      termLengthDays: term.termLengthDays || undefined,
      daysUntilDue: term.daysUntilDue || undefined,
      termsAndConditions: term.termsAndConditions || "",
      description: term.description || "",
      isActive: term.isActive,
      isDefault: term.isDefault,
      displayOrder: term.displayOrder,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async () => {
    if (deletingTerm) {
      await deleteMutation.mutateAsync({ id: deletingTerm });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure payment terms and interest rates for your invoices and
            quotations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Term
        </Button>

        <Form {...form}>
          <AddPaymentTermModal
            onSubmit={onSubmit}
            isOpen={showCreateDialog}
            onClose={() => {
              setShowCreateDialog(false);
              setEditingTerm(null);
              form.reset();
            }}
            editingTerm={editingTerm}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        </Form>
      </div>

      {/* Payment Terms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Terms</CardTitle>
          <CardDescription>Manage all available payment terms</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Payment Plan</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentTerms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">
                    {term.name}
                    {term.isDefault && (
                      <Badge variant="secondary" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{term.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Percent className="h-3 w-3 mr-1" />
                      {parseFloat(term.interestRate).toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    {term.isActive ? (
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(term)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingTerm(term.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paymentTerms.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No payment terms configured. Click &quot;Add Payment
                    Term&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTerm}
        onOpenChange={() => setDeletingTerm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Term?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment term. This action cannot
              be undone. Documents that have already been created with this term
              will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

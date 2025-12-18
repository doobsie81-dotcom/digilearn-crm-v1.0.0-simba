"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import { InvoiceStatusBadge } from "../invoice-status-badge";
import {
  X,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import Modal from "../ui/modal";
import { invoiceStatusEnum } from "~/db/schema";

interface InvoicePreviewModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoicePreviewModal({
  invoiceId,
  isOpen,
  onClose,
}: InvoicePreviewModalProps) {
  const [actionDialog, setActionDialog] = useState<{
    type: (typeof invoiceStatusEnum)[number] | null;
  }>({ type: null });

  const utils = trpc.useUtils();

  const { data: invoice, isLoading } = trpc.invoices.getById.useQuery(
    { id: invoiceId ?? "" },
    { enabled: isOpen && !!invoiceId }
  );

  const updateStatus = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      utils.invoices.getById.invalidate({ id: invoiceId ?? "" });
      utils.invoices.listWithFilters.invalidate();
      toast.success("Invoice status updated successfully");
      setActionDialog({ type: null });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice status");
    },
  });

  const sendEmail = trpc.invoices.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Invoice sent successfully");
      if (invoiceId) {
        updateStatus.mutate({ id: invoiceId, status: "Sent" });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invoice");
    },
  });

  const handlePaid = () => {
    if (invoiceId) {
      updateStatus.mutate({ id: invoiceId, status: "Paid" });
    }
  };

  const handlePartiallyPaid = () => {
    if (invoiceId) {
      updateStatus.mutate({ id: invoiceId, status: "Partially-Paid" });
    }
  };

  const handleCancel = () => {
    if (invoiceId) {
      updateStatus.mutate({ id: invoiceId, status: "Cancelled" });
    }
  };

  const handleSendEmail = () => {
    if (invoiceId) {
      sendEmail.mutate({ id: invoiceId });
    }
  };

  const handleDownload = () => {
    toast.success("Downloading invoice...");
    // Implement PDF download logic
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        title={
          isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            invoice?.invoiceNumber || ""
          )
        }
        isOpen={isOpen}
        onClose={onClose}
        className="min-w-[100vw] h-[100vh] p-0 gap-0"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading invoice...</p>
          </div>
        ) : invoice ? (
          <div className="flex flex-col h-full">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {invoice.invoiceNumber}
                    <InvoiceStatusBadge status={invoice.status} />
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Created{" "}
                    {format(new Date(invoice.createdAt), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Update Dropdown */}
                {invoice.status !== "Paid" &&
                  invoice.status !== "Cancelled" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">Update Status</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {invoice.status !== "Sent" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus.mutate({
                                id: invoiceId ?? "",
                                status: "Sent",
                              })
                            }
                          >
                            Mark as Sent
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setActionDialog({ type: "Paid" })}
                          className="text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Pay Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setActionDialog({ type: "Partially-Paid" })
                          }
                          className="text-amber-600"
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Partially Pay Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setActionDialog({ type: "Cancelled" })}
                          className="text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  disabled={sendEmail.isPending}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>

                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
              <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-lg">
                {/* Invoice Header */}
                <div className="p-8 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
                      <p className="text-lg text-muted-foreground">
                        #{invoice.invoiceNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">
                        Your Company Name
                      </p>
                      <p className="text-sm text-muted-foreground">
                        123 Business Street
                      </p>
                      <p className="text-sm text-muted-foreground">
                        City, State 12345
                      </p>
                      <p className="text-sm text-muted-foreground">
                        contact@company.com
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer & Invoice Info */}
                <div className="p-8 grid md:grid-cols-2 gap-8 border-b">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Invoice For
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{invoice.client.name}</p>
                      </div>
                      {invoice?.clientName && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{invoice.clientName}</p>
                        </div>
                      )}
                      {invoice?.clientEmail && (
                        <p className="text-sm text-muted-foreground">
                          {invoice.clientEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Invoice Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Invoice Date:
                        </span>
                        <span className="font-medium">
                          {format(new Date(invoice.createdAt), "MMMM dd, yyyy")}
                        </span>
                      </div>
                      {invoice.dueDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due Date:
                          </span>
                          <span className="font-medium">
                            {format(new Date(invoice.dueDate), "MMMM dd, yyyy")}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="p-8">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 text-sm font-semibold text-muted-foreground">
                          DESCRIPTION
                        </th>
                        <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                          QTY
                        </th>
                        <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                          PRICE
                        </th>
                        <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                          DISCOUNT
                        </th>
                        <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                          TAX
                        </th>
                        <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              {item.product && (
                                <p className="text-xs text-muted-foreground">
                                  Name: {item.product.name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-4">
                            {parseFloat(item.quantity).toFixed(2)}
                          </td>
                          <td className="text-right py-4">
                            ${parseFloat(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="text-right py-4 text-green-600">
                            -${parseFloat(item.discount).toFixed(2)}
                          </td>
                          <td className="text-right py-4">
                            ${parseFloat(item.tax).toFixed(2)}
                          </td>
                          <td className="text-right py-4 font-semibold">
                            ${parseFloat(item.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="mt-8 flex justify-end">
                    <div className="w-80 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">
                          ${parseFloat(invoice.subtotal).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium text-green-600">
                          -${parseFloat(invoice.discount).toFixed(2)}
                        </span>
                      </div>

                      {/* Payment Terms Information */}
                      {invoice.paymentTermId && invoice.interest && parseFloat(invoice.interest) > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm text-blue-600">
                            <span>Interest:</span>
                            <span>+${parseFloat(invoice.interest).toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium">
                          ${parseFloat(invoice.tax).toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          ${parseFloat(invoice.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="p-8 bg-slate-50 dark:bg-slate-800 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Notes
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="p-8 border-t text-center text-sm text-muted-foreground">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Invoice not found</p>
          </div>
        )}
      </Modal>

      {/* Pay Dialog */}
      <AlertDialog
        open={actionDialog.type === "Paid"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mark as Paid
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this invoice as paid?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePaid}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partially Pay Dialog */}
      <AlertDialog
        open={actionDialog.type === "Partially-Paid"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Record Partial Payment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this invoice as partially paid?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePartiallyPaid}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Partially Paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={actionDialog.type === "Cancelled"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancel Invoice
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invoice? This action will
              update the invoice status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

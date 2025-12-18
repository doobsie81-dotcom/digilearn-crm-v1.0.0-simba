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
import { QuoteStatusBadge } from "../quote-status-badge";
import {
  X,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Copy,
  MoreVertical,
  FileText,
  Building2,
  User,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import Modal from "../ui/modal";
import { quoteStatusEnum } from "~/db/schema";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

interface QuotePreviewModalProps {
  quoteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuotePreviewModal({
  quoteId,
  isOpen,
  onClose,
}: QuotePreviewModalProps) {
  const [actionDialog, setActionDialog] = useState<{
    type:
      | Extract<(typeof quoteStatusEnum)[number], "Accepted" | "Rejected">
      | "Duplicate"
      | null;
  }>({ type: null });
  const [isPoReceived, setIsPoReceived] = useState(false);

  const utils = trpc.useUtils();

  const { data: quote, isLoading } = trpc.quotes.getById.useQuery(
    { id: quoteId ?? "" },
    { enabled: isOpen && !!quoteId, retryOnMount: true }
  );

  const updateStatus = trpc.quotes.updateStatus.useMutation({
    onSuccess: () => {
      utils.quotes.getById.invalidate({ id: quoteId ?? "" });
      utils.quotes.listWithFilters.invalidate();
      toast.success("Quote status updated successfully");
      setActionDialog({ type: null });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update quote status");
    },
  });

  const duplicateQuote = trpc.quotes.duplicate.useMutation({
    onSuccess: () => {
      utils.quotes.listWithFilters.invalidate();
      toast.success("Quote duplicated successfully");
      setActionDialog({ type: null });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to duplicate quote");
    },
  });

  const sendEmail = trpc.quotes.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Quote sent successfully");
      if (quoteId) {
        updateStatus.mutate({ id: quoteId, status: "Sent" });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send quote");
    },
  });

  const handleAccept = () => {
    if (quoteId) {
      updateStatus.mutate({
        id: quoteId,
        status: "Accepted",
        poReceived: isPoReceived,
      });
    }
  };

  const handleReject = () => {
    if (quoteId) {
      updateStatus.mutate({ id: quoteId, status: "Rejected" });
    }
  };

  const handleDuplicate = () => {
    if (quoteId) {
      duplicateQuote.mutate({ id: quoteId });
    }
  };

  const handleSendEmail = () => {
    if (quoteId) {
      sendEmail.mutate({ id: quoteId });
    }
  };

  const handleDownload = () => {
    toast.success("Downloading quote...");
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
            quote?.quoteNumber || ""
          )
        }
        isOpen={isOpen}
        onClose={onClose}
        className="min-w-[100vw] h-[100vh] p-0 gap-0"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading quote...</p>
          </div>
        ) : quote ? (
          <div className="flex flex-col h-full">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {quote.quoteNumber}
                    <QuoteStatusBadge status={quote.status} />
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Created {format(new Date(quote.createdAt), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Update Dropdown */}
                {quote.status !== "Accepted" && quote.status !== "Rejected" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Update Status</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {quote.status !== "Sent" && (
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatus.mutate({
                              id: quoteId ?? "",
                              status: "Sent",
                            })
                          }
                        >
                          Mark as Sent
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setActionDialog({ type: "Accepted" })}
                        className="text-green-600"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept Quote
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setActionDialog({ type: "Rejected" })}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Quote
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setActionDialog({ type: "Duplicate" })}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate Quote
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
              <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-lg">
                {/* Quote Header */}
                <div className="p-8 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-4xl font-bold mb-2">QUOTE</h1>
                      <p className="text-lg text-muted-foreground">
                        #{quote.quoteNumber}
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

                {/* Customer & Quote Info */}
                <div className="p-8 grid md:grid-cols-2 gap-8 border-b">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Quote For
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{quote.client.name}</p>
                      </div>
                      {quote?.clientName && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{quote.clientName}</p>
                        </div>
                      )}
                      {quote?.clientEmail && (
                        <p className="text-sm text-muted-foreground">
                          {quote.clientEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Quote Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Quote Date:
                        </span>
                        <span className="font-medium">
                          {format(new Date(quote.createdAt), "MMMM dd, yyyy")}
                        </span>
                      </div>
                      {quote.validUntil && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Valid Until:
                          </span>
                          <span className="font-medium">
                            {format(
                              new Date(quote.validUntil),
                              "MMMM dd, yyyy"
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <QuoteStatusBadge status={quote.status} />
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
                      {quote.items.map((item, index) => (
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
                          ${parseFloat(quote.subtotal).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium text-green-600">
                          -${parseFloat(quote.discount).toFixed(2)}
                        </span>
                      </div>

                      {/* Payment Terms Information */}
                      {quote.paymentTermId && quote.interest && parseFloat(quote.interest) > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm text-blue-600">
                            <span>Interest:</span>
                            <span>+${parseFloat(quote.interest).toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium">
                          ${parseFloat(quote.tax).toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          ${parseFloat(quote.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                  <div className="p-8 bg-slate-50 dark:bg-slate-800 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Notes
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
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
            <p className="text-muted-foreground">Quote not found</p>
          </div>
        )}
      </Modal>

      {/* Accept Dialog */}
      <AlertDialog
        open={actionDialog.type === "Accepted"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Accept Quote
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this quote as accepted? This action
              will create an invoice for this quote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start gap-x-2 my-2">
            <Checkbox
              id="po-received"
              checked={isPoReceived}
              onCheckedChange={(checked) =>
                setIsPoReceived(checked === true ? true : false)
              }
            />
            <div>
              <Label htmlFor="po-received">PO received</Label>
              <p className="text-sm text-muted-foreground">
                Check here if purchase order was received from client
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={actionDialog.type === "Rejected"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Quote
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this quote? This action will
              update the quote status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Dialog */}
      <AlertDialog
        open={actionDialog.type === "Duplicate"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Duplicate Quote
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will create a copy of this quote with a new quote number. The
              original quote will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicate}>
              Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

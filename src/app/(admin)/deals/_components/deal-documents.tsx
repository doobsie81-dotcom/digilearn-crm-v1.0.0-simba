"use client";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Plus, Receipt, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, isPast } from "date-fns";

interface DealDocumentsProps {
  deal: {
    id: string;
    quote?: {
      id: string;
      quoteNumber: string;
      status: string;
      validUntil: Date | null;
      total?: string;
    };
    invoice?: {
      id: string;
      invoiceNumber: string;
      status: string;
      dueDate: Date | null;
      total?: string;
    };
  };
}

export function DealDocuments({ deal }: DealDocumentsProps) {
  const isQuoteExpired =
    deal.quote?.validUntil && isPast(deal.quote.validUntil);

  // If has invoice, display invoice
  if (!!deal.invoice) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Invoice</h3>
          <Badge
            variant={deal.invoice.status === "paid" ? "default" : "secondary"}
          >
            {deal.invoice.status}
          </Badge>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            {deal.invoice.invoiceNumber} • Due{" "}
            {deal.invoice.dueDate &&
              format(deal.invoice.dueDate, "dd MMM yyyy")}
          </p>
          <p className="font-semibold text-base">
            ${deal.invoice?.total || "0.00"}
          </p>
        </div>
      </div>
    );
  }

  // If has quote, display quote with actions
  if (!!deal.quote) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Quote</h3>
          <div className="flex items-center gap-2">
            {isQuoteExpired && (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <Badge variant={isQuoteExpired ? "destructive" : "secondary"}>
              {deal.quote.status}
            </Badge>
          </div>
        </div>
        <div className="space-y-1 text-sm mb-3">
          <p className="text-muted-foreground">
            {deal.quote.quoteNumber} • Valid until{" "}
            {deal.quote.validUntil &&
              format(deal.quote.validUntil, "dd MMM yyyy")}
          </p>
          <p className="font-semibold text-base">
            ${deal.quote?.total || "0.00"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" size="sm" asChild>
            <Link href={`/quotes/${deal.quote.id}/edit`}>
              <Edit className="w-3 h-3 mr-1" />
              Update
            </Link>
          </Button> */}
          <Button size="sm" asChild>
            <Link href={`/invoices/new?quoteId=${deal.quote.id}`}>
              <Receipt className="w-3 h-3 mr-1" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // No quote or invoice - show add products button
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Button size="sm" variant="link" asChild>
          <Link href={`/quotes/new?dealId=${deal.id}`}>
            <Plus className="w-3 h-3 mr-1" />
            Add Products
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">No quote created yet</p>
    </div>
  );
}

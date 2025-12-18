"use client";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  AlertCircle,
  AlertCircleIcon,
} from "lucide-react";
import { invoiceStatusEnum } from "~/db/schema/accounting-schema";

type InvoiceStatus = (typeof invoiceStatusEnum)[number];

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    icon: React.ElementType;
    className: string;
    dotColor: string;
  }
> = {
  Draft: {
    label: "Draft",
    icon: FileText,
    className:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200",
    dotColor: "bg-slate-500",
  },
  Sent: {
    label: "Sent",
    icon: Send,
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    dotColor: "bg-blue-500",
  },
  Paid: {
    label: "Paid",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
    dotColor: "bg-green-500",
  },
  "Partially-Paid": {
    label: "Partially Paid",
    icon: AlertCircleIcon,
    className:
      "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200",
    dotColor: "bg-amber-500",
  },
  Cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    dotColor: "bg-red-500",
  },
  Overdue: {
    label: "Overdue",
    icon: AlertCircle,
    className:
      "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
    dotColor: "bg-orange-500",
  },
};

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 font-medium",
        config.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

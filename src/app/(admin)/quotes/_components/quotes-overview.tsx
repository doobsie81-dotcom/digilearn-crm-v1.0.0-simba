"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { QuoteStatusBadge } from "~/components/quote-status-badge";
import {
  CalendarIcon,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  LayoutList,
  Plus,
  Download,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "~/lib/utils";
import { quoteStatusEnum } from "~/db/schema";
import Link from "next/link";
import QuotePreviewModal from "~/components/modals/quote-preview-modal";

type ViewMode = "table" | "grid";
type QuoteStatus = (typeof quoteStatusEnum)[number];

export default function QuotesOverview() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [isViewQuoteOpen, setViewQuoteOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: quotesData, isLoading } = trpc.quotes.listWithFilters.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: statistics } = trpc.quotes.getStatistics.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const quotes = quotesData?.quotes ?? [];
  const stats = statistics ?? {
    totalQuotes: 0,
    totalValue: 0,
    accepted: 0,
    rejected: 0,
    acceptedValue: 0,
    conversionRate: 0,
  };

  const handleOnViewQuote = (id: string | null) => {
    setQuoteId(id);
    setViewQuoteOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your quotes
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/quotes/new">
              <Plus className="h-4 w-4" />
              New Quote
            </Link>
          </Button>
        </div>
      </div>
      <QuotePreviewModal
        quoteId={quoteId}
        isOpen={isViewQuoteOpen}
        onClose={() => {
          setViewQuoteOpen(false);
          setQuoteId(null);
        }}
      />
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none  overflow-hidden">
          {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10" /> */}
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">{stats.totalQuotes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time quotes created
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          {/* <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10" /> */}
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              $
              {stats.totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all quotes
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          {/* <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10" /> */}
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              $
              {stats.acceptedValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              in value
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          {/* <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" /> */}
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              {stats.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.rejected} rejected quotes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none ">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by quote number or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) =>
                      setDateRange({ from: range?.from, to: range?.to })
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value: QuoteStatus) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {quoteStatusEnum.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator
              orientation="vertical"
              className="hidden md:block h-10"
            />

            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      {viewMode === "table" ? (
        <Card className="border-none ">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Quote #</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Loading quotes...
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No quotes found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quote.client.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {quote.clientName ? (
                        <div>
                          <p className="text-sm">{quote.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {quote.clientEmail ?? "not provided"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(quote.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {quote.validUntil
                        ? format(new Date(quote.validUntil), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      $
                      {parseFloat(quote.total).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="align-middle space-x-2">
                      <Link href={`/invoices/new?quoteId=${quote.id}`}>
                        Create Invoice
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOnViewQuote(quote.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center py-10">
              Loading quotes...
            </div>
          ) : quotes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-2 py-10">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No quotes found</p>
            </div>
          ) : (
            quotes.map((quote) => (
              <Card
                key={quote.id}
                className="border-none  hover:shadow-xl transition-shadow cursor-pointer overflow-hidden group"
              >
                {/* <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" /> */}
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {quote.quoteNumber}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quote.client.name}
                      </p>
                    </div>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {quote.clientName && (
                    <div>
                      <p className="text-sm font-medium">{quote.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {quote.clientEmail ?? "not provided"}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-2xl font-bold">
                        $
                        {parseFloat(quote.total).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">
                        {format(new Date(quote.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  {quote.validUntil && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      Valid until{" "}
                      {format(new Date(quote.validUntil), "MMM dd, yyyy")}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOnViewQuote(quote.id)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

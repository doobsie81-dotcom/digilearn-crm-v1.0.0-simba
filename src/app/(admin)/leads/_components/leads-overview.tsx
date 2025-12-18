"use client";

import { useState } from "react";
import {
  Filter,
  Search,
  ChevronDown,
  TrendingUp,
  Calendar,
  Building2,
  Loader2,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { Lead } from "~/db/types";
import PageHeader from "~/components/page-header";
import { CreateLeadForm } from "./create-lead-form";
import { Card, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import Link from "next/link";
import { CSVImport } from "~/components/csv-import";
import { toast } from "sonner";
import { DataPagination } from "~/components/data-pagination";

export type LeadStatus = Lead["status"] | "all";

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  qualified: "bg-green-100 text-green-800",
  unqualified: "bg-gray-100 text-gray-800",
  converted: "bg-emerald-100 text-emerald-800",
};

const sourceLabels = {
  website: "Website",
  referral: "Referral",
  cold_call: "Cold Call",
  social_media: "Social Media",
  event: "Event",
  partner: "Partner",
  other: "Other",
};

export default function LeadsListComponent() {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filters change
  const handleStatusChange = (status: LeadStatus) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleUnassignedToggle = (checked: boolean) => {
    setShowUnassignedOnly(checked);
    setCurrentPage(1);
  };

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.leads.getMany.useQuery({
    status: selectedStatus !== "all" ? [selectedStatus] : [],
    includeArchived: false,
    source:
      selectedSource !== "all" ? (selectedSource as Lead["source"]) : undefined,
    searchTerm: searchQuery || undefined,
    unassignedOnly: showUnassignedOnly,
    page: currentPage,
    pageSize: pageSize,
  });

  const getQualificationColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const onImportComplete = (message: string) => {
    toast.success(message);
    utils.leads.getMany.invalidate();
  };

  // const getActivityCount = (activities: { status: string }[]) => {
  //   const completed =
  //     activities?.filter((a) => a.status === "completed").length || 0;
  //   const scheduled =
  //     activities?.filter((a) => a.status === "scheduled").length || 0;
  //   return { completed, scheduled };
  // };

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <PageHeader
        title="Leads"
        subtitle="Search, prioritise, and nurture potential customers."
        actions={
          <div className="flex flex-wrap gap-x-2">
            <CSVImport onImportComplete={onImportComplete} />
            <CreateLeadForm />
          </div>
        }
      />

      {/* Filters and Search */}
      <Card className="border-none ">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads, companies, contacts..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as LeadStatus)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="unqualified">Unqualified</option>
                  <option value="converted">Converted</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sources</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="social_media">Social Media</option>
                  <option value="event">Event</option>
                  <option value="partner">Partner</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="unassigned-only"
                    checked={showUnassignedOnly}
                    onChange={(e) => handleUnassignedToggle(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="unassigned-only"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    Show unassigned leads only
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none ">
        {error && (
          <div className="p-6 text-center">
            <p className="text-red-600">Error loading leads: {error.message}</p>
          </div>
        )}

        {isLoading && (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading leads...</p>
          </div>
        )}

        {!isLoading && !error && data && data.items?.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leads found
            </h3>
            <p className="text-gray-500">
              {searchQuery ||
              selectedStatus !== "all" ||
              selectedSource !== "all"
                ? "Try adjusting your filters"
                : "Create your first lead to get started"}
            </p>
          </div>
        )}

        {!isLoading && !error && data && data.items?.length > 0 && (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((lead) => {
                  //const activityCounts = getActivityCount(lead.activities);
                  // const totalContacts = lead?.contactAssociations?.length || 0;

                  return (
                    <TableRow
                      key={lead.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {/* Lead / Company */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {lead.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate">
                                {lead.company?.name}
                              </span>
                            </div>
                            {lead.company?.industry && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {lead.company.industry}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Primary Contact */}
                      <TableCell className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {lead.primaryContact?.firstName}{" "}
                            {lead.primaryContact?.lastName}
                          </p>
                          {lead.primaryContact?.jobTitle && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {lead.primaryContact.jobTitle}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[lead.status]}`}
                        >
                          {lead.status.charAt(0).toUpperCase() +
                            lead.status.slice(1)}
                        </span>
                      </TableCell>

                      {/* Value */}
                      <TableCell className="px-6 py-4">
                        {lead.estimatedValue ? (
                          <div className="text-sm">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(parseFloat(lead.estimatedValue))}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not set</span>
                        )}
                      </TableCell>

                      {/* Score */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <TrendingUp
                            className={`w-4 h-4 ${getQualificationColor(lead.qualificationScore || 0)}`}
                          />
                          <span
                            className={`text-sm font-semibold ${getQualificationColor(lead.qualificationScore || 0)}`}
                          >
                            {lead.qualificationScore || 0}%
                          </span>
                        </div>
                      </TableCell>

                      {/* Assignee */}
                      <TableCell className="px-6 py-4">
                        {!!lead.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-slate-600 flex items-center justify-center text-white text-sm font-medium">
                              {lead.assignee?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {lead.assignee.email}, {lead.assignee.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span>unassigned</span>
                        )}
                      </TableCell>

                      {/* Last Contact */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(lead.lastContactedAt)}</span>
                        </div>
                      </TableCell>

                      {/* Source */}
                      <TableCell className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {sourceLabels[lead.source]}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Link href={`/leads/${lead.id}`}>View</Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {data.pagination && (
              <DataPagination
                currentPage={data.pagination.page}
                totalPages={data.pagination.totalPages}
                pageSize={data.pagination.pageSize}
                totalCount={data.pagination.totalCount}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

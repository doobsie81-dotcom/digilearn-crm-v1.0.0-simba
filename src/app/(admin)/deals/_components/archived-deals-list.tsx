"use client";

import { differenceInBusinessDays, format, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { trpc } from "~/trpc/client";
import { CloseStatus } from "./close-deal-button";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Deal, Company } from "~/db/types";
import { ArchivedDealsFilters } from "./archived-deals-filters";
import PageHeader from "~/components/page-header";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";
import Link from "next/link";
import { Separator } from "~/components/ui/separator";

const CloseStatuses: CloseStatus[] = ["won", "lost"];

const columnHelper = createColumnHelper<Deal & { company: Company }>();

export const ArchivedDeals = () => {
  const columns = [
    columnHelper.accessor("title", {
      header: "Deal Title",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("company.name", {
      header: "Company",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("value", {
      header: "Deal Value",
      cell: (info) =>
        `${info.row.original.currency} ${parseFloat(info.getValue()).toLocaleString()}`,
    }),
    columnHelper.accessor("probability", {
      header: "Win Probability",
      cell: (info) => `${info.getValue()}%`,
    }),
    columnHelper.accessor("closeStatus", {
      header: "Close Status",
      cell: (info) => (
        <span
          className={`capitalize px-2 py-1 rounded text-xs font-medium ${
            info.getValue() === "won"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("actualCloseDate", {
      header: "Close Date",
      cell: (info) => {
        const date = info.getValue();
        return date ? format(new Date(date), "dd-MM-yyyy") : "";
      },
    }),
    columnHelper.accessor("id", {
      header: "Days In Stage Vs Archived",
      cell: ({ row }) => {
        const actualCloseDate = row.original.actualCloseDate!;
        const currentStageSince = row.original.currentStageSince;
        const daysInArchive = differenceInBusinessDays(
          new Date(),
          new Date(actualCloseDate)
        );
        const daysInStage = differenceInBusinessDays(
          new Date(),
          currentStageSince
        );
        return (
          <div className="h-8 flex justify-start items-center gap-x-2">
            <p className="text-sm">{daysInStage} In Stage</p>
            <Separator className="h-full" orientation="vertical" />
            <p className="text-sm">{daysInArchive} Archived</p>
          </div>
        );
      },
    }),
    columnHelper.accessor("assignedToEmail", {
      header: "Assigned To",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("id", {
      header: "",
      cell: (info) => <Link href={`/deals/${info.getValue()}`}>View</Link>,
    }),
  ];

  // Use useMemo to create stable initial dates
  const initialDateRange = useMemo(() => {
    const now = new Date();
    return {
      fromDate: subDays(now, 60).toISOString(),
      toDate: now.toISOString(),
    };
  }, []); // Empty dependency array means this only runs once

  const [dateRange, setDateRange] = useState(initialDateRange);
  const [closeStatus, setCloseStatus] = useState<CloseStatus[]>(CloseStatuses);
  const { data: deals, isLoading } = trpc.deals.getArchivedDeals.useQuery({
    ...dateRange,
    closeStatus,
  });

  const table = useReactTable({
    data: deals || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Archived Deals" />
      <Card>
        <CardContent>
          <ArchivedDealsFilters
            selectedStatuses={closeStatus}
            setSelectedStatus={setCloseStatus}
            selectedDates={dateRange}
            setSelectedDates={setDateRange}
          />
        </CardContent>
      </Card>
      <Card>
        {isLoading ? (
          <CardContent>
            <div className="grid grid-cols-2 gap-x-2">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-slate-50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-semibold"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {deals?.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500">
                No deals found matching your filters
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

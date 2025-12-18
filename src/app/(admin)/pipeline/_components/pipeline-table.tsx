import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { differenceInDays, format } from "date-fns";
import { Company, Deal, PipelineStage } from "~/db/types";

type DealWithCompany = Deal & { company: Company };

interface PipelineTableProps {
  pipelineStages: (PipelineStage & {
    deals: DealWithCompany[];
  })[];
  onView?: (deal: Deal) => void;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
}

export default function PipelineTable({
  pipelineStages,
  onView,
  onEdit,
  onDelete,
}: PipelineTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deals] = useState<DealWithCompany[]>(() => {
    const deals = pipelineStages.map((stage) => stage.deals);
    return deals
      .flatMap((deal) => deal)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  });

  const getHealthColor = (health: number) => {
    if (health >= 80) return "bg-green-100 text-green-800";
    if (health >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStageColor = (stageId: string) => {
    return (
      pipelineStages.find((stage) => stage.id === stageId)?.color || "bg-muted"
    );
  };

  const getHealthLabel = (health: number) => {
    if (health >= 80) return "Healthy";
    if (health >= 50) return "Warning";
    return "At Risk";
  };

  const calculateDays = (currentStageSince: Date | string): number => {
    const stageDate =
      typeof currentStageSince === "string"
        ? new Date(currentStageSince)
        : currentStageSince;
    return differenceInDays(new Date(), stageDate);
  };

  const columns = useMemo<ColumnDef<DealWithCompany>[]>(
    () => [
      {
        accessorKey: "deal",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 font-semibold hover:text-blue-600 px-0"
          >
            Deal
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">{row.original.title}</div>
        ),
      },
      {
        accessorKey: "company",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 font-semibold hover:text-blue-600 px-0"
          >
            Company
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.original.company.name}</span>,
      },
      {
        accessorKey: "value",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 font-semibold hover:text-blue-600 px-0"
          >
            Value
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="font-medium text-gray-900">
            ${(getValue() as number).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "currentStageId",
        header: "Stage",
        cell: ({ getValue, row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(getValue() as string)}`}
          >
            {row.original.currentStatus}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ getValue, row }) => (
          <span className={`text-xs font-medium}`}>
            {format(row.original.createdAt, "Ppp")}
          </span>
        ),
      },
      {
        accessorKey: "assignedToEmail",
        header: "Owner",
        cell: ({ getValue }) => (
          <div className="text-gray-900">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: "healthScore",
        header: "Health",
        cell: ({ getValue }) => {
          const health = getValue() as number;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(health)}`}
            >
              {getHealthLabel(health)} ({health}%)
            </span>
          );
        },
      },
      {
        id: "days",
        accessorKey: "currentStageSince",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 font-semibold hover:text-blue-600 px-0"
          >
            Days
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const days = calculateDays(getValue() as Date | string);
          return <div className="text-gray-900">{days} days</div>;
        },
        sortingFn: (rowA, rowB) => {
          const daysA = calculateDays(rowA.original.currentStageSince);
          const daysB = calculateDays(rowB.original.currentStageSince);
          return daysA - daysB;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {onView && (
              <Button
                variant="ghost"
                onClick={() => onView(row.original)}
                className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                title="View"
              >
                <Eye className="w-4 h-4" /> View
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(row.original)}
                className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(row.original)}
                className="h-8 w-8 text-red-600 hover:bg-red-100"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete]
  );

  const table = useReactTable<DealWithCompany>({
    data: deals,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full">
      <div className="mb-6 px-6">
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search all columns..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 px-6 text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {deals.length} deals
      </div>
    </div>
  );
}

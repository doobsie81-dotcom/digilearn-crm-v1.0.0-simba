import { Filter } from "lucide-react";
import { ChangeEvent } from "react";
import SearchInput from "~/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
//import { Lead } from "~/db/types";
import { LeadStatus } from "./leads-overview";

interface LeadsFiltersProps {
  searchTerm: string;
  onChangeSearchTerm: (e: ChangeEvent<HTMLInputElement>) => void;
  statusFilters: { value: LeadStatus; label: string }[];
  selectedStatusFilter: LeadStatus;
  onSelectStatus: (status: LeadStatus) => void;
}

const LeadsFilters: React.FC<LeadsFiltersProps> = ({
  searchTerm,
  onChangeSearchTerm,
  selectedStatusFilter,
  statusFilters,
  onSelectStatus,
}) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onChangeSearchTerm}
          placeholder="Search by name, email, or company"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedStatusFilter} onValueChange={onSelectStatus}>
            <SelectTrigger
              className="w-[160px]"
              aria-label="Filter leads by status"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* <div className="flex items-center gap-2">
        {hasSelections && (
          <span className="text-sm text-muted-foreground">
            {selectionCount} selected
          </span>
        )}
        <Button
          variant="outline"
          disabled={!hasSelections || bulkDeleting}
          onClick={handleBulkDelete}
        >
          {bulkDeleting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </span>
          )}
        </Button>
      </div> */}
    </div>
  );
};

export default LeadsFilters;

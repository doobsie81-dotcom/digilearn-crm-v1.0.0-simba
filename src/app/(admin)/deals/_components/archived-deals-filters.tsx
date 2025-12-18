import CustomDatePicker from "~/components/custom-date-picker";
import { CloseStatus } from "./close-deal-button";
import { Label } from "~/components/ui/label";
import { MultiStatusSelect } from "~/components/multi-select";
import { useCallback } from "react";

interface ArchivedDealsFiltersProps {
  selectedStatuses: CloseStatus[];
  setSelectedStatus: (statuses: CloseStatus[]) => void;
  selectedDates: { fromDate: string; toDate: string };
  setSelectedDates: (dates: { fromDate: string; toDate: string }) => void;
}

export const ArchivedDealsFilters = ({
  setSelectedDates,
  selectedDates,
  selectedStatuses,
  setSelectedStatus,
}: ArchivedDealsFiltersProps) => {
  const diabledDates = useCallback(
    (date: Date) => {
      //const start = new Date(selectedDates.fromDate);
      const end = new Date(selectedDates.toDate);
      return date > end;
    },
    [selectedDates]
  );

  return (
    <div className="grid grid-cols-5 items-start gap-x-2">
      <div className="col-span-1">
        <div className="space-y-2">
          <Label>Close Status</Label>
          <MultiStatusSelect
            selectedStatuses={selectedStatuses}
            setSelectedStatus={(statuses: string[]) =>
              setSelectedStatus(statuses as CloseStatus[])
            }
            options={["won", "lost"].map((s) => ({ label: s, value: s }))}
          />
        </div>
      </div>
      <div className="col-span-2 ml-auto flex items-center justify-end gap-x-2">
        <div className="space-y-2">
          <Label>From</Label>
          <CustomDatePicker
            onSelectChange={(date) =>
              setSelectedDates({
                ...selectedDates,
                fromDate: date?.toISOString() ?? "",
              })
            }
            variant="outline"
            value={new Date(selectedDates.fromDate)}
            disabledDateCheck={diabledDates}
          />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <CustomDatePicker
            onSelectChange={(date) =>
              setSelectedDates({
                ...selectedDates,
                toDate: date?.toISOString() ?? "",
              })
            }
            variant="outline"
            value={new Date(selectedDates.toDate)}
            disabledDateCheck={diabledDates}
          />
        </div>
      </div>
    </div>
  );
};

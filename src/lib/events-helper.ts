import {
  format,
  setHours,
  setMinutes,
  differenceInMilliseconds,
} from "date-fns";

export const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const displayTime = format(
        setMinutes(setHours(new Date(), hour), minute),
        "h:mm a"
      );
      options.push({ value: time, label: displayTime });
    }
  }
  return options;
};

export function calculateDuration(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const start = new Date(startDate);
  start.setHours(startHours, startMinutes, 0, 0);

  const end = new Date(endDate);
  end.setHours(endHours, endMinutes, 0, 0);

  const diffMs = differenceInMilliseconds(end, start);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0) {
    return `${diffMinutes} minutes`;
  } else if (diffMinutes === 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  } else {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ${diffMinutes} minutes`;
  }
}

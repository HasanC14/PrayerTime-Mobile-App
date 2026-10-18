import { addDaysToDateKey } from "./prayerTimes";

export interface CalendarCell {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
}

export function getMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1, 12));
  const mondayBasedOffset = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, monthIndex, 1 - mondayBasedOffset, 12));
  const startKey = `${gridStart.getUTCFullYear()}-${String(gridStart.getUTCMonth() + 1).padStart(2, "0")}-${String(
    gridStart.getUTCDate()
  ).padStart(2, "0")}`;

  return Array.from({ length: 42 }, (_, index) => {
    const dateKey = addDaysToDateKey(startKey, index);
    const [, month, day] = dateKey.split("-").map(Number);
    return { dateKey, day, inCurrentMonth: month === monthIndex + 1 };
  });
}

export function getMonthFromDateKey(dateKey: string): { year: number; monthIndex: number } {
  const [year, month] = dateKey.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

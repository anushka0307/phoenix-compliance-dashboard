import type { DashboardPeriod } from "@/types/msa";

export interface ResolvedDateRange {
  preset: DashboardPeriod;
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
}

export interface CustomRangeValidation {
  valid: boolean;
  message?: string;
}

const HISTORY_START = new Date(2020, 0, 1);
const MAX_CUSTOM_RANGE_YEARS = 5;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

function endOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3 + 3, 0);
}

function daysInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function resolvePresetDateRange(
  preset: DashboardPeriod,
  customStart?: string | null,
  customEnd?: string | null,
  referenceDate = new Date(),
): ResolvedDateRange {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  if (preset === "overall") {
    return {
      preset,
      start: toIsoDate(HISTORY_START),
      end: toIsoDate(today),
      startDate: HISTORY_START,
      endDate: today,
    };
  }

  if (preset === "30d") {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    return {
      preset,
      start: toIsoDate(startDate),
      end: toIsoDate(today),
      startDate,
      endDate: today,
    };
  }

  if (preset === "quarter") {
    const startDate = startOfQuarter(today);
    const endDate = endOfQuarter(today);
    return {
      preset,
      start: toIsoDate(startDate),
      end: toIsoDate(endDate),
      startDate,
      endDate,
    };
  }

  if (preset === "year") {
    const startDate = new Date(today.getFullYear(), 0, 1);
    return {
      preset,
      start: toIsoDate(startDate),
      end: toIsoDate(today),
      startDate,
      endDate: today,
    };
  }

  const parsedStart = parseIsoDate(customStart ?? "") ?? startOfQuarter(today);
  const parsedEnd = parseIsoDate(customEnd ?? "") ?? today;
  const startDate = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
  const endDate = parsedStart <= parsedEnd ? parsedEnd : parsedStart;

  return {
    preset: "custom",
    start: toIsoDate(startDate),
    end: toIsoDate(endDate),
    startDate,
    endDate,
  };
}

export function validateCustomDateRange(start: string, end: string): CustomRangeValidation {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (!startDate || !endDate) {
    return { valid: false, message: "Enter valid start and end dates." };
  }

  if (startDate > endDate) {
    return { valid: false, message: "Start date cannot be after end date." };
  }

  if (endDate > today) {
    return { valid: false, message: "End date cannot be in the future." };
  }

  const maxEnd = new Date(startDate);
  maxEnd.setFullYear(maxEnd.getFullYear() + MAX_CUSTOM_RANGE_YEARS);
  if (endDate > maxEnd) {
    return { valid: false, message: "Maximum custom range is 5 years." };
  }

  return { valid: true };
}

export function getComparisonDateRange(
  range: ResolvedDateRange,
): ResolvedDateRange | null {
  const { preset, startDate, endDate } = range;

  if (preset === "overall") {
    const durationDays = daysInclusive(startDate, endDate);
    const prevEnd = addDays(startDate, -1);
    const prevStart = addDays(prevEnd, -(durationDays - 1));
    if (prevStart < HISTORY_START) return null;
    return {
      preset: "overall",
      start: toIsoDate(prevStart),
      end: toIsoDate(prevEnd),
      startDate: prevStart,
      endDate: prevEnd,
    };
  }

  if (preset === "30d") {
    const prevEnd = addDays(startDate, -1);
    const prevStart = addDays(prevEnd, -29);
    return {
      preset: "30d",
      start: toIsoDate(prevStart),
      end: toIsoDate(prevEnd),
      startDate: prevStart,
      endDate: prevEnd,
    };
  }

  if (preset === "quarter") {
    const prevQuarterEnd = addDays(startDate, -1);
    const prevQuarterStart = startOfQuarter(prevQuarterEnd);
    return {
      preset: "quarter",
      start: toIsoDate(prevQuarterStart),
      end: toIsoDate(prevQuarterEnd),
      startDate: prevQuarterStart,
      endDate: prevQuarterEnd,
    };
  }

  if (preset === "year") {
    const prevYear = startDate.getFullYear() - 1;
    if (prevYear < HISTORY_START.getFullYear()) return null;
    const prevStart = new Date(prevYear, 0, 1);
    const prevEnd = new Date(prevYear, 11, 31);
    return {
      preset: "year",
      start: toIsoDate(prevStart),
      end: toIsoDate(prevEnd),
      startDate: prevStart,
      endDate: prevEnd,
    };
  }

  const durationDays = daysInclusive(startDate, endDate);
  const prevEnd = addDays(startDate, -1);
  const prevStart = addDays(prevEnd, -(durationDays - 1));
  if (prevStart < HISTORY_START) return null;

  return {
    preset: "custom",
    start: toIsoDate(prevStart),
    end: toIsoDate(prevEnd),
    startDate: prevStart,
    endDate: prevEnd,
  };
}

export function getDateRangeScale(range: ResolvedDateRange): number {
  if (range.preset === "overall") return 1;
  const days = daysInclusive(range.startDate, range.endDate);
  return days / 365;
}

export function getDateRangeLabel(range: ResolvedDateRange): string {
  if (range.preset === "overall") return "Overall";
  if (range.preset === "30d") return "Last 30 Days";
  if (range.preset === "quarter") return "Current Quarter";
  if (range.preset === "year") return "Year to Date";
  return formatDateRangeDisplay(range);
}

export function formatDateRangeDisplay(range: ResolvedDateRange): string {
  const format = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${format(range.startDate)} – ${format(range.endDate)}`;
}

export function formatLastUpdated(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

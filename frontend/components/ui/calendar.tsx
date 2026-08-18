"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { cn, parseLocalDate, toLocalIsoDate } from "@/lib/utils";
import { formatLocalizedDate } from "@/i18n/date-locale";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/locales";

interface CalendarProps {
  /** Selected date as "YYYY-MM-DD", or undefined for none selected. */
  selected?: string;
  onSelect: (isoDate: string) => void;
  className?: string;
}

// Jan 1 2024 was a Monday — used purely as a stable anchor to read off
// locale-correct Mon-Sun weekday abbreviations via formatLocalizedDate,
// independent of whatever month the grid itself is currently showing.
const WEEKDAY_ANCHOR = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Monday-first 6x7 grid spanning `monthStart`'s month, padded with the
 * adjacent months' trailing/leading days needed to fill whole weeks — same
 * Monday-start convention this app's Schedule pages already use. */
function buildGrid(monthStart: Date): Date[] {
  const firstWeekday = (monthStart.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

/** Plain month-grid date picker — no dependency on the trigger/popover it's
 * usually shown inside of, so it's reusable standalone (e.g. an inline
 * date-range panel) as well as from `Input`'s `type="date"` branch. */
export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const selectedDate = selected ? parseLocalDate(selected) : undefined;
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate ?? new Date()));

  const today = new Date();
  const grid = buildGrid(viewMonth);
  const weekdayLabels = WEEKDAY_ANCHOR.map((d) => formatLocalizedDate(d, locale, { weekday: "short" }));
  const monthLabel = formatLocalizedDate(viewMonth, locale, { month: "long", year: "numeric" });

  return (
    <div className={cn("p-3 w-[272px]", className)}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-900 capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekdayLabels.map((label, i) => (
          <div key={i} className="h-7 flex items-center justify-center text-[11px] font-medium text-slate-400 uppercase">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day, i) => {
          const inMonth = day.getMonth() === viewMonth.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(toLocalIsoDate(day))}
              className={cn(
                "h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-colors",
                !inMonth && "text-slate-300 hover:bg-slate-50",
                inMonth && !isSelected && "text-slate-700 hover:bg-slate-100",
                isToday && !isSelected && "font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200",
                isSelected && "bg-indigo-600 text-white font-semibold hover:bg-indigo-600"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

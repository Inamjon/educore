import type { Locale } from "./locales";

// Intl.DateTimeFormat / toLocaleDateString locale string for each interface
// locale — shared by every portal page that formats a date for display.
export const INTL_DATE_LOCALES: Record<Locale, string> = {
  en: "en-US",
  uz: "uz-Latn-UZ",
  ru: "ru-RU",
};

// Chrome/ICU's CLDR data for "uz"/"uz-UZ"/"uz-Latn-UZ" doesn't ship
// localized month or weekday names — toLocaleDateString silently falls
// back to a "M08"-style placeholder for months and plain English ("Sun")
// for weekdays. Verified directly in the browser console; not a bug in
// this app, but Uzbek is EduCore's primary target market, so it gets a
// small hand-rolled table instead of trusting the platform for these two
// fields specifically. Numeric/time formatting (toLocaleTimeString) is
// unaffected and keeps using the browser's Intl support.
const UZ_MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const UZ_MONTHS_LONG = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
// Indexed by Date#getDay() (0 = Sunday).
const UZ_WEEKDAYS_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const UZ_WEEKDAYS_LONG = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

interface LocalizedDateOptions {
  weekday?: "short" | "long";
  month?: "short" | "long" | "numeric" | "2-digit";
  day?: "numeric";
  year?: "numeric";
}

/** Locale-aware date formatting for display — delegates to the browser's
 * Intl for en/ru (both have complete CLDR data), formats manually for uz.
 * Covers the {weekday, month, day, year} combinations used across the
 * portals; extend the option handling here rather than reaching for
 * toLocaleDateString directly in a page. */
export function formatLocalizedDate(date: Date, locale: Locale, options: LocalizedDateOptions): string {
  if (locale !== "uz") {
    return date.toLocaleDateString(INTL_DATE_LOCALES[locale], options);
  }

  const segments: string[] = [];
  if (options.weekday) {
    segments.push((options.weekday === "long" ? UZ_WEEKDAYS_LONG : UZ_WEEKDAYS_SHORT)[date.getDay()]);
  }

  let dayMonth = "";
  if (options.day) dayMonth += date.getDate();
  if (options.month) {
    const month =
      options.month === "long"
        ? UZ_MONTHS_LONG[date.getMonth()]
        : options.month === "short"
          ? UZ_MONTHS_SHORT[date.getMonth()]
          : String(date.getMonth() + 1).padStart(options.month === "2-digit" ? 2 : 1, "0");
    dayMonth += (dayMonth ? " " : "") + month;
  }
  if (dayMonth) segments.push(dayMonth);

  if (options.year) segments.push(String(date.getFullYear()));

  return segments.join(", ");
}

// ─── Shared weekly-schedule-grid helpers ───────────────────────────────────
// Pure locale-formatting utilities (no portal-specific mock-data
// dependency), so — unlike e.g. each portal's own "days until" helper,
// which genuinely differs per portal's demo data — these belong here once,
// not redefined per portal. Every portal's weekly Schedule page imports
// these instead of hand-rolling its own copy.

/** Short weekday abbreviation for a YYYY-MM-DD date string (e.g. "Mon"/"Dush"). */
export function weekdayShort(iso: string, locale: Locale): string {
  return formatLocalizedDate(new Date(iso + "T00:00:00"), locale, { weekday: "short" });
}

/** "Aug 3"-style day-column header for a YYYY-MM-DD date string. */
export function formatDayHeader(iso: string, locale: Locale): string {
  return formatLocalizedDate(new Date(iso + "T00:00:00"), locale, { month: "short", day: "numeric" });
}

/** "Aug 3 – Aug 9, 2026"-style week-range subtitle for a 7-element Mon–Sun
 * array of YYYY-MM-DD date strings. */
export function formatWeekRange(week: string[], locale: Locale): string {
  const start = new Date(week[0] + "T00:00:00");
  const end = new Date(week[6] + "T00:00:00");
  return `${formatLocalizedDate(start, locale, { month: "short", day: "numeric" })} – ${formatLocalizedDate(end, locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

/** Locale-aware "HH:MM" formatting for a bare "HH:MM" time-of-day string
 * (not a full Date/ISO timestamp) — en gets 12-hour AM/PM, uz/ru get
 * 24-hour, per each locale's own convention. Shared by every page that
 * displays a lesson/class start-end time. */
export function formatClockTime(time: string, locale: Locale): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(INTL_DATE_LOCALES[locale], { hour: "numeric", minute: "2-digit", hour12: locale === "en" });
}

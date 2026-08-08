import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** `new Date("2026-08-15")` parses a bare date-only string as UTC midnight,
 * per spec — formatting that in any timezone behind UTC silently shifts it
 * back a day (a due_date of "2026-08-15" rendering as "Aug 14"). Parses it
 * as a local calendar date instead. Mirrors the schedule pages' own
 * toLocalIso() encoder; this is the matching decoder. A full ISO timestamp
 * (has a "T") is a real point in time and is left to `new Date()` as-is. */
function parseLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: string | Date) {
  const parsed = typeof date === "string" && DATE_ONLY.test(date) ? parseLocalDate(date) : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Mock login ID generator (e.g. "STU-4821") — stands in for the backend's
 * sequence-based login_id generation (see backend/foundation/managers.py)
 * until real account creation is wired up. */
export function generateLoginId(prefix: string) {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

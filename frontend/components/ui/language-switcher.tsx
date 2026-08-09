"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

/** Sets the plain `NEXT_LOCALE` cookie `i18n/request.ts` reads server-side,
 * then `router.refresh()` to re-run the server components (RootLayout
 * included) against the new cookie value — the standard next-intl
 * "without i18n routing" pattern (no `/en/...` URL prefix, see
 * `i18n/locales.ts`'s docstring on why).
 */
function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

interface LanguageSwitcherProps {
  className?: string;
  /** Compact = just the flag/code (header bars); full = flag + language name (login page). */
  variant?: "compact" | "full";
}

export function LanguageSwitcher({ className, variant = "compact" }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Locale) {
    if (next === locale) return;
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <select
        aria-label="Language"
        value={locale}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as Locale)}
        className={cn(
          "appearance-none cursor-pointer rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60",
          variant === "compact" ? "h-8 pl-2 pr-6 text-xs" : "h-10 pl-3 pr-8 text-sm"
        )}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code].flag} {LOCALE_LABELS[code].label}
          </option>
        ))}
      </select>
    </div>
  );
}

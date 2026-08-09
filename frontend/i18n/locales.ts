/** Supported UI languages — Uzbekistan/Central Asia market (see CLAUDE.md).
 * `uz` is the default, matching `foundation.User.language`'s own model
 * default on the backend. Not URL-prefixed routing (`/en/...`) — locale
 * lives in a plain cookie instead (see `i18n/request.ts`), specifically so
 * adding this didn't require restructuring every existing route under
 * `app/[locale]/...` (proxy.ts's portal-redirect logic, every `Link`/
 * `router.push` in the app) for a first pass scoped to Login + Student only.
 */
export const LOCALES = ["en", "uz", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  uz: { label: "O'zbek", flag: "🇺🇿" },
  ru: { label: "Русский", flag: "🇷🇺" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Called once, right after a successful login (see the login page) — seeds
 * the locale cookie from the account's saved `language` preference, but
 * only on a device/browser that has never had one set. Deliberately does
 * NOT override an already-set cookie: a user who explicitly picked English
 * on the login screen (because they don't read Uzbek) shouldn't have it
 * silently flip back to their saved "uz" the moment they sign in — the
 * saved preference only matters as the *first-ever* default for this
 * browser, not something that overwrites an in-the-moment choice.
 *
 * Returns whether it actually wrote the cookie — the caller still needs a
 * `router.refresh()` in that case, since a plain `document.cookie` write
 * doesn't itself invalidate Next's Client Cache (see the login page).
 */
export function seedLocaleCookieIfUnset(language: string): boolean {
  if (typeof document === "undefined") return false;
  const hasCookie = document.cookie.split("; ").some((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  if (hasCookie) return false;
  const locale = isLocale(language) ? language : DEFAULT_LOCALE;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  return true;
}

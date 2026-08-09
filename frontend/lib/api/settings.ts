import { apiFetch } from "@/lib/api/client";

/** Platform-wide General + Security settings (Super-Admin System Settings
 * page). Theme/Languages/Email/SMS/Backup/API-Keys stay frontend-mock — see
 * backend/foundation/services.py's docstring on PLATFORM_SETTINGS_DEFAULTS
 * for why only these two panels are real this phase.
 */

export interface GeneralSettings {
  platformName: string;
  tagline: string;
  supportEmail: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export type PasswordPolicy = "basic" | "medium" | "strong";

export interface SecuritySettings {
  twoFactor: boolean;
  sessionTimeoutMinutes: number;
  ipAllowlist: boolean;
  maxLoginAttempts: number;
  passwordPolicy: PasswordPolicy;
}

export interface PlatformSettings {
  general: GeneralSettings;
  security: SecuritySettings;
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/api/v1/settings/platform/");
}

export async function updatePlatformSettings(
  input: Partial<{ general: Partial<GeneralSettings>; security: Partial<SecuritySettings> }>
): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/api/v1/settings/platform/", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/** Public subset (name/tagline/logo), for the login page — no auth
 * required, see foundation.views.PlatformBrandingView. */
export interface PlatformBranding {
  platformName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export async function getPlatformBranding(): Promise<PlatformBranding> {
  return apiFetch<PlatformBranding>("/api/v1/settings/platform/branding/");
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

// General + Security moved off this mock store onto the real
// foundation.Setting-backed API — see lib/api/settings.ts and
// app/super-admin/settings/page.tsx. Everything below is still mock;
// see the plan doc for why (each is its own real integration: SMTP
// sending, an SMS provider, automated backups, ...).

export interface SASettingsTheme {
  darkMode: boolean;
  compactSidebar: boolean;
  primaryColor: string;
  fontFamily: string;
}

export interface SASettingsLanguage {
  code: string;
  label: string;
  flag: string;
  enabled: boolean;
  default: boolean;
}

export interface SASettingsEmail {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromName: string;
  tlsEnabled: boolean;
}

export interface SASettingsSms {
  provider: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
  enabled: boolean;
}

export interface SASettingsBackup {
  autoBackup: boolean;
  frequency: string;
  retention: string;
  lastBackupAt: string;
}

export interface SAApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
}

export interface SASettings {
  theme: SASettingsTheme;
  languages: SASettingsLanguage[];
  email: SASettingsEmail;
  sms: SASettingsSms;
  backup: SASettingsBackup;
  apiKeys: SAApiKey[];
}

const DEFAULT_SETTINGS: SASettings = {
  theme: {
    darkMode: false,
    compactSidebar: false,
    primaryColor: "#6366f1",
    fontFamily: "inter",
  },
  languages: [
    { code: "en", label: "English", flag: "🇺🇸", enabled: true, default: true },
    { code: "uz", label: "Uzbek", flag: "🇺🇿", enabled: true, default: false },
    { code: "ru", label: "Russian", flag: "🇷🇺", enabled: true, default: false },
    { code: "ar", label: "Arabic", flag: "🇸🇦", enabled: false, default: false },
    { code: "es", label: "Spanish", flag: "🇪🇸", enabled: false, default: false },
  ],
  email: {
    smtpHost: "smtp.mailgun.org",
    smtpPort: 587,
    username: "postmaster@educore.com",
    password: "••••••••••",
    fromName: "EduCore Platform",
    tlsEnabled: true,
  },
  sms: {
    provider: "twilio",
    accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authToken: "••••••••••",
    fromNumber: "+1 555-000-0001",
    enabled: true,
  },
  backup: {
    autoBackup: true,
    frequency: "daily",
    retention: "30d",
    lastBackupAt: "2026-07-04T03:00:00Z",
  },
  apiKeys: [
    { id: "key1", name: "Production API Key", key: "ek_live_" + "x".repeat(32), createdAt: "2026-01-01", lastUsed: "2026-07-04" },
    { id: "key2", name: "Webhook Secret", key: "whsec_" + "x".repeat(32), createdAt: "2026-01-01", lastUsed: "2026-07-03" },
    { id: "key3", name: "Sandbox API Key", key: "ek_test_" + "x".repeat(32), createdAt: "2026-03-10", lastUsed: "2026-06-28" },
  ],
};

function randomKey(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${out}`;
}

interface SASettingsState {
  settings: SASettings;
  updateTheme: (patch: Partial<SASettingsTheme>) => void;
  toggleLanguage: (code: string) => void;
  updateEmail: (patch: Partial<SASettingsEmail>) => void;
  updateSms: (patch: Partial<SASettingsSms>) => void;
  updateBackup: (patch: Partial<SASettingsBackup>) => void;
  runBackup: () => void;
  rotateApiKey: (id: string) => void;
  generateApiKey: () => void;
}

export const useSASettingsStore = create<SASettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateTheme: (patch) =>
        set((s) => ({ settings: { ...s.settings, theme: { ...s.settings.theme, ...patch } } })),
      toggleLanguage: (code) =>
        set((s) => ({
          settings: {
            ...s.settings,
            languages: s.settings.languages.map((l) =>
              l.code === code && !l.default ? { ...l, enabled: !l.enabled } : l
            ),
          },
        })),
      updateEmail: (patch) =>
        set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, ...patch } } })),
      updateSms: (patch) =>
        set((s) => ({ settings: { ...s.settings, sms: { ...s.settings.sms, ...patch } } })),
      updateBackup: (patch) =>
        set((s) => ({ settings: { ...s.settings, backup: { ...s.settings.backup, ...patch } } })),
      runBackup: () =>
        set((s) => ({
          settings: { ...s.settings, backup: { ...s.settings.backup, lastBackupAt: new Date().toISOString() } },
        })),
      rotateApiKey: (id) =>
        set((s) => ({
          settings: {
            ...s.settings,
            apiKeys: s.settings.apiKeys.map((k) =>
              k.id === id ? { ...k, key: randomKey(k.key.split("_")[0]), lastUsed: new Date().toISOString().slice(0, 10) } : k
            ),
          },
        })),
      generateApiKey: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            apiKeys: [
              ...s.settings.apiKeys,
              {
                id: `key${Date.now()}`,
                name: "New API Key",
                key: randomKey("ek_live"),
                createdAt: new Date().toISOString().slice(0, 10),
                lastUsed: "Never",
              },
            ],
          },
        })),
    }),
    { name: "educore-sa-settings", version: 2 }
  )
);

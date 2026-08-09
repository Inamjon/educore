'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Globe,
  Mail,
  MessageSquare,
  Database,
  Shield,
  Key,
  Palette,
  Save,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { useSASettingsStore } from '@/lib/store/sa-settings-store';
import { usePlatformSettingsQuery, useUpdatePlatformSettingsMutation } from '@/lib/queries/settings';
import type { GeneralSettings, SecuritySettings } from '@/lib/api/settings';
import { toast } from '@/lib/store/toast-store';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

// ─── Settings Sections ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'general',   label: 'General',        icon: Settings,      desc: 'Platform name, logo & branding' },
  { id: 'theme',     label: 'Theme',           icon: Palette,       desc: 'Colors, appearance & layout' },
  { id: 'languages', label: 'Languages',       icon: Globe,         desc: 'Supported languages & locale' },
  { id: 'email',     label: 'Email Settings',  icon: Mail,          desc: 'SMTP & email templates' },
  { id: 'sms',       label: 'SMS Settings',    icon: MessageSquare, desc: 'SMS provider & templates' },
  { id: 'backup',    label: 'Backup',          icon: Database,      desc: 'Automated backups & restore' },
  { id: 'security',  label: 'Security',        icon: Shield,        desc: 'Auth, 2FA & session settings' },
  { id: 'api',       label: 'API Keys',        icon: Key,           desc: 'Integration keys & webhooks' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SettingsLoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading…
    </div>
  );
}

function SettingsLoadError({ error }: { error: unknown }) {
  return (
    <p className="py-8 text-sm text-red-500">
      {error instanceof ApiError ? error.message : 'Failed to load settings.'}
    </p>
  );
}

// ─── Section Panels ───────────────────────────────────────────────────────────

function GeneralPanel({ general, onChange }: { general: GeneralSettings; onChange: (patch: Partial<GeneralSettings>) => void }) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (field: 'logoUrl' | 'faviconUrl') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ [field]: reader.result as string });
      toast.success(field === 'logoUrl' ? 'Logo uploaded' : 'Favicon uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-0">
      <FieldRow label="Platform Name" hint="Displayed across the entire application">
        <Input
          value={general.platformName}
          onChange={(e) => onChange({ platformName: e.target.value })}
          className="w-64"
        />
      </FieldRow>
      <FieldRow label="Tagline" hint="Short description shown on the login page">
        <Input
          value={general.tagline}
          onChange={(e) => onChange({ tagline: e.target.value })}
          className="w-64"
        />
      </FieldRow>
      <FieldRow label="Logo" hint="Recommended size: 256×64px, PNG or SVG">
        <div className="flex items-center gap-3">
          {general.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={general.logoUrl} alt="Logo" className="h-9 w-28 object-contain rounded-lg border border-slate-200" />
          ) : (
            <div className="h-9 w-28 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
              No file
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>Upload</Button>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload('logoUrl')} />
        </div>
      </FieldRow>
      <FieldRow label="Favicon" hint="16×16 or 32×32 ICO file">
        <div className="flex items-center gap-3">
          {general.faviconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={general.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain rounded border border-slate-200" />
          )}
          <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()}>Upload</Button>
          <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload('faviconUrl')} />
        </div>
      </FieldRow>
      <FieldRow label="Support Email" hint="Contact email shown to users">
        <Input
          type="email"
          value={general.supportEmail}
          onChange={(e) => onChange({ supportEmail: e.target.value })}
          className="w-64"
        />
      </FieldRow>
    </div>
  );
}

function ThemePanel() {
  const theme = useSASettingsStore((s) => s.settings.theme);
  const updateTheme = useSASettingsStore((s) => s.updateTheme);

  return (
    <div className="space-y-0">
      <FieldRow label="Dark Mode" hint="Enable dark theme for all users">
        <Toggle checked={theme.darkMode} onChange={(v) => updateTheme({ darkMode: v })} />
      </FieldRow>
      <FieldRow label="Compact Sidebar" hint="Collapse sidebar by default">
        <Toggle checked={theme.compactSidebar} onChange={(v) => updateTheme({ compactSidebar: v })} />
      </FieldRow>
      <FieldRow label="Primary Color" hint="Used for buttons, links and accents">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.primaryColor}
            onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200"
          />
          <Input
            value={theme.primaryColor}
            onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            className="w-28 font-mono text-sm"
          />
        </div>
      </FieldRow>
      <FieldRow label="Font Family" hint="Typography used across the platform">
        <Select
          className="w-48"
          value={theme.fontFamily}
          options={[
            { value: 'inter', label: 'Inter (Default)' },
            { value: 'roboto', label: 'Roboto' },
            { value: 'outfit', label: 'Outfit' },
            { value: 'system', label: 'System Default' },
          ]}
          onChange={(e) => updateTheme({ fontFamily: e.target.value })}
        />
      </FieldRow>
    </div>
  );
}

function LanguagesPanel() {
  const languages = useSASettingsStore((s) => s.settings.languages);
  const toggleLanguage = useSASettingsStore((s) => s.toggleLanguage);

  return (
    <div className="space-y-0">
      {languages.map((lang) => (
        <FieldRow key={lang.code} label={`${lang.flag} ${lang.label}`} hint={lang.default ? 'Default language' : undefined}>
          <div className="flex items-center gap-3">
            {lang.default && (
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">Default</span>
            )}
            <Toggle
              checked={lang.enabled}
              onChange={() => {
                if (lang.default) {
                  toast.error('The default language cannot be disabled');
                  return;
                }
                toggleLanguage(lang.code);
              }}
            />
          </div>
        </FieldRow>
      ))}
    </div>
  );
}

function EmailPanel() {
  const email = useSASettingsStore((s) => s.settings.email);
  const updateEmail = useSASettingsStore((s) => s.updateEmail);

  return (
    <div className="space-y-0">
      <FieldRow label="SMTP Host" hint="Your email server host">
        <Input value={email.smtpHost} onChange={(e) => updateEmail({ smtpHost: e.target.value })} className="w-64" />
      </FieldRow>
      <FieldRow label="SMTP Port" hint="">
        <Input
          type="number"
          value={email.smtpPort}
          onChange={(e) => updateEmail({ smtpPort: Number(e.target.value) || 0 })}
          className="w-32"
        />
      </FieldRow>
      <FieldRow label="Username" hint="">
        <Input value={email.username} onChange={(e) => updateEmail({ username: e.target.value })} className="w-64" />
      </FieldRow>
      <FieldRow label="Password" hint="">
        <Input
          type="password"
          value={email.password}
          onChange={(e) => updateEmail({ password: e.target.value })}
          className="w-64"
        />
      </FieldRow>
      <FieldRow label="From Name" hint="Sender name shown in inbox">
        <Input value={email.fromName} onChange={(e) => updateEmail({ fromName: e.target.value })} className="w-64" />
      </FieldRow>
      <FieldRow label="Enable TLS" hint="Secure connection">
        <Toggle checked={email.tlsEnabled} onChange={(v) => updateEmail({ tlsEnabled: v })} />
      </FieldRow>
    </div>
  );
}

function SMSPanel() {
  const sms = useSASettingsStore((s) => s.settings.sms);
  const updateSms = useSASettingsStore((s) => s.updateSms);

  return (
    <div className="space-y-0">
      <FieldRow label="SMS Provider" hint="">
        <Select
          className="w-48"
          value={sms.provider}
          options={[
            { value: 'twilio', label: 'Twilio' },
            { value: 'nexmo', label: 'Nexmo / Vonage' },
            { value: 'aws-sns', label: 'AWS SNS' },
            { value: 'custom', label: 'Custom' },
          ]}
          onChange={(e) => updateSms({ provider: e.target.value })}
        />
      </FieldRow>
      <FieldRow label="Account SID" hint="">
        <Input
          value={sms.accountSid}
          onChange={(e) => updateSms({ accountSid: e.target.value })}
          className="w-64 font-mono text-xs"
        />
      </FieldRow>
      <FieldRow label="Auth Token" hint="">
        <Input
          type="password"
          value={sms.authToken}
          onChange={(e) => updateSms({ authToken: e.target.value })}
          className="w-64"
        />
      </FieldRow>
      <FieldRow label="From Number" hint="Your Twilio phone number">
        <Input value={sms.fromNumber} onChange={(e) => updateSms({ fromNumber: e.target.value })} className="w-64" />
      </FieldRow>
      <FieldRow label="Enable SMS" hint="Send SMS notifications to users">
        <Toggle checked={sms.enabled} onChange={(v) => updateSms({ enabled: v })} />
      </FieldRow>
    </div>
  );
}

function BackupPanel() {
  const backup = useSASettingsStore((s) => s.settings.backup);
  const updateBackup = useSASettingsStore((s) => s.updateBackup);
  const runBackup = useSASettingsStore((s) => s.runBackup);

  return (
    <div className="space-y-0">
      <FieldRow label="Auto Backup" hint="Automatically backup data on a schedule">
        <Toggle checked={backup.autoBackup} onChange={(v) => updateBackup({ autoBackup: v })} />
      </FieldRow>
      <FieldRow label="Backup Frequency" hint="">
        <Select
          className="w-48"
          value={backup.frequency}
          options={[
            { value: 'hourly', label: 'Every Hour' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
          ]}
          onChange={(e) => updateBackup({ frequency: e.target.value })}
        />
      </FieldRow>
      <FieldRow label="Backup Retention" hint="How long to keep backups">
        <Select
          className="w-48"
          value={backup.retention}
          options={[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
          ]}
          onChange={(e) => updateBackup({ retention: e.target.value })}
        />
      </FieldRow>
      <FieldRow label="Last Backup" hint="">
        <span className="text-sm text-emerald-600 font-medium">
          {new Date(backup.lastBackupAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })} ✓
        </span>
      </FieldRow>
      <FieldRow label="Manual Backup" hint="Trigger an immediate backup now">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            runBackup();
            toast.success('Backup completed');
          }}
        >
          <Database className="h-3.5 w-3.5" />
          Run Backup
        </Button>
      </FieldRow>
    </div>
  );
}

function SecurityPanel({ security, onChange }: { security: SecuritySettings; onChange: (patch: Partial<SecuritySettings>) => void }) {
  return (
    <div className="space-y-0">
      <FieldRow label="Two-Factor Authentication" hint="Require 2FA for all admins — stored, not yet enforced (a real TOTP flow is a future project)">
        <Toggle checked={security.twoFactor} onChange={(v) => onChange({ twoFactor: v })} />
      </FieldRow>
      <FieldRow label="Session Timeout" hint="Stored, not yet enforced (JWT lifetime is currently a fixed server setting)">
        <Select
          className="w-48"
          value={String(security.sessionTimeoutMinutes)}
          options={[
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
            { value: '480', label: '8 hours' },
          ]}
          onChange={(e) => onChange({ sessionTimeoutMinutes: Number(e.target.value) })}
        />
      </FieldRow>
      <FieldRow label="IP Allowlist" hint="Restrict admin access to specific IPs — stored, not yet enforced">
        <Toggle checked={security.ipAllowlist} onChange={(v) => onChange({ ipAllowlist: v })} />
      </FieldRow>
      <FieldRow label="Max Login Attempts" hint="Lock a login out for 30 minutes after N failed attempts — enforced">
        <Input
          type="number"
          min={0}
          value={security.maxLoginAttempts}
          onChange={(e) => onChange({ maxLoginAttempts: Number(e.target.value) || 0 })}
          className="w-24"
        />
      </FieldRow>
      <FieldRow label="Password Policy" hint="Minimum requirements for new/changed passwords — enforced">
        <Select
          className="w-48"
          value={security.passwordPolicy}
          options={[
            { value: 'basic', label: 'Basic (8 chars)' },
            { value: 'medium', label: 'Medium (8+ mixed)' },
            { value: 'strong', label: 'Strong (12+ special)' },
          ]}
          onChange={(e) => onChange({ passwordPolicy: e.target.value as SecuritySettings['passwordPolicy'] })}
        />
      </FieldRow>
    </div>
  );
}

function APIKeysPanel() {
  const apiKeys = useSASettingsStore((s) => s.settings.apiKeys);
  const rotateApiKey = useSASettingsStore((s) => s.rotateApiKey);
  const generateApiKey = useSASettingsStore((s) => s.generateApiKey);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  return (
    <div className="space-y-4">
      {apiKeys.map((k) => (
        <div key={k.id} className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{k.name}</p>
            <p className="text-xs font-mono text-slate-400 mt-1 truncate">{k.key}</p>
            <p className="text-xs text-slate-400 mt-1">Created {k.createdAt} · Last used {k.lastUsed}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => handleCopy(k.key)}>Copy</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                rotateApiKey(k.id);
                toast.success('API key rotated');
              }}
            >
              Rotate
            </Button>
          </div>
        </div>
      ))}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            generateApiKey();
            toast.success('New API key generated');
          }}
        >
          <Key className="h-3.5 w-3.5" />
          Generate New Key
        </Button>
      </div>
    </div>
  );
}

// ─── Panel Map ────────────────────────────────────────────────────────────────
// Theme/Languages/Email/SMS/Backup/API Keys aren't wired to a backend yet
// (see the plan doc) — those panels keep applying changes live to the local
// mock store, same as before General/Security became real.

const MOCK_PANEL_MAP: Partial<Record<SectionId, React.ReactNode>> = {
  theme:     <ThemePanel />,
  languages: <LanguagesPanel />,
  email:     <EmailPanel />,
  sms:       <SMSPanel />,
  backup:    <BackupPanel />,
  api:       <APIKeysPanel />,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SystemSettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const active = SECTIONS.find((s) => s.id === activeSection)!;
  const ActiveIcon = active.icon;

  const { data: platformSettings, isLoading, isError, error } = usePlatformSettingsQuery();
  const updateMutation = useUpdatePlatformSettingsMutation();

  // Local buffers, not a live-write-per-keystroke — General/Security only
  // hit the network on "Save Changes" now that they're a real API, unlike
  // the still-mock panels' instant local-store writes. Seeded from the
  // server exactly once (a `seededRef` guard, not a `[platformSettings]`
  // effect dependency) — these are platform-wide singletons, not a form
  // that needs re-seeding when switching between different records, so
  // resyncing on every refetch (a background window-refocus refetch, or
  // the OTHER panel's own save invalidating this shared query) would
  // silently clobber whichever panel currently has unsaved edits.
  const [generalForm, setGeneralForm] = useState<GeneralSettings | null>(null);
  const [securityForm, setSecurityForm] = useState<SecuritySettings | null>(null);
  const seededRef = useRef(false);
  useEffect(() => {
    if (platformSettings && !seededRef.current) {
      setGeneralForm(platformSettings.general);
      setSecurityForm(platformSettings.security);
      seededRef.current = true;
    }
  }, [platformSettings]);

  async function handleSave() {
    const isWiredSection = activeSection === 'general' || activeSection === 'security';
    if (!isWiredSection) {
      // Mock panels already applied their edits live — this is just a
      // confirmation toast, same as before.
      toast.success('Settings saved');
      return;
    }
    const formToSave = activeSection === 'general' ? generalForm : securityForm;
    if (!formToSave) {
      // Settings haven't loaded yet (or failed to) — nothing to save, and
      // the button is disabled in this state anyway; this is just a
      // backstop against a stray click racing the initial load.
      toast.error('Settings are still loading — try again in a moment.');
      return;
    }
    try {
      if (activeSection === 'general') {
        await updateMutation.mutateAsync({ general: formToSave as GeneralSettings });
      } else {
        await updateMutation.mutateAsync({ security: formToSave as SecuritySettings });
      }
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  function renderActivePanel() {
    if (activeSection === 'general') {
      if (isError) return <SettingsLoadError error={error} />;
      if (!generalForm) return <SettingsLoadingState />;
      return <GeneralPanel general={generalForm} onChange={(patch) => setGeneralForm((f) => f && { ...f, ...patch })} />;
    }
    if (activeSection === 'security') {
      if (isError) return <SettingsLoadError error={error} />;
      if (!securityForm) return <SettingsLoadingState />;
      return <SecurityPanel security={securityForm} onChange={(patch) => setSecurityForm((f) => f && { ...f, ...patch })} />;
    }
    return MOCK_PANEL_MAP[activeSection];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Configure platform-wide settings and integrations"
        actions={
          <Button
            onClick={handleSave}
            loading={updateMutation.isPending}
            disabled={
              // generalForm/securityForm are seeded together (see seededRef
              // above) — either being null means neither has loaded yet.
              (activeSection === 'general' || activeSection === 'security') && (isLoading || !generalForm)
            }
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar Nav ─────────────────────────────────────────────────── */}
        <Card className="lg:col-span-1 h-fit">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as SectionId)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  activeSection === id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    activeSection === id ? 'text-indigo-600' : 'text-slate-400'
                  )}
                />
                <span>{label}</span>
                {activeSection === id && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-indigo-400" />
                )}
              </button>
            ))}
          </nav>
        </Card>

        {/* ── Content Panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-50">
                <ActiveIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{active.label}</h3>
                <p className="text-xs text-slate-400">{active.desc}</p>
              </div>
            </div>
            {renderActivePanel()}
          </Card>
        </div>
      </div>
    </div>
  );
}

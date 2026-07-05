'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
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

// ─── Section Panels ───────────────────────────────────────────────────────────

function GeneralPanel() {
  const [name, setName] = useState('EduCore');
  const [tagline, setTagline] = useState('The All-in-One LMS Platform');

  return (
    <div className="space-y-0">
      <FieldRow label="Platform Name" hint="Displayed across the entire application">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="w-64" />
      </FieldRow>
      <FieldRow label="Tagline" hint="Short description shown on the login page">
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-64" />
      </FieldRow>
      <FieldRow label="Logo" hint="Recommended size: 256×64px, PNG or SVG">
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
            No file
          </div>
          <Button variant="outline" size="sm">Upload</Button>
        </div>
      </FieldRow>
      <FieldRow label="Favicon" hint="16×16 or 32×32 ICO file">
        <Button variant="outline" size="sm">Upload</Button>
      </FieldRow>
      <FieldRow label="Support Email" hint="Contact email shown to users">
        <Input type="email" defaultValue="support@educore.com" className="w-64" />
      </FieldRow>
    </div>
  );
}

function ThemePanel() {
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div className="space-y-0">
      <FieldRow label="Dark Mode" hint="Enable dark theme for all users">
        <Toggle checked={darkMode} onChange={setDarkMode} />
      </FieldRow>
      <FieldRow label="Compact Sidebar" hint="Collapse sidebar by default">
        <Toggle checked={compactMode} onChange={setCompactMode} />
      </FieldRow>
      <FieldRow label="Primary Color" hint="Used for buttons, links and accents">
        <div className="flex items-center gap-2">
          <input type="color" defaultValue="#6366f1" className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200" />
          <Input defaultValue="#6366f1" className="w-28 font-mono text-sm" />
        </div>
      </FieldRow>
      <FieldRow label="Font Family" hint="Typography used across the platform">
        <Select
          className="w-48"
          defaultValue="inter"
          options={[
            { value: 'inter', label: 'Inter (Default)' },
            { value: 'roboto', label: 'Roboto' },
            { value: 'outfit', label: 'Outfit' },
            { value: 'system', label: 'System Default' },
          ]}
          onChange={() => {}}
        />
      </FieldRow>
    </div>
  );
}

function LanguagesPanel() {
  const LANGS = [
    { code: 'en', label: 'English', flag: '🇺🇸', enabled: true, default: true },
    { code: 'uz', label: 'Uzbek',   flag: '🇺🇿', enabled: true, default: false },
    { code: 'ru', label: 'Russian', flag: '🇷🇺', enabled: true, default: false },
    { code: 'ar', label: 'Arabic',  flag: '🇸🇦', enabled: false, default: false },
    { code: 'es', label: 'Spanish', flag: '🇪🇸', enabled: false, default: false },
  ];

  return (
    <div className="space-y-0">
      {LANGS.map((lang) => (
        <FieldRow key={lang.code} label={`${lang.flag} ${lang.label}`} hint={lang.default ? 'Default language' : undefined}>
          <div className="flex items-center gap-3">
            {lang.default && (
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">Default</span>
            )}
            <Toggle checked={lang.enabled} onChange={() => {}} />
          </div>
        </FieldRow>
      ))}
    </div>
  );
}

function EmailPanel() {
  return (
    <div className="space-y-0">
      <FieldRow label="SMTP Host" hint="Your email server host">
        <Input defaultValue="smtp.mailgun.org" className="w-64" />
      </FieldRow>
      <FieldRow label="SMTP Port" hint="">
        <Input type="number" defaultValue="587" className="w-32" />
      </FieldRow>
      <FieldRow label="Username" hint="">
        <Input defaultValue="postmaster@educore.com" className="w-64" />
      </FieldRow>
      <FieldRow label="Password" hint="">
        <Input type="password" defaultValue="••••••••••" className="w-64" />
      </FieldRow>
      <FieldRow label="From Name" hint="Sender name shown in inbox">
        <Input defaultValue="EduCore Platform" className="w-64" />
      </FieldRow>
      <FieldRow label="Enable TLS" hint="Secure connection">
        <Toggle checked={true} onChange={() => {}} />
      </FieldRow>
    </div>
  );
}

function SMSPanel() {
  return (
    <div className="space-y-0">
      <FieldRow label="SMS Provider" hint="">
        <Select
          className="w-48"
          defaultValue="twilio"
          options={[
            { value: 'twilio', label: 'Twilio' },
            { value: 'nexmo', label: 'Nexmo / Vonage' },
            { value: 'aws-sns', label: 'AWS SNS' },
            { value: 'custom', label: 'Custom' },
          ]}
          onChange={() => {}}
        />
      </FieldRow>
      <FieldRow label="Account SID" hint="">
        <Input defaultValue="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="w-64 font-mono text-xs" />
      </FieldRow>
      <FieldRow label="Auth Token" hint="">
        <Input type="password" defaultValue="••••••••••" className="w-64" />
      </FieldRow>
      <FieldRow label="From Number" hint="Your Twilio phone number">
        <Input defaultValue="+1 555-000-0001" className="w-64" />
      </FieldRow>
      <FieldRow label="Enable SMS" hint="Send SMS notifications to users">
        <Toggle checked={true} onChange={() => {}} />
      </FieldRow>
    </div>
  );
}

function BackupPanel() {
  return (
    <div className="space-y-0">
      <FieldRow label="Auto Backup" hint="Automatically backup data on a schedule">
        <Toggle checked={true} onChange={() => {}} />
      </FieldRow>
      <FieldRow label="Backup Frequency" hint="">
        <Select
          className="w-48"
          defaultValue="daily"
          options={[
            { value: 'hourly', label: 'Every Hour' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
          ]}
          onChange={() => {}}
        />
      </FieldRow>
      <FieldRow label="Backup Retention" hint="How long to keep backups">
        <Select
          className="w-48"
          defaultValue="30d"
          options={[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
          ]}
          onChange={() => {}}
        />
      </FieldRow>
      <FieldRow label="Last Backup" hint="">
        <span className="text-sm text-emerald-600 font-medium">Jul 4, 2026 at 03:00 UTC ✓</span>
      </FieldRow>
      <FieldRow label="Manual Backup" hint="Trigger an immediate backup now">
        <Button variant="outline" size="sm">
          <Database className="h-3.5 w-3.5" />
          Run Backup
        </Button>
      </FieldRow>
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="space-y-0">
      <FieldRow label="Two-Factor Authentication" hint="Require 2FA for all admins">
        <Toggle checked={true} onChange={() => {}} />
      </FieldRow>
      <FieldRow label="Session Timeout" hint="Auto-logout after inactivity">
        <Select
          className="w-48"
          defaultValue="60"
          options={[
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
            { value: '480', label: '8 hours' },
          ]}
          onChange={() => {}}
        />
      </FieldRow>
      <FieldRow label="IP Allowlist" hint="Restrict admin access to specific IPs">
        <Toggle checked={false} onChange={() => {}} />
      </FieldRow>
      <FieldRow label="Max Login Attempts" hint="Lock account after N failed attempts">
        <Input type="number" defaultValue="5" className="w-24" />
      </FieldRow>
      <FieldRow label="Password Policy" hint="Minimum requirements for passwords">
        <Select
          className="w-48"
          defaultValue="strong"
          options={[
            { value: 'basic', label: 'Basic (8 chars)' },
            { value: 'medium', label: 'Medium (8+ mixed)' },
            { value: 'strong', label: 'Strong (12+ special)' },
          ]}
          onChange={() => {}}
        />
      </FieldRow>
    </div>
  );
}

function APIKeysPanel() {
  const KEYS = [
    { name: 'Production API Key', key: 'ek_live_••••••••••••••••••••••••••••••••', created: 'Jan 1, 2026', last: 'Jul 4, 2026' },
    { name: 'Webhook Secret',     key: 'whsec_••••••••••••••••••••••••••••••••', created: 'Jan 1, 2026', last: 'Jul 3, 2026' },
    { name: 'Sandbox API Key',    key: 'ek_test_••••••••••••••••••••••••••••••••', created: 'Mar 10, 2026', last: 'Jun 28, 2026' },
  ];

  return (
    <div className="space-y-4">
      {KEYS.map((k) => (
        <div key={k.name} className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{k.name}</p>
            <p className="text-xs font-mono text-slate-400 mt-1 truncate">{k.key}</p>
            <p className="text-xs text-slate-400 mt-1">Created {k.created} · Last used {k.last}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm">Copy</Button>
            <Button variant="ghost" size="sm">Rotate</Button>
          </div>
        </div>
      ))}
      <div className="pt-2">
        <Button variant="outline" size="sm">
          <Key className="h-3.5 w-3.5" />
          Generate New Key
        </Button>
      </div>
    </div>
  );
}

// ─── Panel Map ────────────────────────────────────────────────────────────────

const PANEL_MAP: Record<SectionId, React.ReactNode> = {
  general:   <GeneralPanel />,
  theme:     <ThemePanel />,
  languages: <LanguagesPanel />,
  email:     <EmailPanel />,
  sms:       <SMSPanel />,
  backup:    <BackupPanel />,
  security:  <SecurityPanel />,
  api:       <APIKeysPanel />,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SystemSettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const active = SECTIONS.find((s) => s.id === activeSection)!;
  const ActiveIcon = active.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Configure platform-wide settings and integrations"
        actions={
          <Button>
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
            {PANEL_MAP[activeSection]}
          </Card>
        </div>
      </div>
    </div>
  );
}

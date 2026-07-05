'use client';

import { useState } from 'react';
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Save,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEACHER_PROFILE } from '@/lib/teacher-data';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'account' | 'security' | 'notifications' | 'appearance' | 'language';

const SETTINGS_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
];

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
        enabled ? 'bg-indigo-600' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          enabled ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ─── Label wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherSettingsPage() {
  const p = TEACHER_PROFILE;

  // Active tab
  const [activeTab, setActiveTab] = useState<TabId>('account');

  // Account form
  const [account, setAccount] = useState({
    name: p.name,
    email: p.email,
    phone: p.phone,
    bio: p.bio,
    subject: p.subject,
  });

  // Security form
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Notifications
  const [notifToggles, setNotifToggles] = useState({
    emailNotifications: true,
    smsAlerts: false,
    assignmentReminders: true,
    examReminders: true,
    messageAlerts: true,
    adminAnnouncements: true,
  });

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [accent, setAccent] = useState('#6366f1');

  // Language
  const [langSettings, setLangSettings] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
  });

  const ACCENT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const THEME_OPTIONS: { id: 'light' | 'dark' | 'system'; label: string; Icon: React.ElementType }[] = [
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'system', label: 'System', Icon: Monitor },
  ];

  function toggleNotif(key: keyof typeof notifToggles) {
    setNotifToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Nav Sidebar */}
        <div className="lg:col-span-1">
          <Card noPadding>
            <nav className="py-2">
              {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left',
                    activeTab === id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      activeTab === id ? 'text-indigo-600' : 'text-slate-400'
                    )}
                  />
                  <span className="flex-1">{label}</span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 opacity-0 transition-opacity',
                      activeTab === id && 'opacity-100 text-indigo-400'
                    )}
                  />
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Account ── */}
          {activeTab === 'account' && (
            <Card title="Account Settings" subtitle="Update your personal information">
              <div className="space-y-4">
                <div className="flex items-center gap-5 pb-4 border-b border-slate-50">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                    SC
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <Input
                      value={account.name}
                      onChange={(e) => setAccount({ ...account, name: e.target.value })}
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={account.email}
                      onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={account.phone}
                      onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Subject">
                    <Input
                      value={account.subject}
                      onChange={(e) => setAccount({ ...account, subject: e.target.value })}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Bio">
                      <textarea
                        className="w-full min-h-[96px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        value={account.bio}
                        onChange={(e) => setAccount({ ...account, bio: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <>
              <Card title="Change Password" subtitle="Update your password to keep your account secure">
                <div className="space-y-4">
                  <Field label="Current Password">
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    />
                  </Field>
                  <Field label="New Password">
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={passwords.next}
                      onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                    />
                  </Field>
                  <Field label="Confirm New Password">
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    />
                  </Field>
                  <div className="flex justify-end pt-2">
                    <Button>
                      <Lock className="h-4 w-4" />
                      Update Password
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {twoFAEnabled ? '2FA is Enabled' : '2FA is Disabled'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {twoFAEnabled
                        ? 'Your account is protected with two-factor authentication.'
                        : 'Enable 2FA to secure your account with a one-time code.'}
                    </p>
                  </div>
                  <ToggleSwitch enabled={twoFAEnabled} onChange={() => setTwoFAEnabled(!twoFAEnabled)} />
                </div>
              </Card>
            </>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <Card title="Notification Preferences" subtitle="Choose how you want to be notified">
              <div className="divide-y divide-slate-50">
                {(
                  [
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email' },
                    { key: 'smsAlerts', label: 'SMS Alerts', description: 'Get urgent alerts as text messages' },
                    { key: 'assignmentReminders', label: 'Assignment Reminders', description: 'Reminders before assignment due dates' },
                    { key: 'examReminders', label: 'Exam Reminders', description: 'Notifications about upcoming exams' },
                    { key: 'messageAlerts', label: 'Message Alerts', description: 'Alerts for new messages from students and parents' },
                    { key: 'adminAnnouncements', label: 'Admin Announcements', description: 'Important announcements from administration' },
                  ] as { key: keyof typeof notifToggles; label: string; description: string }[]
                ).map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                    <ToggleSwitch
                      enabled={notifToggles[key]}
                      onChange={() => toggleNotif(key)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Appearance ── */}
          {activeTab === 'appearance' && (
            <Card title="Appearance" subtitle="Customize the look and feel of your dashboard">
              <div className="space-y-6">
                {/* Theme selector */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {THEME_OPTIONS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={cn(
                          'flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all',
                          theme === id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color picker */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Accent Color</p>
                  <div className="flex gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccent(color)}
                        className={cn(
                          'h-9 w-9 rounded-full transition-transform hover:scale-110',
                          accent === color && 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Language ── */}
          {activeTab === 'language' && (
            <Card title="Language & Region" subtitle="Set your preferred language and regional settings">
              <div className="space-y-4">
                <Field label="Language">
                  <select
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    value={langSettings.language}
                    onChange={(e) => setLangSettings({ ...langSettings, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese (Simplified)</option>
                  </select>
                </Field>

                <Field label="Timezone">
                  <select
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    value={langSettings.timezone}
                    onChange={(e) => setLangSettings({ ...langSettings, timezone: e.target.value })}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Karachi">Karachi (PKT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </Field>

                <Field label="Date Format">
                  <select
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    value={langSettings.dateFormat}
                    onChange={(e) => setLangSettings({ ...langSettings, dateFormat: e.target.value })}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD MMM YYYY">DD MMM YYYY</option>
                    <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                  </select>
                </Field>

                <div className="flex justify-end pt-2">
                  <Button>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

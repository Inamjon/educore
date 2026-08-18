'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { STUDENT_PROFILE } from '@/lib/student-data';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'account' | 'security' | 'notifications' | 'appearance' | 'language';

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentSettingsPage() {
  const t = useTranslations('StudentSettings');
  const tc = useTranslations('Common');
  const p = STUDENT_PROFILE;

  const SETTINGS_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'account', label: t('tabAccount'), icon: User },
    { id: 'security', label: t('tabSecurity'), icon: Lock },
    { id: 'notifications', label: t('tabNotifications'), icon: Bell },
    { id: 'appearance', label: t('tabAppearance'), icon: Palette },
    { id: 'language', label: t('tabLanguage'), icon: Globe },
  ];

  const [activeTab, setActiveTab] = useState<TabId>('account');

  const [account, setAccount] = useState({
    name: p.name,
    phone: p.phone,
    bio: p.bio,
  });

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const [notifToggles, setNotifToggles] = useState({
    emailNotifications: true,
    smsAlerts: false,
    homeworkReminders: true,
    examReminders: true,
    messageAlerts: true,
    adminAnnouncements: true,
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [accent, setAccent] = useState('#6366f1');

  const [regionSettings, setRegionSettings] = useState({
    timezone: 'Asia/Tashkent',
    dateFormat: 'MM/DD/YYYY',
  });

  const ACCENT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const THEME_OPTIONS: { id: 'light' | 'dark' | 'system'; label: string; Icon: React.ElementType }[] = [
    { id: 'light', label: t('themeLight'), Icon: Sun },
    { id: 'dark', label: t('themeDark'), Icon: Moon },
    { id: 'system', label: t('themeSystem'), Icon: Monitor },
  ];

  function toggleNotif(key: keyof typeof notifToggles) {
    setNotifToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

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
                    activeTab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4', activeTab === id ? 'text-indigo-600' : 'text-slate-400')} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className={cn('h-4 w-4 opacity-0 transition-opacity', activeTab === id && 'opacity-100 text-indigo-400')} />
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Account */}
          {activeTab === 'account' && (
            <Card title={t('accountTitle')} subtitle={t('accountSubtitle')}>
              <div className="space-y-4">
                <div className="flex items-center gap-5 pb-4 border-b border-slate-50">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                    AJ
                  </div>
                  <div>
                    <Button variant="outline" size="sm">{t('changePhoto')}</Button>
                    <p className="text-xs text-slate-400 mt-1">{t('photoHint')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('fullName')}>
                    <Input value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
                  </Field>
                  <Field label={t('loginId')}>
                    <Input value={p.loginId} disabled />
                  </Field>
                  <Field label={t('phone')}>
                    <Input value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
                  </Field>
                  <Field label={t('gradeLevel')}>
                    <Input value={p.grade} disabled />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={t('bio')}>
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
                    {tc('saveChanges')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <>
              <Card title={t('changePasswordTitle')} subtitle={t('changePasswordSubtitle')}>
                <div className="space-y-4">
                  <Field label={t('currentPassword')}>
                    <Input
                      type="password"
                      placeholder={t('currentPasswordPlaceholder')}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    />
                  </Field>
                  <Field label={t('newPassword')}>
                    <Input
                      type="password"
                      placeholder={t('newPasswordPlaceholder')}
                      value={passwords.next}
                      onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                    />
                  </Field>
                  <Field label={t('confirmNewPassword')}>
                    <Input
                      type="password"
                      placeholder={t('confirmNewPasswordPlaceholder')}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    />
                  </Field>
                  <div className="flex justify-end pt-2">
                    <Button>
                      <Lock className="h-4 w-4" />
                      {t('updatePassword')}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title={t('twoFactorTitle')} subtitle={t('twoFactorSubtitle')}>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{twoFAEnabled ? t('twoFactorEnabled') : t('twoFactorDisabled')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {twoFAEnabled ? t('twoFactorEnabledHint') : t('twoFactorDisabledHint')}
                    </p>
                  </div>
                  <ToggleSwitch enabled={twoFAEnabled} onChange={() => setTwoFAEnabled(!twoFAEnabled)} />
                </div>
              </Card>
            </>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card title={t('notificationsTitle')} subtitle={t('notificationsSubtitle')}>
              <div className="divide-y divide-slate-50">
                {(
                  [
                    { key: 'emailNotifications', label: t('emailNotifications'), description: t('emailNotificationsHint') },
                    { key: 'smsAlerts', label: t('smsAlerts'), description: t('smsAlertsHint') },
                    { key: 'homeworkReminders', label: t('homeworkReminders'), description: t('homeworkRemindersHint') },
                    { key: 'examReminders', label: t('examReminders'), description: t('examRemindersHint') },
                    { key: 'messageAlerts', label: t('messageAlerts'), description: t('messageAlertsHint') },
                    { key: 'adminAnnouncements', label: t('adminAnnouncements'), description: t('adminAnnouncementsHint') },
                  ] as { key: keyof typeof notifToggles; label: string; description: string }[]
                ).map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                    <ToggleSwitch enabled={notifToggles[key]} onChange={() => toggleNotif(key)} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <Card title={t('appearanceTitle')} subtitle={t('appearanceSubtitle')}>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">{t('theme')}</p>
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

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">{t('accentColor')}</p>
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
                    {t('savePreferences')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Language */}
          {activeTab === 'language' && (
            <Card title={t('languageRegionTitle')} subtitle={t('languageRegionSubtitle')}>
              <div className="space-y-4">
                <Field label={t('interfaceLanguage')}>
                  {/* Real, not mock — this is the ONLY place the interface
                      language can be changed (see the login page's own
                      comment on this). Applies immediately, no Save needed. */}
                  <LanguageSwitcher variant="full" className="w-full [&>select]:w-full" />
                </Field>

                <Field label={t('timezone')}>
                  <select
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    value={regionSettings.timezone}
                    onChange={(e) => setRegionSettings({ ...regionSettings, timezone: e.target.value })}
                  >
                    <option value="Asia/Tashkent">{t('timezoneTashkentUZT')}</option>
                    <option value="Asia/Almaty">{t('timezoneAlmatyALMT')}</option>
                    <option value="Europe/Moscow">{t('timezoneMoscowMSK')}</option>
                    <option value="America/New_York">{t('timezoneEasternET')}</option>
                  </select>
                </Field>

                <Field label={t('dateFormat')}>
                  <select
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    value={regionSettings.dateFormat}
                    onChange={(e) => setRegionSettings({ ...regionSettings, dateFormat: e.target.value })}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </Field>

                <div className="flex justify-end pt-2">
                  <Button>
                    <Save className="h-4 w-4" />
                    {t('saveSettings')}
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

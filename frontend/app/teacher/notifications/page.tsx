'use client';

import { useState } from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bell,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useNotificationsQuery, useMarkNotificationReadMutation } from '@/lib/queries/notifications';
import type { NotificationType } from '@/lib/api/notifications';
import { cn } from '@/lib/utils';
import { formatLocalizedDate } from '@/i18n/date-locale';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

type NotificationCategory = 'all' | 'class' | 'assignment' | 'exam' | 'message' | 'admin';

const TYPE_CONFIG: Record<
  NotificationType,
  { bg: string; iconBg: string; iconColor: string; Icon: React.ElementType }
> = {
  info: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    Icon: Info,
  },
  success: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: XCircle,
  },
};

// t is TeacherNotifications's useTranslations return value.
function formatTime(isoString: string, locale: Locale, t: ReturnType<typeof useTranslations<'TeacherNotifications'>>): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return t('minutesAgo', { count: diffMin });
  if (diffHr < 24) return t('hoursAgo', { count: diffHr });
  if (diffDay < 7) return t('daysAgo', { count: diffDay });
  return formatLocalizedDate(date, locale, { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const t = useTranslations('TeacherNotifications');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const FILTER_TABS: { id: NotificationCategory; label: string }[] = [
    { id: 'all', label: t('tabAll') },
    { id: 'class', label: t('tabClasses') },
    { id: 'assignment', label: t('tabAssignments') },
    { id: 'exam', label: t('tabExams') },
    { id: 'message', label: t('tabMessages') },
    { id: 'admin', label: t('tabAdmin') },
  ];

  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const { data: notifications = [] } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();

  const filtered = notifications.filter(
    (n) => activeTab === 'all' || n.category === activeTab
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markRead(id: string) {
    markReadMutation.mutate({ id, read: true });
  }

  function markAllRead() {
    notifications.filter((n) => !n.read).forEach((n) => markReadMutation.mutate({ id: n.id, read: true }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageTitle')}
        subtitle={
          unreadCount > 0
            ? t('unreadSubtitle', { count: unreadCount })
            : t('allCaughtUpSubtitle')
        }
        actions={
          <Button variant="ghost" onClick={markAllRead} disabled={unreadCount === 0}>
            {t('markAllRead')}
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 overflow-x-auto pb-px">
        {FILTER_TABS.map((tab) => {
          const tabCount =
            tab.id === 'all'
              ? notifications.filter((n) => !n.read).length
              : notifications.filter((n) => n.category === tab.id && !n.read).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
              )}
            >
              {tab.label}
              {tabCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  {tabCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const config = TYPE_CONFIG[notification.type];
            const Icon = config.Icon;

            return (
              <div
                key={notification.id}
                onClick={() => markRead(notification.id)}
                className={cn(
                  'flex gap-3 rounded-xl border border-slate-100 p-4 cursor-pointer transition-colors hover:border-slate-200',
                  notification.read ? 'bg-white' : 'bg-indigo-50/30'
                )}
              >
                {/* Icon circle */}
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                    config.iconBg
                  )}
                >
                  <Icon className={cn('h-5 w-5', config.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm text-slate-900',
                      !notification.read ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {formatTime(notification.created_at, locale, t)}
                  </p>
                </div>

                {/* Unread dot */}
                <div className="flex-shrink-0 flex items-start pt-1">
                  {!notification.read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Bell className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">{t('noNotificationsHere')}</p>
          <p className="text-xs mt-1">{t('checkBackLater')}</p>
        </div>
      )}
    </div>
  );
}

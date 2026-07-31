'use client';

import { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  CreditCard,
  GitBranch,
  ShieldAlert,
  CheckCheck,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { NotificationType, NotificationCategory } from '@/lib/super-admin-data';
import {
  useSANotificationsStore,
  markAllSANotificationsRead,
  markSANotificationRead,
  type SANotification,
} from '@/lib/store/sa-notifications-store';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string) {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

// ─── Type Icon & Style ────────────────────────────────────────────────────────

function typeConfig(type: NotificationType) {
  return {
    success: { Icon: CheckCircle2, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-100' },
    warning: { Icon: AlertTriangle, iconClass: 'text-amber-600', bgClass: 'bg-amber-50', borderClass: 'border-amber-100' },
    error:   { Icon: XCircle,       iconClass: 'text-red-600',    bgClass: 'bg-red-50',    borderClass: 'border-red-100' },
    info:    { Icon: Info,           iconClass: 'text-blue-600',   bgClass: 'bg-blue-50',   borderClass: 'border-blue-100' },
  }[type];
}

// ─── Category Icon ────────────────────────────────────────────────────────────

function categoryIcon(category: NotificationCategory) {
  const map: Record<NotificationCategory, React.ReactNode> = {
    system:       <ShieldAlert className="h-3 w-3" />,
    payment:      <CreditCard className="h-3 w-3" />,
    branch:       <GitBranch className="h-3 w-3" />,
    subscription: <Bell className="h-3 w-3" />,
  };
  return map[category];
}

function categoryLabel(category: NotificationCategory) {
  return {
    system: 'System',
    payment: 'Payment',
    branch: 'Branch',
    subscription: 'Subscription',
  }[category];
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ notif, onMarkRead }: { notif: SANotification; onMarkRead: (id: string) => void }) {
  const cfg = typeConfig(notif.type);
  const { Icon, iconClass, bgClass, borderClass } = cfg;

  return (
    <div
      className={cn(
        'flex items-start gap-4 px-6 py-4 border-b border-slate-50 transition-colors',
        !notif.read ? 'bg-indigo-50/30' : 'bg-white',
        'hover:bg-slate-50/60'
      )}
    >
      {/* Icon */}
      <div className={`mt-0.5 flex-shrink-0 h-9 w-9 rounded-xl ${bgClass} border ${borderClass} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('text-sm font-semibold', !notif.read ? 'text-slate-900' : 'text-slate-700')}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            {categoryIcon(notif.category)}
            {categoryLabel(notif.category)}
          </span>
          <span className="text-xs text-slate-400">{formatRelativeTime(notif.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      {!notif.read && (
        <button
          onClick={() => onMarkRead(notif.id)}
          className="flex-shrink-0 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
          title="Mark as read"
        >
          Mark read
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const notifications = useSANotificationsStore((s) => s.items);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRead, setFilterRead] = useState('');

  const unread = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchCat = !filterCategory || n.category === filterCategory;
      const matchRead =
        !filterRead ||
        (filterRead === 'unread' && !n.read) ||
        (filterRead === 'read' && n.read);
      return matchCat && matchRead;
    });
  }, [notifications, filterCategory, filterRead]);

  const handleMarkRead = (id: string) => {
    markSANotificationRead(id);
  };

  const handleMarkAllRead = () => {
    markAllSANotificationsRead();
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notification${unread !== 1 ? 's' : ''}`}
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          ) : null
        }
      />

      {/* ── Summary Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            { cat: 'system', label: 'System Alerts', Icon: ShieldAlert, color: 'text-violet-600', bg: 'bg-violet-50' },
            { cat: 'payment', label: 'Payments', Icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { cat: 'branch', label: 'Branches', Icon: GitBranch, color: 'text-blue-600', bg: 'bg-blue-50' },
            { cat: 'subscription', label: 'Subscriptions', Icon: Bell, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ] as const
        ).map(({ cat, label, Icon, color, bg }) => {
          const count = notifications.filter((n) => n.category === cat).length;
          const unreadCat = notifications.filter((n) => n.category === cat && !n.read).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
              className={cn(
                'bg-white rounded-2xl p-5 shadow-sm border text-left transition-all',
                filterCategory === cat ? 'border-indigo-200 ring-2 ring-indigo-100' : 'border-slate-100 hover:border-slate-200'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                {unreadCat > 0 && (
                  <span className="ml-auto h-5 min-w-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCat}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Notifications List ─────────────────────────────────────────────────── */}
      <Card noPadding>
        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
          <Bell className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">All Notifications</span>
          <div className="flex items-center gap-2 ml-auto">
            <Select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
              ]}
            />
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                { value: 'system', label: 'System' },
                { value: 'payment', label: 'Payment' },
                { value: 'branch', label: 'Branch' },
                { value: 'subscription', label: 'Subscription' },
              ]}
            />
            {(filterCategory || filterRead) && (
              <button
                onClick={() => { setFilterCategory(''); setFilterRead(''); }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400">{filtered.length} notifications</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No notifications</p>
          </div>
        ) : (
          <div>
            {filtered.map((notif) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

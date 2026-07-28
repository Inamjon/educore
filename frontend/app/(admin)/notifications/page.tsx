"use client";
import { useMemo, useState } from "react";
import { Bell, Info, CheckCircle2, AlertTriangle, XCircle, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useNotificationsStore, markAllRead as markAllReadAction, markRead } from "@/lib/store/notifications-store";
import { cn } from "@/lib/utils";
import type { NotificationType, Notification } from "@/types";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
];

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

function NotificationIcon({ type }: { type: NotificationType }) {
  const map = {
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
    success: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  };
  const { icon: Icon, color, bg } = map[type];
  return (
    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
      <Icon className={cn("h-5 w-5", color)} />
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-colors",
        !notification.read ? "bg-indigo-50/50 hover:bg-indigo-50" : "hover:bg-slate-50"
      )}
    >
      <NotificationIcon type={notification.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold", !notification.read ? "text-slate-900" : "text-slate-700")}>
            {notification.title}
            {!notification.read && <span className="ml-2 h-1.5 w-1.5 bg-indigo-500 rounded-full inline-block" />}
          </p>
          <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(notification.createdAt)}</span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{notification.message}</p>
      </div>
      {!notification.read && (
        <button
          onClick={() => onRead(notification.id)}
          className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          title="Mark as read"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const notificationItems = useNotificationsStore((s) => s.items);
  const notifications = useMemo(() => notificationItems.filter((n) => !n.deletedAt), [notificationItems]);
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");

  const markAsRead = (id: string) => {
    markRead(id);
  };

  const markAllRead = () => {
    markAllReadAction();
  };

  const filtered = notifications.filter((n) => {
    const matchesType = !typeFilter || n.type === typeFilter;
    const matchesRead =
      !readFilter || (readFilter === "unread" ? !n.read : n.read);
    return matchesType && matchesRead;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const groups = {
    unread: filtered.filter((n) => !n.read),
    read: filtered.filter((n) => n.read),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notifications`}
        actions={
          <div className="flex items-center gap-2">
            <Select options={TYPE_OPTIONS} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-32" />
            <Select options={FILTER_OPTIONS} value={readFilter} onChange={(e) => setReadFilter(e.target.value)} className="w-28" />
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <Check className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["info", "success", "warning", "error"] as NotificationType[]).map((type) => {
          const count = notifications.filter((n) => n.type === type).length;
          const colors = {
            info: { bg: "bg-blue-50", text: "text-blue-700", icon: Info },
            success: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
            warning: { bg: "bg-amber-50", text: "text-amber-700", icon: AlertTriangle },
            error: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
          };
          const { bg, text, icon: Icon } = colors[type];
          return (
            <div key={type} className={cn("rounded-2xl p-4 flex items-center gap-3", bg)}>
              <Icon className={cn("h-6 w-6", text)} />
              <div>
                <p className={cn("text-xl font-bold", text)}>{count}</p>
                <p className={cn("text-xs font-medium capitalize", text)}>{type}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notifications list */}
      <Card title="All Notifications" subtitle={`${filtered.length} notifications`}>
        {groups.unread.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Unread</p>
            <div className="space-y-1">
              {groups.unread.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))}
            </div>
          </div>
        )}

        {groups.read.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Earlier</p>
            <div className="space-y-1">
              {groups.read.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p>No notifications found</p>
          </div>
        )}
      </Card>
    </div>
  );
}

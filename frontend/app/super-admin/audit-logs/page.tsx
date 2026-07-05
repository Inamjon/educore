'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  Building2,
  ShieldCheck,
  Trash2,
  Settings,
  CreditCard,
  LogIn,
  TrendingUp,
  X,
  AlertTriangle,
  Info,
  AlertOctagon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { SearchInput, Select } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import { SA_AUDIT_LOGS, SAAuditLog, AuditSeverity } from '@/lib/super-admin-data';
import { cn } from '@/lib/utils';

// ─── Action Config ────────────────────────────────────────────────────────────

function actionConfig(action: string): { icon: React.ReactNode; variant: 'success' | 'danger' | 'warning' | 'purple' | 'info' | 'secondary' | 'default'; label: string } {
  const map: Record<string, { icon: React.ReactNode; variant: 'success' | 'danger' | 'warning' | 'purple' | 'info' | 'secondary' | 'default'; label: string }> = {
    CENTER_CREATED:       { icon: <Building2 className="h-3.5 w-3.5" />,   variant: 'success',   label: 'Center Created' },
    ADMIN_ADDED:          { icon: <ShieldCheck className="h-3.5 w-3.5" />, variant: 'success',   label: 'Admin Added' },
    SUBSCRIPTION_UPGRADED:{ icon: <TrendingUp className="h-3.5 w-3.5" />,  variant: 'purple',    label: 'Subscription Upgraded' },
    BRANCH_SUSPENDED:     { icon: <AlertTriangle className="h-3.5 w-3.5" />,variant: 'warning',  label: 'Branch Suspended' },
    PAYMENT_RECEIVED:     { icon: <CreditCard className="h-3.5 w-3.5" />,  variant: 'info',      label: 'Payment Received' },
    LOGIN_FAILED:         { icon: <LogIn className="h-3.5 w-3.5" />,       variant: 'danger',    label: 'Login Failed' },
    SETTINGS_UPDATED:     { icon: <Settings className="h-3.5 w-3.5" />,    variant: 'secondary', label: 'Settings Updated' },
    USER_DELETED:         { icon: <Trash2 className="h-3.5 w-3.5" />,      variant: 'danger',    label: 'User Deleted' },
  };
  return map[action] ?? { icon: <Info className="h-3.5 w-3.5" />, variant: 'default', label: action.replace(/_/g, ' ') };
}

// ─── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  const map: Record<AuditSeverity, { Icon: React.ElementType; className: string; label: string }> = {
    info:     { Icon: Info,          className: 'text-blue-600 bg-blue-50',   label: 'Info' },
    warning:  { Icon: AlertTriangle, className: 'text-amber-600 bg-amber-50', label: 'Warning' },
    critical: { Icon: AlertOctagon,  className: 'text-red-600 bg-red-50',     label: 'Critical' },
  };
  const cfg = map[severity];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium', cfg.className)}>
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Derived stats ─────────────────────────────────────────────────────────────

const totalLogs = SA_AUDIT_LOGS.length;
const criticalCount = SA_AUDIT_LOGS.filter((l) => l.severity === 'critical').length;
const warningCount  = SA_AUDIT_LOGS.filter((l) => l.severity === 'warning').length;
const infoCount     = SA_AUDIT_LOGS.filter((l) => l.severity === 'info').length;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SA_AUDIT_LOGS.filter((log) => {
      const matchSearch =
        !q ||
        log.entityName.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        log.ip.includes(q) ||
        log.action.toLowerCase().includes(q);
      const matchAction = !filterAction || log.action === filterAction;
      const matchSeverity = !filterSeverity || log.severity === filterSeverity;
      return matchSearch && matchAction && matchSeverity;
    });
  }, [search, filterAction, filterSeverity]);

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<SAAuditLog>[] = [
    {
      key: 'date',
      label: 'Date & Time',
      render: (_, row) => (
        <div className="whitespace-nowrap">
          <p className="text-sm text-slate-800 font-medium">
            {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(row.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => {
        const cfg = actionConfig(row.action);
        return (
          <Badge label={cfg.label} variant={cfg.variant} />
        );
      },
    },
    {
      key: 'entityName',
      label: 'Target',
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{row.entityName}</p>
          <p className="text-xs text-slate-400 mt-0.5">{row.entity}</p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Performed By',
      render: (_, row) => (
        <div>
          <p className="text-sm text-slate-800">{row.user}</p>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{row.ip}</p>
        </div>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (_, row) => (
        <p className="text-xs text-slate-500 max-w-[260px] leading-snug">{row.details}</p>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (_, row) => <SeverityBadge severity={row.severity} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable record of all important platform actions and events"
      />

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={totalLogs}
          icon={<ScrollText className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Info"
          value={infoCount}
          icon={<Info className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Warning"
          value={warningCount}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Critical"
          value={criticalCount}
          icon={<AlertOctagon className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <Card
        noPadding
        title="Event Log"
        subtitle={`${filtered.length} of ${totalLogs} events`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs…"
              className="w-52"
            />
            <Select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              options={[
                { value: '', label: 'All Actions' },
                { value: 'CENTER_CREATED', label: 'Center Created' },
                { value: 'ADMIN_ADDED', label: 'Admin Added' },
                { value: 'USER_DELETED', label: 'User Deleted' },
                { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
                { value: 'SUBSCRIPTION_UPGRADED', label: 'Sub Upgraded' },
                { value: 'BRANCH_SUSPENDED', label: 'Branch Suspended' },
                { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
                { value: 'LOGIN_FAILED', label: 'Login Failed' },
              ]}
            />
            <Select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              options={[
                { value: '', label: 'All Severities' },
                { value: 'info', label: 'Info' },
                { value: 'warning', label: 'Warning' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
            {(search || filterAction || filterSeverity) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterAction('');
                  setFilterSeverity('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        }
      >
        <DataTable<SAAuditLog>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="No audit logs match your filters."
        />
      </Card>
    </div>
  );
}

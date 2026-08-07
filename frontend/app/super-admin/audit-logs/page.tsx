'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  PlusCircle,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Upload,
  Eye,
  Info,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Select } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { useOrganizationsQuery } from '@/lib/queries/organizations';
import { useAuditLogsQuery } from '@/lib/queries/audit-logs';
import type { AuditLog, AuditAction } from '@/lib/api/audit-logs';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

// ─── Action Config ──────────────────────────────────────────────────────────
// Mirrors backend/foundation/models/audit_log.py::AUDIT_ACTION_CHOICES —
// every value the API can actually return, nothing invented.

const ACTION_CONFIG: Record<AuditAction, { icon: React.ReactNode; variant: 'success' | 'danger' | 'warning' | 'purple' | 'info' | 'secondary' | 'default'; label: string }> = {
  create: { icon: <PlusCircle className="h-3.5 w-3.5" />, variant: 'success', label: 'Create' },
  update: { icon: <Pencil className="h-3.5 w-3.5" />, variant: 'info', label: 'Update' },
  delete: { icon: <Trash2 className="h-3.5 w-3.5" />, variant: 'danger', label: 'Delete' },
  login: { icon: <LogIn className="h-3.5 w-3.5" />, variant: 'purple', label: 'Login' },
  logout: { icon: <LogOut className="h-3.5 w-3.5" />, variant: 'secondary', label: 'Logout' },
  export: { icon: <Download className="h-3.5 w-3.5" />, variant: 'warning', label: 'Export' },
  import: { icon: <Upload className="h-3.5 w-3.5" />, variant: 'warning', label: 'Import' },
  read: { icon: <Eye className="h-3.5 w-3.5" />, variant: 'default', label: 'Read' },
};

function ActionBadge({ action }: { action: AuditAction }) {
  const cfg = ACTION_CONFIG[action] ?? { icon: <Info className="h-3.5 w-3.5" />, variant: 'default' as const, label: action };
  return (
    <span className="inline-flex">
      <Badge label={cfg.label} variant={cfg.variant} />
    </span>
  );
}

function formatEntityType(entityType: string) {
  return entityType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Every entity_type currently written by @audited()/audit_log() call sites
// across the backend — see grep of `entity_type=` in views.py files.
const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entities' },
  ...[
    'organization', 'branch', 'user', 'invoice', 'payment', 'notification',
    'assignment', 'submission', 'lesson', 'group', 'student_profile',
    'course', 'session', 'attendance', 'teacher_profile',
  ].map((v) => ({ value: v, label: formatEntityType(v) })),
];

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  ...(Object.keys(ACTION_CONFIG) as AuditAction[]).map((a) => ({ value: a, label: ACTION_CONFIG[a].label })),
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null);

  const { data: centers } = useOrganizationsQuery();
  const { data: logs, isLoading, isError, error } = useAuditLogsQuery({
    organizationId: organizationId || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const centerOptions = [{ value: '', label: 'All Centers' }, ...(centers ?? []).map((c) => ({ value: c.id, label: c.name }))];

  const list = logs ?? [];
  const totalLogs = list.length;
  const createCount = list.filter((l) => l.action === 'create').length;
  const updateCount = list.filter((l) => l.action === 'update').length;
  const deleteCount = list.filter((l) => l.action === 'delete').length;

  const hasFilters = !!(organizationId || action || entityType || dateFrom || dateTo);

  const columns: Column<AuditLog>[] = useMemo(
    () => [
      {
        key: 'created_at',
        label: 'Date & Time',
        render: (_, row) => {
          const { date, time } = formatDateTime(row.created_at);
          return (
            <div className="whitespace-nowrap">
              <p className="text-sm text-slate-800 font-medium">{date}</p>
              <p className="text-xs text-slate-400 mt-0.5">{time}</p>
            </div>
          );
        },
      },
      {
        key: 'action',
        label: 'Action',
        render: (_, row) => <ActionBadge action={row.action} />,
      },
      {
        key: 'entity_type',
        label: 'Entity',
        render: (_, row) => (
          <div>
            <p className="text-sm font-medium text-slate-800">{formatEntityType(row.entity_type)}</p>
            {row.entity_id && <p className="text-xs text-slate-400 mt-0.5 font-mono">{row.entity_id.slice(0, 8)}…</p>}
          </div>
        ),
      },
      {
        key: 'user_name',
        label: 'Performed By',
        render: (_, row) => (
          <div>
            <p className="text-sm text-slate-800">{row.user_name ?? 'System'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{row.user_login_id ?? '—'}</p>
          </div>
        ),
      },
      {
        key: 'organization_name',
        label: 'Center',
        render: (_, row) => <span className="text-sm text-slate-600 whitespace-nowrap">{row.organization_name ?? '—'}</span>,
      },
      {
        key: 'ip_address',
        label: 'IP Address',
        render: (_, row) => <span className="text-xs text-slate-400 font-mono">{row.ip_address ?? '—'}</span>,
      },
      {
        key: 'id',
        label: 'Details',
        headerClassName: 'text-right',
        className: 'text-right',
        render: (_, row) => (
          <button
            onClick={() => setViewingLog(row)}
            className="text-slate-400 hover:text-slate-600 inline-flex items-center"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable record of authentication, payment, role-change and deletion events across the platform"
      />

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={totalLogs} icon={<ScrollText className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Created" value={createCount} icon={<PlusCircle className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Updated" value={updateCount} icon={<Pencil className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Deleted" value={deleteCount} icon={<Trash2 className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────── */}
      <Card
        noPadding
        title="Event Log"
        subtitle={`${totalLogs} events`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} options={centerOptions} />
            <Select value={action} onChange={(e) => setAction(e.target.value as AuditAction | '')} options={ACTION_OPTIONS} />
            <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} options={ENTITY_TYPE_OPTIONS} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            {hasFilters && (
              <button
                onClick={() => {
                  setOrganizationId('');
                  setAction('');
                  setEntityType('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : 'Failed to load audit logs.'}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading audit logs…
          </div>
        ) : (
          <DataTable<AuditLog> columns={columns} data={list} keyField="id" emptyMessage="No audit logs match your filters." />
        )}
      </Card>

      {/* ── Detail Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!viewingLog} onOpenChange={(open) => !open && setViewingLog(null)}>
        <DialogContent className="max-w-md">
          {viewingLog && (
            <>
              <DialogHeader>
                <DialogTitle>Event Details</DialogTitle>
              </DialogHeader>
              <DialogBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <ActionBadge action={viewingLog.action} />
                  <span className="text-sm font-medium text-slate-800">{formatEntityType(viewingLog.entity_type)}</span>
                </div>
                <DetailRow label="Performed By" value={viewingLog.user_name ?? 'System'} />
                <DetailRow label="Login ID" value={viewingLog.user_login_id ?? '—'} />
                <DetailRow label="Center" value={viewingLog.organization_name ?? '—'} />
                <DetailRow label="Entity ID" value={viewingLog.entity_id ?? '—'} mono />
                <DetailRow label="IP Address" value={viewingLog.ip_address ?? '—'} mono />
                <DetailRow label="Timestamp" value={new Date(viewingLog.created_at).toLocaleString('en-US')} />
                {viewingLog.old_values && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Old Values</p>
                    <pre className="text-xs bg-slate-50 rounded-lg p-2 overflow-x-auto text-slate-600">{JSON.stringify(viewingLog.old_values, null, 2)}</pre>
                  </div>
                )}
                {viewingLog.new_values && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">New Values</p>
                    <pre className="text-xs bg-slate-50 rounded-lg p-2 overflow-x-auto text-slate-600">{JSON.stringify(viewingLog.new_values, null, 2)}</pre>
                  </div>
                )}
                {viewingLog.metadata && Object.keys(viewingLog.metadata).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Metadata</p>
                    <pre className="text-xs bg-slate-50 rounded-lg p-2 overflow-x-auto text-slate-600">{JSON.stringify(viewingLog.metadata, null, 2)}</pre>
                  </div>
                )}
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm gap-4">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className={cn('font-medium text-slate-900 text-right truncate', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  );
}

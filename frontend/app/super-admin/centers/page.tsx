'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Ban,
  Trash2,
  Plus,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Input, SearchInput, Select } from '@/components/ui/input';
import { SA_CENTERS, SA_SUBSCRIPTIONS, SACenter, CenterStatus, SubscriptionTier } from '@/lib/super-admin-data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CenterFormData {
  name: string;
  owner: string;
  city: string;
  country: string;
  subscription: string;
  status: string;
}

const emptyForm: CenterFormData = {
  name: '',
  owner: '',
  city: '',
  country: '',
  subscription: 'basic',
  status: 'active',
};

// ─── Subscription Badge ───────────────────────────────────────────────────────

function SubscriptionBadge({ tier }: { tier: SubscriptionTier }) {
  const map: Record<SubscriptionTier, { variant: 'warning' | 'purple' | 'info'; label: string }> = {
    enterprise: { variant: 'warning', label: 'Enterprise' },
    pro: { variant: 'purple', label: 'Pro' },
    basic: { variant: 'info', label: 'Basic' },
  };
  const cfg = map[tier] ?? { variant: 'info' as const, label: tier };
  return <Badge label={cfg.label} variant={cfg.variant} />;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function CenterStatusBadge({ status }: { status: CenterStatus }) {
  const map: Record<CenterStatus, { label: string; className: string }> = {
    active:    { label: 'Active',    className: 'bg-emerald-50 text-emerald-700' },
    suspended: { label: 'Suspended', className: 'bg-red-50 text-red-600' },
    trial:     { label: 'Trial',     className: 'bg-amber-50 text-amber-700' },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-slate-50 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CentersPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CenterFormData>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSub, setFilterSub] = useState('');

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total = SA_CENTERS.length;
  const active = SA_CENTERS.filter((c) => c.status === 'active').length;
  const suspended = SA_CENTERS.filter((c) => c.status === 'suspended').length;
  const trial = SA_CENTERS.filter((c) => c.status === 'trial').length;

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return SA_CENTERS.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);
      const matchStatus = !filterStatus || c.status === filterStatus;
      const matchSub = !filterSub || c.subscription === filterSub;
      return matchSearch && matchStatus && matchSub;
    });
  }, [search, filterStatus, filterSub]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleFormChange = (field: keyof CenterFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<SACenter>[] = [
    {
      key: 'name',
      label: 'Center',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{row.city}, {row.country}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.owner} size="sm" />
          <span className="text-slate-700">{row.owner}</span>
        </div>
      ),
    },
    {
      key: 'branchCount',
      label: 'Branches',
      render: (_, row) => (
        <span className="font-semibold text-slate-900">{row.branchCount}</span>
      ),
    },
    {
      key: 'studentCount',
      label: 'Students',
      render: (_, row) => (
        <span className="font-medium text-slate-800">{row.studentCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'teacherCount',
      label: 'Teachers',
      render: (_, row) => (
        <span className="font-medium text-slate-800">{row.teacherCount}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <CenterStatusBadge status={row.status} />,
    },
    {
      key: 'subscription',
      label: 'Subscription',
      render: (_, row) => <SubscriptionBadge tier={row.subscription} />,
    },
    {
      key: 'id',
      label: 'Actions',
      render: () => (
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Suspend"
          >
            <Ban className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const subscriptionOptions = SA_SUBSCRIPTIONS.map((s) => ({
    value: s.name.toLowerCase(),
    label: s.name,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Educational Centers"
        subtitle="Manage all registered educational centers on the platform"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Create Center
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Centers"
          value={total}
          icon={<Building2 className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Active"
          value={active}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Trial"
          value={trial}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Suspended"
          value={suspended}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* Create Center Form */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Create New Educational Center</h3>
            <button
              onClick={handleCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Center Name</label>
              <Input
                placeholder="e.g. Bright Future Academy"
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Owner Name</label>
              <Input
                placeholder="Full name"
                value={form.owner}
                onChange={(e) => handleFormChange('owner', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">City</label>
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => handleFormChange('city', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Country</label>
              <Input
                placeholder="Country"
                value={form.country}
                onChange={(e) => handleFormChange('country', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Subscription Plan</label>
              <Select
                className="w-full"
                value={form.subscription}
                options={[
                  { value: 'basic', label: 'Basic' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
                onChange={(e) => handleFormChange('subscription', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Status</label>
              <Select
                className="w-full"
                value={form.status}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'trial', label: 'Trial' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                onChange={(e) => handleFormChange('status', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4" />
              Create Center
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card noPadding>
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-50">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search centers..."
          />
          <Select
            value={filterStatus}
            placeholder="All Statuses"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'trial', label: 'Trial' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
          <Select
            value={filterSub}
            placeholder="All Plans"
            options={[
              { value: 'basic', label: 'Basic' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            onChange={(e) => setFilterSub(e.target.value)}
          />
          {(search || filterStatus || filterSub) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterSub('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} centers</span>
        </div>

        <DataTable<SACenter>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="No educational centers found"
        />
      </Card>
    </div>
  );
}

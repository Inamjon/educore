'use client';

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  UserX,
  BarChart3,
  Pencil,
  Ban,
  Trash2,
  Plus,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Input, SearchInput, Select } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SA_CENTERS, SA_BRANCHES, AdminRole, AdminStatus } from '@/lib/super-admin-data';
import { useSAAdministratorsStore, type SAAdmin } from '@/lib/store/sa-administrators-store';
import { toast } from '@/lib/store/toast-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  centerId: string;
  branchId: string;
  role: string;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  { key: 'manage_students', label: 'Manage Students' },
  { key: 'manage_teachers', label: 'Manage Teachers' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'manage_finance', label: 'Manage Finance' },
  { key: 'send_notifications', label: 'Send Notifications' },
  { key: 'manage_schedule', label: 'Manage Schedule' },
  { key: 'edit_settings', label: 'Edit Settings' },
  { key: 'view_audit_logs', label: 'View Audit Logs' },
];

const emptyForm: AdminFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  centerId: '',
  branchId: '',
  role: '',
  permissions: [],
};

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminRole }) {
  const map: Record<AdminRole, { label: string; variant: 'purple' | 'info' | 'default' }> = {
    center_admin: { label: 'Center Admin', variant: 'purple' },
    branch_admin: { label: 'Branch Admin', variant: 'info' },
    moderator: { label: 'Moderator', variant: 'default' },
  };
  const cfg = map[role] ?? { label: role, variant: 'default' as const };
  return <Badge label={cfg.label} variant={cfg.variant} />;
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdministratorsPage() {
  const adminItems = useSAAdministratorsStore((s) => s.items);
  const admins = adminItems.filter((a) => !a.deletedAt);
  const addAdmin = useSAAdministratorsStore((s) => s.add);
  const updateAdmin = useSAAdministratorsStore((s) => s.update);
  const removeAdmin = useSAAdministratorsStore((s) => s.softDelete);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<SAAdmin | null>(null);
  const [form, setForm] = useState<AdminFormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total = admins.length;
  const active = admins.filter((a) => a.status === 'active').length;
  const inactiveSuspended = admins.filter(
    (a) => a.status === 'inactive' || a.status === 'suspended'
  ).length;
  const centerAdmins = admins.filter((a) => a.role === 'center_admin').length;
  const branchAdmins = admins.filter((a) => a.role === 'branch_admin').length;

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.centerName.toLowerCase().includes(q);
      const matchRole = !filterRole || a.role === filterRole;
      const matchStatus = !filterStatus || a.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [admins, search, filterRole, filterStatus]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleFormChange = (field: keyof AdminFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (admin: SAAdmin) => {
    setEditingId(admin.id);
    setForm({
      fullName: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: '',
      confirmPassword: '',
      centerId: admin.centerId,
      branchId: admin.branchId,
      role: admin.role,
      permissions: admin.permissions,
    });
    setShowForm(true);
  };

  const handleSuspendToggle = (admin: SAAdmin) => {
    const nextStatus: AdminStatus = admin.status === 'suspended' ? 'active' : 'suspended';
    updateAdmin(admin.id, { status: nextStatus });
    toast.success(nextStatus === 'suspended' ? 'Administrator suspended' : 'Administrator reactivated');
  };

  const handleSubmit = () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.role) {
      toast.error('Name, email, and role are required');
      return;
    }
    if (!editingId || form.password) {
      if (!form.password || form.password !== form.confirmPassword) {
        toast.error('Passwords must match and cannot be empty');
        return;
      }
    }
    const center = SA_CENTERS.find((c) => c.id === form.centerId);
    const branch = SA_BRANCHES.find((b) => b.id === form.branchId);

    if (editingId) {
      updateAdmin(editingId, {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        centerId: form.centerId,
        centerName: center?.name ?? '',
        branchId: form.branchId,
        branchName: branch?.name ?? '',
        role: form.role as AdminRole,
        permissions: form.permissions,
      });
      toast.success('Administrator updated');
    } else {
      addAdmin({
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        centerId: form.centerId,
        centerName: center?.name ?? '',
        branchId: form.branchId,
        branchName: branch?.name ?? '',
        role: form.role as AdminRole,
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        permissions: form.permissions,
      });
      toast.success('Administrator created');
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // ── Center & branch options ────────────────────────────────────────────────

  const centerOptions = SA_CENTERS.map((c) => ({ value: c.id, label: c.name }));
  const branchOptions = SA_BRANCHES
    .filter((b) => !form.centerId || b.centerId === form.centerId)
    .map((b) => ({ value: b.id, label: b.name }));

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<SAAdmin>[] = [
    {
      key: 'name',
      label: 'Admin',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="font-medium text-slate-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (_, row) => (
        <span className="text-slate-600 text-xs">{row.email}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (_, row) => (
        <span className="text-slate-600 text-xs whitespace-nowrap">{row.phone}</span>
      ),
    },
    {
      key: 'centerName',
      label: 'Center',
      render: (_, row) => (
        <span className="text-slate-700 text-sm">{row.centerName}</span>
      ),
    },
    {
      key: 'branchName',
      label: 'Branch',
      render: (_, row) => (
        <span className="text-slate-600 text-sm">{row.branchName}</span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (_, row) => <RoleBadge role={row.role} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (_, row) => (
        <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(row.lastLogin)}</span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleSuspendToggle(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title={row.status === 'suspended' ? 'Reactivate' : 'Suspend'}
          >
            <Ban className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeletingAdmin(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Administrators"
        subtitle="Manage platform administrators and their permissions"
        actions={
          <Button
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setEditingId(null);
                setForm(emptyForm);
                setShowForm(true);
              }
            }}
          >
            <Plus className="h-4 w-4" />
            Add Administrator
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Admins"
          value={total}
          icon={<ShieldCheck className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Active"
          value={active}
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Inactive / Suspended"
          value={inactiveSuspended}
          icon={<UserX className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
        {/* Ratio card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-violet-50 flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 font-medium">Center vs Branch</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">{centerAdmins}</span>
                <span className="text-sm text-slate-400">:</span>
                <span className="text-2xl font-bold text-slate-900">{branchAdmins}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-violet-600 font-medium">Center Admins</span>
                <span className="text-xs text-blue-600 font-medium">Branch Admins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Administrator Form */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">
              {editingId ? 'Edit Administrator' : 'Add New Administrator'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Full Name</label>
              <Input
                placeholder="Jane Doe"
                value={form.fullName}
                onChange={(e) => handleFormChange('fullName', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Email</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <Input
                placeholder="+1 555-000-0000"
                value={form.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                Password{editingId && ' (leave blank to keep current)'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Assign Center</label>
              <Select
                className="w-full"
                value={form.centerId}
                placeholder="Select center"
                options={centerOptions}
                onChange={(e) => {
                  handleFormChange('centerId', e.target.value);
                  handleFormChange('branchId', '');
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Assign Branch</label>
              <Select
                className="w-full"
                value={form.branchId}
                placeholder="Select branch"
                options={branchOptions}
                onChange={(e) => handleFormChange('branchId', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Role</label>
              <Select
                className="w-full"
                value={form.role}
                placeholder="Select role"
                options={[
                  { value: 'center_admin', label: 'Center Admin' },
                  { value: 'branch_admin', label: 'Branch Admin' },
                  { value: 'moderator', label: 'Moderator' },
                ]}
                onChange={(e) => handleFormChange('role', e.target.value)}
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Permissions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {ALL_PERMISSIONS.map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm.key)}
                    onChange={() => handlePermissionToggle(perm.key)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                    {perm.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4" />
              {editingId ? 'Save Changes' : 'Add Administrator'}
            </Button>
          </div>
        </Card>
      )}

      {/* Table Card */}
      <Card noPadding>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-50">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search administrators..."
          />
          <Select
            value={filterRole}
            placeholder="All Roles"
            options={[
              { value: 'center_admin', label: 'Center Admin' },
              { value: 'branch_admin', label: 'Branch Admin' },
              { value: 'moderator', label: 'Moderator' },
            ]}
            onChange={(e) => setFilterRole(e.target.value)}
          />
          <Select
            value={filterStatus}
            placeholder="All Statuses"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
          {(search || filterRole || filterStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterRole('');
                setFilterStatus('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} administrators</span>
        </div>

        <DataTable<SAAdmin>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="No administrators found"
        />
      </Card>

      <ConfirmDialog
        open={!!deletingAdmin}
        onOpenChange={(open) => !open && setDeletingAdmin(null)}
        title="Delete administrator"
        description={`Are you sure you want to delete "${deletingAdmin?.name}"? This can be restored later if needed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingAdmin) {
            removeAdmin(deletingAdmin.id);
            toast.success('Administrator deleted');
          }
        }}
      />
    </div>
  );
}

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
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Input, SearchInput, Select } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/store/toast-store';
import { useOrganizationsQuery } from '@/lib/queries/organizations';
import { useBranchesQuery } from '@/lib/queries/branches';
import {
  useAdministratorsQuery,
  useCenterAdminRoleQuery,
  useCreateAdministratorMutation,
  useUpdateAdministratorMutation,
  useSuspendAdministratorMutation,
  useDeleteAdministratorMutation,
} from '@/lib/queries/administrators';
import type { Administrator, AdminStatus } from '@/lib/api/administrators';
import { ApiError } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminFormData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  organization: string;
  branch: string;
  status: AdminStatus;
}

const emptyForm: AdminFormData = {
  firstName: '',
  lastName: '',
  phone: '',
  password: '',
  confirmPassword: '',
  organization: '',
  branch: '',
  status: 'active',
};

const STATUS_OPTIONS: { value: AdminStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdministratorsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Administrator | null>(null);
  const [form, setForm] = useState<AdminFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdminStatus | ''>('');

  const { data: centers } = useOrganizationsQuery();
  const { data: allBranches } = useBranchesQuery({ organization: form.organization || undefined });
  const { data: centerAdminRole } = useCenterAdminRoleQuery(form.organization || undefined);
  const { data: admins, isLoading, isError, error } = useAdministratorsQuery({
    organization: filterCenter || undefined,
    status: filterStatus || undefined,
  });
  const createMutation = useCreateAdministratorMutation();
  const updateMutation = useUpdateAdministratorMutation();
  const suspendMutation = useSuspendAdministratorMutation();
  const deleteMutation = useDeleteAdministratorMutation();

  const list = admins ?? [];
  const centerOptions = (centers ?? []).map((c) => ({ value: c.id, label: c.name }));
  const branchOptions = (allBranches ?? []).map((b) => ({ value: b.id, label: b.name }));

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total = list.length;
  const active = list.filter((a) => a.status === 'active').length;
  const inactiveSuspended = list.filter((a) => a.status === 'inactive' || a.status === 'suspended').length;
  const withBranch = list.filter((a) => a.branch).length;

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(
      (a) => !q || a.full_name.toLowerCase().includes(q) || a.login_id.toLowerCase().includes(q) || (a.organization_name ?? '').toLowerCase().includes(q)
    );
  }, [list, search]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function handleFormChange<K extends keyof AdminFormData>(field: K, value: AdminFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCancel() {
    setShowForm(false);
    setEditingAdmin(null);
    setForm(emptyForm);
  }

  function handleEdit(admin: Administrator) {
    setEditingAdmin(admin);
    setForm({
      firstName: admin.first_name,
      lastName: admin.last_name,
      phone: admin.phone,
      password: '',
      confirmPassword: '',
      organization: admin.organization,
      branch: admin.branch ?? '',
      status: admin.status,
    });
    setShowForm(true);
  }

  async function handleSuspendToggle(admin: Administrator) {
    try {
      await suspendMutation.mutateAsync(admin.id);
      toast.success(admin.status === 'suspended' ? 'Administrator reactivated' : 'Administrator suspended');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  async function handleSubmit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.organization) {
      toast.error('Name and center are required');
      return;
    }
    if (!editingAdmin || form.password) {
      if (!form.password || form.password !== form.confirmPassword) {
        toast.error('Passwords must match and cannot be empty');
        return;
      }
    }
    if (!editingAdmin && !centerAdminRole) {
      toast.error('This center has no Center Admin role provisioned yet.');
      return;
    }

    setSaving(true);
    try {
      if (editingAdmin) {
        await updateMutation.mutateAsync({
          id: editingAdmin.id,
          input: {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            branch: form.branch,
            password: form.password || undefined,
          },
        });
        toast.success('Administrator updated');
      } else {
        await createMutation.mutateAsync({
          organization: form.organization,
          branch: form.branch,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          password: form.password,
          roleId: centerAdminRole!.id,
        });
        toast.success('Administrator created');
      }
      handleCancel();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<Administrator>[] = [
    {
      key: 'full_name',
      label: 'Admin',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.full_name} size="sm" />
          <span className="font-medium text-slate-900">{row.full_name}</span>
        </div>
      ),
    },
    { key: 'login_id', label: 'Login ID', render: (_, row) => <span className="text-slate-600 text-xs">{row.login_id}</span> },
    { key: 'phone', label: 'Phone', render: (_, row) => <span className="text-slate-600 text-xs whitespace-nowrap">{row.phone}</span> },
    { key: 'organization_name', label: 'Center', render: (_, row) => <span className="text-slate-700 text-sm">{row.organization_name}</span> },
    { key: 'branch_name', label: 'Branch', render: (_, row) => <span className="text-slate-600 text-sm">{row.branch_name ?? '—'}</span> },
    { key: 'status', label: 'Status', render: (_, row) => <Badge label={row.status} variant={row.status === 'active' ? 'success' : row.status === 'suspended' ? 'danger' : 'secondary'} /> },
    { key: 'last_login', label: 'Last Login', render: (_, row) => <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(row.last_login)}</span> },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleSuspendToggle(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title={row.status === 'suspended' ? 'Reactivate' : 'Suspend'}>
            <Ban className="h-4 w-4" />
          </button>
          <button onClick={() => setDeletingAdmin(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Administrators"
        subtitle="Manage center administrator accounts across the platform"
        actions={
          <Button
            onClick={() => {
              if (showForm) handleCancel();
              else {
                setEditingAdmin(null);
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
        <StatCard label="Total Admins" value={total} icon={<ShieldCheck className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Active" value={active} icon={<Users className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Inactive / Suspended" value={inactiveSuspended} icon={<UserX className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Assigned to a Branch" value={withBranch} icon={<BarChart3 className="h-5 w-5 text-violet-600" />} iconBg="bg-violet-50" />
      </div>

      {/* Add/Edit Administrator Form */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">{editingAdmin ? 'Edit Administrator' : 'Add New Administrator'}</h3>
            <button onClick={handleCancel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">First Name</label>
              <Input placeholder="Jane" value={form.firstName} onChange={(e) => handleFormChange('firstName', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Last Name</label>
              <Input placeholder="Doe" value={form.lastName} onChange={(e) => handleFormChange('lastName', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <Input placeholder="+1 555-000-0000" value={form.phone} onChange={(e) => handleFormChange('phone', e.target.value)} />
            </div>

            {editingAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Login ID</label>
                <Input value={editingAdmin.login_id} disabled />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Password{editingAdmin && ' (leave blank to keep current)'}</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => handleFormChange('password', e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Confirm Password</label>
              <div className="relative">
                <Input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={(e) => handleFormChange('confirmPassword', e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Assign Center</label>
              <Select
                className="w-full"
                value={form.organization}
                placeholder="Select center"
                options={centerOptions}
                disabled={!!editingAdmin}
                onChange={(e) => {
                  handleFormChange('organization', e.target.value);
                  handleFormChange('branch', '');
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Assign Branch (optional)</label>
              <Select className="w-full" value={form.branch} placeholder="Select branch" options={branchOptions} onChange={(e) => handleFormChange('branch', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Role</label>
              {/* Read-only: the org's auto-provisioned Center Admin role is
                  the only administrator-type role this platform has — no
                  custom per-user permission overrides exist (RBAC here is
                  role-based, not a per-admin checkbox grid). */}
              <Input value="Center Admin" disabled />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              <Plus className="h-4 w-4" />
              {editingAdmin ? 'Save Changes' : 'Add Administrator'}
            </Button>
          </div>
        </Card>
      )}

      {/* Table Card */}
      <Card noPadding>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-50">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search administrators..." />
          <Select value={filterCenter} placeholder="All Centers" options={centerOptions} onChange={(e) => setFilterCenter(e.target.value)} />
          <Select value={filterStatus} placeholder="All Statuses" options={STATUS_OPTIONS} onChange={(e) => setFilterStatus(e.target.value as AdminStatus | '')} />
          {(search || filterCenter || filterStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterCenter('');
                setFilterStatus('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} administrators</span>
        </div>

        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : 'Failed to load administrators.'}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading administrators…
          </div>
        ) : (
          <DataTable<Administrator> columns={columns} data={filtered} keyField="id" emptyMessage="No administrators found" />
        )}
      </Card>

      <ConfirmDialog
        open={!!deletingAdmin}
        onOpenChange={(open) => !open && setDeletingAdmin(null)}
        title="Delete administrator"
        description={`Are you sure you want to delete "${deletingAdmin?.full_name}"? This can be restored later if needed.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingAdmin) return;
          try {
            await deleteMutation.mutateAsync(deletingAdmin.id);
            toast.success('Administrator deleted');
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
          } finally {
            setDeletingAdmin(null);
          }
        }}
      />
    </div>
  );
}

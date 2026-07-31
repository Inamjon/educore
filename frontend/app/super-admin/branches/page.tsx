'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  Ban,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Input, SearchInput, Select } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SA_CENTERS, BranchStatus } from '@/lib/super-admin-data';
import { useSABranchesStore, type SABranch } from '@/lib/store/sa-branches-store';
import { toast } from '@/lib/store/toast-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchFormData {
  name: string;
  centerId: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  workingHours: string;
  status: string;
}

const emptyForm: BranchFormData = {
  name: '',
  centerId: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  manager: '',
  workingHours: '',
  status: 'active',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BranchesPage() {
  const branchItems = useSABranchesStore((s) => s.items);
  const branches = branchItems.filter((b) => !b.deletedAt);
  const addBranch = useSABranchesStore((s) => s.add);
  const updateBranch = useSABranchesStore((s) => s.update);
  const removeBranch = useSABranchesStore((s) => s.softDelete);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<SABranch | null>(null);
  const [form, setForm] = useState<BranchFormData>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total = branches.length;
  const active = branches.filter((b) => b.status === 'active').length;
  const inactive = branches.filter((b) => b.status !== 'active').length;

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.manager.toLowerCase().includes(q);
      const matchCenter = !filterCenter || b.centerId === filterCenter;
      const matchStatus = !filterStatus || b.status === filterStatus;
      return matchSearch && matchCenter && matchStatus;
    });
  }, [branches, search, filterCenter, filterStatus]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleFormChange = (field: keyof BranchFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (branch: SABranch) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      centerId: branch.centerId,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      workingHours: branch.workingHours,
      status: branch.status,
    });
    setShowForm(true);
  };

  const handleSuspendToggle = (branch: SABranch) => {
    const nextStatus: BranchStatus = branch.status === 'suspended' ? 'active' : 'suspended';
    updateBranch(branch.id, { status: nextStatus });
    toast.success(nextStatus === 'suspended' ? 'Branch suspended' : 'Branch reactivated');
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.centerId) {
      toast.error('Branch name and center are required');
      return;
    }
    const center = SA_CENTERS.find((c) => c.id === form.centerId);
    if (editingId) {
      updateBranch(editingId, {
        name: form.name,
        centerId: form.centerId,
        centerName: center?.name ?? '',
        address: form.address,
        city: form.city,
        phone: form.phone,
        email: form.email,
        manager: form.manager,
        workingHours: form.workingHours,
        status: form.status as BranchStatus,
      });
      toast.success('Branch updated');
    } else {
      addBranch({
        name: form.name,
        centerId: form.centerId,
        centerName: center?.name ?? '',
        address: form.address,
        city: form.city,
        phone: form.phone,
        email: form.email,
        manager: form.manager,
        workingHours: form.workingHours,
        status: form.status as BranchStatus,
        studentCount: 0,
        teacherCount: 0,
        createdAt: new Date().toISOString(),
      });
      toast.success('Branch created');
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<SABranch>[] = [
    {
      key: 'name',
      label: 'Branch',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{row.city}</p>
        </div>
      ),
    },
    {
      key: 'centerName',
      label: 'Center',
      render: (_, row) => (
        <Badge label={row.centerName} variant="info" />
      ),
    },
    {
      key: 'manager',
      label: 'Manager',
      render: (_, row) => (
        <span className="text-slate-700">{row.manager}</span>
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
      key: 'workingHours',
      label: 'Working Hours',
      render: (_, row) => (
        <span className="text-slate-600 text-xs whitespace-nowrap">{row.workingHours}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={row.status} />,
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
            onClick={() => setDeletingBranch(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // ── Center options ─────────────────────────────────────────────────────────

  const centerOptions = SA_CENTERS.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Branches"
        subtitle="Manage all branches across educational centers"
        actions={
          <Button
            size="md"
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
            Add Branch
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Branches"
          value={total}
          icon={<Building2 className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Active Branches"
          value={active}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Inactive / Suspended"
          value={inactive}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* Add Branch Form */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">
              {editingId ? 'Edit Branch' : 'Add New Branch'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Branch Name</label>
              <Input
                placeholder="e.g. Downtown Campus"
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Educational Center</label>
              <Select
                className="w-full"
                value={form.centerId}
                placeholder="Select center"
                options={centerOptions}
                onChange={(e) => handleFormChange('centerId', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Address</label>
              <Input
                placeholder="Street address"
                value={form.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
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
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <Input
                placeholder="+1 555-000-0000"
                value={form.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Email</label>
              <Input
                type="email"
                placeholder="branch@example.com"
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Manager Name</label>
              <Input
                placeholder="Full name"
                value={form.manager}
                onChange={(e) => handleFormChange('manager', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Working Hours</label>
              <Input
                placeholder="e.g. 08:00 - 18:00"
                value={form.workingHours}
                onChange={(e) => handleFormChange('workingHours', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Status</label>
              <Select
                className="w-full"
                value={form.status}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
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
              {editingId ? 'Save Changes' : 'Add Branch'}
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
            placeholder="Search branches..."
          />
          <Select
            value={filterCenter}
            placeholder="All Centers"
            options={centerOptions}
            onChange={(e) => setFilterCenter(e.target.value)}
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
          <span className="ml-auto text-xs text-slate-400">{filtered.length} branches</span>
        </div>

        <DataTable<SABranch>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="No branches found"
        />
      </Card>

      <ConfirmDialog
        open={!!deletingBranch}
        onOpenChange={(open) => !open && setDeletingBranch(null)}
        title="Delete branch"
        description={`Are you sure you want to delete "${deletingBranch?.name}"? This can be restored later if needed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingBranch) {
            removeBranch(deletingBranch.id);
            toast.success('Branch deleted');
          }
        }}
      />
    </div>
  );
}

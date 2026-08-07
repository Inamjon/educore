'use client';

import { useState, useMemo } from 'react';
import {
  GraduationCap,
  UserCheck,
  UserX,
  Briefcase,
  Eye,
  Ban,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput, Select } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { toast } from '@/lib/store/toast-store';
import { useOrganizationsQuery } from '@/lib/queries/organizations';
import { useTeachersQuery, useUpdateTeacherMutation } from '@/lib/queries/teachers';
import type { TeacherProfile, TeacherStatus } from '@/lib/api/teachers';
import { ApiError } from '@/lib/api/client';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TeachersPage() {
  const [search, setSearch] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [status, setStatus] = useState<TeacherStatus | ''>('');
  const [viewingTeacher, setViewingTeacher] = useState<TeacherProfile | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const updateMutation = useUpdateTeacherMutation();

  const { data: centers } = useOrganizationsQuery();
  const { data: teachers, isLoading, isError, error } = useTeachersQuery({
    organizationId: organizationId || undefined,
    status: status || undefined,
  });

  const centerOptions = [{ value: '', label: 'All Centers' }, ...(centers ?? []).map((c) => ({ value: c.id, label: c.name }))];

  const list = teachers ?? [];
  const totalTeachers = list.length;
  const activeTeachers = list.filter((t) => t.status === 'active').length;
  const inactiveTeachers = list.filter((t) => t.status !== 'active').length;
  const avgExperience = list.length > 0 ? list.reduce((sum, t) => sum + t.experience_years, 0) / list.length : 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((t) => !q || t.user_full_name.toLowerCase().includes(q) || t.user_login_id.toLowerCase().includes(q));
  }, [list, search]);

  async function handleSuspendToggle(teacher: TeacherProfile) {
    setSuspendingId(teacher.id);
    try {
      // TeacherProfile has no dedicated suspend action (unlike Organization/
      // Branch/User) — the closest real state is its own `status` field,
      // toggled directly via PATCH. userId is required by UpdateTeacherInput
      // but unused here (no User-level fields are being changed), so no
      // extra request fires beyond the profile PATCH — see updateTeacher().
      const nextStatus: TeacherStatus = teacher.status === 'active' ? 'inactive' : 'active';
      await updateMutation.mutateAsync({ profileId: teacher.id, input: { userId: teacher.user, status: nextStatus } });
      toast.success(nextStatus === 'inactive' ? 'Teacher suspended' : 'Teacher reactivated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSuspendingId(null);
    }
  }

  const columns: Column<TeacherProfile>[] = [
    {
      key: 'user_full_name',
      label: 'Teacher',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.user_full_name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{row.user_full_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{row.user_login_id}</p>
          </div>
        </div>
      ),
    },
    { key: 'employment_type', label: 'Employment', render: (_, row) => <Badge label={row.employment_type.replace('_', ' ')} variant="info" /> },
    { key: 'organization', label: 'Center', render: (_, row) => <span className="text-slate-700 whitespace-nowrap">{centers?.find((c) => c.id === row.organization)?.name ?? '—'}</span> },
    { key: 'branch_name', label: 'Branch', render: (_, row) => <span className="text-slate-500 text-sm whitespace-nowrap">{row.branch_name ?? '—'}</span> },
    { key: 'experience_years', label: 'Experience', render: (_, row) => <span className="text-sm text-slate-700">{row.experience_years} yrs</span> },
    { key: 'status', label: 'Status', render: (_, row) => <Badge label={row.status.replace('_', ' ')} variant={row.status === 'active' ? 'success' : 'secondary'} /> },
    { key: 'hire_date', label: 'Hired', render: (_, row) => <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(row.hire_date)}</span> },
    {
      key: 'id',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" title="View teacher" onClick={() => setViewingTeacher(row)}>
            <Eye className="h-4 w-4 text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={row.status === 'active' ? 'Suspend teacher' : 'Reactivate teacher'}
            onClick={() => handleSuspendToggle(row)}
            loading={suspendingId === row.id}
          >
            <Ban className="h-4 w-4 text-slate-500 hover:text-amber-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" subtitle="Platform-wide teacher overview across all centers and branches" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Teachers" value={totalTeachers} icon={<GraduationCap className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Active" value={activeTeachers} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Inactive" value={inactiveTeachers} icon={<UserX className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Avg. Experience" value={`${avgExperience.toFixed(1)} yrs`} icon={<Briefcase className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title="All Teachers"
        subtitle={`${filtered.length} of ${totalTeachers} teachers`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers…" className="w-52" />
            <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} options={centerOptions} />
            <Select value={status} onChange={(e) => setStatus(e.target.value as TeacherStatus | '')} options={STATUS_OPTIONS} />
            {(search || organizationId || status) && (
              <button
                onClick={() => {
                  setSearch('');
                  setOrganizationId('');
                  setStatus('');
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
            {error instanceof ApiError ? error.message : 'Failed to load teachers.'}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading teachers…
          </div>
        ) : (
          <DataTable<TeacherProfile> columns={columns} data={filtered} keyField="id" emptyMessage="No teachers match your filters." />
        )}
      </Card>

      <Dialog open={!!viewingTeacher} onOpenChange={(open) => !open && setViewingTeacher(null)}>
        <DialogContent className="max-w-sm">
          {viewingTeacher && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingTeacher.user_full_name}</DialogTitle>
              </DialogHeader>
              <DialogBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={viewingTeacher.user_full_name} size="md" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{viewingTeacher.user_full_name}</p>
                    <p className="text-xs text-slate-400">{viewingTeacher.user_login_id}</p>
                  </div>
                </div>
                <DetailRow label="Phone" value={viewingTeacher.user_phone} />
                <DetailRow label="Employment" value={viewingTeacher.employment_type.replace('_', ' ')} />
                <DetailRow label="Center" value={centers?.find((c) => c.id === viewingTeacher.organization)?.name ?? '—'} />
                <DetailRow label="Branch" value={viewingTeacher.branch_name ?? '—'} />
                <DetailRow label="Experience" value={`${viewingTeacher.experience_years} years`} />
                {viewingTeacher.university && <DetailRow label="University" value={viewingTeacher.university} />}
                <DetailRow label="Hired" value={formatDate(viewingTeacher.hire_date)} />
                <DetailRow label="Status" value={viewingTeacher.status.replace('_', ' ')} />
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

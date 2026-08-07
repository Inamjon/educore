'use client';

import { useState, useMemo } from 'react';
import { Eye, Users, UserCheck, UserX, AlertCircle, Loader2 } from 'lucide-react';
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
import { useOrganizationsQuery } from '@/lib/queries/organizations';
import { useStudentsQuery } from '@/lib/queries/students';
import type { StudentProfile, StudentStatus } from '@/lib/api/students';
import { ApiError } from '@/lib/api/client';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'expelled', label: 'Expelled' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'on_leave', label: 'On Leave' },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>('');
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);

  const { data: centers } = useOrganizationsQuery();
  const { data: students, isLoading, isError, error } = useStudentsQuery({
    organizationId: organizationId || undefined,
    status: status || undefined,
  });

  const centerOptions = [{ value: '', label: 'All Centers' }, ...(centers ?? []).map((c) => ({ value: c.id, label: c.name }))];

  const list = students ?? [];
  const totalStudents = list.length;
  const activeStudents = list.filter((s) => s.status === 'active').length;
  const otherStudents = totalStudents - activeStudents;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((s) => !q || s.user_full_name.toLowerCase().includes(q) || s.user_login_id.toLowerCase().includes(q));
  }, [list, search]);

  const columns: Column<StudentProfile>[] = [
    {
      key: 'user_full_name',
      label: 'Student',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.user_full_name} size="sm" />
          <span className="font-medium text-slate-900 whitespace-nowrap">{row.user_full_name}</span>
        </div>
      ),
    },
    { key: 'user_login_id', label: 'Login ID', render: (_, row) => <span className="text-slate-500 text-xs">{row.user_login_id}</span> },
    { key: 'organization', label: 'Center', render: (_, row) => <span className="text-slate-700 whitespace-nowrap">{centers?.find((c) => c.id === row.organization)?.name ?? '—'}</span> },
    { key: 'branch_name', label: 'Branch', render: (_, row) => <span className="text-slate-600 whitespace-nowrap">{row.branch_name ?? '—'}</span> },
    { key: 'education_level', label: 'Education Level', render: (_, row) => (row.education_level ? <Badge label={row.education_level} variant="info" /> : <span className="text-slate-300">—</span>) },
    { key: 'status', label: 'Status', render: (_, row) => <Badge label={row.status} variant={row.status === 'active' ? 'success' : row.status === 'expelled' ? 'danger' : 'secondary'} /> },
    { key: 'enrollment_date', label: 'Enrolled', render: (_, row) => <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(row.enrollment_date)}</span> },
    {
      key: 'id',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (_, row) => (
        <Button variant="ghost" size="icon" title="View student" onClick={() => setViewingStudent(row)}>
          <Eye className="h-4 w-4 text-slate-500" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="Platform-wide student overview" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Students" value={totalStudents} icon={<Users className="h-5 w-5 text-violet-600" />} iconBg="bg-violet-50" />
        <StatCard label="Active" value={activeStudents} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Other Statuses" value={otherStudents} icon={<UserX className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
      </div>

      <Card
        noPadding
        title="All Students"
        subtitle={`${filtered.length} of ${totalStudents} students`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" className="w-52" />
            <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} options={centerOptions} />
            <Select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus | '')} options={STATUS_OPTIONS} />
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : 'Failed to load students.'}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading students…
          </div>
        ) : (
          <DataTable<StudentProfile> columns={columns} data={filtered} keyField="id" emptyMessage="No students match your filters." />
        )}
      </Card>

      <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
        <DialogContent className="max-w-sm">
          {viewingStudent && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingStudent.user_full_name}</DialogTitle>
              </DialogHeader>
              <DialogBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={viewingStudent.user_full_name} size="md" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{viewingStudent.user_full_name}</p>
                    <p className="text-xs text-slate-400">{viewingStudent.user_login_id}</p>
                  </div>
                </div>
                <DetailRow label="Phone" value={viewingStudent.user_phone} />
                <DetailRow label="Center" value={centers?.find((c) => c.id === viewingStudent.organization)?.name ?? '—'} />
                <DetailRow label="Branch" value={viewingStudent.branch_name ?? '—'} />
                {viewingStudent.education_level && <DetailRow label="Education Level" value={viewingStudent.education_level} />}
                {viewingStudent.school_name && <DetailRow label="Previous School" value={viewingStudent.school_name} />}
                <DetailRow label="Enrolled" value={formatDate(viewingStudent.enrollment_date)} />
                <DetailRow label="Status" value={viewingStudent.status.charAt(0).toUpperCase() + viewingStudent.status.slice(1)} />
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

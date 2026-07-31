'use client';

import { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  Star,
  Eye,
  Ban,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
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
import { SA_CENTERS } from '@/lib/super-admin-data';
import { useSATeachersStore, type SATeacher } from '@/lib/store/sa-teachers-store';
import { toast } from '@/lib/store/toast-store';

// ─── Filter options ────────────────────────────────────────────────────────────
const centerOptions = [
  { value: '', label: 'All Centers' },
  ...SA_CENTERS.map((c) => ({ value: c.id, label: c.name })),
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// ─── Rating Stars ─────────────────────────────────────────────────────────────
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
      <span className="text-sm font-semibold text-slate-700">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function TeachersPage() {
  const teachers = useSATeachersStore((s) => s.items);
  const updateTeacher = useSATeachersStore((s) => s.update);

  const [search, setSearch] = useState('');
  const [centerId, setCenterId] = useState('');
  const [status, setStatus] = useState('');
  const [viewingTeacher, setViewingTeacher] = useState<SATeacher | null>(null);

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((t) => t.status === 'active').length;
  const inactiveTeachers = teachers.filter((t) => t.status === 'inactive').length;

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return teachers.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.loginId.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q);
      const matchesCenter = !centerId || t.centerId === centerId;
      const matchesStatus = !status || t.status === status;
      return matchesSearch && matchesCenter && matchesStatus;
    });
  }, [teachers, search, centerId, status]);

  // ── Average rating ──────────────────────────────────────────────────────────
  const avgRating =
    teachers.length > 0 ? teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length : 0;

  const handleSuspendToggle = (teacher: SATeacher) => {
    const nextStatus = teacher.status === 'active' ? 'inactive' : 'active';
    updateTeacher(teacher.id, { status: nextStatus });
    toast.success(nextStatus === 'inactive' ? 'Teacher suspended' : 'Teacher reactivated');
  };

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns: Column<SATeacher>[] = [
    {
      key: 'name',
      label: 'Teacher',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{row.loginId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (_, row) => (
        <Badge label={row.subject} variant="info" />
      ),
    },
    {
      key: 'centerName',
      label: 'Center',
      render: (_, row) => (
        <span className="text-slate-700 whitespace-nowrap">{row.centerName}</span>
      ),
    },
    {
      key: 'branchName',
      label: 'Branch',
      render: (_, row) => (
        <span className="text-slate-500 text-sm whitespace-nowrap">{row.branchName}</span>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (_, row) => <RatingStars rating={row.rating} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'joinedAt',
      label: 'Joined',
      render: (_, row) => (
        <span className="text-slate-500 text-xs whitespace-nowrap">
          {new Date(row.joinedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
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
          >
            <Ban className="h-4 w-4 text-slate-500 hover:text-amber-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Teachers"
        subtitle="Platform-wide teacher overview across all centers and branches"
      />

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Teachers"
          value={totalTeachers}
          icon={<GraduationCap className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Active"
          value={activeTeachers}
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Inactive"
          value={inactiveTeachers}
          icon={<UserX className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
        {/* Avg Rating card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-amber-50 flex-shrink-0">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 font-medium">Avg. Rating</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">{avgRating.toFixed(2)}</span>
                <span className="text-sm text-slate-400">/ 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <Card
        noPadding
        title="All Teachers"
        subtitle={`${filtered.length} of ${totalTeachers} teachers`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers…"
              className="w-52"
            />
            <Select
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              options={centerOptions}
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
            />
            {(search || centerId || status) && (
              <button
                onClick={() => {
                  setSearch('');
                  setCenterId('');
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
        <DataTable<SATeacher>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="No teachers match your filters."
        />
      </Card>

      <Dialog open={!!viewingTeacher} onOpenChange={(open) => !open && setViewingTeacher(null)}>
        <DialogContent className="max-w-sm">
          {viewingTeacher && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingTeacher.name}</DialogTitle>
              </DialogHeader>
              <DialogBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={viewingTeacher.name} size="md" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{viewingTeacher.name}</p>
                    <p className="text-xs text-slate-400">{viewingTeacher.loginId}</p>
                  </div>
                </div>
                <DetailRow label="Phone" value={viewingTeacher.phone} />
                <DetailRow label="Subject" value={viewingTeacher.subject} />
                <DetailRow label="Center" value={viewingTeacher.centerName} />
                <DetailRow label="Branch" value={viewingTeacher.branchName} />
                <DetailRow label="Rating" value={`${viewingTeacher.rating.toFixed(1)} / 5.0`} />
                <DetailRow
                  label="Joined"
                  value={new Date(viewingTeacher.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                />
                <DetailRow label="Status" value={viewingTeacher.status === 'active' ? 'Active' : 'Inactive'} />
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

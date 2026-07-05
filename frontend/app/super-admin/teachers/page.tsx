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
import { SA_TEACHERS, SA_CENTERS, SATeacher } from '@/lib/super-admin-data';

// ─── Derived stats ─────────────────────────────────────────────────────────────
const totalTeachers = SA_TEACHERS.length;
const activeTeachers = SA_TEACHERS.filter((t) => t.status === 'active').length;
const inactiveTeachers = SA_TEACHERS.filter((t) => t.status === 'inactive').length;

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
  const [search, setSearch] = useState('');
  const [centerId, setCenterId] = useState('');
  const [status, setStatus] = useState('');

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SA_TEACHERS.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q);
      const matchesCenter = !centerId || t.centerId === centerId;
      const matchesStatus = !status || t.status === status;
      return matchesSearch && matchesCenter && matchesStatus;
    });
  }, [search, centerId, status]);

  // ── Average rating ──────────────────────────────────────────────────────────
  const avgRating =
    SA_TEACHERS.reduce((sum, t) => sum + t.rating, 0) / SA_TEACHERS.length;

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
            <p className="text-xs text-slate-400 mt-0.5">{row.email}</p>
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
      render: () => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" title="View teacher">
            <Eye className="h-4 w-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" title="Suspend teacher">
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
    </div>
  );
}

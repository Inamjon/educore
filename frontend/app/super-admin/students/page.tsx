'use client';

import { useState, useMemo } from 'react';
import { Eye, Users, UserCheck, UserX } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput, Select } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import { SA_STUDENTS, SA_CENTERS, SAStudent } from '@/lib/super-admin-data';
import { formatCurrency } from '@/lib/utils';

// ── Derived stats ──────────────────────────────────────────────────────────────
const totalStudents = SA_STUDENTS.length;
const activeStudents = SA_STUDENTS.filter((s) => s.status === 'active').length;
const suspendedStudents = SA_STUDENTS.filter((s) => s.status === 'suspended').length;

// ── Center options for filter ──────────────────────────────────────────────────
const centerOptions = [
  { value: '', label: 'All Centers' },
  ...SA_CENTERS.map((c) => ({ value: c.id, label: c.name })),
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [centerId, setCenterId] = useState('');
  const [status, setStatus] = useState('');

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SA_STUDENTS.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.groupName.toLowerCase().includes(q);
      const matchesCenter = !centerId || s.centerId === centerId;
      const matchesStatus = !status || s.status === status;
      return matchesSearch && matchesCenter && matchesStatus;
    });
  }, [search, centerId, status]);

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns: Column<SAStudent>[] = [
    {
      key: 'name',
      label: 'Student',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="font-medium text-slate-900 whitespace-nowrap">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (_, row) => (
        <span className="text-slate-500 text-xs">{row.email}</span>
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
        <span className="text-slate-600 whitespace-nowrap">{row.branchName}</span>
      ),
    },
    {
      key: 'groupName',
      label: 'Group',
      render: (_, row) => (
        <Badge label={row.groupName} variant="info" />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'enrolledAt',
      label: 'Enrolled',
      render: (_, row) => (
        <span className="text-slate-500 text-xs whitespace-nowrap">
          {new Date(row.enrolledAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (_, row) => (
        <span
          className={
            row.balance > 0
              ? 'font-semibold text-red-600'
              : 'font-semibold text-emerald-600'
          }
        >
          {formatCurrency(Math.abs(row.balance))}
          {row.balance < 0 && ' (credit)'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: () => (
        <Button variant="ghost" size="icon" title="View student">
          <Eye className="h-4 w-4 text-slate-500" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Students"
        subtitle="Platform-wide student overview"
      />

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Students"
          value={totalStudents}
          icon={<Users className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
        />
        <StatCard
          label="Active"
          value={activeStudents}
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Suspended"
          value={suspendedStudents}
          icon={<UserX className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <Card
        noPadding
        title="All Students"
        subtitle={`${filtered.length} of ${totalStudents} students`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
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
          </div>
        }
      >
        <DataTable<SAStudent>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="No students match your filters."
        />
      </Card>
    </div>
  );
}

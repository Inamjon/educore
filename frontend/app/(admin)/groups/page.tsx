"use client";
import { useState } from "react";
import { Plus, Users2, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { GROUPS } from "@/lib/data";
import type { Group } from "@/types";
import { Users, BookOpen } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const COLUMNS: Column<Group>[] = [
  {
    key: "name",
    label: "Group",
    render: (_, row) => (
      <div>
        <p className="font-medium text-slate-900">{row.name}</p>
        <p className="text-xs text-slate-400">{row.courseName}</p>
      </div>
    ),
  },
  {
    key: "teacherName",
    label: "Teacher",
    render: (_, row) => (
      <div className="flex items-center gap-2">
        <Avatar name={row.teacherName} size="xs" />
        <span className="text-sm text-slate-700">{row.teacherName}</span>
      </div>
    ),
  },
  {
    key: "days",
    label: "Schedule",
    render: (_, row) => (
      <div>
        <p className="text-sm text-slate-700">{row.days.join(", ")}</p>
        <p className="text-xs text-slate-400">{row.startTime} – {row.endTime}</p>
      </div>
    ),
  },
  { key: "room", label: "Room" },
  {
    key: "enrolledCount",
    label: "Students",
    render: (_, row) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${(row.enrolledCount / row.capacity) * 100}%` }}
          />
        </div>
        <span className="text-sm text-slate-600 whitespace-nowrap">{row.enrolledCount}/{row.capacity}</span>
      </div>
    ),
  },
  {
    key: "level",
    label: "Level",
    render: (val) => <StatusBadge status={String(val)} />,
  },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusBadge status={String(val)} />,
  },
];

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = GROUPS.filter((g) => {
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.courseName.toLowerCase().includes(search.toLowerCase()) ||
      g.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalEnrolled = GROUPS.reduce((s, g) => s + g.enrolledCount, 0);
  const totalCapacity = GROUPS.reduce((s, g) => s + g.capacity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups & Classes"
        subtitle={`${GROUPS.length} groups running`}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Groups" value={GROUPS.length} icon={<Users2 className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Total Enrolled" value={totalEnrolled} icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Total Capacity" value={totalCapacity} icon={<BookOpen className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Occupancy Rate" value={`${Math.round((totalEnrolled / totalCapacity) * 100)}%`} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      {/* Table */}
      <Card
        noPadding
        title="All Groups"
        subtitle={`${filtered.length} groups`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..." />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36" />
          </div>
        }
      >
        <DataTable columns={COLUMNS} data={filtered} keyField="id" emptyMessage="No groups found" />
      </Card>
    </div>
  );
}

"use client";
import { useState } from "react";
import { UserPlus, Filter } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { STUDENTS } from "@/lib/data";
import type { Student } from "@/types";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

const GENDER_OPTIONS = [
  { value: "", label: "All Genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const COLUMNS: Column<Student>[] = [
  {
    key: "name",
    label: "Student",
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.name} size="sm" />
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      </div>
    ),
  },
  { key: "groupName", label: "Group" },
  { key: "phone", label: "Phone" },
  {
    key: "attendanceRate",
    label: "Attendance",
    render: (val) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${val}%` }}
          />
        </div>
        <span className="text-sm text-slate-600">{String(val)}%</span>
      </div>
    ),
  },
  {
    key: "balance",
    label: "Balance",
    render: (val) => (
      <span className={Number(val) > 0 ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>
        {Number(val) > 0 ? `-$${val}` : "Paid"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusBadge status={String(val)} />,
  },
  {
    key: "enrolledAt",
    label: "Enrolled",
    render: (val) => new Date(String(val)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
  },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const filtered = STUDENTS.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.groupName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    const matchesGender = !genderFilter || s.gender === genderFilter;
    return matchesSearch && matchesStatus && matchesGender;
  });

  const stats = {
    total: STUDENTS.length,
    active: STUDENTS.filter((s) => s.status === "active").length,
    inactive: STUDENTS.filter((s) => s.status === "inactive" || s.status === "suspended").length,
    pending: STUDENTS.filter((s) => s.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${stats.total} students enrolled`}
        actions={
          <Button>
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.total} icon={<Users className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Active" value={stats.active} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Inactive" value={stats.inactive} icon={<UserX className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      {/* Table */}
      <Card
        noPadding
        title="All Students"
        subtitle={`Showing ${filtered.length} of ${STUDENTS.length} students`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
            />
            <Select
              options={GENDER_OPTIONS}
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-32"
            />
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <DataTable
          columns={COLUMNS}
          data={filtered}
          keyField="id"
          emptyMessage="No students found"
        />
      </Card>
    </div>
  );
}

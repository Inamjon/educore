"use client";
import { useMemo, useState } from "react";
import { Plus, Users2, Clock, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useGroupsStore } from "@/lib/store/groups-store";
import { toast } from "@/lib/store/toast-store";
import type { Group } from "@/types";
import { Users, BookOpen } from "lucide-react";
import { GroupFormDialog } from "./_components/group-form-dialog";
import { GroupDetailPanel } from "./_components/group-detail-panel";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function GroupsPage() {
  const groupItems = useGroupsStore((s) => s.items);
  const groups = useMemo(() => groupItems.filter((g) => !g.deletedAt), [groupItems]);
  const softDelete = useGroupsStore((s) => s.softDelete);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const filtered = groups.filter((g) => {
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.courseName.toLowerCase().includes(search.toLowerCase()) ||
      g.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedGroup = groups.find((g) => g.id === selectedId) ?? null;
  const totalEnrolled = groups.reduce((s, g) => s + g.enrolledCount, 0);
  const totalCapacity = groups.reduce((s, g) => s + g.capacity, 0);

  function openEdit(group: Group) {
    setEditingGroup(group);
    setFormOpen(true);
  }

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
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(row.enrolledCount / row.capacity) * 100}%` }} />
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
    {
      key: "id",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletingGroup(row)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups & Classes"
        subtitle={`${groups.length} groups running`}
        actions={
          <Button
            onClick={() => {
              setEditingGroup(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Groups" value={groups.length} icon={<Users2 className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Total Enrolled" value={totalEnrolled} icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Total Capacity" value={totalCapacity} icon={<BookOpen className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Occupancy Rate" value={totalCapacity ? `${Math.round((totalEnrolled / totalCapacity) * 100)}%` : "0%"} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

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
        <DataTable columns={COLUMNS} data={filtered} keyField="id" emptyMessage="No groups found" onRowClick={(row) => setSelectedId(row.id)} />
      </Card>

      {selectedGroup && (
        <GroupDetailPanel
          group={selectedGroup}
          onBack={() => setSelectedId(null)}
          onEdit={() => openEdit(selectedGroup)}
          onDelete={() => setDeletingGroup(selectedGroup)}
        />
      )}

      <GroupFormDialog open={formOpen} onOpenChange={setFormOpen} group={editingGroup} />

      <ConfirmDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
        title="Delete group"
        description={`Are you sure you want to remove ${deletingGroup?.name}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingGroup) {
            softDelete(deletingGroup.id);
            toast.success("Group removed");
            if (selectedId === deletingGroup.id) setSelectedId(null);
          }
        }}
      />
    </div>
  );
}

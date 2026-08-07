"use client";
import { useState } from "react";
import { Plus, Users2, Clock, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "@/lib/store/toast-store";
import { useDeleteGroupMutation, useGroupsQuery } from "@/lib/queries/groups";
import type { Group, GroupStatus } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { Users, BookOpen } from "lucide-react";
import { GroupFormDialog } from "./_components/group-form-dialog";
import { GroupDetailPanel } from "./_components/group-detail-panel";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "forming", label: "Forming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "archived", label: "Archived" },
];

export default function GroupsPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<GroupStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const {
    data: groups,
    isLoading,
    isError,
    error,
  } = useGroupsQuery({
    organizationId: organizationId ?? "",
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const deleteMutation = useDeleteGroupMutation();

  const list = groups ?? [];
  const selectedGroup = list.find((g) => g.id === selectedId) ?? null;
  const totalEnrolled = list.reduce((s, g) => s + g.enrolled_count, 0);
  const totalCapacity = list.reduce((s, g) => s + g.max_students, 0);

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
          <p className="text-xs text-slate-400">{row.course_name}</p>
        </div>
      ),
    },
    {
      key: "teacher_name",
      label: "Teacher",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.teacher_name} size="xs" />
          <span className="text-sm text-slate-700">{row.teacher_name}</span>
        </div>
      ),
    },
    {
      key: "days_of_week",
      label: "Schedule",
      render: (_, row) => (
        <div>
          <p className="text-sm text-slate-700">{row.days_of_week.join(", ") || "—"}</p>
          <p className="text-xs text-slate-400">
            {row.start_time && row.end_time ? `${row.start_time.slice(0, 5)} – ${row.end_time.slice(0, 5)}` : "—"}
          </p>
        </div>
      ),
    },
    { key: "room", label: "Room" },
    {
      key: "enrolled_count",
      label: "Students",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (row.enrolled_count / row.max_students) * 100)}%` }} />
          </div>
          <span className="text-sm text-slate-600 whitespace-nowrap">{row.enrolled_count}/{row.max_students}</span>
        </div>
      ),
    },
    {
      key: "course_level",
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
        subtitle={`${list.length} groups running`}
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
        <StatCard label="Total Groups" value={list.length} icon={<Users2 className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Total Enrolled" value={totalEnrolled} icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Total Capacity" value={totalCapacity} icon={<BookOpen className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Occupancy Rate" value={totalCapacity ? `${Math.round((totalEnrolled / totalCapacity) * 100)}%` : "0%"} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title="All Groups"
        subtitle={`${list.length} groups`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..." />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as GroupStatus | "")} className="w-36" />
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : "Failed to load groups."}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading groups…
          </div>
        ) : (
          <DataTable columns={COLUMNS} data={list} keyField="id" emptyMessage="No groups found" onRowClick={(row) => setSelectedId(row.id)} />
        )}
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
        description={`Are you sure you want to remove ${deletingGroup?.name}? This can be restored later from the database if needed.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingGroup) return;
          try {
            await deleteMutation.mutateAsync(deletingGroup.id);
            toast.success("Group removed");
            if (selectedId === deletingGroup.id) setSelectedId(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to delete group.");
          }
        }}
      />
    </div>
  );
}

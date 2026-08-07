'use client';

import { useMemo, useState } from 'react';
import { Users, ClipboardCheck, KeyRound, Phone, ChevronLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput, Select } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth-store';
import { useMyTeacherProfileQuery } from '@/lib/queries/teachers';
import { useGroupsQuery, useMyRosterQuery } from '@/lib/queries/groups';
import { useAttendanceForGroupsQuery } from '@/lib/queries/attendance';
import type { GroupMember } from '@/lib/api/groups';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({
  member,
  attendanceRate,
  onViewProfile,
}: {
  member: GroupMember;
  attendanceRate: number;
  onViewProfile: (m: GroupMember) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center text-center gap-3">
      <Avatar name={member.student_name} size="xl" />

      <div className="space-y-1.5">
        <p className="font-semibold text-slate-900 text-base">{member.student_name}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700">
            {member.group_name}
          </span>
          <StatusBadge status={member.status} />
        </div>
      </div>

      <div className="w-full space-y-2 text-left">
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Attendance</span>
            <span className="font-medium text-slate-700">{attendanceRate}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
          <KeyRound className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <span className="truncate">{member.student_login_id}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <span>{member.student_phone}</span>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => onViewProfile(member)}>
        View Profile
      </Button>
    </div>
  );
}

// ─── Student Detail Panel ─────────────────────────────────────────────────────

function StudentDetailPanel({
  member,
  attendanceRate,
  records,
  onBack,
}: {
  member: GroupMember;
  attendanceRate: number;
  records: { id: string; date: string; status: string; notes: string | null }[];
  onBack: () => void;
}) {
  const statusColors: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-600',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-blue-100 text-blue-700',
  };

  return (
    <Card className="mt-6" noPadding>
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Avatar name={member.student_name} size="md" />
          <div>
            <p className="font-semibold text-slate-900">{member.student_name}</p>
            <p className="text-xs text-slate-500">{member.group_name}</p>
          </div>
        </div>
        <div className="ml-auto">
          <StatusBadge status={member.status} />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Personal Information</h4>
          <div className="space-y-3">
            <InfoRow icon={<KeyRound className="h-4 w-4" />} label="Login ID" value={member.student_login_id} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={member.student_phone} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Group" value={member.group_name} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Course" value={member.course_name} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3">
            <MiniStat icon={<ClipboardCheck className="h-4 w-4 text-indigo-600" />} label="Attendance" value={`${attendanceRate}%`} bg="bg-indigo-50" />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent Attendance</h4>
            {records.length === 0 ? (
              <p className="text-sm text-slate-400">No attendance records.</p>
            ) : (
              <div className="space-y-1.5">
                {records.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusColors[rec.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(rec.date)}</span>
                    </div>
                    {rec.notes && <span className="text-xs text-slate-400 truncate max-w-[140px]">{rec.notes}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400 block">{label}</span>
        <span className="text-sm text-slate-700 font-medium">{value}</span>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-bold text-slate-900 text-sm">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherStudentsPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const { data: myProfile } = useMyTeacherProfileQuery();
  const { data: groups } = useGroupsQuery({ organizationId: organizationId ?? '', teacher: myProfile?.id });
  const groupIds = useMemo(() => (groups ?? []).map((g) => g.id), [groups]);

  const { data: roster, isLoading } = useMyRosterQuery(groupIds);
  const { data: attendance } = useAttendanceForGroupsQuery(organizationId ?? '', groupIds);

  const activeRoster = useMemo(
    () => roster.filter((m) => m.status === 'active').filter((m, i, arr) => arr.findIndex((x) => x.student_profile === m.student_profile) === i),
    [roster]
  );

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function rateFor(studentProfileId: string): number {
    const records = attendance.filter((r) => r.student_profile === studentProfileId);
    if (records.length === 0) return 0;
    const present = records.filter((r) => r.status === 'present').length;
    return Math.round((present / records.length) * 100);
  }

  const filtered = activeRoster.filter((m) => {
    const matchSearch = !search || m.student_name.toLowerCase().includes(search.toLowerCase()) || m.student_login_id.toLowerCase().includes(search.toLowerCase());
    const matchGroup = !groupFilter || m.group === groupFilter;
    return matchSearch && matchGroup;
  });

  const selectedMember = activeRoster.find((m) => m.student_profile === selectedId) ?? null;

  const totalStudents = activeRoster.length;
  const avgAttendance = totalStudents > 0 ? Math.round(activeRoster.reduce((sum, m) => sum + rateFor(m.student_profile), 0) / totalStudents) : 0;

  const groupOptions = (groups ?? []).map((g) => ({ value: g.id, label: g.name }));

  const handleViewProfile = (member: GroupMember) => {
    setSelectedId(member.student_profile);
    setTimeout(() => {
      document.getElementById('student-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle="Manage and monitor your students across all groups"
        actions={
          <>
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." />
            <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} options={groupOptions} placeholder="All Groups" className="w-40" />
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Students" value={totalStudents} icon={<Users className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Avg Attendance" value={`${avgAttendance}%`} icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading students…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">No students found.</div>
          ) : (
            filtered.map((member) => (
              <StudentCard key={member.id} member={member} attendanceRate={rateFor(member.student_profile)} onViewProfile={handleViewProfile} />
            ))
          )}
        </div>
      )}

      {selectedMember && (
        <div id="student-detail">
          <StudentDetailPanel
            key={selectedMember.id}
            member={selectedMember}
            attendanceRate={rateFor(selectedMember.student_profile)}
            records={attendance
              .filter((r) => r.student_profile === selectedMember.student_profile)
              .map((r) => ({ id: r.id, date: r.date, status: r.status, notes: r.notes }))}
            onBack={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}

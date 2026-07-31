'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/badge';
import { STUDENT_ATTENDANCE, WEEKLY_ATTENDANCE_TREND, STUDENT_STATS } from '@/lib/student-data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentAttendancePage() {
  const counts = {
    present: STUDENT_ATTENDANCE.filter((r) => r.status === 'present').length,
    absent: STUDENT_ATTENDANCE.filter((r) => r.status === 'absent').length,
    late: STUDENT_ATTENDANCE.filter((r) => r.status === 'late').length,
    excused: STUDENT_ATTENDANCE.filter((r) => r.status === 'excused').length,
  };

  const sorted = [...STUDENT_ATTENDANCE].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Your attendance history across all courses" />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance Rate"
          value={`${STUDENT_STATS.attendanceRate}%`}
          icon={<CheckCircle2 className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Present"
          value={counts.present}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Absent"
          value={counts.absent}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
        <StatCard
          label="Late / Excused"
          value={counts.late + counts.excused}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2">
          <Card title="Weekly Attendance Rate" subtitle="Last 6 weeks">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={WEEKLY_ATTENDANCE_TREND} margin={{ top: 4, right: 0, bottom: 0, left: -20 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  formatter={(value: unknown) => [`${value}%`, 'Attendance']}
                />
                <Bar dataKey="rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Legend / breakdown */}
        <Card title="Breakdown" subtitle="All-time record">
          <div className="space-y-4">
            {[
              { label: 'Present', value: counts.present, color: 'bg-emerald-400' },
              { label: 'Absent', value: counts.absent, color: 'bg-red-400' },
              { label: 'Late', value: counts.late, color: 'bg-amber-400' },
              { label: 'Excused', value: counts.excused, color: 'bg-blue-400' },
            ].map((row) => {
              const total = STUDENT_ATTENDANCE.length;
              const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-semibold text-slate-800">{row.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card title="Attendance History" subtitle={`${sorted.length} recorded sessions`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Course</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((rec) => (
                <tr key={rec.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3 text-sm text-slate-700">{formatDate(rec.date)}</td>
                  <td className="py-3.5 px-3 text-sm text-slate-600">{rec.groupName}</td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-400">{'note' in rec ? rec.note ?? '—' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

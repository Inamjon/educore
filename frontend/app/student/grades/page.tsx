'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, GraduationCap, Trophy, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { STUDENT_GRADES, GRADE_TREND_DATA } from '@/lib/student-data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLetterVariant(letter: string): 'success' | 'info' | 'warning' | 'danger' {
  if (letter.startsWith('A')) return 'success';
  if (letter.startsWith('B')) return 'info';
  if (letter.startsWith('C')) return 'warning';
  return 'danger';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentGradesPage() {
  const overallAvg = Math.round(
    STUDENT_GRADES.reduce((s, g) => s + g.finalGrade, 0) / STUDENT_GRADES.length
  );
  const topSubject = STUDENT_GRADES.reduce((best, g) => (g.finalGrade > best.finalGrade ? g : best));
  const needsAttention = STUDENT_GRADES.reduce((worst, g) => (g.finalGrade < worst.finalGrade ? g : worst));

  const barData = STUDENT_GRADES.map((g) => ({
    name: g.subject,
    Assignment: g.assignmentScore,
    Exam: g.examScore,
    Participation: g.participation,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Grades" subtitle="Your performance across all enrolled courses" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Overall Average"
          value={`${overallAvg}%`}
          icon={<GraduationCap className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Strongest Subject"
          value={topSubject.subject}
          icon={<Trophy className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Needs Attention"
          value={needsAttention.subject}
          icon={<BookOpen className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* Subject Table */}
      <Card title="Grade Breakdown" subtitle={`${STUDENT_GRADES.length} enrolled subjects`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Subject</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Teacher</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Assignment</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Exam</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Participation</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Final Grade</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {STUDENT_GRADES.map((g) => (
                <tr key={g.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="text-sm font-semibold text-slate-900">{g.subject}</span>
                    <p className="text-xs text-slate-400">{g.groupName}</p>
                  </td>
                  <td className="py-3.5 px-3 text-sm text-slate-600">{g.teacherName}</td>
                  <td className="py-3.5 px-3 text-sm text-slate-600">{g.assignmentScore}</td>
                  <td className="py-3.5 px-3 text-sm text-slate-600">{g.examScore}</td>
                  <td className="py-3.5 px-3 text-sm text-slate-600">{g.participation}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900">{g.finalGrade}</span>
                    <Badge label={g.letterGrade} variant={getLetterVariant(g.letterGrade)} className="ml-2" />
                  </td>
                  <td className="py-3.5 px-3">
                    {(() => {
                      const trend = g.trend as 'up' | 'down' | 'stable';
                      if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
                      if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
                      return <Minus className="h-4 w-4 text-slate-400" />;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject comparison bar chart */}
        <Card title="Score Comparison" subtitle="Assignment vs. exam vs. participation">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: '12px' }}
              />
              <Bar dataKey="Assignment" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Exam" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Participation" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" /> Assignment
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500 inline-block" /> Exam
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-200 inline-block" /> Participation
            </span>
          </div>
        </Card>

        {/* Grade trend */}
        <Card title="Grade Trend" subtitle="Overall average over recent months">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={GRADE_TREND_DATA} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

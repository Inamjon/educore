'use client';

import { Users, Clock, MapPin, Calendar, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { STUDENT_COURSES } from '@/lib/student-data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: (typeof STUDENT_COURSES)[number] }) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
      style={{ borderTop: `4px solid ${course.courseColor}` }}
    >
      <div className="p-5 pb-0">
        <h3 className="text-base font-bold text-slate-900">{course.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{course.courseName}</p>
        <p className="text-xs text-slate-400 mt-1">Taught by {course.teacherName}</p>
      </div>

      <div className="px-5 pt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.classmatesCount} classmates
            </span>
            <span className="text-xs text-slate-400">
              Next: <span className="font-medium text-slate-700">{formatDate(course.nextLesson)}</span>
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${course.progress}%`, backgroundColor: course.courseColor }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{course.progress}% course progress</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span>{course.days.join(', ')}</span>
          <span className="text-slate-300">·</span>
          <span>{course.startTime} – {course.endTime}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
            {course.room}
          </span>
        </div>
      </div>

      <div className="p-5 pt-4 mt-auto flex gap-2">
        <a
          href="/student/schedule"
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
          Schedule
        </a>
        <a
          href="/student/homework"
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          Homework
        </a>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentGroupsPage() {
  return (
    <div>
      <PageHeader title="My Courses" subtitle={`${STUDENT_COURSES.length} enrolled courses`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {STUDENT_COURSES.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

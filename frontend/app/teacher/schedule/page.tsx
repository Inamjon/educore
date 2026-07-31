'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TEACHER_SCHEDULE } from '@/lib/teacher-data';
import { LessonDetailDialog } from './_components/lesson-detail-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  groupId: string;
  groupName: string;
  courseColor: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  topic: string;
  status: 'completed' | 'scheduled' | 'cancelled';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 8;
const HOUR_END = 18;
const HOURS: string[] = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
  const h = HOUR_START + i;
  return `${String(h).padStart(2, '0')}:00`;
});

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a Date as a YYYY-MM-DD string using its local calendar date (not toISOString, which
 * converts to UTC and shifts the date backward a day in timezones ahead of UTC). */
function toLocalIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the Monday of the week containing a given date */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Build an array of 7 ISO date strings (Mon–Sun) for the week starting at monday */
function buildWeek(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toLocalIso(d);
  });
}

function formatDayHeader(iso: string, idx: number): string {
  const d = new Date(iso + 'T00:00:00');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${DAY_LABELS[idx]} ${month} ${d.getDate()}`;
}

function formatWeekRange(week: string[]): string {
  const start = new Date(week[0] + 'T00:00:00');
  const end = new Date(week[6] + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', {
    ...opts,
    year: 'numeric',
  })}`;
}

/** Top offset and height (px) for a lesson block, 60px per hour */
function getLessonStyle(startTime: string, endTime: string): { top: string; height: string } {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = (sh - HOUR_START) * 60 + sm;
  const endMin = (eh - HOUR_START) * 60 + em;
  return {
    top: `${startMin}px`,
    height: `${Math.max(endMin - startMin, 40)}px`,
  };
}

function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hNum = parseInt(h);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDateBadge(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherSchedulePage() {
  const todayIso = '2026-07-04';
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const currentMonday = useMemo(() => {
    const base = getMondayOf(new Date(todayIso + 'T12:00:00'));
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDates = useMemo(() => buildWeek(currentMonday), [currentMonday]);
  const weekRange = useMemo(() => formatWeekRange(weekDates), [weekDates]);

  // Lessons in this week, cast to typed array
  const weekLessons = useMemo(
    () =>
      (TEACHER_SCHEDULE as Lesson[]).filter((l) => weekDates.includes(l.date)),
    [weekDates]
  );

  // Today's lessons (only relevant when viewing the current week)
  const todayLessons = useMemo(
    () =>
      (TEACHER_SCHEDULE as Lesson[])
        .filter((l) => l.date === todayIso)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    []
  );

  // Upcoming: next 5 lessons after today, sorted by date then time
  const upcomingLessons = useMemo(
    () =>
      (TEACHER_SCHEDULE as Lesson[])
        .filter((l) => l.date > todayIso && l.status !== 'cancelled')
        .sort((a, b) =>
          a.date !== b.date
            ? a.date.localeCompare(b.date)
            : a.startTime.localeCompare(b.startTime)
        )
        .slice(0, 5),
    []
  );

  const statusVariant = (status: Lesson['status']) => {
    if (status === 'completed') return 'success' as const;
    if (status === 'cancelled') return 'secondary' as const;
    return 'info' as const;
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        title="Schedule"
        subtitle={`Week of ${weekRange}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={weekOffset === 0 ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((o) => o + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* ── Weekly Calendar Grid ─────────────────────────────────────── */}
      <Card noPadding className="overflow-hidden">
        {/* Day headers */}
        <div
          className="grid border-b border-slate-100"
          style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
        >
          <div className="border-r border-slate-100 p-3" />
          {weekDates.map((date, idx) => {
            const isToday = date === todayIso;
            return (
              <div
                key={date}
                className={`p-3 text-center border-r border-slate-100 last:border-0 ${
                  isToday ? 'bg-indigo-50' : ''
                }`}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    isToday ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {DAY_LABELS[idx]}
                </p>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    isToday ? 'text-indigo-700' : 'text-slate-800'
                  }`}
                >
                  {formatDayHeader(date, idx).split(' ').slice(1).join(' ')}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: '60px repeat(7, 1fr)',
              minHeight: `${(HOUR_END - HOUR_START + 1) * 60}px`,
            }}
          >
            {/* Time labels column */}
            <div className="border-r border-slate-100">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="h-[60px] border-b border-slate-50 flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-[10px] text-slate-400">{h}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((date, idx) => {
              const dayLessons = weekLessons.filter((l) => l.date === date);
              const isToday = date === todayIso;

              return (
                <div
                  key={date}
                  className={`relative border-r border-slate-100 last:border-0 ${
                    isToday ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <div key={h} className="h-[60px] border-b border-slate-50" />
                  ))}

                  {/* Lesson blocks */}
                  {dayLessons.map((lesson) => {
                    const style = getLessonStyle(lesson.startTime, lesson.endTime);
                    const isCancelled = lesson.status === 'cancelled';
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer transition-opacity ${
                          isCancelled ? 'opacity-50' : 'hover:opacity-90'
                        }`}
                        style={{
                          top: style.top,
                          height: style.height,
                          backgroundColor: `${lesson.courseColor}18`,
                          borderLeft: `3px solid ${lesson.courseColor}`,
                        }}
                      >
                        <p
                          className="text-[11px] font-semibold truncate leading-tight"
                          style={{ color: lesson.courseColor }}
                        >
                          {lesson.groupName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                          {lesson.topic}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {lesson.startTime}–{lesson.endTime}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Group color legend ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        {Array.from(
          new Map(
            (TEACHER_SCHEDULE as Lesson[]).map((l) => [l.groupId, l])
          ).values()
        ).map((l) => (
          <div key={l.groupId} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: l.courseColor }}
            />
            <span className="text-xs text-slate-600">{l.groupName}</span>
          </div>
        ))}
      </div>

      {/* ── Bottom: Today's Timetable + Upcoming ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Timetable */}
        <Card
          title="Today's Timetable"
          subtitle={`Saturday, July 4, 2026 · ${todayLessons.length} lesson${
            todayLessons.length !== 1 ? 's' : ''
          }`}
        >
          {todayLessons.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No lessons scheduled for today.
            </p>
          ) : (
            <ol className="space-y-3">
              {todayLessons.map((lesson, i) => (
                <li
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className="flex items-start gap-3 cursor-pointer hover:bg-slate-50 rounded-xl -mx-2 px-2 py-1 transition-colors"
                >
                  {/* Number */}
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: lesson.courseColor }}
                  >
                    {i + 1}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {lesson.groupName}
                      </span>
                      <Badge
                        label={lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                        variant={statusVariant(lesson.status)}
                      />
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{lesson.topic}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(lesson.startTime)} – {formatTime(lesson.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lesson.room}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Upcoming Lessons */}
        <Card
          title="Upcoming Lessons"
          subtitle="Next 5 scheduled lessons"
        >
          {upcomingLessons.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No upcoming lessons found.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {/* Colored left accent */}
                  <div
                    className="h-10 w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: lesson.courseColor }}
                  />

                  {/* Date badge */}
                  <div
                    className="flex-shrink-0 text-center rounded-xl px-2.5 py-1.5 min-w-[48px]"
                    style={{
                      backgroundColor: `${lesson.courseColor}15`,
                    }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase leading-none"
                      style={{ color: lesson.courseColor }}
                    >
                      {new Date(lesson.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p
                      className="text-base font-bold leading-tight"
                      style={{ color: lesson.courseColor }}
                    >
                      {new Date(lesson.date + 'T00:00:00').getDate()}
                    </p>
                  </div>

                  {/* Lesson details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {lesson.groupName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{lesson.topic}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lesson.startTime}–{lesson.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lesson.room}
                      </span>
                    </div>
                  </div>

                  {/* Day-of-week label */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-slate-600">
                      {new Date(lesson.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDateBadge(lesson.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <LessonDetailDialog lesson={selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)} />
    </div>
  );
}

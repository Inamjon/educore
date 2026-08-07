"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLessonsQuery } from "@/lib/queries/schedule";
import type { Lesson } from "@/lib/api/schedule";
import { LessonDetailDialog } from "./_components/lesson-detail-dialog";
import { LessonFormDialog } from "./_components/lesson-form-dialog";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_START = 8;
const HOURS = Array.from({ length: 11 }, (_, i) => `${String(HOUR_START + i).padStart(2, "0")}:00`);

const VIEW_OPTIONS = [
  { value: "week", label: "Week View" },
  { value: "list", label: "List View" },
];

/** Formats a Date as a YYYY-MM-DD string using its local calendar date (not
 * toISOString, which converts to UTC and shifts the date backward a day in
 * timezones ahead of UTC — see app/teacher/schedule/page.tsx's toLocalIso
 * for the bug this fixes). */
function toLocalIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeek(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day: DAYS[i],
      date: toLocalIso(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

function formatWeekRange(week: { date: string }[]) {
  const start = new Date(week[0].date + "T00:00:00");
  const end = new Date(week[6].date + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

function getLessonStyle(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = (sh - HOUR_START) * 60 + sm;
  const durationMinutes = (eh - HOUR_START) * 60 + em - startMinutes;
  const top = (startMinutes / 60) * 60;
  const height = (durationMinutes / 60) * 60;
  return { top: `${top}px`, height: `${Math.max(height, 40)}px` };
}

export default function SchedulePage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [view, setView] = useState<"week" | "list">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const currentMonday = useMemo(() => {
    const base = getMondayOf(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDates = useMemo(() => buildWeek(currentMonday), [currentMonday]);
  const weekRange = useMemo(() => formatWeekRange(weekDates), [weekDates]);

  const { data: lessons = [], isLoading } = useLessonsQuery({
    organizationId: organizationId ?? "",
    dateFrom: weekDates[0].date,
    dateTo: weekDates[6].date,
  });
  // List view isn't week-bound — widen the window instead of re-deriving a
  // second query shape for one toggle state.
  const { data: allLessons = [] } = useLessonsQuery({
    organizationId: view === "list" ? organizationId ?? "" : "",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        subtitle={`Week of ${weekRange}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant={weekOffset === 0 ? "secondary" : "outline"} size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select
              options={VIEW_OPTIONS}
              value={view}
              onChange={(e) => setView(e.target.value as "week" | "list")}
              className="w-32"
            />
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              New Lesson
            </Button>
          </div>
        }
      />

      {view === "week" ? (
        <Card noPadding className="overflow-hidden">
          <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
            <div className="p-3 border-r border-slate-100" />
            {weekDates.map((d) => (
              <div key={d.day} className="p-3 text-center border-r border-slate-100 last:border-0">
                <p className="text-xs font-semibold text-slate-500 uppercase">{d.day}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{d.label.split(" ")[1]}</p>
              </div>
            ))}
          </div>

          <div className="relative overflow-x-auto">
            <div className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", minHeight: `${HOURS.length * 60}px` }}>
              <div className="border-r border-slate-100">
                {HOURS.map((h) => (
                  <div key={h} className="h-[60px] border-b border-slate-50 flex items-start justify-end pr-2 pt-1">
                    <span className="text-[10px] text-slate-400">{h}</span>
                  </div>
                ))}
              </div>

              {weekDates.map((d) => {
                const dayLessons = lessons.filter((l) => l.date === d.date);
                return (
                  <div key={d.date} className="relative border-r border-slate-100 last:border-0">
                    {HOURS.map((h) => (
                      <div key={h} className="h-[60px] border-b border-slate-50" />
                    ))}
                    {dayLessons.map((lesson) => {
                      const style = getLessonStyle(lesson.start_time, lesson.end_time);
                      const color = lesson.course_color || "#6366f1";
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ ...style, backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` }}
                        >
                          <p className="text-xs font-semibold truncate" style={{ color }}>
                            {lesson.group_name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{lesson.topic}</p>
                          <p className="text-[10px] text-slate-400">
                            {lesson.start_time.slice(0, 5)}–{lesson.end_time.slice(0, 5)}
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
      ) : (
        <Card noPadding title="All Lessons">
          <div className="divide-y divide-slate-50">
            {[...allLessons]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="h-10 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: lesson.course_color || "#6366f1" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{lesson.group_name}</p>
                    <p className="text-sm text-slate-400">{lesson.topic} · {lesson.teacher_name}</p>
                  </div>
                  <div className="text-sm text-slate-600 hidden sm:block">{lesson.room}</div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">
                      {lesson.start_time.slice(0, 5)} – {lesson.end_time.slice(0, 5)}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(lesson.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                  </div>
                  <StatusBadge status={lesson.status} />
                </div>
              ))}
            {allLessons.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">No lessons found.</p>
            )}
          </div>
        </Card>
      )}

      {!isLoading && lessons.length === 0 && view === "week" && (
        <p className="text-sm text-slate-400 text-center">No lessons scheduled this week.</p>
      )}

      <div className="flex flex-wrap gap-4">
        {Array.from(new Set(lessons.map((l) => l.group_name))).map((name) => {
          const lesson = lessons.find((l) => l.group_name === name)!;
          return (
            <div key={name} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: lesson.course_color || "#6366f1" }} />
              <span className="text-xs text-slate-600">{name}</span>
            </div>
          );
        })}
      </div>

      <LessonDetailDialog lesson={selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)} />
      <LessonFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

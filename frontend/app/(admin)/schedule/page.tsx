"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { LESSONS } from "@/lib/data";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

// Week of July 7–13, 2026
const WEEK_DATES = [
  { day: "Mon", date: "2026-07-07", label: "Jul 7" },
  { day: "Tue", date: "2026-07-08", label: "Jul 8" },
  { day: "Wed", date: "2026-07-09", label: "Jul 9" },
  { day: "Thu", date: "2026-07-10", label: "Jul 10" },
  { day: "Fri", date: "2026-07-11", label: "Jul 11" },
  { day: "Sat", date: "2026-07-12", label: "Jul 12" },
  { day: "Sun", date: "2026-07-13", label: "Jul 13" },
];

const VIEW_OPTIONS = [
  { value: "week", label: "Week View" },
  { value: "list", label: "List View" },
];

function getLessonStyle(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = (sh - 8) * 60 + sm;
  const durationMinutes = (eh - 8) * 60 + em - startMinutes;
  const top = (startMinutes / 60) * 60; // 60px per hour
  const height = (durationMinutes / 60) * 60;
  return { top: `${top}px`, height: `${Math.max(height, 40)}px` };
}

export default function SchedulePage() {
  const [view, setView] = useState<"week" | "list">("week");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        subtitle="Weekly lesson timetable"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 px-2">Jul 7 – 13, 2026</span>
            <Button variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select
              options={VIEW_OPTIONS}
              value={view}
              onChange={(e) => setView(e.target.value as "week" | "list")}
              className="w-32"
            />
          </div>
        }
      />

      {view === "week" ? (
        <Card noPadding className="overflow-hidden">
          {/* Header */}
          <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
            <div className="p-3 border-r border-slate-100" />
            {WEEK_DATES.map((d) => (
              <div key={d.day} className="p-3 text-center border-r border-slate-100 last:border-0">
                <p className="text-xs font-semibold text-slate-500 uppercase">{d.day}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{d.label.split(" ")[1]}</p>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="relative overflow-x-auto">
            <div className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", minHeight: `${HOURS.length * 60}px` }}>
              {/* Time column */}
              <div className="border-r border-slate-100">
                {HOURS.map((h) => (
                  <div key={h} className="h-[60px] border-b border-slate-50 flex items-start justify-end pr-2 pt-1">
                    <span className="text-[10px] text-slate-400">{h}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {WEEK_DATES.map((d) => {
                const dayLessons = LESSONS.filter((l) => l.date === d.date);
                return (
                  <div key={d.date} className="relative border-r border-slate-100 last:border-0">
                    {HOURS.map((h) => (
                      <div key={h} className="h-[60px] border-b border-slate-50" />
                    ))}
                    {dayLessons.map((lesson) => {
                      const style = getLessonStyle(lesson.startTime, lesson.endTime);
                      return (
                        <div
                          key={lesson.id}
                          className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ ...style, backgroundColor: `${lesson.color}20`, borderLeft: `3px solid ${lesson.color}` }}
                        >
                          <p className="text-xs font-semibold truncate" style={{ color: lesson.color }}>
                            {lesson.groupName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{lesson.topic}</p>
                          <p className="text-[10px] text-slate-400">{lesson.startTime}–{lesson.endTime}</p>
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
            {LESSONS.sort((a, b) => a.date.localeCompare(b.date)).map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div
                  className="h-10 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: lesson.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{lesson.groupName}</p>
                  <p className="text-sm text-slate-400">{lesson.topic} · {lesson.teacherName}</p>
                </div>
                <div className="text-sm text-slate-600 hidden sm:block">{lesson.room}</div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">{lesson.startTime} – {lesson.endTime}</p>
                  <p className="text-xs text-slate-400">{new Date(lesson.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                </div>
                <StatusBadge status={lesson.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Array.from(new Set(LESSONS.map((l) => l.groupName))).map((name) => {
          const lesson = LESSONS.find((l) => l.groupName === name)!;
          return (
            <div key={name} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: lesson.color }} />
              <span className="text-xs text-slate-600">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

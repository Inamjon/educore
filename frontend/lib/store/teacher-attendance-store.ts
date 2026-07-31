import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TEACHER_ATTENDANCE } from "@/lib/teacher-data";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
}

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: AttendanceRecord["status"];
  note?: string;
}

interface TeacherAttendanceState {
  records: AttendanceRecord[];
  recordSession: (groupId: string, groupName: string, date: string, entries: AttendanceEntry[]) => void;
}

export const useTeacherAttendanceStore = create<TeacherAttendanceState>()(
  persist(
    (set) => ({
      records: TEACHER_ATTENDANCE as AttendanceRecord[],

      recordSession: (groupId, groupName, date, entries) =>
        set((s) => {
          const withoutSession = s.records.filter(
            (r) => !(r.groupId === groupId && r.date === date)
          );
          const newRecords: AttendanceRecord[] = entries.map((e) => ({
            id: `ta${Date.now()}${e.studentId}`,
            studentId: e.studentId,
            studentName: e.studentName,
            groupId,
            groupName,
            date,
            status: e.status,
            note: e.note || undefined,
          }));
          return { records: [...newRecords, ...withoutSession] };
        }),
    }),
    { name: "educore-teacher-attendance", version: 1 }
  )
);

// ─── Shared ───────────────────────────────────────────────────────────────────

export type Status = "active" | "inactive" | "pending" | "suspended";
export type Gender = "male" | "female" | "other";
export type Role = "admin" | "teacher" | "student" | "parent";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  loginId: string;
  phone: string;
  avatar?: string;
  role: Role;
  status: Status;
  createdAt: string;
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  loginId: string;
  phone: string;
  avatar?: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  parentName: string;
  parentPhone: string;
  status: Status;
  enrolledAt: string;
  deletedAt?: string | null;
}

// ─── Teacher ──────────────────────────────────────────────────────────────────

export interface Teacher {
  id: string;
  name: string;
  loginId: string;
  phone: string;
  avatar?: string;
  gender: Gender;
  specialization: string;
  subjects: string[];
  groupCount: number;
  studentCount: number;
  status: Status;
  joinedAt: string;
  salary: number;
  rating: number;
  deletedAt?: string | null;
}

// Course/Group mock types were removed here (2026-08) once both got a real
// backend + real Admin pages — see lib/api/courses.ts (CourseProfile,
// CourseLevel) and lib/api/groups.ts (Group, DayOfWeek) for the real shapes.

// Admin's mock Lesson type was removed here (2026-08-07) once the real
// Schedule backend + Admin page landed — see lib/api/schedule.ts::Lesson.

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  groupId: string;
  groupName: string;
  lessonId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export type PaymentStatus = "paid" | "pending" | "overdue" | "cancelled";
export type PaymentMethod = "cash" | "card" | "transfer" | "online";

// The mock Invoice interface that used to live here was removed (2026-08)
// once the real Finance backend + Admin page landed — see lib/api/finance.ts's
// real Invoice type. Transaction below is untouched: the Admin Dashboard's
// "Recent Transactions" widget still reads TRANSACTIONS and hasn't been
// wired to real Payment data yet.

export interface Transaction {
  id: string;
  studentName: string;
  studentAvatar?: string;
  amount: number;
  method: PaymentMethod;
  description: string;
  date: string;
  status: PaymentStatus;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface StatCard {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

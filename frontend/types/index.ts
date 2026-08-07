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

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  groupId: string;
  groupName: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled";
  topic?: string;
  color: string;
}

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

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  targetRole?: Role;
  deletedAt?: string | null;
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

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

// ─── Course ───────────────────────────────────────────────────────────────────

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  name: string;
  category: string;
  level: CourseLevel;
  description: string;
  duration: number; // weeks
  lessonsCount: number;
  groupCount: number;
  studentCount: number;
  price: number;
  status: Status;
  createdAt: string;
  color: string;
  deletedAt?: string | null;
}

// ─── Group ────────────────────────────────────────────────────────────────────

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface Group {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  room: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  capacity: number;
  enrolledCount: number;
  status: Status;
  startDate: string;
  endDate: string;
  level: CourseLevel;
  deletedAt?: string | null;
}

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

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  groupName: string;
  amount: number;
  paid: number;
  balance: number;
  dueDate: string;
  status: PaymentStatus;
  createdAt: string;
  deletedAt?: string | null;
}

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

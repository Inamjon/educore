import type {
  Student,
  Teacher,
  Course,
  Group,
  Lesson,
  AttendanceRecord,
  Invoice,
  Transaction,
  Notification,
} from "@/types";

// ─── Students ─────────────────────────────────────────────────────────────────

export const STUDENTS: Student[] = [
  { id: "s1", name: "Alice Johnson", email: "alice@email.com", phone: "+1 555-0101", gender: "female", dateOfBirth: "2008-03-15", address: "123 Main St, NY", groupId: "g1", groupName: "Algebra A1", parentName: "Mary Johnson", parentPhone: "+1 555-0100", status: "active", enrolledAt: "2024-09-01", attendanceRate: 95, balance: 0, avatar: undefined },
  { id: "s2", name: "Bob Smith", email: "bob@email.com", phone: "+1 555-0102", gender: "male", dateOfBirth: "2007-07-22", address: "456 Oak Ave, NY", groupId: "g1", groupName: "Algebra A1", parentName: "Tom Smith", parentPhone: "+1 555-0099", status: "active", enrolledAt: "2024-09-01", attendanceRate: 88, balance: 150, avatar: undefined },
  { id: "s3", name: "Carol White", email: "carol@email.com", phone: "+1 555-0103", gender: "female", dateOfBirth: "2009-01-10", address: "789 Pine Rd, NY", groupId: "g2", groupName: "Physics B2", parentName: "David White", parentPhone: "+1 555-0098", status: "active", enrolledAt: "2024-09-01", attendanceRate: 92, balance: 0, avatar: undefined },
  { id: "s4", name: "Daniel Brown", email: "daniel@email.com", phone: "+1 555-0104", gender: "male", dateOfBirth: "2008-11-05", address: "321 Elm St, NY", groupId: "g2", groupName: "Physics B2", parentName: "Susan Brown", parentPhone: "+1 555-0097", status: "inactive", enrolledAt: "2024-09-01", attendanceRate: 62, balance: 300, avatar: undefined },
  { id: "s5", name: "Eva Martinez", email: "eva@email.com", phone: "+1 555-0105", gender: "female", dateOfBirth: "2007-05-18", address: "654 Maple Dr, NY", groupId: "g3", groupName: "English C1", parentName: "Carlos Martinez", parentPhone: "+1 555-0096", status: "active", enrolledAt: "2024-08-15", attendanceRate: 98, balance: 0, avatar: undefined },
  { id: "s6", name: "Frank Lee", email: "frank@email.com", phone: "+1 555-0106", gender: "male", dateOfBirth: "2009-09-30", address: "987 Cedar Ln, NY", groupId: "g3", groupName: "English C1", parentName: "Lisa Lee", parentPhone: "+1 555-0095", status: "active", enrolledAt: "2024-08-15", attendanceRate: 85, balance: 75, avatar: undefined },
  { id: "s7", name: "Grace Kim", email: "grace@email.com", phone: "+1 555-0107", gender: "female", dateOfBirth: "2008-12-20", address: "147 Birch Blvd, NY", groupId: "g4", groupName: "Chemistry D1", parentName: "James Kim", parentPhone: "+1 555-0094", status: "active", enrolledAt: "2024-09-01", attendanceRate: 91, balance: 0, avatar: undefined },
  { id: "s8", name: "Henry Davis", email: "henry@email.com", phone: "+1 555-0108", gender: "male", dateOfBirth: "2007-04-14", address: "258 Walnut Way, NY", groupId: "g4", groupName: "Chemistry D1", parentName: "Rachel Davis", parentPhone: "+1 555-0093", status: "pending", enrolledAt: "2024-10-01", attendanceRate: 78, balance: 450, avatar: undefined },
  { id: "s9", name: "Iris Chen", email: "iris@email.com", phone: "+1 555-0109", gender: "female", dateOfBirth: "2009-06-08", address: "369 Ash Ave, NY", groupId: "g5", groupName: "Biology E2", parentName: "Wei Chen", parentPhone: "+1 555-0092", status: "active", enrolledAt: "2024-09-01", attendanceRate: 96, balance: 0, avatar: undefined },
  { id: "s10", name: "Jake Wilson", email: "jake@email.com", phone: "+1 555-0110", gender: "male", dateOfBirth: "2008-08-25", address: "741 Spruce St, NY", groupId: "g5", groupName: "Biology E2", parentName: "Karen Wilson", parentPhone: "+1 555-0091", status: "active", enrolledAt: "2024-09-01", attendanceRate: 89, balance: 0, avatar: undefined },
  { id: "s11", name: "Kate Adams", email: "kate@email.com", phone: "+1 555-0111", gender: "female", dateOfBirth: "2007-02-12", address: "852 Poplar Pl, NY", groupId: "g1", groupName: "Algebra A1", parentName: "Mike Adams", parentPhone: "+1 555-0090", status: "active", enrolledAt: "2024-09-01", attendanceRate: 93, balance: 0, avatar: undefined },
  { id: "s12", name: "Liam Turner", email: "liam@email.com", phone: "+1 555-0112", gender: "male", dateOfBirth: "2009-10-17", address: "963 Oak Ct, NY", groupId: "g2", groupName: "Physics B2", parentName: "Nancy Turner", parentPhone: "+1 555-0089", status: "suspended", enrolledAt: "2024-09-01", attendanceRate: 45, balance: 600, avatar: undefined },
];

// ─── Teachers ─────────────────────────────────────────────────────────────────

export const TEACHERS: Teacher[] = [
  { id: "t1", name: "Dr. Sarah Connor", email: "sarah@educore.com", phone: "+1 555-0201", gender: "female", specialization: "Mathematics", subjects: ["Algebra", "Calculus", "Statistics"], groupCount: 3, studentCount: 45, status: "active", joinedAt: "2022-01-15", salary: 4500, rating: 4.9 },
  { id: "t2", name: "Prof. James Wilson", email: "james@educore.com", phone: "+1 555-0202", gender: "male", specialization: "Physics", subjects: ["Classical Physics", "Quantum Mechanics"], groupCount: 2, studentCount: 30, status: "active", joinedAt: "2021-08-01", salary: 4800, rating: 4.7 },
  { id: "t3", name: "Ms. Emily Carter", email: "emily@educore.com", phone: "+1 555-0203", gender: "female", specialization: "English Literature", subjects: ["English", "Writing", "Literature"], groupCount: 4, studentCount: 60, status: "active", joinedAt: "2023-02-10", salary: 3800, rating: 4.8 },
  { id: "t4", name: "Dr. Robert Chen", email: "robert@educore.com", phone: "+1 555-0204", gender: "male", specialization: "Chemistry", subjects: ["Organic Chemistry", "Inorganic Chemistry"], groupCount: 2, studentCount: 28, status: "active", joinedAt: "2022-09-01", salary: 4600, rating: 4.6 },
  { id: "t5", name: "Ms. Lisa Park", email: "lisa@educore.com", phone: "+1 555-0205", gender: "female", specialization: "Biology", subjects: ["Cell Biology", "Genetics", "Ecology"], groupCount: 3, studentCount: 42, status: "active", joinedAt: "2023-01-20", salary: 4000, rating: 4.9 },
  { id: "t6", name: "Mr. David Nguyen", email: "david@educore.com", phone: "+1 555-0206", gender: "male", specialization: "Computer Science", subjects: ["Programming", "Data Structures", "Web Dev"], groupCount: 2, studentCount: 35, status: "inactive", joinedAt: "2023-06-01", salary: 5000, rating: 4.5 },
];

// ─── Courses ──────────────────────────────────────────────────────────────────

export const COURSES: Course[] = [
  { id: "c1", name: "Algebra Fundamentals", category: "Mathematics", level: "beginner", description: "Core algebra concepts including equations, functions, and graphs.", duration: 16, lessonsCount: 48, groupCount: 3, studentCount: 45, price: 299, status: "active", createdAt: "2024-01-01", color: "#6366f1" },
  { id: "c2", name: "Classical Physics", category: "Science", level: "intermediate", description: "Mechanics, thermodynamics, waves, and electromagnetism.", duration: 20, lessonsCount: 60, groupCount: 2, studentCount: 30, price: 349, status: "active", createdAt: "2024-01-01", color: "#3b82f6" },
  { id: "c3", name: "English Communication", category: "Languages", level: "beginner", description: "Speaking, writing, and comprehension for everyday use.", duration: 12, lessonsCount: 36, groupCount: 4, studentCount: 60, price: 249, status: "active", createdAt: "2024-02-01", color: "#22c55e" },
  { id: "c4", name: "Advanced Chemistry", category: "Science", level: "advanced", description: "Organic and inorganic chemistry with lab practicals.", duration: 18, lessonsCount: 54, groupCount: 2, studentCount: 28, price: 399, status: "active", createdAt: "2024-01-15", color: "#f59e0b" },
  { id: "c5", name: "Biology & Life Sciences", category: "Science", level: "intermediate", description: "Cell biology, genetics, ecology and human anatomy.", duration: 16, lessonsCount: 48, groupCount: 3, studentCount: 42, price: 329, status: "active", createdAt: "2024-02-01", color: "#ec4899" },
  { id: "c6", name: "Web Development", category: "Technology", level: "beginner", description: "HTML, CSS, JavaScript and modern frontend frameworks.", duration: 24, lessonsCount: 72, groupCount: 2, studentCount: 35, price: 449, status: "active", createdAt: "2024-03-01", color: "#a855f7" },
];

// ─── Groups ───────────────────────────────────────────────────────────────────

export const GROUPS: Group[] = [
  { id: "g1", name: "Algebra A1", courseId: "c1", courseName: "Algebra Fundamentals", teacherId: "t1", teacherName: "Dr. Sarah Connor", room: "Room 101", days: ["Mon", "Wed", "Fri"], startTime: "09:00", endTime: "10:30", capacity: 20, enrolledCount: 15, status: "active", startDate: "2024-09-01", endDate: "2025-01-15", level: "beginner" },
  { id: "g2", name: "Physics B2", courseId: "c2", courseName: "Classical Physics", teacherId: "t2", teacherName: "Prof. James Wilson", room: "Room 205", days: ["Tue", "Thu"], startTime: "11:00", endTime: "13:00", capacity: 18, enrolledCount: 16, status: "active", startDate: "2024-09-01", endDate: "2025-02-28", level: "intermediate" },
  { id: "g3", name: "English C1", courseId: "c3", courseName: "English Communication", teacherId: "t3", teacherName: "Ms. Emily Carter", room: "Room 303", days: ["Mon", "Wed"], startTime: "14:00", endTime: "15:30", capacity: 20, enrolledCount: 18, status: "active", startDate: "2024-08-15", endDate: "2024-12-15", level: "beginner" },
  { id: "g4", name: "Chemistry D1", courseId: "c4", courseName: "Advanced Chemistry", teacherId: "t4", teacherName: "Dr. Robert Chen", room: "Lab 102", days: ["Tue", "Thu", "Sat"], startTime: "10:00", endTime: "12:00", capacity: 15, enrolledCount: 12, status: "active", startDate: "2024-09-01", endDate: "2025-02-01", level: "advanced" },
  { id: "g5", name: "Biology E2", courseId: "c5", courseName: "Biology & Life Sciences", teacherId: "t5", teacherName: "Ms. Lisa Park", room: "Lab 201", days: ["Mon", "Wed", "Fri"], startTime: "13:00", endTime: "14:30", capacity: 20, enrolledCount: 14, status: "active", startDate: "2024-09-01", endDate: "2025-01-31", level: "intermediate" },
  { id: "g6", name: "WebDev F1", courseId: "c6", courseName: "Web Development", teacherId: "t6", teacherName: "Mr. David Nguyen", room: "Lab 303", days: ["Sat", "Sun"], startTime: "10:00", endTime: "13:00", capacity: 20, enrolledCount: 20, status: "active", startDate: "2024-10-01", endDate: "2025-04-01", level: "beginner" },
];

// ─── Lessons / Schedule ───────────────────────────────────────────────────────

export const LESSONS: Lesson[] = [
  { id: "l1", groupId: "g1", groupName: "Algebra A1", courseId: "c1", courseName: "Algebra Fundamentals", teacherId: "t1", teacherName: "Dr. Sarah Connor", room: "Room 101", date: "2026-07-07", startTime: "09:00", endTime: "10:30", status: "scheduled", topic: "Linear Equations", color: "#6366f1" },
  { id: "l2", groupId: "g2", groupName: "Physics B2", courseId: "c2", courseName: "Classical Physics", teacherId: "t2", teacherName: "Prof. James Wilson", room: "Room 205", date: "2026-07-07", startTime: "11:00", endTime: "13:00", status: "scheduled", topic: "Newton's Laws", color: "#3b82f6" },
  { id: "l3", groupId: "g3", groupName: "English C1", courseId: "c3", courseName: "English Communication", teacherId: "t3", teacherName: "Ms. Emily Carter", room: "Room 303", date: "2026-07-07", startTime: "14:00", endTime: "15:30", status: "scheduled", topic: "Writing Skills", color: "#22c55e" },
  { id: "l4", groupId: "g5", groupName: "Biology E2", courseId: "c5", courseName: "Biology & Life Sciences", teacherId: "t5", teacherName: "Ms. Lisa Park", room: "Lab 201", date: "2026-07-07", startTime: "13:00", endTime: "14:30", status: "scheduled", topic: "Cell Division", color: "#ec4899" },
  { id: "l5", groupId: "g4", groupName: "Chemistry D1", courseId: "c4", courseName: "Advanced Chemistry", teacherId: "t4", teacherName: "Dr. Robert Chen", room: "Lab 102", date: "2026-07-08", startTime: "10:00", endTime: "12:00", status: "scheduled", topic: "Organic Reactions", color: "#f59e0b" },
  { id: "l6", groupId: "g1", groupName: "Algebra A1", courseId: "c1", courseName: "Algebra Fundamentals", teacherId: "t1", teacherName: "Dr. Sarah Connor", room: "Room 101", date: "2026-07-09", startTime: "09:00", endTime: "10:30", status: "scheduled", topic: "Quadratic Equations", color: "#6366f1" },
  { id: "l7", groupId: "g6", groupName: "WebDev F1", courseId: "c6", courseName: "Web Development", teacherId: "t6", teacherName: "Mr. David Nguyen", room: "Lab 303", date: "2026-07-05", startTime: "10:00", endTime: "13:00", status: "scheduled", topic: "React Hooks", color: "#a855f7" },
  { id: "l8", groupId: "g2", groupName: "Physics B2", courseId: "c2", courseName: "Classical Physics", teacherId: "t2", teacherName: "Prof. James Wilson", room: "Room 205", date: "2026-07-04", startTime: "11:00", endTime: "13:00", status: "completed", topic: "Kinematics", color: "#3b82f6" },
];

// ─── Attendance ───────────────────────────────────────────────────────────────

export const ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: "a1", studentId: "s1", studentName: "Alice Johnson", groupId: "g1", groupName: "Algebra A1", lessonId: "l1", date: "2026-07-07", status: "present" },
  { id: "a2", studentId: "s2", studentName: "Bob Smith", groupId: "g1", groupName: "Algebra A1", lessonId: "l1", date: "2026-07-07", status: "late" },
  { id: "a3", studentId: "s11", studentName: "Kate Adams", groupId: "g1", groupName: "Algebra A1", lessonId: "l1", date: "2026-07-07", status: "present" },
  { id: "a4", studentId: "s3", studentName: "Carol White", groupId: "g2", groupName: "Physics B2", lessonId: "l8", date: "2026-07-04", status: "present" },
  { id: "a5", studentId: "s4", studentName: "Daniel Brown", groupId: "g2", groupName: "Physics B2", lessonId: "l8", date: "2026-07-04", status: "absent" },
  { id: "a6", studentId: "s12", studentName: "Liam Turner", groupId: "g2", groupName: "Physics B2", lessonId: "l8", date: "2026-07-04", status: "absent" },
  { id: "a7", studentId: "s5", studentName: "Eva Martinez", groupId: "g3", groupName: "English C1", lessonId: "l3", date: "2026-07-07", status: "present" },
  { id: "a8", studentId: "s6", studentName: "Frank Lee", groupId: "g3", groupName: "English C1", lessonId: "l3", date: "2026-07-07", status: "present" },
  { id: "a9", studentId: "s7", studentName: "Grace Kim", groupId: "g4", groupName: "Chemistry D1", lessonId: "l5", date: "2026-07-08", status: "present" },
  { id: "a10", studentId: "s8", studentName: "Henry Davis", groupId: "g4", groupName: "Chemistry D1", lessonId: "l5", date: "2026-07-08", status: "excused", note: "Doctor's appointment" },
];

// ─── Finance ──────────────────────────────────────────────────────────────────

export const INVOICES: Invoice[] = [
  { id: "inv1", studentId: "s1", studentName: "Alice Johnson", groupName: "Algebra A1", amount: 299, paid: 299, balance: 0, dueDate: "2026-07-01", status: "paid", createdAt: "2026-06-01" },
  { id: "inv2", studentId: "s2", studentName: "Bob Smith", groupName: "Algebra A1", amount: 299, paid: 149, balance: 150, dueDate: "2026-07-01", status: "pending", createdAt: "2026-06-01" },
  { id: "inv3", studentId: "s3", studentName: "Carol White", groupName: "Physics B2", amount: 349, paid: 349, balance: 0, dueDate: "2026-07-01", status: "paid", createdAt: "2026-06-01" },
  { id: "inv4", studentId: "s4", studentName: "Daniel Brown", groupName: "Physics B2", amount: 349, paid: 49, balance: 300, dueDate: "2026-06-15", status: "overdue", createdAt: "2026-05-15" },
  { id: "inv5", studentId: "s5", studentName: "Eva Martinez", groupName: "English C1", amount: 249, paid: 249, balance: 0, dueDate: "2026-07-01", status: "paid", createdAt: "2026-06-01" },
  { id: "inv6", studentId: "s6", studentName: "Frank Lee", groupName: "English C1", amount: 249, paid: 174, balance: 75, dueDate: "2026-07-15", status: "pending", createdAt: "2026-06-15" },
  { id: "inv7", studentId: "s7", studentName: "Grace Kim", groupName: "Chemistry D1", amount: 399, paid: 399, balance: 0, dueDate: "2026-07-01", status: "paid", createdAt: "2026-06-01" },
  { id: "inv8", studentId: "s8", studentName: "Henry Davis", groupName: "Chemistry D1", amount: 399, paid: 0, balance: 399, dueDate: "2026-06-01", status: "overdue", createdAt: "2026-05-01" },
  { id: "inv9", studentId: "s9", studentName: "Iris Chen", groupName: "Biology E2", amount: 329, paid: 329, balance: 0, dueDate: "2026-07-01", status: "paid", createdAt: "2026-06-01" },
  { id: "inv10", studentId: "s12", studentName: "Liam Turner", groupName: "Physics B2", amount: 349, paid: 0, balance: 349, dueDate: "2026-05-01", status: "overdue", createdAt: "2026-04-01" },
];

export const TRANSACTIONS: Transaction[] = [
  { id: "tr1", studentName: "Alice Johnson", amount: 299, method: "card", description: "Monthly tuition - Algebra A1", date: "2026-06-28", status: "paid" },
  { id: "tr2", studentName: "Carol White", amount: 349, method: "transfer", description: "Monthly tuition - Physics B2", date: "2026-06-27", status: "paid" },
  { id: "tr3", studentName: "Eva Martinez", amount: 249, method: "cash", description: "Monthly tuition - English C1", date: "2026-06-25", status: "paid" },
  { id: "tr4", studentName: "Grace Kim", amount: 399, method: "online", description: "Monthly tuition - Chemistry D1", date: "2026-06-24", status: "paid" },
  { id: "tr5", studentName: "Iris Chen", amount: 329, method: "card", description: "Monthly tuition - Biology E2", date: "2026-06-23", status: "paid" },
  { id: "tr6", studentName: "Bob Smith", amount: 149, method: "cash", description: "Partial payment - Algebra A1", date: "2026-06-20", status: "paid" },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "New Student Enrolled", message: "Henry Davis has enrolled in Chemistry D1 group.", type: "info", read: false, createdAt: "2026-07-03T10:00:00Z" },
  { id: "n2", title: "Payment Overdue", message: "Daniel Brown has an overdue payment of $300.", type: "warning", read: false, createdAt: "2026-07-03T09:30:00Z" },
  { id: "n3", title: "Low Attendance Alert", message: "Liam Turner attendance dropped below 50%.", type: "error", read: false, createdAt: "2026-07-02T14:00:00Z" },
  { id: "n4", title: "Lesson Completed", message: "Physics B2 completed lesson on Kinematics.", type: "success", read: true, createdAt: "2026-07-02T13:00:00Z" },
  { id: "n5", title: "New Course Added", message: "Web Development course is now available.", type: "info", read: true, createdAt: "2026-07-01T11:00:00Z" },
  { id: "n6", title: "Payment Received", message: "Alice Johnson paid $299 for Algebra A1.", type: "success", read: true, createdAt: "2026-06-28T16:00:00Z" },
  { id: "n7", title: "Schedule Updated", message: "Biology E2 schedule has been updated for next week.", type: "info", read: true, createdAt: "2026-06-28T09:00:00Z" },
  { id: "n8", title: "Teacher Report Due", message: "Monthly teacher performance reports are due July 10.", type: "warning", read: false, createdAt: "2026-07-03T08:00:00Z" },
];

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const DASHBOARD_STATS = {
  totalStudents: 240,
  totalTeachers: 18,
  totalCourses: 12,
  totalGroups: 32,
  monthlyRevenue: 48600,
  avgAttendance: 87,
  newEnrollments: 24,
  pendingPayments: 8,
};

export const MONTHLY_REVENUE_DATA = [
  { name: "Jan", revenue: 38000, expenses: 21000 },
  { name: "Feb", revenue: 41000, expenses: 22000 },
  { name: "Mar", revenue: 39000, expenses: 20000 },
  { name: "Apr", revenue: 43000, expenses: 23000 },
  { name: "May", revenue: 45000, expenses: 24000 },
  { name: "Jun", revenue: 42000, expenses: 22500 },
  { name: "Jul", revenue: 48600, expenses: 25000 },
];

export const ATTENDANCE_TREND_DATA = [
  { name: "Mon", present: 92, absent: 8 },
  { name: "Tue", present: 88, absent: 12 },
  { name: "Wed", present: 95, absent: 5 },
  { name: "Thu", present: 85, absent: 15 },
  { name: "Fri", present: 90, absent: 10 },
  { name: "Sat", present: 78, absent: 22 },
];

export const ENROLLMENT_BY_COURSE = [
  { name: "Mathematics", value: 45, color: "#6366f1" },
  { name: "Physics", value: 30, color: "#3b82f6" },
  { name: "English", value: 60, color: "#22c55e" },
  { name: "Chemistry", value: 28, color: "#f59e0b" },
  { name: "Biology", value: 42, color: "#ec4899" },
  { name: "Web Dev", value: 35, color: "#a855f7" },
];

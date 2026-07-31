// ─── Student Profile ──────────────────────────────────────────────────────────

export const STUDENT_PROFILE = {
  id: "s1",
  name: "Alice Johnson",
  email: "student@educore.com",
  phone: "+1 555-0101",
  avatar: undefined,
  studentIdNumber: "STU-2025-0142",
  grade: "10th Grade",
  groupId: "g1",
  groupName: "Algebra A1",
  parentName: "Mary Johnson",
  parentPhone: "+1 555-0100",
  joinedAt: "2025-09-01",
  bio: "Alice is a dedicated 10th-grade student with a strong interest in mathematics and biology. She consistently participates in class discussions and enjoys collaborative problem-solving.",
};

// ─── Student Courses / Groups ─────────────────────────────────────────────────

export const STUDENT_COURSES = [
  {
    id: "g1",
    name: "Algebra A1",
    courseName: "Algebra Fundamentals",
    courseColor: "#6366f1",
    teacherName: "Dr. Sarah Connor",
    progress: 68,
    days: ["Mon", "Wed", "Fri"],
    startTime: "09:00",
    endTime: "10:30",
    room: "Room 101",
    classmatesCount: 15,
    nextLesson: "2026-07-07",
  },
  {
    id: "g4",
    name: "English Literature B",
    courseName: "English Literature",
    courseColor: "#f59e0b",
    teacherName: "Mr. James Cole",
    progress: 72,
    days: ["Tue", "Thu"],
    startTime: "10:00",
    endTime: "11:30",
    room: "Room 210",
    classmatesCount: 18,
    nextLesson: "2026-07-08",
  },
  {
    id: "g5",
    name: "Biology B1",
    courseName: "Introductory Biology",
    courseColor: "#10b981",
    teacherName: "Ms. Elena Ruiz",
    progress: 55,
    days: ["Mon", "Wed"],
    startTime: "12:00",
    endTime: "13:30",
    room: "Lab 3",
    classmatesCount: 20,
    nextLesson: "2026-07-06",
  },
];

// ─── Student Schedule ─────────────────────────────────────────────────────────

export const STUDENT_SCHEDULE = [
  { id: "ss1", groupId: "g1", groupName: "Algebra A1", courseColor: "#6366f1", teacherName: "Dr. Sarah Connor", date: "2026-07-04", startTime: "09:00", endTime: "10:30", room: "Room 101", topic: "Introduction to Polynomials", status: "completed" as const },
  { id: "ss2", groupId: "g5", groupName: "Biology B1", courseColor: "#10b981", teacherName: "Ms. Elena Ruiz", date: "2026-07-04", startTime: "12:00", endTime: "13:30", room: "Lab 3", topic: "Cell Structure Review", status: "completed" as const },
  { id: "ss3", groupId: "g4", groupName: "English Literature B", courseColor: "#f59e0b", teacherName: "Mr. James Cole", date: "2026-07-06", startTime: "10:00", endTime: "11:30", room: "Room 210", topic: "Shakespearean Sonnets", status: "scheduled" as const },
  { id: "ss4", groupId: "g5", groupName: "Biology B1", courseColor: "#10b981", teacherName: "Ms. Elena Ruiz", date: "2026-07-06", startTime: "12:00", endTime: "13:30", room: "Lab 3", topic: "Photosynthesis Basics", status: "scheduled" as const },
  { id: "ss5", groupId: "g1", groupName: "Algebra A1", courseColor: "#6366f1", teacherName: "Dr. Sarah Connor", date: "2026-07-07", startTime: "09:00", endTime: "10:30", room: "Room 101", topic: "Factoring Polynomials", status: "scheduled" as const },
  { id: "ss6", groupId: "g4", groupName: "English Literature B", courseColor: "#f59e0b", teacherName: "Mr. James Cole", date: "2026-07-08", startTime: "10:00", endTime: "11:30", room: "Room 210", topic: "Essay Structure Workshop", status: "scheduled" as const },
  { id: "ss7", groupId: "g1", groupName: "Algebra A1", courseColor: "#6366f1", teacherName: "Dr. Sarah Connor", date: "2026-07-09", startTime: "09:00", endTime: "10:30", room: "Room 101", topic: "Rational Expressions", status: "scheduled" as const },
  { id: "ss8", groupId: "g5", groupName: "Biology B1", courseColor: "#10b981", teacherName: "Ms. Elena Ruiz", date: "2026-07-08", startTime: "12:00", endTime: "13:30", room: "Lab 3", topic: "Plant Respiration", status: "scheduled" as const },
  { id: "ss9", groupId: "g1", groupName: "Algebra A1", courseColor: "#6366f1", teacherName: "Dr. Sarah Connor", date: "2026-07-10", startTime: "09:00", endTime: "10:30", room: "Room 101", topic: "Review: Mid-term Prep", status: "cancelled" as const },
  { id: "ss10", groupId: "g1", groupName: "Algebra A1", courseColor: "#6366f1", teacherName: "Dr. Sarah Connor", date: "2026-07-02", startTime: "09:00", endTime: "10:30", room: "Room 101", topic: "Polynomial Operations", status: "completed" as const },
  { id: "ss11", groupId: "g4", groupName: "English Literature B", courseColor: "#f59e0b", teacherName: "Mr. James Cole", date: "2026-07-01", startTime: "10:00", endTime: "11:30", room: "Room 210", topic: "Poetry Analysis", status: "completed" as const },
];

// ─── Student Homework ─────────────────────────────────────────────────────────

export const STUDENT_HOMEWORK = [
  {
    id: "hw1",
    title: "Polynomial Expressions Worksheet",
    groupId: "g1",
    groupName: "Algebra A1",
    courseColor: "#6366f1",
    assignedDate: "2026-07-01",
    dueDate: "2026-07-08",
    description: "Complete exercises 1–20 on polynomial addition, subtraction, and multiplication.",
    maxScore: 100,
    status: "graded" as const,
    score: 92,
    submittedAt: "2026-07-06T10:30:00Z",
    feedback: "Excellent work on multiplication! Keep it up.",
  },
  {
    id: "hw2",
    title: "Essay: Themes in Sonnet 18",
    groupId: "g4",
    groupName: "English Literature B",
    courseColor: "#f59e0b",
    assignedDate: "2026-07-02",
    dueDate: "2026-07-09",
    description: "Write a 500-word essay analyzing the central themes of Shakespeare's Sonnet 18.",
    maxScore: 100,
    status: "submitted" as const,
    submittedAt: "2026-07-08T20:15:00Z",
  },
  {
    id: "hw3",
    title: "Cell Structure Lab Report",
    groupId: "g5",
    groupName: "Biology B1",
    courseColor: "#10b981",
    assignedDate: "2026-06-30",
    dueDate: "2026-07-05",
    description: "Submit your observations and diagrams from the microscope lab session.",
    maxScore: 50,
    status: "graded" as const,
    score: 45,
    submittedAt: "2026-07-04T18:00:00Z",
    feedback: "Great diagrams. Add more detail to the nucleus labeling next time.",
  },
  {
    id: "hw4",
    title: "Factoring Quiz Preparation",
    groupId: "g1",
    groupName: "Algebra A1",
    courseColor: "#6366f1",
    assignedDate: "2026-07-04",
    dueDate: "2026-07-11",
    description: "Practice factoring by GCF, difference of squares, and trinomials.",
    maxScore: 50,
    status: "pending" as const,
  },
  {
    id: "hw5",
    title: "Photosynthesis Reflection",
    groupId: "g5",
    groupName: "Biology B1",
    courseColor: "#10b981",
    assignedDate: "2026-07-04",
    dueDate: "2026-07-12",
    description: "Write a short reflection connecting photosynthesis to plant respiration.",
    maxScore: 30,
    status: "pending" as const,
  },
  {
    id: "hw6",
    title: "Poetry Analysis Worksheet",
    groupId: "g4",
    groupName: "English Literature B",
    courseColor: "#f59e0b",
    assignedDate: "2026-06-24",
    dueDate: "2026-07-01",
    description: "Analyze meter and rhyme scheme for three assigned poems.",
    maxScore: 40,
    status: "late" as const,
  },
  {
    id: "hw7",
    title: "Rational Expressions Homework",
    groupId: "g1",
    groupName: "Algebra A1",
    courseColor: "#6366f1",
    assignedDate: "2026-07-04",
    dueDate: "2026-07-14",
    description: "Simplify, multiply, and divide rational expressions. 15 problems total.",
    maxScore: 75,
    status: "pending" as const,
  },
];

// ─── Student Grades ───────────────────────────────────────────────────────────

export const STUDENT_GRADES = [
  { id: "sgr1", subject: "Algebra", groupId: "g1", groupName: "Algebra A1", teacherName: "Dr. Sarah Connor", assignmentScore: 92, examScore: 85, participation: 90, finalGrade: 89, letterGrade: "B+", trend: "up" as const },
  { id: "sgr2", subject: "English Literature", groupId: "g4", groupName: "English Literature B", teacherName: "Mr. James Cole", assignmentScore: 78, examScore: 82, participation: 85, finalGrade: 81, letterGrade: "B-", trend: "stable" as const },
  { id: "sgr3", subject: "Biology", groupId: "g5", groupName: "Biology B1", teacherName: "Ms. Elena Ruiz", assignmentScore: 90, examScore: 76, participation: 88, finalGrade: 85, letterGrade: "B", trend: "up" as const },
];

export const GRADE_TREND_DATA = [
  { name: "Feb", score: 79 },
  { name: "Mar", score: 82 },
  { name: "Apr", score: 80 },
  { name: "May", score: 85 },
  { name: "Jun", score: 87 },
  { name: "Jul", score: 89 },
];

// ─── Student Attendance ───────────────────────────────────────────────────────

export const STUDENT_ATTENDANCE = [
  { id: "sa1", groupId: "g1", groupName: "Algebra A1", date: "2026-07-04", status: "present" as const },
  { id: "sa2", groupId: "g5", groupName: "Biology B1", date: "2026-07-04", status: "present" as const },
  { id: "sa3", groupId: "g1", groupName: "Algebra A1", date: "2026-07-02", status: "present" as const },
  { id: "sa4", groupId: "g4", groupName: "English Literature B", date: "2026-07-01", status: "late" as const, note: "Arrived 10 minutes late" },
  { id: "sa5", groupId: "g1", groupName: "Algebra A1", date: "2026-06-30", status: "present" as const },
  { id: "sa6", groupId: "g5", groupName: "Biology B1", date: "2026-06-29", status: "absent" as const, note: "Sick leave, parent notified" },
  { id: "sa7", groupId: "g4", groupName: "English Literature B", date: "2026-06-27", status: "present" as const },
  { id: "sa8", groupId: "g1", groupName: "Algebra A1", date: "2026-06-26", status: "present" as const },
  { id: "sa9", groupId: "g5", groupName: "Biology B1", date: "2026-06-25", status: "excused" as const, note: "Medical appointment" },
  { id: "sa10", groupId: "g4", groupName: "English Literature B", date: "2026-06-24", status: "present" as const },
  { id: "sa11", groupId: "g1", groupName: "Algebra A1", date: "2026-06-23", status: "present" as const },
  { id: "sa12", groupId: "g1", groupName: "Algebra A1", date: "2026-06-19", status: "late" as const, note: "Bus delay" },
  { id: "sa13", groupId: "g5", groupName: "Biology B1", date: "2026-06-18", status: "present" as const },
  { id: "sa14", groupId: "g4", groupName: "English Literature B", date: "2026-06-17", status: "present" as const },
  { id: "sa15", groupId: "g1", groupName: "Algebra A1", date: "2026-06-16", status: "present" as const },
];

export const WEEKLY_ATTENDANCE_TREND = [
  { name: "Wk 1", rate: 100 },
  { name: "Wk 2", rate: 83 },
  { name: "Wk 3", rate: 100 },
  { name: "Wk 4", rate: 92 },
  { name: "Wk 5", rate: 92 },
  { name: "Wk 6", rate: 95 },
];

// ─── Student Exams ────────────────────────────────────────────────────────────

export const STUDENT_EXAMS = [
  {
    id: "sex1",
    title: "Algebra A1 Mid-Term Exam",
    groupId: "g1",
    groupName: "Algebra A1",
    courseColor: "#6366f1",
    date: "2026-07-15",
    startTime: "09:00",
    duration: 90,
    room: "Exam Hall A",
    maxScore: 100,
    questions: 40,
    status: "upcoming" as const,
  },
  {
    id: "sex2",
    title: "English Literature Essay Exam",
    groupId: "g4",
    groupName: "English Literature B",
    courseColor: "#f59e0b",
    date: "2026-07-17",
    startTime: "10:00",
    duration: 60,
    room: "Room 210",
    maxScore: 80,
    questions: 4,
    status: "upcoming" as const,
  },
  {
    id: "sex3",
    title: "Algebra A1 Unit 1 Quiz",
    groupId: "g1",
    groupName: "Algebra A1",
    courseColor: "#6366f1",
    date: "2026-06-20",
    startTime: "09:00",
    duration: 45,
    room: "Room 101",
    maxScore: 50,
    questions: 20,
    status: "completed" as const,
    score: 44,
  },
  {
    id: "sex4",
    title: "Biology Mid-Term Quiz",
    groupId: "g5",
    groupName: "Biology B1",
    courseColor: "#10b981",
    date: "2026-06-25",
    startTime: "12:00",
    duration: 45,
    room: "Lab 3",
    maxScore: 80,
    questions: 25,
    status: "completed" as const,
    score: 68,
  },
];

// ─── Student Messages ─────────────────────────────────────────────────────────

export const STUDENT_MESSAGES = [
  {
    id: "smsg1",
    participantName: "Dr. Sarah Connor",
    participantRole: "teacher" as const,
    lastMessage: "Great job on the polynomial worksheet, Alice!",
    lastTime: "2026-07-06T11:00:00Z",
    unread: 1,
    avatar: undefined,
    messages: [
      { id: "sm1a", senderId: "s1", text: "Hi Dr. Connor, I submitted my worksheet a bit early, could you check it?", time: "2026-07-06T10:35:00Z", isMe: true },
      { id: "sm1b", senderId: "t1", text: "Great job on the polynomial worksheet, Alice!", time: "2026-07-06T11:00:00Z", isMe: false },
    ],
  },
  {
    id: "smsg2",
    participantName: "Admin Office",
    participantRole: "admin" as const,
    lastMessage: "Mid-term exam schedule has been posted. Please check your Exams page.",
    lastTime: "2026-07-03T09:00:00Z",
    unread: 1,
    avatar: undefined,
    messages: [
      { id: "sm2a", senderId: "admin", text: "Mid-term exam schedule has been posted. Please check your Exams page.", time: "2026-07-03T09:00:00Z", isMe: false },
    ],
  },
  {
    id: "smsg3",
    participantName: "Mr. James Cole",
    participantRole: "teacher" as const,
    lastMessage: "Don't forget the essay is due this Wednesday.",
    lastTime: "2026-07-02T14:20:00Z",
    unread: 0,
    avatar: undefined,
    messages: [
      { id: "sm3a", senderId: "t2", text: "Don't forget the essay is due this Wednesday.", time: "2026-07-02T14:20:00Z", isMe: false },
      { id: "sm3b", senderId: "s1", text: "Thank you for the reminder, I'm almost done!", time: "2026-07-02T14:35:00Z", isMe: true },
    ],
  },
  {
    id: "smsg4",
    participantName: "Ms. Elena Ruiz",
    participantRole: "teacher" as const,
    lastMessage: "Your lab report was well organized, nice work.",
    lastTime: "2026-06-30T16:00:00Z",
    unread: 0,
    avatar: undefined,
    messages: [
      { id: "sm4a", senderId: "t3", text: "Your lab report was well organized, nice work.", time: "2026-06-30T16:00:00Z", isMe: false },
    ],
  },
];

// ─── Student Notifications ────────────────────────────────────────────────────

export const STUDENT_NOTIFICATIONS = [
  { id: "sn1", title: "Homework Graded", message: "Your Polynomial Expressions Worksheet was graded: 92/100.", type: "success" as const, read: false, createdAt: "2026-07-06T11:05:00Z", category: "homework" as const },
  { id: "sn2", title: "New Message", message: "Dr. Sarah Connor sent you a message.", type: "info" as const, read: false, createdAt: "2026-07-06T11:00:00Z", category: "message" as const },
  { id: "sn3", title: "Exam Schedule Posted", message: "Mid-term exam schedule has been posted for Algebra A1 and English Literature B.", type: "info" as const, read: false, createdAt: "2026-07-03T09:00:00Z", category: "exam" as const },
  { id: "sn4", title: "Homework Due Soon", message: "Essay: Themes in Sonnet 18 is due on July 9.", type: "warning" as const, read: false, createdAt: "2026-07-05T08:00:00Z", category: "homework" as const },
  { id: "sn5", title: "Overdue Homework", message: "Poetry Analysis Worksheet was due on July 1 and has not been submitted.", type: "error" as const, read: false, createdAt: "2026-07-02T09:00:00Z", category: "homework" as const },
  { id: "sn6", title: "Class Cancelled", message: "Algebra A1 session on July 10 has been cancelled due to a school event.", type: "warning" as const, read: true, createdAt: "2026-07-01T12:00:00Z", category: "class" as const },
  { id: "sn7", title: "Lab Report Graded", message: "Your Cell Structure Lab Report was graded: 45/50.", type: "success" as const, read: true, createdAt: "2026-07-04T18:30:00Z", category: "homework" as const },
  { id: "sn8", title: "Attendance Reminder", message: "You were marked late for English Literature B on July 1.", type: "warning" as const, read: true, createdAt: "2026-07-01T10:30:00Z", category: "class" as const },
  { id: "sn9", title: "Welcome to EduCore", message: "Your student account has been set up successfully.", type: "success" as const, read: true, createdAt: "2025-09-01T09:00:00Z", category: "admin" as const },
];

// ─── Student Stats ────────────────────────────────────────────────────────────

export const STUDENT_STATS = {
  attendanceRate: 92,
  avgGrade: 85,
  pendingHomework: STUDENT_HOMEWORK.filter((h) => h.status === "pending" || h.status === "late").length,
  upcomingExams: STUDENT_EXAMS.filter((e) => e.status === "upcoming").length,
  unreadMessages: STUDENT_MESSAGES.reduce((sum, m) => sum + m.unread, 0),
  enrolledCourses: STUDENT_COURSES.length,
};

export type AttendanceStatus = "present" | "late" | "leave" | "absent";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
};

export type Classroom = {
  id: string;
  name: string;
  academic_year: string;
  owner_id: string;
  archived_at: string | null;
  created_at: string;
};

export type ClassroomTeacher = {
  classroom_id: string;
  teacher_id: string | null;
  teacher_email: string;
  role: "owner" | "teacher";
};

export type Student = {
  id: string;
  classroom_id: string;
  number: number;
  full_name: string;
  active: boolean;
};

export type AttendanceSession = {
  id: string;
  classroom_id: string;
  attendance_date: string;
  completed: boolean;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
};

export type StudentSummary = {
  student: Student;
  present: number;
  late: number;
  leave: number;
  absent: number;
  total: number;
  attendanceRate: number;
};

export type DailySummary = {
  date: string;
  present: number;
  late: number;
  leave: number;
  absent: number;
  totalStudents: number;
  attendanceRate: number;
};

export type AttendanceLogRecord = AttendanceRecord & {
  attendance_sessions?: AttendanceSession | null;
  students?: Pick<Student, "number" | "full_name"> | null;
};

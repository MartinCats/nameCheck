import type { AttendanceRecord, AttendanceSession, DailySummary, Student, StudentSummary } from "@/lib/types";

type RecordWithSession = AttendanceRecord & {
  attendance_sessions: AttendanceSession | null;
};

export function buildStudentSummaries(students: Student[], records: RecordWithSession[]): StudentSummary[] {
  return students.map((student) => {
    const ownRecords = records.filter((record) => record.student_id === student.id);
    const present = ownRecords.filter((record) => record.status === "present").length;
    const late = ownRecords.filter((record) => record.status === "late").length;
    const leave = ownRecords.filter((record) => record.status === "leave").length;
    const absent = ownRecords.filter((record) => record.status === "absent").length;
    const total = ownRecords.length;
    const attendanceRate = total === 0 ? 0 : ((present + late) / total) * 100;

    return { student, present, late, leave, absent, total, attendanceRate };
  });
}

export function buildDailySummaries(sessions: AttendanceSession[], records: AttendanceRecord[], totalStudents: number): DailySummary[] {
  return sessions.map((session) => {
    const sessionRecords = records.filter((record) => record.session_id === session.id);
    const present = sessionRecords.filter((record) => record.status === "present").length;
    const late = sessionRecords.filter((record) => record.status === "late").length;
    const leave = sessionRecords.filter((record) => record.status === "leave").length;
    const absent = sessionRecords.filter((record) => record.status === "absent").length;
    const attendanceRate = totalStudents === 0 ? 0 : ((present + late) / totalStudents) * 100;

    return {
      date: session.attendance_date,
      present,
      late,
      leave,
      absent,
      totalStudents,
      attendanceRate,
    };
  });
}

export function percent(value: number) {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

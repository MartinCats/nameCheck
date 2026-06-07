import { redirect } from "next/navigation";
import { buildDailySummaries, buildStudentSummaries } from "@/lib/reports";
import { getSessionUser } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import type { AttendanceRecord, AttendanceSession, Classroom, ClassroomTeacher, Student } from "@/lib/types";

export async function getAppContext() {
  const { supabase, user } = await getSessionUser();
  return { supabase, user, isConfigured: Boolean(supabase) };
}

export async function requireAppUser() {
  const context = await getAppContext();
  if (!context.isConfigured) {
    return context;
  }
  if (!context.user) {
    redirect("/login");
  }
  return context;
}

export async function loadDashboard() {
  const { supabase, user, isConfigured } = await requireAppUser();
  if (!supabase || !user) {
    return { isConfigured, classrooms: [], students: [], sessions: [], recentRecords: [] };
  }

  const today = todayISO();

  const [{ data: classrooms }, { data: students }, { data: sessions }] = await Promise.all([
    supabase.from("classrooms").select("*").is("archived_at", null).order("created_at"),
    supabase.from("students").select("id, classroom_id, active").eq("active", true),
    supabase.from("attendance_sessions").select("id, classroom_id, attendance_date").eq("attendance_date", today),
  ]);

  return {
    isConfigured,
    classrooms: (classrooms ?? []) as Classroom[],
    students: (students ?? []) as Student[],
    sessions: (sessions ?? []) as AttendanceSession[],
    recentRecords: [],
  };
}

export async function loadClassrooms({ includeArchived = false } = {}) {
  const { supabase, user, isConfigured } = await requireAppUser();
  if (!supabase || !user) {
    return { isConfigured, classrooms: [], teachers: [], students: [], recentRecords: [] };
  }

  const today = todayISO();
  const since = new Date();
  since.setDate(since.getDate() - 29);

  let classroomsQuery = supabase.from("classrooms").select("*").order("created_at");
  if (!includeArchived) {
    classroomsQuery = classroomsQuery.is("archived_at", null);
  }

  const [{ data: classrooms }, { data: teachers }, { data: students }, { data: recentSessions }] = await Promise.all([
    classroomsQuery,
    supabase.from("classroom_teachers").select("*"),
    supabase.from("students").select("*").order("number"),
    supabase.from("attendance_sessions").select("id").gte("attendance_date", since.toISOString().slice(0, 10)).lte("attendance_date", today),
  ]);

  const recentSessionIds = (recentSessions ?? []).map((session) => session.id);
  const { data: recentRecords } =
    recentSessionIds.length > 0
      ? await supabase.from("attendance_records").select("status").in("session_id", recentSessionIds)
      : { data: [] };

  return {
    isConfigured,
    classrooms: (classrooms ?? []) as Classroom[],
    teachers: (teachers ?? []) as ClassroomTeacher[],
    students: (students ?? []) as Student[],
    recentRecords: (recentRecords ?? []) as AttendanceRecord[],
  };
}

export async function loadClassroom(classroomId: string) {
  const { supabase, user, isConfigured } = await requireAppUser();
  if (!supabase || !user) {
    return { isConfigured, classroom: null, teachers: [], students: [] };
  }

  const [{ data: classroom }, { data: teachers }, { data: students }] = await Promise.all([
    supabase.from("classrooms").select("*").eq("id", classroomId).single(),
    supabase.from("classroom_teachers").select("*").eq("classroom_id", classroomId),
    supabase.from("students").select("*").eq("classroom_id", classroomId).order("number"),
  ]);

  return {
    isConfigured,
    classroom: classroom as Classroom | null,
    teachers: (teachers ?? []) as ClassroomTeacher[],
    students: (students ?? []) as Student[],
  };
}

export async function loadAttendance(classroomId: string, date: string) {
  const { supabase, user, isConfigured } = await requireAppUser();
  if (!supabase || !user) {
    return { isConfigured, classroom: null, students: [], session: null, records: [] };
  }

  const [{ data: classroom }, { data: students }, { data: session }] = await Promise.all([
    supabase.from("classrooms").select("*").eq("id", classroomId).single(),
    supabase.from("students").select("*").eq("classroom_id", classroomId).eq("active", true).order("number"),
    supabase
      .from("attendance_sessions")
      .select("*")
      .eq("classroom_id", classroomId)
      .eq("attendance_date", date)
      .maybeSingle(),
  ]);

  const { data: records } = session
    ? await supabase.from("attendance_records").select("*").eq("session_id", session.id)
    : { data: [] };

  return {
    isConfigured,
    classroom: classroom as Classroom | null,
    students: (students ?? []) as Student[],
    session: session as AttendanceSession | null,
    records: (records ?? []) as AttendanceRecord[],
  };
}

export async function loadReports(classroomId: string, from: string, to: string) {
  const { supabase, user, isConfigured } = await requireAppUser();
  if (!supabase || !user) {
    return { isConfigured, classroom: null, students: [], studentSummaries: [], dailySummaries: [], records: [] };
  }

  const [{ data: classroom }, { data: students }, { data: sessions }] = await Promise.all([
    supabase.from("classrooms").select("*").eq("id", classroomId).single(),
    supabase.from("students").select("*").eq("classroom_id", classroomId).order("number"),
    supabase
      .from("attendance_sessions")
      .select("*")
      .eq("classroom_id", classroomId)
      .gte("attendance_date", from)
      .lte("attendance_date", to)
      .order("attendance_date", { ascending: false }),
  ]);

  const sessionIds = ((sessions ?? []) as AttendanceSession[]).map((session) => session.id);
  const { data: records } =
    sessionIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("*, attendance_sessions(*), students(number, full_name)")
          .in("session_id", sessionIds)
      : { data: [] };

  const flatRecords = (records ?? []) as AttendanceRecord[];

  return {
    isConfigured,
    classroom: classroom as Classroom | null,
    students: (students ?? []) as Student[],
    studentSummaries: buildStudentSummaries((students ?? []) as Student[], records ?? []),
    dailySummaries: buildDailySummaries((sessions ?? []) as AttendanceSession[], flatRecords, ((students ?? []) as Student[]).filter((s) => s.active).length),
    records: records ?? [],
  };
}

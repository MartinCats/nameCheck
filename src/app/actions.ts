"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseStudentText } from "@/lib/import-students";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/lib/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireSupabase() {
  const { supabase, user } = await getSessionUser();
  if (!supabase) {
    throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  }
  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login?setup=1");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const siteUrl = (origin ?? (forwardedHost ? `${forwardedProto}://${forwardedHost}` : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")).replace(/\/$/, "");
  const redirectTo = `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function ensureProfile() {
  const { supabase, user } = await requireSupabase();
  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? "",
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "ครู",
  });
}

export async function createClassroom(formData: FormData) {
  const { supabase } = await requireSupabase();

  const name = text(formData, "name");
  const academicYear = text(formData, "academic_year");
  if (!name || !academicYear) {
    throw new Error("กรุณากรอกชื่อห้องเรียนและปีการศึกษา");
  }

  const { error } = await supabase.rpc("create_classroom_with_owner", {
    p_name: name,
    p_academic_year: academicYear,
  });

  if (error) {
    throw new Error("สร้างห้องเรียนไม่สำเร็จ กรุณาลองใหม่");
  }

  revalidatePath("/");
  revalidatePath("/classrooms");
}

export async function updateClassroom(formData: FormData) {
  const { supabase } = await requireSupabase();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const academicYear = text(formData, "academic_year");

  const { error } = await supabase.from("classrooms").update({ name, academic_year: academicYear }).eq("id", id);
  if (error) {
    throw new Error("บันทึกข้อมูลห้องเรียนไม่สำเร็จ");
  }

  revalidatePath("/");
  revalidatePath("/classrooms");
}

export async function deleteClassroom(formData: FormData) {
  const { supabase } = await requireSupabase();
  if (text(formData, "delete_confirm") !== "ลบถาวร") {
    throw new Error("กรุณาพิมพ์ ลบถาวร เพื่อยืนยันการลบ");
  }
  const { error } = await supabase.from("classrooms").delete().eq("id", text(formData, "id"));
  if (error) {
    throw new Error("ลบห้องเรียนไม่สำเร็จ");
  }
  revalidatePath("/");
  revalidatePath("/classrooms");
}

export async function archiveClassroom(formData: FormData) {
  const { supabase, user } = await requireSupabase();
  const id = text(formData, "id");
  await ensureClassroomOwner(supabase, id, user.id);
  const { error } = await supabase.from("classrooms").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    throw new Error("เก็บถาวรห้องเรียนไม่สำเร็จ");
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/classrooms");
  revalidatePath(`/classrooms/${id}`);
  revalidatePath("/attendance");
  revalidatePath("/reports");
}

export async function restoreClassroom(formData: FormData) {
  const { supabase, user } = await requireSupabase();
  const id = text(formData, "id");
  await ensureClassroomOwner(supabase, id, user.id);
  const { error } = await supabase.from("classrooms").update({ archived_at: null }).eq("id", id);
  if (error) {
    throw new Error("กู้คืนห้องเรียนไม่สำเร็จ");
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/classrooms");
  revalidatePath(`/classrooms/${id}`);
  revalidatePath("/attendance");
  revalidatePath("/reports");
}

export async function inviteTeacher(formData: FormData) {
  const { supabase } = await requireSupabase();
  const classroomId = text(formData, "classroom_id");
  const email = text(formData, "teacher_email").toLowerCase();

  const { count, error: countError } = await supabase
    .from("classroom_teachers")
    .select("*", { count: "exact", head: true })
    .eq("classroom_id", classroomId);

  if (countError) {
    throw new Error("ตรวจสอบจำนวนครูไม่สำเร็จ");
  }
  if ((count ?? 0) >= 2) {
    throw new Error("ห้องเรียนนี้มีครูครบ 2 คนแล้ว");
  }

  const { data: existingTeacher, error: existingTeacherError } = await supabase
    .from("classroom_teachers")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("teacher_email", email)
    .maybeSingle();

  if (existingTeacherError) {
    throw new Error("ตรวจสอบครูซ้ำไม่สำเร็จ");
  }
  if (existingTeacher) {
    throw new Error("ครูคนนี้อยู่ในห้องเรียนแล้ว");
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  const { error } = await supabase.from("classroom_teachers").insert({
    classroom_id: classroomId,
    teacher_id: profile?.id ?? null,
    teacher_email: email,
    role: "teacher",
  });

  if (error) {
    throw new Error("เชิญครูไม่สำเร็จ กรุณาตรวจสอบอีเมล");
  }

  revalidatePath("/classrooms");
}

export async function addStudent(formData: FormData) {
  const { supabase } = await requireSupabase();
  const classroomId = text(formData, "classroom_id");
  const number = Number(text(formData, "number"));
  const fullName = text(formData, "full_name");

  if (!number || !fullName) {
    throw new Error("กรุณากรอกเลขที่และชื่อนักเรียน");
  }

  await ensureUniqueStudent(supabase, classroomId, number, fullName);

  const { error } = await supabase.from("students").insert({
    classroom_id: classroomId,
    number,
    full_name: fullName,
    active: true,
  });

  if (error) {
    throw new Error("เพิ่มนักเรียนไม่สำเร็จ");
  }

  revalidatePath(`/classrooms/${classroomId}`);
}

export async function importStudents(formData: FormData) {
  const { supabase } = await requireSupabase();
  const classroomId = text(formData, "classroom_id");
  const parsed = parseStudentText(text(formData, "students"));

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.join("\n"));
  }

  const { data: existing, error: existingError } = await supabase
    .from("students")
    .select("number, full_name")
    .eq("classroom_id", classroomId);

  if (existingError) {
    throw new Error("ตรวจสอบรายชื่อนักเรียนเดิมไม่สำเร็จ");
  }

  const existingNumbers = new Set((existing ?? []).map((student) => student.number));
  const existingNames = new Set((existing ?? []).map((student) => String(student.full_name).toLowerCase()));
  const duplicate = parsed.students.find(
    (student) => existingNumbers.has(student.number) || existingNames.has(student.fullName.toLowerCase()),
  );

  if (duplicate) {
    throw new Error(`พบข้อมูลซ้ำ: เลขที่ ${duplicate.number} ${duplicate.fullName}`);
  }

  const { error } = await supabase.from("students").insert(
    parsed.students.map((student) => ({
      classroom_id: classroomId,
      number: student.number,
      full_name: student.fullName,
      active: true,
    })),
  );

  if (error) {
    throw new Error("นำเข้านักเรียนไม่สำเร็จ");
  }

  revalidatePath(`/classrooms/${classroomId}`);
}

export async function restoreStudentRoster(formData: FormData) {
  const { supabase } = await requireSupabase();
  const classroomId = text(formData, "classroom_id");
  const rawRows = text(formData, "students_json");

  let rows: Array<{ number: number; fullName: string; active: boolean }>;
  try {
    rows = JSON.parse(rawRows) as Array<{ number: number; fullName: string; active: boolean }>;
  } catch {
    throw new Error("ไฟล์รายชื่อนักเรียนไม่ถูกต้อง");
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("ไม่พบข้อมูลนักเรียนในไฟล์");
  }

  const seenNumbers = new Set<number>();
  const seenNames = new Set<string>();
  for (const row of rows) {
    if (!Number.isInteger(row.number) || row.number <= 0 || !row.fullName?.trim()) {
      throw new Error("ข้อมูลนักเรียนในไฟล์ไม่ครบถ้วน");
    }
    const normalizedName = row.fullName.trim().toLowerCase();
    if (seenNumbers.has(row.number)) {
      throw new Error(`เลขที่ ${row.number} ซ้ำในไฟล์`);
    }
    if (seenNames.has(normalizedName)) {
      throw new Error(`ชื่อ ${row.fullName} ซ้ำในไฟล์`);
    }
    seenNumbers.add(row.number);
    seenNames.add(normalizedName);
  }

  const { data: existing, error: existingError } = await supabase
    .from("students")
    .select("id, number")
    .eq("classroom_id", classroomId);

  if (existingError) {
    throw new Error("ตรวจสอบรายชื่อนักเรียนเดิมไม่สำเร็จ");
  }

  const existingByNumber = new Map((existing ?? []).map((student) => [student.number, student.id]));
  const inserts = rows
    .filter((row) => !existingByNumber.has(row.number))
    .map((row) => ({
      classroom_id: classroomId,
      number: row.number,
      full_name: row.fullName.trim(),
      active: row.active,
    }));

  const updates = rows
    .filter((row) => existingByNumber.has(row.number))
    .map((row) =>
      supabase
        .from("students")
        .update({ full_name: row.fullName.trim(), active: row.active })
        .eq("id", existingByNumber.get(row.number)),
    );

  const updateResults = await Promise.all(updates);
  if (updateResults.some((result) => result.error)) {
    throw new Error("กู้คืนรายชื่อนักเรียนไม่สำเร็จ");
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("students").insert(inserts);
    if (error) {
      throw new Error("กู้คืนรายชื่อนักเรียนไม่สำเร็จ");
    }
  }

  revalidatePath(`/classrooms/${classroomId}`);
}

export async function updateStudent(formData: FormData) {
  const { supabase } = await requireSupabase();
  const classroomId = text(formData, "classroom_id");
  const studentId = text(formData, "id");
  const number = Number(text(formData, "number"));
  const fullName = text(formData, "full_name");

  if (!number || !fullName) {
    throw new Error("กรุณากรอกเลขที่และชื่อนักเรียน");
  }

  await ensureUniqueStudent(supabase, classroomId, number, fullName, studentId);

  const { error } = await supabase
    .from("students")
    .update({
      number,
      full_name: fullName,
      active: formData.get("active") === "on",
    })
    .eq("id", studentId);

  if (error) {
    throw new Error("บันทึกข้อมูลนักเรียนไม่สำเร็จ");
  }

  revalidatePath(`/classrooms/${classroomId}`);
}

export async function saveAttendance(formData: FormData) {
  const { supabase, user } = await requireSupabase();
  const classroomId = text(formData, "classroom_id");
  const date = text(formData, "attendance_date");

  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .upsert(
      {
        classroom_id: classroomId,
        attendance_date: date,
        completed: true,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "classroom_id,attendance_date" },
    )
    .select("id")
    .single();

  if (sessionError) {
    throw new Error("สร้างรอบเช็คชื่อไม่สำเร็จ");
  }

  const records = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("status:"))
    .map(([key, value]) => ({
      session_id: session.id,
      student_id: key.replace("status:", ""),
      status: String(value) as AttendanceStatus,
      updated_at: new Date().toISOString(),
    }));

  const { error: recordsError } = await supabase
    .from("attendance_records")
    .upsert(records, { onConflict: "session_id,student_id" });

  if (recordsError) {
    throw new Error("บันทึกการเช็คชื่อไม่สำเร็จ");
  }

  revalidatePath("/");
  revalidatePath(`/attendance/${classroomId}`);
  revalidatePath(`/reports/${classroomId}`);
}

async function ensureUniqueStudent(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  classroomId: string,
  number: number,
  fullName: string,
  excludeStudentId?: string,
) {
  const { data: existing, error } = await supabase
    .from("students")
    .select("id, number, full_name")
    .eq("classroom_id", classroomId);

  if (error) {
    throw new Error("ตรวจสอบข้อมูลนักเรียนซ้ำไม่สำเร็จ");
  }

  const normalizedName = fullName.toLowerCase();
  const duplicate = (existing ?? []).find(
    (student) =>
      student.id !== excludeStudentId &&
      (student.number === number || String(student.full_name).toLowerCase() === normalizedName),
  );

  if (!duplicate) return;
  if (duplicate.number === number) {
    throw new Error(`เลขที่ ${number} มีอยู่แล้วในห้องนี้`);
  }
  throw new Error(`ชื่อ ${fullName} มีอยู่แล้วในห้องนี้`);
}

async function ensureClassroomOwner(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  classroomId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("classroom_teachers")
    .select("role")
    .eq("classroom_id", classroomId)
    .eq("teacher_id", userId)
    .eq("role", "owner")
    .maybeSingle();

  if (error || !data) {
    throw new Error("เฉพาะเจ้าของห้องเรียนเท่านั้นที่ทำรายการนี้ได้");
  }
}

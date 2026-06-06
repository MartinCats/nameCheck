import { Archive, RotateCcw, Save } from "lucide-react";
import { notFound } from "next/navigation";
import { addStudent, archiveClassroom, deleteClassroom, importStudents, inviteTeacher, restoreClassroom, restoreStudentRoster, updateClassroom, updateStudent } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { DangerDeleteClassroom } from "@/components/danger-delete-classroom";
import { FileImportButton } from "@/components/file-import";
import { RosterBackup } from "@/components/roster-backup";
import { Card, Field, SetupNotice } from "@/components/ui";
import { loadClassroom } from "@/lib/data";

export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isConfigured, classroom, teachers, students } = await loadClassroom(id);
  if (!isConfigured) return <SetupNotice />;
  if (!classroom) notFound();

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">จัดการ {classroom.name}</h1>
        <p className="text-sm text-slate-500">นักเรียน {students.length} คน · ครู {teachers.length}/2 คน</p>
        {classroom.archived_at ? <p className="mt-2 text-sm font-medium text-amber-700">ห้องเรียนนี้ถูกเก็บถาวรแล้ว</p> : null}
      </header>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-5">
          <Card className="p-4">
            <h2 className="mb-3 font-bold text-slate-950">ข้อมูลห้องเรียน</h2>
            <ActionForm action={updateClassroom} className="grid gap-3" successMessage="บันทึกข้อมูลห้องเรียนแล้ว">
              <input type="hidden" name="id" value={classroom.id} />
              <Field label="ชื่อห้องเรียน" name="name" defaultValue={classroom.name} />
              <Field label="ปีการศึกษา" name="academic_year" defaultValue={classroom.academic_year} />
              <SubmitButton>
                <Save size={16} />
                บันทึก
              </SubmitButton>
            </ActionForm>
            {classroom.archived_at ? (
              <ActionForm
                action={restoreClassroom}
                className="mt-3 grid gap-3"
                successMessage="กู้คืนห้องเรียนแล้ว"
                confirmMessage="ยืนยันกู้คืนห้องเรียนนี้?"
              >
                <input type="hidden" name="id" value={classroom.id} />
                <SubmitButton variant="secondary" className="w-full" pendingLabel="กำลังกู้คืน...">
                  <RotateCcw size={16} />
                  กู้คืนห้องเรียน
                </SubmitButton>
              </ActionForm>
            ) : (
              <ActionForm
                action={archiveClassroom}
                className="mt-3 grid gap-3"
                successMessage="เก็บถาวรห้องเรียนแล้ว"
                confirmMessage="ยืนยันเก็บถาวรห้องเรียนนี้? ประวัติการเช็คชื่อจะยังอยู่ในรายงาน"
              >
                <input type="hidden" name="id" value={classroom.id} />
                <SubmitButton variant="secondary" className="w-full" pendingLabel="กำลังเก็บถาวร...">
                  <Archive size={16} />
                  เก็บถาวรห้องเรียน
                </SubmitButton>
              </ActionForm>
            )}
          </Card>
          <DangerDeleteClassroom classroomId={classroom.id} action={deleteClassroom} />
          <Card className="p-4">
            <h2 className="mb-3 font-bold text-slate-950">สำรองรายชื่อนักเรียน</h2>
            <p className="mb-3 text-sm text-slate-500">ส่งออกหรือกู้คืนไฟล์ students.xlsx พร้อมเลขที่ ชื่อ และสถานะใช้งาน</p>
            <RosterBackup classroomId={classroom.id} students={students} restoreAction={restoreStudentRoster} />
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 font-bold text-slate-950">ครูประจำห้อง</h2>
            <div className="mb-3 grid gap-2">
              {teachers.map((teacher) => (
                <div key={teacher.teacher_email} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-800">{teacher.teacher_email}</p>
                  <p className="text-xs text-slate-500">{teacher.role === "owner" ? "เจ้าของห้อง" : "ครูร่วม"}</p>
                </div>
              ))}
            </div>
            <ActionForm action={inviteTeacher} className="grid gap-3" successMessage="เชิญครูแล้ว">
              <input type="hidden" name="classroom_id" value={classroom.id} />
              <Field label="เชิญครูด้วยอีเมล" name="teacher_email" type="email" required={teachers.length < 2} />
              <SubmitButton disabled={teachers.length >= 2} pendingLabel="กำลังเชิญ...">เชิญครู</SubmitButton>
            </ActionForm>
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 font-bold text-slate-950">เพิ่มนักเรียน</h2>
            <ActionForm action={addStudent} className="grid gap-3" successMessage="เพิ่มนักเรียนแล้ว">
              <input type="hidden" name="classroom_id" value={classroom.id} />
              <Field label="เลขที่" name="number" type="number" />
              <Field label="ชื่อ - สกุล" name="full_name" />
              <SubmitButton pendingLabel="กำลังเพิ่ม...">เพิ่มนักเรียน</SubmitButton>
            </ActionForm>
          </Card>
        </div>
        <div className="grid gap-5">
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-950">นำเข้านักเรียนหลายคน</h2>
              <FileImportButton targetId="students-import" />
            </div>
            <ActionForm action={importStudents} className="grid gap-3" successMessage="นำเข้านักเรียนแล้ว">
              <input type="hidden" name="classroom_id" value={classroom.id} />
              <textarea
                id="students-import"
                name="students"
                rows={6}
                placeholder={"1 ด.ช. สมชาย ใจดี\n2 ด.ญ. พิมพ์ชนก รักเรียน"}
                className="rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
              <SubmitButton pendingLabel="กำลังนำเข้า...">นำเข้า</SubmitButton>
            </ActionForm>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-bold text-slate-950">รายชื่อนักเรียน</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {students.map((student) => (
                <ActionForm
                  key={student.id}
                  action={updateStudent}
                  className="grid gap-2 p-3 sm:grid-cols-[80px_1fr_auto_auto] sm:items-end"
                  successMessage="บันทึกข้อมูลนักเรียนแล้ว"
                  confirmUncheckedName={student.active ? "active" : undefined}
                  confirmUncheckedMessage="ยืนยันปิดใช้งานนักเรียนคนนี้?"
                >
                  <input type="hidden" name="id" value={student.id} />
                  <input type="hidden" name="classroom_id" value={classroom.id} />
                  <Field label="เลขที่" name="number" type="number" defaultValue={student.number} />
                  <Field label="ชื่อ" name="full_name" defaultValue={student.full_name} />
                  <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" name="active" defaultChecked={student.active} />
                    ใช้งาน
                  </label>
                  <SubmitButton variant="secondary">บันทึก</SubmitButton>
                </ActionForm>
              ))}
              {students.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีนักเรียนในห้องนี้</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

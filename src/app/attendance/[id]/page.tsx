import { notFound } from "next/navigation";
import { saveAttendance } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { AppShell } from "@/components/app-shell";
import { Button, Card, SetupNotice } from "@/components/ui";
import { ATTENDANCE_STATUSES, statusTone } from "@/lib/status";
import { formatThaiDate, todayISO } from "@/lib/dates";
import { loadAttendance } from "@/lib/data";
import type { AttendanceStatus } from "@/lib/types";

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date = todayISO() } = await searchParams;
  const { isConfigured, classroom, students, records } = await loadAttendance(id, date);
  if (!isConfigured) return <SetupNotice />;
  if (!classroom) notFound();

  const statusByStudent = new Map(records.map((record) => [record.student_id, record.status]));

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">เช็คชื่อ {classroom.name}</h1>
        <p className="text-sm text-slate-500">{formatThaiDate(date)}</p>
      </header>
      <Card className="p-4">
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]" method="get">
          <input type="date" name="date" defaultValue={date} className="min-h-11 rounded-lg border border-slate-200 px-3" />
          <Button variant="secondary">เลือกวันที่</Button>
        </form>
        <ActionForm
          action={saveAttendance}
          className="grid gap-3"
          successMessage="บันทึกการเช็คชื่อแล้ว"
          confirmMessage={records.length > 0 ? "ยืนยันแก้ไขข้อมูลการเช็คชื่อของวันนี้?" : undefined}
        >
          <input type="hidden" name="classroom_id" value={classroom.id} />
          <input type="hidden" name="attendance_date" value={date} />
          {students.map((student) => {
            const current = statusByStudent.get(student.id) ?? "present";
            return (
              <div key={student.id} className="rounded-lg border border-slate-100 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-950">{student.number}. {student.full_name}</p>
                    <p className="text-xs text-slate-500">สถานะปัจจุบัน: <span className={`rounded-full border px-2 py-0.5 ${statusTone(current as AttendanceStatus)}`}>{ATTENDANCE_STATUSES.find((s) => s.value === current)?.label}</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ATTENDANCE_STATUSES.map((status) => (
                    <label key={status.value} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm font-semibold ${status.tone}`}>
                      <input className="sr-only" type="radio" name={`status:${student.id}`} value={status.value} defaultChecked={current === status.value} />
                      {status.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {students.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีนักเรียนในห้องนี้</p> : null}
          {students.length > 0 && records.length === 0 ? <p className="text-center text-sm text-slate-500">ยังไม่มีข้อมูลการเช็คชื่อ</p> : null}
          <SubmitButton className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:static" pendingLabel="กำลังบันทึก...">
            บันทึกการเช็คชื่อ
          </SubmitButton>
        </ActionForm>
      </Card>
    </AppShell>
  );
}

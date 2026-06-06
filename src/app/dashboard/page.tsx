import { CalendarCheck, Plus, Users } from "lucide-react";
import { createClassroom } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { AppShell } from "@/components/app-shell";
import { Card, Field, LinkButton, SetupNotice } from "@/components/ui";
import { formatThaiDate, todayISO, academicYearNow } from "@/lib/dates";
import { loadDashboard } from "@/lib/data";

export default async function DashboardPage() {
  const { isConfigured, classrooms, students, sessions, recentRecords } = await loadDashboard();
  if (!isConfigured) return <SetupNotice />;

  const completed = classrooms.filter((room) => sessions.some((session) => session.classroom_id === room.id)).length;
  const uncheckedRooms = classrooms.filter((room) => !sessions.some((session) => session.classroom_id === room.id));
  const attendedRecords = recentRecords.filter((record) => record.status === "present" || record.status === "late").length;
  const averageAttendance = recentRecords.length > 0 ? Math.round((attendedRecords / recentRecords.length) * 100) : 0;

  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">ภาพรวมวันนี้</p>
          <h1 className="text-2xl font-bold text-slate-950">{formatThaiDate(todayISO())}</h1>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={`เช็คชื่อแล้ววันนี้ ${completed}/${classrooms.length} ห้อง`} value={completed} />
        <Metric label="นักเรียนทั้งหมด" value={students.length} />
        <Metric label="อัตราการมาเรียนเฉลี่ย 30 วันล่าสุด" value={`${averageAttendance}%`} />
        <Metric label="ห้องที่ยังไม่เช็คชื่อวันนี้" value={uncheckedRooms.length} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
          <h2 className="mb-3 font-bold text-slate-950">ห้องเรียนของฉัน</h2>
          <div className="grid gap-3">
            {uncheckedRooms.length > 0 ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">ห้องที่ยังไม่เช็คชื่อวันนี้</p>
                <p className="mt-1 text-sm text-amber-700">{uncheckedRooms.map((room) => room.name).join(", ")}</p>
              </div>
            ) : null}
            {classrooms.map((room) => {
              const done = sessions.some((session) => session.classroom_id === room.id);
              const count = students.filter((student) => student.classroom_id === room.id).length;
              return (
                <div key={room.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="font-bold text-slate-950">{room.name}</p>
                    <p className="text-xs text-slate-500">นักเรียน {count} คน</p>
                  </div>
                  <LinkButton href={`/attendance/${room.id}`} className={done ? "bg-slate-700 hover:bg-slate-800" : ""}>
                    {done ? "แก้ไขชื่อ" : "เช็คชื่อ"}
                  </LinkButton>
                </div>
              );
            })}
            {classrooms.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีห้องเรียน</p> : null}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-950">
            <Plus size={18} />
            สร้างห้องเรียน
          </h2>
          <ActionForm action={createClassroom} className="grid gap-3" successMessage="สร้างห้องเรียนแล้ว">
            <Field label="ชื่อห้องเรียน" name="name" placeholder="ป.6/1" />
            <Field label="ปีการศึกษา" name="academic_year" defaultValue={academicYearNow()} />
            <SubmitButton pendingLabel="กำลังสร้าง...">บันทึกห้องเรียน</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        {label.includes("นักเรียน") ? <Users size={18} /> : <CalendarCheck size={18} />}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-950">{value}</p>
    </Card>
  );
}

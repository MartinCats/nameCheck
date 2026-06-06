import { AlertTriangle, CalendarCheck, CheckCircle2, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, LinkButton, SetupNotice } from "@/components/ui";
import { formatThaiDate, todayISO } from "@/lib/dates";
import { loadDashboard } from "@/lib/data";

export default async function DashboardPage() {
  const { isConfigured, classrooms, students, sessions } = await loadDashboard();
  if (!isConfigured) return <SetupNotice />;

  const completed = classrooms.filter((room) => sessions.some((session) => session.classroom_id === room.id)).length;
  const uncheckedRooms = classrooms.filter((room) => !sessions.some((session) => session.classroom_id === room.id));
  const nextRoom = uncheckedRooms[0] ?? classrooms[0];

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm font-medium text-slate-500">ภาพรวมวันนี้</p>
        <h1 className="text-2xl font-bold text-slate-950">{formatThaiDate(todayISO())}</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950">ห้องที่ยังไม่ได้เช็คชื่อวันนี้</h2>
            <p className="mt-1 text-sm text-slate-500">
              {uncheckedRooms.length > 0 ? `${uncheckedRooms.length} ห้องรอเช็คชื่อ` : "เช็คชื่อครบทุกห้องแล้ว"}
            </p>
          </div>
          {nextRoom ? <LinkButton href={`/attendance/${nextRoom.id}`}>เช็คชื่อตอนนี้</LinkButton> : null}
        </div>

        <div className="mt-4 grid gap-2">
          {uncheckedRooms.map((room) => {
            const count = students.filter((student) => student.classroom_id === room.id).length;
            return (
              <div key={room.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-3">
                <div>
                  <p className="font-semibold text-amber-900">{room.name}</p>
                  <p className="text-xs text-amber-700">นักเรียน {count} คน</p>
                </div>
                <LinkButton href={`/attendance/${room.id}`} className="min-h-10 px-3 text-xs">
                  เช็คชื่อ
                </LinkButton>
              </div>
            );
          })}
          {classrooms.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">ยังไม่มีห้องเรียน</p> : null}
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Metric icon={CalendarCheck} label="เช็คชื่อแล้ว" value={`${completed}/${classrooms.length}`} />
        <Metric icon={Users} label="นักเรียนทั้งหมด" value={students.length} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-bold text-slate-950">ห้องเรียนของฉัน</h2>
        <div className="grid gap-2">
          {classrooms.map((room) => {
            const done = sessions.some((session) => session.classroom_id === room.id);
            const count = students.filter((student) => student.classroom_id === room.id).length;
            return (
              <div key={room.id} className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{room.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{count} คน</span>
                    <span aria-hidden="true">•</span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <CheckCircle2 size={14} />
                        เช็คแล้ววันนี้
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                        <AlertTriangle size={14} />
                        ยังไม่ได้เช็ค
                      </span>
                    )}
                  </p>
                </div>
                <LinkButton href={`/attendance/${room.id}`} className={`min-h-11 shrink-0 px-3 text-sm ${done ? "bg-slate-700 hover:bg-slate-800" : ""}`}>
                  {done ? "แก้ไข" : "เช็คชื่อ"}
                </LinkButton>
              </div>
            );
          })}
          {classrooms.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">สร้างห้องเรียนได้ที่หน้าห้องเรียน</p> : null}
        </div>
      </Card>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        <Icon size={18} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-950">{value}</p>
    </Card>
  );
}

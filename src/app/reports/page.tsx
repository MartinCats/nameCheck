import { AppShell } from "@/components/app-shell";
import { Card, LinkButton, SetupNotice } from "@/components/ui";
import { loadClassrooms } from "@/lib/data";

export default async function ReportsIndexPage() {
  const { isConfigured, classrooms, students, recentRecords } = await loadClassrooms({ includeArchived: true });
  if (!isConfigured) return <SetupNotice />;
  const attendedRecords = recentRecords.filter((record) => record.status === "present" || record.status === "late").length;
  const averageAttendance = recentRecords.length > 0 ? Math.round((attendedRecords / recentRecords.length) * 100) : 0;

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">รายงาน</h1>
      </header>
      <Card className="mb-4 p-4">
        <p className="text-sm text-slate-500">อัตราการมาเรียนเฉลี่ย 30 วันล่าสุด</p>
        <p className="mt-2 text-3xl font-bold text-slate-950">{averageAttendance}%</p>
      </Card>
      <div className="grid gap-3">
        {classrooms.map((room) => (
          <Card key={room.id} className="flex items-center justify-between p-4">
            <div>
              <h2 className="font-bold text-slate-950">{room.name}</h2>
              {room.archived_at ? <p className="text-xs font-medium text-amber-700">เก็บถาวรแล้ว</p> : null}
              <p className="text-sm text-slate-500">นักเรียน {students.filter((student) => student.classroom_id === room.id).length} คน</p>
            </div>
            <LinkButton href={`/reports/${room.id}`}>ดูรายงาน</LinkButton>
          </Card>
        ))}
        {classrooms.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีห้องเรียน</p> : null}
      </div>
    </AppShell>
  );
}

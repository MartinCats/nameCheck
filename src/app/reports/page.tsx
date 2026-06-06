import { AppShell } from "@/components/app-shell";
import { Card, LinkButton, SetupNotice } from "@/components/ui";
import { loadClassrooms } from "@/lib/data";

export default async function ReportsIndexPage() {
  const { isConfigured, classrooms, students } = await loadClassrooms({ includeArchived: true });
  if (!isConfigured) return <SetupNotice />;

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">รายงาน</h1>
      </header>
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

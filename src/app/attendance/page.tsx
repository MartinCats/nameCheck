import { AppShell } from "@/components/app-shell";
import { Card, LinkButton, SetupNotice } from "@/components/ui";
import { loadClassrooms } from "@/lib/data";

export default async function AttendanceIndexPage() {
  const { isConfigured, classrooms, students } = await loadClassrooms();
  if (!isConfigured) return <SetupNotice />;

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">เลือกห้องเรียนเพื่อเช็คชื่อ</h1>
      </header>
      <div className="grid gap-3">
        {classrooms.map((room) => (
          <Card key={room.id} className="flex items-center justify-between p-4">
            <div>
              <h2 className="font-bold text-slate-950">{room.name}</h2>
              <p className="text-sm text-slate-500">นักเรียน {students.filter((student) => student.classroom_id === room.id && student.active).length} คน</p>
            </div>
            <LinkButton href={`/attendance/${room.id}`}>เช็คชื่อ</LinkButton>
          </Card>
        ))}
        {classrooms.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีห้องเรียน</p> : null}
      </div>
    </AppShell>
  );
}

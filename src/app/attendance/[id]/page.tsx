import { notFound } from "next/navigation";
import { AttendanceForm } from "@/components/attendance-form";
import { AppShell } from "@/components/app-shell";
import { DatePickerButton } from "@/components/date-picker-button";
import { Card, SetupNotice } from "@/components/ui";
import { formatThaiDate, todayISO } from "@/lib/dates";
import { loadAttendance } from "@/lib/data";

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

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">เช็คชื่อ {classroom.name}</h1>
      </header>
      <Card className="p-4">
        <div className="mb-3">
          <DatePickerButton date={date} label={formatThaiDate(date)} />
        </div>
        <AttendanceForm classroomId={classroom.id} date={date} students={students} records={records} />
      </Card>
    </AppShell>
  );
}

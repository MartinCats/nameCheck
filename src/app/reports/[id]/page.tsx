import { notFound } from "next/navigation";
import { ExportButtons } from "@/components/export-buttons";
import { AppShell } from "@/components/app-shell";
import { Button, Card, SetupNotice } from "@/components/ui";
import { formatThaiDate, todayISO } from "@/lib/dates";
import { loadReports } from "@/lib/data";
import { percent } from "@/lib/reports";
import { STATUS_LABELS, statusTone } from "@/lib/status";
import type { AttendanceLogRecord, AttendanceStatus } from "@/lib/types";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const from = query.from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const to = query.to ?? todayISO();
  const { isConfigured, classroom, studentSummaries, dailySummaries, records } = await loadReports(id, from, to);
  if (!isConfigured) return <SetupNotice />;
  if (!classroom) notFound();
  const hasReportData = dailySummaries.length > 0 || records.length > 0;
  const riskStudents = studentSummaries.filter((row) => row.absent >= 3 || row.late >= 5);

  return (
    <AppShell>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">รายงาน {classroom.name}</h1>
          <p className="text-sm text-slate-500">{formatThaiDate(from)} - {formatThaiDate(to)}</p>
        </div>
        <ExportButtons classroomName={classroom.name} studentSummaries={studentSummaries} dailySummaries={dailySummaries} />
      </header>
      <Card className="mb-5 p-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" method="get">
          <input type="date" name="from" defaultValue={from} className="min-h-11 rounded-lg border border-slate-200 px-3" />
          <input type="date" name="to" defaultValue={to} className="min-h-11 rounded-lg border border-slate-200 px-3" />
          <Button variant="secondary">กรอง</Button>
        </form>
      </Card>
      <div className="grid gap-5">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-950">สรุปรายชื่อนักเรียน</h2>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{["เลขที่", "ชื่อ", "มาเรียน", "มาสาย", "ลา", "ขาด", "รวม", "%"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSummaries.map((row) => (
                  <tr key={row.student.id}>
                    <td className="px-4 py-3">{row.student.number}</td>
                    <td className="px-4 py-3 font-medium">{row.student.full_name}</td>
                    <td className="px-4 py-3">{row.present}</td>
                    <td className="px-4 py-3">{row.late}</td>
                    <td className="px-4 py-3">{row.leave}</td>
                    <td className="px-4 py-3">{row.absent}</td>
                    <td className="px-4 py-3">{row.total}</td>
                    <td className="px-4 py-3">{percent(row.attendanceRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {studentSummaries.length === 0 || !hasReportData ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีรายงานในช่วงวันที่นี้</p> : null}
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {studentSummaries.map((row) => (
              <div key={row.student.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-bold">{row.student.number}. {row.student.full_name}</p>
                <p className="mt-2 text-sm text-slate-500">มา {row.present} · สาย {row.late} · ลา {row.leave} · ขาด {row.absent}</p>
                <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.min(row.attendanceRate, 100)}%` }} /></div>
              </div>
            ))}
            {studentSummaries.length === 0 || !hasReportData ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีรายงานในช่วงวันที่นี้</p> : null}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-950">สรุปรายวัน</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {dailySummaries.map((row) => (
              <div key={row.date} className="grid gap-2 p-4 md:grid-cols-[1fr_repeat(5,90px)]">
                <p className="font-semibold">{formatThaiDate(row.date)}</p>
                <p>มา {row.present}</p>
                <p>สาย {row.late}</p>
                <p>ลา {row.leave}</p>
                <p>ขาด {row.absent}</p>
                <p>{percent(row.attendanceRate)}%</p>
              </div>
            ))}
            {dailySummaries.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีข้อมูลการเช็คชื่อ</p> : null}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-950">นักเรียนที่ควรติดตาม</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {riskStudents.map((row) => (
              <div key={row.student.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_120px_100px_100px]">
                <p className="font-semibold">{row.student.number}. {row.student.full_name}</p>
                <p>{classroom.name}</p>
                <p>ขาด {row.absent}</p>
                <p>สาย {row.late}</p>
              </div>
            ))}
            {riskStudents.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีนักเรียนที่ควรติดตาม</p> : null}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-950">ประวัติการเช็คชื่อ</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(records as AttendanceLogRecord[]).map((record) => (
              <div key={record.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[120px_1fr_auto]">
                <p>{formatThaiDate(record.attendance_sessions?.attendance_date ?? to)}</p>
                <p>{record.students?.number}. {record.students?.full_name ?? record.student_id}</p>
                <span className={`w-fit rounded-full border px-2 py-1 text-xs font-semibold ${statusTone(record.status as AttendanceStatus)}`}>
                  {STATUS_LABELS[record.status as AttendanceStatus]}
                </span>
              </div>
            ))}
            {records.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีประวัติการเช็คชื่อ</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExportButtons } from "@/components/export-buttons";
import { ReportAttendanceHistoryList, ReportDailySummaryList } from "@/components/report-detail-lists";
import { Button, Card, SetupNotice } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { loadReports } from "@/lib/data";
import { percent } from "@/lib/reports";
import type { AttendanceLogRecord, StudentSummary } from "@/lib/types";

const THAI_SHORT_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getDate()} ${THAI_SHORT_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function studentPerformanceBadge(rate: number) {
  if (rate >= 90) {
    return {
      label: "ดีมาก",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (rate >= 75) {
    return {
      label: "ปกติ",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "ควรติดตาม",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  };
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function StudentSummaryRows({ rows, hasReportData }: { rows: StudentSummary[]; hasReportData: boolean }) {
  if (rows.length === 0 || !hasReportData) {
    return <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีรายงานในช่วงวันที่นี้</p>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {["เลขที่", "ชื่อ", "มาเรียน", "มาสาย", "ลา", "ขาด", "รวม", "%"].map((head) => (
                <th key={head} className="px-4 py-3">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const badge = studentPerformanceBadge(row.attendanceRate);

              return (
                <tr key={row.student.id}>
                  <td className="px-4 py-3">{row.student.number}</td>
                  <td className="px-4 py-3 font-medium">{row.student.full_name}</td>
                  <td className="px-4 py-3">{row.present}</td>
                  <td className="px-4 py-3">{row.late}</td>
                  <td className="px-4 py-3">{row.leave}</td>
                  <td className="px-4 py-3">{row.absent}</td>
                  <td className="px-4 py-3">{row.total}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{percent(row.attendanceRate)}%</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => {
          const badge = studentPerformanceBadge(row.attendanceRate);

          return (
            <div key={row.student.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{row.student.number}. {row.student.full_name}</p>
                  <p className="mt-1 text-sm text-slate-500">มา {row.present} • สาย {row.late} • ลา {row.leave} • ขาด {row.absent}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-emerald-700">{percent(row.attendanceRate)}%</p>
                  <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.min(row.attendanceRate, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

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
  const averageAttendanceRate =
    dailySummaries.length === 0
      ? 0
      : dailySummaries.reduce((total, row) => total + row.attendanceRate, 0) / dailySummaries.length;

  return (
    <AppShell>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">รายงาน {classroom.name}</h1>
          <p className="text-sm text-slate-500">{formatReportDate(from)} - {formatReportDate(to)}</p>
        </div>
        <div className="grid gap-2">
          <ExportButtons classroomName={classroom.name} studentSummaries={studentSummaries} dailySummaries={dailySummaries} />
          <p className="text-xs text-slate-500">ส่งออกสรุปรายชื่อนักเรียนและสรุปรายวัน</p>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <SummaryMetric label="อัตราเฉลี่ย" value={`${percent(averageAttendanceRate)}%`} />
        <SummaryMetric label="นักเรียนทั้งหมด" value={`${studentSummaries.length} คน`} />
        <SummaryMetric label="วันในรายงาน" value={`${dailySummaries.length} วัน`} />
      </div>

      <Card className="mb-5 p-4">
        <h2 className="mb-3 font-bold text-slate-950">ช่วงวันที่</h2>
        <form className="grid gap-3" method="get">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              จากวันที่
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                {formatReportDate(from)}
              </span>
              <input type="date" name="from" defaultValue={from} className="min-h-11 rounded-lg border border-slate-200 px-3" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              ถึงวันที่
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                {formatReportDate(to)}
              </span>
              <input type="date" name="to" defaultValue={to} className="min-h-11 rounded-lg border border-slate-200 px-3" />
            </label>
          </div>
          <Button variant="secondary" className="w-full">ดูรายงาน</Button>
        </form>
      </Card>

      <div className="grid gap-5">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-950">สรุปรายชื่อนักเรียน</h2>
          </div>
          <StudentSummaryRows rows={studentSummaries} hasReportData={hasReportData} />
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h2 className="font-bold text-slate-950">สรุปรายวัน ({dailySummaries.length} วัน)</h2>
              <p className="text-xs text-slate-500">แสดงล่าสุด 7 วัน</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-500">อัตราเฉลี่ย</p>
              <p className="text-xl font-bold text-emerald-700">{percent(averageAttendanceRate)}%</p>
            </div>
          </div>
          <ReportDailySummaryList dailySummaries={dailySummaries} />
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-950">นักเรียนที่ควรติดตาม</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {riskStudents.map((row) => (
              <div key={row.student.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{row.student.number}. {row.student.full_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{classroom.name}</p>
                </div>
                <p className="shrink-0 text-right text-xs font-semibold text-amber-700">ขาด {row.absent} • สาย {row.late}</p>
              </div>
            ))}
            {riskStudents.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีนักเรียนที่ควรติดตาม</p> : null}
          </div>
        </Card>

        <Card className="overflow-hidden opacity-90">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-700">ประวัติการเช็คชื่อ</h2>
            <p className="text-xs text-slate-500">แสดงล่าสุด 10 รายการ</p>
          </div>
          <ReportAttendanceHistoryList records={records as AttendanceLogRecord[]} fallbackDate={to} />
        </Card>
      </div>
    </AppShell>
  );
}

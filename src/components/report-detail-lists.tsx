"use client";

import { useState } from "react";
import { percent } from "@/lib/reports";
import { STATUS_LABELS, statusTone } from "@/lib/status";
import type { AttendanceLogRecord, AttendanceStatus, DailySummary } from "@/lib/types";

const THAI_SHORT_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getDate()} ${THAI_SHORT_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}

export function ReportDailySummaryList({ dailySummaries }: { dailySummaries: DailySummary[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleSummaries = expanded ? dailySummaries : dailySummaries.slice(0, 7);

  return (
    <>
      <div className="divide-y divide-slate-100">
        {visibleSummaries.map((row) => (
          <div key={row.date} className="grid gap-2 p-3 md:grid-cols-[1fr_repeat(5,90px)] md:p-4">
            <div>
              <p className="font-semibold text-slate-950">{formatReportDate(row.date)}</p>
              <p className="mt-1 text-sm text-slate-500 md:hidden">มา {row.present} • สาย {row.late} • ลา {row.leave} • ขาด {row.absent}</p>
            </div>
            <p className="hidden md:block">มา {row.present}</p>
            <p className="hidden md:block">สาย {row.late}</p>
            <p className="hidden md:block">ลา {row.leave}</p>
            <p className="hidden md:block">ขาด {row.absent}</p>
            <p className="text-xl font-bold text-emerald-700 md:text-base md:text-slate-950">{percent(row.attendanceRate)}%</p>
          </div>
        ))}
        {dailySummaries.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p> : null}
      </div>
      {dailySummaries.length > 7 ? (
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-11 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.99]"
          >
            {expanded ? "ซ่อน" : "ดูทั้งหมด"}
          </button>
        </div>
      ) : null}
    </>
  );
}

export function ReportAttendanceHistoryList({ records, fallbackDate }: { records: AttendanceLogRecord[]; fallbackDate: string }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRecords = expanded ? records : records.slice(0, 10);

  return (
    <>
      <div className="divide-y divide-slate-100">
        {visibleRecords.map((record) => (
          <div key={record.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[120px_1fr_auto] sm:gap-2">
            <p className="text-xs font-medium text-slate-500">{formatReportDate(record.attendance_sessions?.attendance_date ?? fallbackDate)}</p>
            <p className="truncate text-slate-600">{record.students?.number}. {record.students?.full_name ?? record.student_id}</p>
            <span className={`w-fit rounded-full border px-2 py-1 text-xs font-semibold ${statusTone(record.status as AttendanceStatus)}`}>
              {STATUS_LABELS[record.status as AttendanceStatus]}
            </span>
          </div>
        ))}
        {records.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีประวัติการเช็คชื่อ</p> : null}
      </div>
      {records.length > 10 ? (
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
          >
            {expanded ? "ซ่อน" : "ดูทั้งหมด"}
          </button>
        </div>
      ) : null}
    </>
  );
}

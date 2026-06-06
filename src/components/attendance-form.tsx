"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { saveAttendance } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { ATTENDANCE_STATUSES, statusTone } from "@/lib/status";
import type { AttendanceRecord, AttendanceStatus, Student } from "@/lib/types";

export function AttendanceForm({
  classroomId,
  date,
  students,
  records,
}: {
  classroomId: string;
  date: string;
  students: Student[];
  records: AttendanceRecord[];
}) {
  const initialStatuses = useMemo(() => {
    const statusByStudent = new Map(records.map((record) => [record.student_id, record.status]));
    return Object.fromEntries(students.map((student) => [student.id, statusByStudent.get(student.id) ?? "present"])) as Record<
      string,
      AttendanceStatus
    >;
  }, [records, students]);
  const [statuses, setStatuses] = useState(initialStatuses);

  const counts = ATTENDANCE_STATUSES.map((status) => ({
    ...status,
    count: Object.values(statuses).filter((value) => value === status.value).length,
  }));

  return (
    <ActionForm
      action={saveAttendance}
      className="grid gap-2"
      successMessage="บันทึกการเช็คชื่อแล้ว"
      confirmMessage={records.length > 0 ? "ยืนยันแก้ไขข้อมูลการเช็คชื่อของวันนี้?" : undefined}
    >
      <input type="hidden" name="classroom_id" value={classroomId} />
      <input type="hidden" name="attendance_date" value={date} />

      <div className="sticky top-0 z-20 -mx-4 grid grid-cols-2 gap-1.5 border-y border-slate-100 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
        {counts.map((status) => (
          <div key={status.value} className={`flex min-h-9 items-center justify-between rounded-lg border px-3 py-1.5 ${status.tone}`}>
            <p className="text-xs font-bold leading-none">{status.shortLabel}</p>
            <p className="text-base font-bold leading-none">{status.count}</p>
          </div>
        ))}
      </div>

      {students.map((student) => {
        const current = statuses[student.id] ?? "present";
        return (
          <div key={student.id} className="rounded-lg border border-slate-100 bg-white px-2 py-1.5">
            <div className="mb-1 flex min-h-6 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-bold leading-5 text-slate-950">
                {student.number}. {student.full_name}
              </p>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${statusTone(current)}`}>
                {ATTENDANCE_STATUSES.find((status) => status.value === current)?.shortLabel}
              </span>
            </div>
            <div className="grid w-full grid-cols-4 gap-1">
              {ATTENDANCE_STATUSES.map((status) => {
                const selected = current === status.value;
                return (
                  <label
                    key={status.value}
                    className={`relative flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-1 text-xs font-bold transition ${
                      selected ? `${status.tone} border-2 shadow-sm ring-2 ring-emerald-100` : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name={`status:${student.id}`}
                      value={status.value}
                      checked={selected}
                      onChange={() => setStatuses((previous) => ({ ...previous, [student.id]: status.value }))}
                    />
                    {selected ? <Check className="mr-1" size={13} strokeWidth={3} /> : null}
                    {status.shortLabel}
                  </label>
                );
              })}
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
  );
}

"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import ExcelJS from "exceljs";
import { ActionForm, SubmitButton } from "@/components/action-form";
import type { Student } from "@/lib/types";

type RestoreAction = (formData: FormData) => Promise<void>;

type ImportStatus = {
  type: "success" | "error";
  message: string;
} | null;

export function RosterBackup({
  classroomId,
  students,
  restoreAction,
}: {
  classroomId: string;
  students: Student[];
  restoreAction: RestoreAction;
}) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<ImportStatus>(null);
  const [readyCount, setReadyCount] = useState(0);

  async function exportRoster() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(["student number", "student name", "active status"]);
    students.forEach((student) => {
      sheet.addRow([student.number, student.full_name, student.active ? "active" : "inactive"]);
    });
    sheet.columns.forEach((column) => {
      column.width = 22;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importRoster(file: File) {
    setPending(true);
    setStatus(null);
    setReadyCount(0);
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("ไม่พบชีตข้อมูลในไฟล์");

      const rows: Array<{ number: number; fullName: string; active: boolean }> = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const number = Number(row.getCell(1).value);
        const fullName = String(row.getCell(2).value ?? "").trim();
        const rawActive = String(row.getCell(3).value ?? "active").trim().toLowerCase();
        if (!number && !fullName) return;
        rows.push({
          number,
          fullName,
          active: !["inactive", "false", "0", "no", "ไม่ใช้งาน"].includes(rawActive),
        });
      });

      if (rows.length === 0) throw new Error("ไม่พบข้อมูลนักเรียนในไฟล์");
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = JSON.stringify(rows);
      }
      setReadyCount(rows.length);
      setStatus({ type: "success", message: `อ่านไฟล์แล้ว ${rows.length} รายการ กดกู้คืนเพื่อบันทึก` });
    } catch (error) {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = "";
      }
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "อ่านไฟล์ students.xlsx ไม่สำเร็จ",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <ActionForm action={restoreAction} className="grid gap-3" successMessage="กู้คืนรายชื่อนักเรียนแล้ว">
      <input type="hidden" name="classroom_id" value={classroomId} />
      <input ref={hiddenInputRef} type="hidden" name="students_json" />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void exportRoster()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
        >
          <Download size={16} />
          ส่งออก
        </button>
        <label className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 ${pending ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
          <Upload size={16} />
          {pending ? "กำลังอ่าน..." : "เลือกไฟล์"}
          <input
            type="file"
            accept=".xlsx"
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (file) void importRoster(file);
            }}
          />
        </label>
      </div>
      {status ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {status.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel="กำลังกู้คืน..." disabled={readyCount === 0}>
        กู้คืนรายชื่อ
      </SubmitButton>
    </ActionForm>
  );
}

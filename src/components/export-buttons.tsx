"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatThaiDate } from "@/lib/dates";
import { percent } from "@/lib/reports";
import type { DailySummary, StudentSummary } from "@/lib/types";

const THAI_FONT_NAME = "NotoSansThai";
const THAI_FONT_FILE = "NotoSansThai-Regular.ttf";

type ExportStatus = {
  type: "success" | "error";
  message: string;
} | null;

async function loadThaiFont(doc: jsPDF) {
  const response = await fetch(`/fonts/${THAI_FONT_FILE}`);
  if (!response.ok) throw new Error("โหลดฟอนต์ภาษาไทยไม่สำเร็จ");

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  doc.addFileToVFS(THAI_FONT_FILE, btoa(binary));
  doc.addFont(THAI_FONT_FILE, THAI_FONT_NAME, "normal");
  doc.setFont(THAI_FONT_NAME);
}

export function ExportButtons({
  classroomName,
  studentSummaries,
  dailySummaries,
}: {
  classroomName: string;
  studentSummaries: StudentSummary[];
  dailySummaries: DailySummary[];
}) {
  const [pending, setPending] = useState<"excel" | "pdf" | null>(null);
  const [status, setStatus] = useState<ExportStatus>(null);

  async function runExport(type: "excel" | "pdf", callback: () => Promise<void>) {
    setPending(type);
    setStatus(null);
    try {
      await callback();
      setStatus({ type: "success", message: type === "excel" ? "ส่งออก Excel แล้ว" : "ส่งออก PDF แล้ว" });
    } catch {
      setStatus({ type: "error", message: "ส่งออกรายงานไม่สำเร็จ กรุณาลองใหม่" });
    } finally {
      setPending(null);
    }
  }

  async function exportExcel() {
    const workbook = new ExcelJS.Workbook();
    const studentSheet = workbook.addWorksheet("Student Summary");
    studentSheet.addRow(["เลขที่", "ชื่อ", "มาเรียน", "มาสาย", "ลา", "ขาดเรียน", "รวม", "% การเข้าเรียน"]);
    studentSummaries.forEach((row) => {
      studentSheet.addRow([
        row.student.number,
        row.student.full_name,
        row.present,
        row.late,
        row.leave,
        row.absent,
        row.total,
        percent(row.attendanceRate),
      ]);
    });

    const dailySheet = workbook.addWorksheet("Daily Summary");
    dailySheet.addRow(["วันที่", "มาเรียน", "มาสาย", "ลา", "ขาดเรียน", "นักเรียนทั้งหมด", "% การเข้าเรียน"]);
    dailySummaries.forEach((row) => {
      dailySheet.addRow([
        formatThaiDate(row.date),
        row.present,
        row.late,
        row.leave,
        row.absent,
        row.totalStudents,
        percent(row.attendanceRate),
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `name-checked-${classroomName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    const doc = new jsPDF();
    await loadThaiFont(doc);
    doc.setFontSize(14);
    doc.text(`Name Checked - ${classroomName}`, 14, 16);
    autoTable(doc, {
      startY: 24,
      styles: { font: THAI_FONT_NAME },
      headStyles: { font: THAI_FONT_NAME },
      bodyStyles: { font: THAI_FONT_NAME },
      head: [["เลขที่", "ชื่อ", "มาเรียน", "มาสาย", "ลา", "ขาดเรียน", "รวม", "%"]],
      body: studentSummaries.map((row) => [
        row.student.number,
        row.student.full_name,
        row.present,
        row.late,
        row.leave,
        row.absent,
        row.total,
        percent(row.attendanceRate),
      ]),
    });
    autoTable(doc, {
      styles: { font: THAI_FONT_NAME },
      headStyles: { font: THAI_FONT_NAME },
      bodyStyles: { font: THAI_FONT_NAME },
      head: [["วันที่", "มาเรียน", "มาสาย", "ลา", "ขาดเรียน", "ทั้งหมด", "%"]],
      body: dailySummaries.map((row) => [
        formatThaiDate(row.date),
        row.present,
        row.late,
        row.leave,
        row.absent,
        row.totalStudents,
        percent(row.attendanceRate),
      ]),
    });
    doc.save(`name-checked-${classroomName}.pdf`);
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <button
          onClick={() => void runExport("excel", exportExcel)}
          disabled={pending !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} />
          {pending === "excel" ? "กำลังส่งออก..." : "ส่งออก Excel"}
        </button>
        <button
          onClick={() => void runExport("pdf", exportPdf)}
          disabled={pending !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} />
          {pending === "pdf" ? "กำลังส่งออก..." : "ส่งออก PDF"}
        </button>
      </div>
      {status ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

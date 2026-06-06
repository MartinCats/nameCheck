"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import ExcelJS from "exceljs";

type ImportStatus = {
  type: "success" | "error";
  message: string;
} | null;

export function FileImportButton({ targetId }: { targetId: string }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<ImportStatus>(null);

  async function handleFile(file: File) {
    setPending(true);
    setStatus(null);
    try {
      let rows: Array<Array<string | number>> = [];

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        rows = text.split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim()));
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) throw new Error("ไม่พบชีตข้อมูลในไฟล์");
        rows = sheet.getSheetValues().slice(1).map((row) => (Array.isArray(row) ? row.slice(1) : [])) as Array<Array<string | number>>;
      }

      const text = rows
        .map((row, index) => {
          const number = row[0] ? Number(row[0]) : index + 1;
          const name = String(row[1] ?? row[0] ?? "").trim();
          if (!Number.isFinite(number)) return "";
          return name ? `${number} ${name}` : "";
        })
        .filter(Boolean)
        .join("\n");

      if (!text) throw new Error("ไฟล์นี้ไม่มีข้อมูลนักเรียนที่นำเข้าได้");

      const textarea = document.getElementById(targetId) as HTMLTextAreaElement | null;
      if (!textarea) throw new Error("ไม่พบช่องนำเข้ารายชื่อนักเรียน");
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      setStatus({ type: "success", message: "อ่านไฟล์แล้ว ตรวจสอบรายชื่อก่อนกดนำเข้า" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <label className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${pending ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
        <Upload size={16} />
        {pending ? "กำลังอ่านไฟล์..." : "นำเข้าไฟล์"}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) {
              void handleFile(file);
            }
          }}
        />
      </label>
      {status ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

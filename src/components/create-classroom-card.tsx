"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createClassroom } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Button, Card, Field } from "@/components/ui";

export function CreateClassroomCard({ academicYear }: { academicYear: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white p-4 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 active:scale-[0.99]"
      >
        <Plus size={18} />
        เพิ่มห้องเรียน
      </button>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-950">
          <Plus size={18} />
          เพิ่มห้องเรียน
        </h2>
        <Button type="button" variant="secondary" className="min-h-10 px-3 text-xs" onClick={() => setOpen(false)}>
          <X size={14} />
          ยกเลิก
        </Button>
      </div>
      <ActionForm action={createClassroom} className="grid gap-3" successMessage="สร้างห้องเรียนแล้ว">
        <Field label="ชื่อห้องเรียน" name="name" placeholder="ม.1/1" />
        <Field label="ปีการศึกษา" name="academic_year" defaultValue={academicYear} />
        <SubmitButton pendingLabel="กำลังสร้าง...">บันทึก</SubmitButton>
      </ActionForm>
    </Card>
  );
}

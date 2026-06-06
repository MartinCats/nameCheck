"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";

type DeleteAction = (formData: FormData) => Promise<void>;

const REQUIRED_CONFIRMATION = "ลบถาวร";

export function DangerDeleteClassroom({
  classroomId,
  action,
}: {
  classroomId: string;
  action: DeleteAction;
}) {
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation === REQUIRED_CONFIRMATION;

  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-4">
      <h2 className="font-bold text-rose-800">Danger Zone</h2>
      <p className="mt-2 text-sm leading-6 text-rose-700">
        การลบถาวรจะลบข้อมูลนักเรียนและประวัติการเช็คชื่อทั้งหมด ไม่สามารถกู้คืนได้
      </p>
      <ActionForm
        action={action}
        className="mt-3 grid gap-3"
        successMessage="ลบห้องเรียนถาวรแล้ว"
        confirmMessage="ยืนยันลบถาวร? ข้อมูลนักเรียนและประวัติการเช็คชื่อทั้งหมดจะถูกลบและกู้คืนไม่ได้"
      >
        <input type="hidden" name="id" value={classroomId} />
        <label className="grid gap-1.5 text-sm font-medium text-rose-800">
          พิมพ์ ลบถาวร เพื่อยืนยัน
          <input
            name="delete_confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </label>
        <SubmitButton variant="danger" className="w-full" pendingLabel="กำลังลบ..." disabled={!canDelete}>
          <Trash2 size={16} />
          ลบถาวร
        </SubmitButton>
      </ActionForm>
    </section>
  );
}

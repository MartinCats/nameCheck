"use client";

import { CalendarDays } from "lucide-react";

export function DatePickerButton({ date, label }: { date: string; label: string }) {
  return (
    <form method="get" className="relative inline-flex w-full sm:w-auto">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm sm:w-auto"
      >
        <CalendarDays size={18} />
        {label}
      </button>
      <input
        type="date"
        name="date"
        defaultValue={date}
        aria-label="เลือกวันที่"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      />
    </form>
  );
}

import type { AttendanceStatus } from "@/lib/types";

export const ATTENDANCE_STATUSES: Array<{
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  tone: string;
}> = [
  { value: "present", label: "มาเรียน", shortLabel: "มา", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "late", label: "มาสาย", shortLabel: "สาย", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "leave", label: "ลา", shortLabel: "ลา", tone: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "absent", label: "ขาดเรียน", shortLabel: "ขาด", tone: "bg-rose-100 text-rose-800 border-rose-200" },
];

export const STATUS_LABELS = ATTENDANCE_STATUSES.reduce(
  (labels, status) => ({ ...labels, [status.value]: status.label }),
  {} as Record<AttendanceStatus, string>,
);

export function statusTone(status: AttendanceStatus) {
  return ATTENDANCE_STATUSES.find((item) => item.value === status)?.tone ?? "";
}

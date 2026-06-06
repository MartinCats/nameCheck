export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatThaiDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function academicYearNow() {
  return String(new Date().getFullYear() + 543);
}

import Link from "next/link";
import type { ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const variants = {
    primary: "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 ${className}`}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <Card className="p-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">✓</div>
        <h1 className="text-2xl font-bold text-slate-950">ตั้งค่า Supabase ก่อนเริ่มใช้งาน</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          เพิ่มค่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใน `.env.local` แล้วรัน migration ในโฟลเดอร์ `supabase/migrations`
        </p>
      </Card>
    </main>
  );
}

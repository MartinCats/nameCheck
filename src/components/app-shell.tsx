import Link from "next/link";
import { BarChart3, BookOpen, CalendarCheck, Home, Settings } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "หน้าหลัก", icon: Home },
  { href: "/classrooms", label: "ห้องเรียน", icon: BookOpen },
  { href: "/attendance", label: "เช็คชื่อ", icon: CalendarCheck },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto grid min-h-screen max-w-6xl md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-4 md:block">
          <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-lg p-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-lg font-bold text-white">✓</span>
            <span className="font-bold text-slate-950">Name Checked</span>
          </Link>
          <nav className="grid gap-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-emerald-800">
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 px-4 py-4 sm:px-6 md:px-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="grid min-h-14 place-items-center gap-1 rounded-lg text-[11px] font-medium text-slate-600">
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

import { BarChart3, Check, CheckCircle2, GraduationCap, School, UsersRound } from "lucide-react";
import { signInWithGoogle } from "@/app/actions";
import { getAppContext } from "@/lib/data";

const valueRows = [
  { icon: School, label: "เช็คชื่อรายวัน" },
  { icon: GraduationCap, label: "จัดการนักเรียน" },
  { icon: BarChart3, label: "รายงานและสถิติ" },
];

const trustItems = ["ใช้งานง่าย", "รองรับมือถือและแท็บเล็ต", "ส่งออก Excel / PDF"];

export default async function LoginPage() {
  const { isConfigured } = await getAppContext();

  return (
    <main className="min-h-screen bg-emerald-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 sm:max-w-lg sm:px-6 sm:pt-10">
        <header className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-900/15">
            <CheckCircle2 size={30} strokeWidth={2.6} />
          </span>
          <span className="text-sm font-bold text-emerald-800">Name Checked</span>
        </header>

        <div className="flex flex-1 items-center">
          <div className="w-full rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-xl shadow-emerald-950/10 sm:p-8">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
              <UsersRound size={42} strokeWidth={2.3} />
            </div>

            <h1 className="mt-6 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">เช็คชื่อนักเรียน</h1>
            <p className="mt-2 text-xl font-semibold text-emerald-700 sm:text-2xl">PWA สำหรับครู</p>

            <div className="mt-8 grid gap-3 text-left">
              {valueRows.map((item) => (
                <div key={item.label} className="flex min-h-14 items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm shadow-emerald-950/10">
                    <item.icon size={24} strokeWidth={2.1} />
                  </span>
                  <span className="text-lg font-bold text-slate-800">{item.label}</span>
                </div>
              ))}
            </div>

            <form action={signInWithGoogle} className="mt-8">
              <button className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-900 shadow-lg shadow-slate-950/10 transition hover:bg-slate-50">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-xl font-bold text-blue-600 shadow-sm ring-1 ring-slate-100">G</span>
                เข้าสู่ระบบด้วย Google
              </button>
            </form>

            <div className="mt-7 grid gap-2 text-left text-base font-medium text-slate-500">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center justify-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={18} strokeWidth={3} />
                  </span>
                  <span className="min-w-[190px]">{item}</span>
                </div>
              ))}
            </div>

            {!isConfigured ? (
              <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-left text-xs leading-5 text-amber-800">
                ยังไม่ได้ตั้งค่า Supabase: เพิ่มค่าใน `.env.local` ก่อนใช้งาน Google Login
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

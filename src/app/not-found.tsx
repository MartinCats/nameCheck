import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">ไม่พบข้อมูลหรือไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          รายการนี้อาจถูกลบ เก็บถาวร หรือคุณไม่ได้รับสิทธิ์ให้เข้าถึง
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          กลับหน้าหลัก
        </Link>
      </section>
    </main>
  );
}

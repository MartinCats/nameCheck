import Link from "next/link";
import { Archive, ArrowLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreateClassroomCard } from "@/components/create-classroom-card";
import { Card, LinkButton, SetupNotice } from "@/components/ui";
import { academicYearNow } from "@/lib/dates";
import { loadClassrooms } from "@/lib/data";

export default async function ClassroomsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const { isConfigured, classrooms, teachers, students } = await loadClassrooms({ includeArchived: showArchived });
  if (!isConfigured) return <SetupNotice />;
  const visibleClassrooms = classrooms.filter((room) => (showArchived ? room.archived_at : !room.archived_at));

  return (
    <AppShell>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{showArchived ? "ห้องเรียนที่เก็บถาวร" : "ห้องเรียน"}</h1>
          <p className="text-sm text-slate-500">จัดการห้องเรียน ครูร่วม และรายชื่อนักเรียน</p>
        </div>
        {showArchived ? (
          <Link
            href="/classrooms"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
          >
            <ArrowLeft size={16} />
            กลับไปห้องเรียน
          </Link>
        ) : null}
      </header>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3">
          {visibleClassrooms.map((room) => (
            <Card key={room.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{room.name}</h2>
                  <p className="text-sm text-slate-500">ปีการศึกษา {room.academic_year}</p>
                  {room.archived_at ? <p className="mt-1 text-xs font-medium text-amber-700">เก็บถาวรแล้ว</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    นักเรียน {students.filter((student) => student.classroom_id === room.id).length} คน · ครู {teachers.filter((teacher) => teacher.classroom_id === room.id).length} คน
                  </p>
                </div>
                <LinkButton href={`/classrooms/${room.id}`}>จัดการ</LinkButton>
              </div>
            </Card>
          ))}
          {visibleClassrooms.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{showArchived ? "ยังไม่มีห้องเรียนที่เก็บถาวร" : "ยังไม่มีห้องเรียน"}</p> : null}
        </div>
        {!showArchived ? (
          <div className="grid gap-3">
            <CreateClassroomCard academicYear={academicYearNow()} />
            <Link
              href="/classrooms?archived=1"
              className="group flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/60 active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100 transition group-hover:bg-amber-100">
                <Archive size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-950">ห้องเรียนที่เก็บถาวร</span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">ดูห้องเรียนที่ซ่อนไว้จากรายการปัจจุบัน และกู้คืนเมื่อจำเป็น</span>
                <span className="mt-2 inline-flex text-sm font-semibold text-emerald-700">ดูรายการ</span>
              </span>
              <ChevronRight className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" size={20} />
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

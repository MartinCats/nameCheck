import { Plus } from "lucide-react";
import { createClassroom } from "@/app/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { AppShell } from "@/components/app-shell";
import { Card, Field, LinkButton, SetupNotice } from "@/components/ui";
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
        <LinkButton
          href={showArchived ? "/classrooms" : "/classrooms?archived=1"}
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          {showArchived ? "กลับไปห้องเรียนปัจจุบัน" : "ดูห้องเรียนที่เก็บถาวร"}
        </LinkButton>
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
        {!showArchived ? <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-950">
            <Plus size={18} />
            เพิ่มห้องเรียน
          </h2>
          <ActionForm action={createClassroom} className="grid gap-3" successMessage="สร้างห้องเรียนแล้ว">
            <Field label="ชื่อห้องเรียน" name="name" placeholder="ม.1/1" />
            <Field label="ปีการศึกษา" name="academic_year" defaultValue={academicYearNow()} />
            <SubmitButton pendingLabel="กำลังสร้าง...">บันทึก</SubmitButton>
          </ActionForm>
        </Card> : null}
      </div>
    </AppShell>
  );
}

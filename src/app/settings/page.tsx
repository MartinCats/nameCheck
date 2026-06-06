import { signOut } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button, Card, SetupNotice } from "@/components/ui";
import { getAppContext } from "@/lib/data";

export default async function SettingsPage() {
  const { isConfigured, user } = await getAppContext();
  if (!isConfigured) return <SetupNotice />;

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">ตั้งค่า</h1>
      </header>
      <Card className="p-4">
        <div className="mb-4 rounded-lg bg-slate-50 p-4">
          <p className="font-bold text-slate-950">{user?.user_metadata?.full_name ?? user?.email}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
        <div className="grid gap-3 text-sm text-slate-600">
          <p>ภาษา: ไทย</p>
          <p>วันที่: พุทธศักราช</p>
          <p>PWA: รองรับการติดตั้งและ Offline shell</p>
        </div>
        <form action={signOut} className="mt-6">
          <Button variant="danger" className="w-full">ออกจากระบบ</Button>
        </form>
      </Card>
    </AppShell>
  );
}

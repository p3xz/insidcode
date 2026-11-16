import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";
import AdminDuelsMonitorClient from "@/components/admin/AdminDuelsMonitorClient";

export const dynamic = "force-dynamic";

export default async function AdminDuelsPage() {
  const authResult = await requireAdminUser();

  if (authResult.status === 401) {
    redirect("/login?callbackUrl=/admin/duels");
  }
  if (authResult.user?.isBanned) {
    redirect("/suspended");
  }
  if (authResult.status === 403 || !authResult.admin) {
    redirect("/");
  }

  return <AdminDuelsMonitorClient />;
}

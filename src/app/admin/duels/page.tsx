import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminDuelsMonitorClient from "@/components/admin/AdminDuelsMonitorClient";

export const dynamic = "force-dynamic";

export default async function AdminDuelsPage() {
  await enforceAdminPageAccess("/admin/duels");
  return <AdminDuelsMonitorClient />;
}

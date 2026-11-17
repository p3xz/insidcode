import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await enforceAdminPageAccess("/admin");
  return <AdminDashboardClient />;
}

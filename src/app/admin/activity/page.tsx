import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminActivityClient from "@/components/admin/AdminActivityClient";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  await enforceAdminPageAccess("/admin/activity");
  return <AdminActivityClient />;
}

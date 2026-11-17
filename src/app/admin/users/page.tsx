import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await enforceAdminPageAccess("/admin/users");
  return <AdminUsersClient />;
}

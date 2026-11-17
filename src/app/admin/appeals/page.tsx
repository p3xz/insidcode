import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminAppealsClient from "@/components/admin/AdminAppealsClient";

export const dynamic = "force-dynamic";

export default async function AdminAppealsPage() {
  await enforceAdminPageAccess("/admin/appeals");
  return <AdminAppealsClient />;
}

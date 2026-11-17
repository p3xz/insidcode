import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminAuditClient from "@/components/admin/AdminAuditClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await enforceAdminPageAccess("/admin/audit");
  return <AdminAuditClient />;
}

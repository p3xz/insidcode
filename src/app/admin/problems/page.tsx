import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminProblemsClient from "@/components/admin/AdminProblemsClient";

export const dynamic = "force-dynamic";

export default async function AdminProblemsPage() {
  await enforceAdminPageAccess("/admin/problems");
  return <AdminProblemsClient />;
}

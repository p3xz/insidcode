import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminFeedbackClient from "@/components/admin/AdminFeedbackClient";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  await enforceAdminPageAccess("/admin/feedback");
  return <AdminFeedbackClient />;
}

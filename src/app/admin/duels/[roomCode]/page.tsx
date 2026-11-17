import { enforceAdminPageAccess } from "@/lib/adminPageGuard";
import AdminDuelSpectateView from "@/components/admin/AdminDuelSpectateView";

export const dynamic = "force-dynamic";

export default async function AdminDuelSpectatePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const normalizedCode = decodeURIComponent(roomCode || "").trim().toUpperCase();

  await enforceAdminPageAccess(`/admin/duels/${normalizedCode}`);
  return <AdminDuelSpectateView roomCode={normalizedCode} />;
}

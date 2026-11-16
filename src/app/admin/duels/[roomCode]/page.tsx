import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";
import AdminDuelSpectateView from "@/components/admin/AdminDuelSpectateView";

export const dynamic = "force-dynamic";

export default async function AdminDuelSpectatePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
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

  const { roomCode } = await params;
  const normalizedCode = decodeURIComponent(roomCode || "").trim().toUpperCase();

  return <AdminDuelSpectateView roomCode={normalizedCode} />;
}

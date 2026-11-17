import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";
import type { IUser } from "@/types";

/**
 * Authoritative Server Component guard for every /admin route and layout.
 * Re-validates fresh MongoDB user status, suspension state, and role === "admin"
 * on every dynamic render or navigation transition.
 */
export async function enforceAdminPageAccess(callbackPath: string = "/admin"): Promise<IUser> {
  const authResult = await requireAdminUser();

  if (authResult.status === 401) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  if (authResult.user?.isBanned) {
    redirect("/suspended");
  }

  if (authResult.status === 403 || !authResult.admin) {
    redirect("/");
  }

  return authResult.admin;
}

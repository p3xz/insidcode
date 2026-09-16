import { requireAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Console | InsidCode",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAdminUser();

  // If unauthenticated, redirect to login with callback
  if (authResult.status === 401) {
    redirect("/login?callbackUrl=/admin");
  }

  // If authenticated but account is suspended
  if (authResult.user?.isBanned) {
    redirect("/suspended");
  }

  // If authenticated but not an admin (status === 403), safely redirect to home
  if (authResult.status === 403 || !authResult.admin) {
    redirect("/");
  }

  return <>{children}</>;
}

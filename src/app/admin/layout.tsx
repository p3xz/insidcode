import type { Metadata } from "next";
import { AdminNavHeader } from "@/components/admin/AdminNavHeader";
import { enforceAdminPageAccess } from "@/lib/adminPageGuard";

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
  const admin = await enforceAdminPageAccess("/admin");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}>
      <AdminNavHeader adminUsername={admin.username} />
      <main className="flex-1 w-full pb-16">{children}</main>
    </div>
  );
}

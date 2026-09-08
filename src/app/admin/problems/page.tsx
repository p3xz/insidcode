import React from "react";
import { AdminProblemManagement } from "@/components/admin/AdminProblemManagement";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminProblemsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B93A7] hover:text-[#00F0FF] transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Admin Console
      </Link>

      <AdminProblemManagement />
    </div>
  );
}

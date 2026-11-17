import React from "react";
import { AdminProblemManagement } from "@/components/admin/AdminProblemManagement";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminProblemsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/admin"
          className="text-xs text-[#8B93A7] hover:text-[#F5F7FA] inline-flex items-center gap-1 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <span className="text-[#5E667B]">/</span>
        <span className="text-xs font-semibold text-[#00F0FF] mono uppercase tracking-wider">
          Problem Management
        </span>
      </div>

      <AdminProblemManagement />
    </div>
  );
}

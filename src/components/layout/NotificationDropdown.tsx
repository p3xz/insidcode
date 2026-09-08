"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export function NotificationDropdown({
  onClose,
  onReadUpdate,
}: {
  onClose: () => void;
  onReadUpdate: () => void;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onReadUpdate();
    } catch {
      // silent
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#252936] bg-[#11131A] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between border-b border-[#252936] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#00F0FF]" />
          <span className="text-xs font-semibold text-[#F5F7FA]">Notifications</span>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] text-[#8B93A7] hover:text-[#00F0FF] transition"
          >
            <Check className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#181B24]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#00F0FF]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8B93A7]">No notifications yet.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 transition ${n.read ? "bg-transparent opacity-75" : "bg-[#181B24]/40"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-[#F5F7FA]">{n.title}</p>
                <span className="text-[10px] text-[#5E667B] shrink-0 font-mono">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#8B93A7]">{n.message}</p>
              {n.link && (
                <Link
                  href={n.link}
                  onClick={onClose}
                  className="mt-2 inline-block text-[11px] font-medium text-[#00F0FF] hover:underline"
                >
                  View Details &rarr;
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

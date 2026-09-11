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
    <div
      className="absolute right-0 mt-2 w-80 sm:w-96 z-50 overflow-hidden"
      style={{
        border: "1px solid var(--border-strong)",
        borderRadius: "4px",
        backgroundColor: "var(--bg-surface)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>
            Notifications
          </span>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] transition-colors"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
          >
            <Check className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: "var(--fg-muted)" }}>
            No notifications yet.
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              className="p-3.5 transition-colors"
              style={{
                borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none",
                backgroundColor: n.read ? "transparent" : "var(--bg-subtle)",
                opacity: n.read ? 0.75 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{n.title}</p>
                <span className="text-[10px] shrink-0 mono" style={{ color: "var(--fg-dimmed)" }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>{n.message}</p>
              {n.link && (
                <Link
                  href={n.link}
                  onClick={onClose}
                  className="mt-2 inline-block text-[11px] font-medium hover:underline"
                  style={{ color: "var(--accent)" }}
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

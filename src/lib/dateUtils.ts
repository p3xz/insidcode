/**
 * Centralized Date & Time Formatter for Indian Standard Time (IST - Asia/Kolkata, UTC+5:30)
 * Standardizes display across all client components, admin consoles, and restricted views.
 * Output format: "17 Sep 2026 · 06:13"
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatIST(dateInput?: Date | string | number | null): string {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "N/A";

  // Calculate IST Date (+5 hours 30 minutes)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const day = istDate.getUTCDate();
  const month = MONTH_NAMES[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hours}:${minutes}`;
}

export function formatISTDateOnly(dateInput?: Date | string | number | null): string {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "N/A";

  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const day = istDate.getUTCDate();
  const month = MONTH_NAMES[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();
  return `${day} ${month} ${year}`;
}


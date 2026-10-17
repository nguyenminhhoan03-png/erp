import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function formatDate(date: string | Date | null | undefined, pattern: string = "dd/MM/yyyy"): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: vi });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "HH:mm dd/MM/yyyy");
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: vi })
    .replace(/^khoảng\s+/i, "")
    .replace(/^dưới\s+/i, "");
}

export function isOverdue(
  deadline: string | Date | null | undefined,
  statusOrClosed?: string | boolean | null,
  closedAt?: string | Date | null
): boolean {
  if (!deadline) return false;
  if (closedAt) return false;
  if (typeof statusOrClosed === "boolean") {
    if (statusOrClosed) return false;
  } else if (statusOrClosed) {
    const s = String(statusOrClosed).toUpperCase();
    if (s === "DONE" || s === "CANCELLED" || s === "CLOSED") return false;
  }
  const d = typeof deadline === "string" ? parseISO(deadline) : deadline;
  return isBefore(startOfDay(d), startOfDay(new Date()));
}

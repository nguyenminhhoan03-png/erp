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
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
}

export function isOverdue(deadline: string | Date | null | undefined, status?: string): boolean {
  if (!deadline) return false;
  if (status === "DONE" || status === "CANCELLED") return false;
  const d = typeof deadline === "string" ? parseISO(deadline) : deadline;
  return isBefore(startOfDay(d), startOfDay(new Date()));
}

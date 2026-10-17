"use client";

import * as React from "react";
import { GovMeetingSchedule, GovCalendarSummary } from "../../types";
import { CalendarClock, MapPin, Video, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GovCalendarStatsProps {
  meetings: GovMeetingSchedule[];
  summary?: GovCalendarSummary | null;
  activeFilterConflict: boolean;
  onToggleFilterConflict: () => void;
  activeFilterType: string;
  onSelectFilterType: (type: string) => void;
}

export function GovCalendarStats({
  meetings,
  summary,
  activeFilterConflict,
  onToggleFilterConflict,
  activeFilterType,
  onSelectFilterType,
}: GovCalendarStatsProps) {
  const now = React.useMemo(() => new Date(), []);
  const todayStr = React.useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [now]);

  const upcomingCount = summary?.upcoming ?? React.useMemo(() => {
    const nowTime = now.getTime();
    return meetings.filter((m) => {
      const t = new Date(m.scheduledAt?.replace(" ", "T") || 0).getTime();
      return t >= nowTime && m.status !== "CANCELLED";
    }).length;
  }, [meetings, now, summary]);

  const todayCount = summary?.today ?? React.useMemo(() => {
    return meetings.filter((m) => {
      const datePart = (m.scheduledAt || "").slice(0, 10);
      return datePart === todayStr && m.status !== "CANCELLED";
    }).length;
  }, [meetings, todayStr, summary]);

  const thisWeekCount = summary?.this_week ?? todayCount;

  const onSiteCount = summary?.upcoming_onsite ?? React.useMemo(() => {
    const nowTime = now.getTime();
    return meetings.filter((m) => {
      const t = new Date(m.scheduledAt?.replace(" ", "T") || 0).getTime();
      const isUpcoming = t >= nowTime && m.status !== "CANCELLED";
      const isDirect =
        (m as any).meetingType === "TRUC_TIEP" ||
        (m.location &&
          !m.location.toLowerCase().includes("online") &&
          !m.location.toLowerCase().includes("meet") &&
          !m.location.toLowerCase().includes("zoom"));
      return isUpcoming && isDirect;
    }).length;
  }, [meetings, now, summary]);

  const onlineCount = summary?.upcoming_online ?? React.useMemo(() => {
    const nowTime = now.getTime();
    return meetings.filter((m) => {
      const t = new Date(m.scheduledAt?.replace(" ", "T") || 0).getTime();
      const isUpcoming = t >= nowTime && m.status !== "CANCELLED";
      const isOnline =
        (m as any).meetingType === "ONLINE" ||
        (m.location &&
          (m.location.toLowerCase().includes("online") ||
            m.location.toLowerCase().includes("meet") ||
            m.location.toLowerCase().includes("zoom")));
      return isUpcoming && isOnline;
    }).length;
  }, [meetings, now, summary]);

  const conflictCount = summary?.conflict_count ?? React.useMemo(() => {
    return meetings.filter((m) => Boolean((m as any).hasConflict)).length;
  }, [meetings, summary]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      <div
        onClick={() => onSelectFilterType(activeFilterType === "UPCOMING" ? "ALL" : "UPCOMING")}
        className={cn(
          "p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs group",
          activeFilterType === "UPCOMING" && !activeFilterConflict
            ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
            : activeFilterType === "ALL" && !activeFilterConflict
              ? "border-primary/50 bg-primary/5 hover:border-primary"
              : "border-border/80 bg-card hover:border-border"
        )}
        title="Bấm để lọc lịch họp sắp tới"
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Lịch Sắp Diễn Ra</span>
            {activeFilterType === "UPCOMING" && (
              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full font-bold">
                Đang lọc
              </span>
            )}
          </div>
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <CalendarClock className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-foreground">{upcomingCount}</span>
          <span className="text-xs text-muted-foreground font-medium">buổi sắp tới</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1 truncate">
          <span>Hôm nay:</span>
          <strong className="text-primary font-bold">{todayCount}</strong>
          <span className="text-muted-foreground/60">•</span>
          <span>Tuần này:</span>
          <strong className="text-foreground font-semibold">{thisWeekCount}</strong>
        </div>
      </div>

      <div
        onClick={() => onSelectFilterType(activeFilterType === "TRUC_TIEP" ? "ALL" : "TRUC_TIEP")}
        className={cn(
          "p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs group",
          activeFilterType === "TRUC_TIEP" && !activeFilterConflict
            ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 shadow-xs"
            : "border-border/80 bg-card hover:border-border"
        )}
        title="Bấm để lọc chuyến công tác trực tiếp"
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Trực Tiếp Tại Tỉnh</span>
            {activeFilterType === "TRUC_TIEP" && (
              <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                Đang lọc
              </span>
            )}
          </div>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <MapPin className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-foreground">{onSiteCount}</span>
          <span className="text-xs text-muted-foreground font-medium">chuyến thực địa</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          Làm việc tại trụ sở UBND / Sở chuyên ngành
        </p>
      </div>

      <div
        onClick={() => onSelectFilterType(activeFilterType === "ONLINE" ? "ALL" : "ONLINE")}
        className={cn(
          "p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs group",
          activeFilterType === "ONLINE" && !activeFilterConflict
            ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/40 shadow-xs"
            : "border-border/80 bg-card hover:border-border"
        )}
        title="Bấm để lọc các buổi họp trực tuyến"
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Họp Trực Tuyến</span>
            {activeFilterType === "ONLINE" && (
              <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                Đang lọc
              </span>
            )}
          </div>
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <Video className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-foreground">{onlineCount}</span>
          <span className="text-xs text-muted-foreground font-medium">buổi trực tuyến</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          Google Meet / Zoom xúc tiến từ xa
        </p>
      </div>

      <div
        onClick={onToggleFilterConflict}
        className={cn(
          "p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs group",
          conflictCount > 0
            ? activeFilterConflict
              ? "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/40 shadow-xs"
              : "border-rose-300 dark:border-rose-900/60 bg-rose-500/5 hover:border-rose-400"
            : "border-border/80 bg-card hover:border-border"
        )}
        title={conflictCount > 0 ? "Bấm để lọc các cuộc họp bị trùng lịch" : "Không có xung đột lịch"}
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                conflictCount > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"
              )}
            >
              Cảnh Báo Trùng Lịch
            </span>
            {activeFilterConflict && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                Đang lọc
              </span>
            )}
          </div>
          <div
            className={cn(
              "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
              conflictCount > 0 ? "bg-rose-500 text-white animate-pulse" : "bg-muted text-muted-foreground"
            )}
          >
            {conflictCount > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-2xl font-bold font-mono",
              conflictCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
            )}
          >
            {conflictCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium">xung đột giờ họp</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          {conflictCount > 0 ? "⚠️ Bấm để lọc các lịch trùng của Sếp" : "Lịch trình an toàn, không trùng giờ"}
        </p>
      </div>
    </div>
  );
}

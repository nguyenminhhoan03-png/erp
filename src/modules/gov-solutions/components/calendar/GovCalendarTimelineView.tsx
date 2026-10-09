"use client";

import * as React from "react";
import { GovMeetingSchedule, GovStage } from "../../types";
import { DLTM_STAGES } from "../../constants";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Clock,
  MapPin,
  Video,
  UserCheck,
  Building,
  AlertTriangle,
  Check,
  X,
  Trash2,
  ExternalLink,
  Calendar,
  Building2,
  ArrowUpDown,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  ArrowUp,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_KEYS: GovStage[] = [
  "DISPATCHED",
  "FEEDBACK",
  "MOU_SIGNED",
  "SPONSOR_AGREED",
  "DATA_COLLECT",
  "DEPLOYING",
  "COMPLETED",
];

interface GovCalendarTimelineViewProps {
  meetings: GovMeetingSchedule[];
  onUpdateStatus: (meetingId: string, status: "UPCOMING" | "DONE" | "CANCELLED") => Promise<boolean | void>;
  onDeleteMeeting: (meetingId: string) => Promise<boolean | void>;
  onSelectProject?: (projectId: string) => void;
}

export function GovCalendarTimelineView({
  meetings,
  onUpdateStatus,
  onDeleteMeeting,
  onSelectProject,
}: GovCalendarTimelineViewProps) {
  // Thứ tự sắp xếp ngày: ASC (Cận ngày nhất trước) hoặc DESC (Xa nhất trước)
  const [sortOrder, setSortOrder] = React.useState<"ASC" | "DESC">("ASC");

  // Trạng thái thu phóng các ngày
  const [collapsedDates, setCollapsedDates] = React.useState<Record<string, boolean>>({});

  // Phân trang Cursor theo mốc ngày (mặc định 7 mốc ngày/lượt)
  const [visibleDaysCount, setVisibleDaysCount] = React.useState<number>(7);

  const toggleDate = React.useCallback((dateKey: string) => {
    setCollapsedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  }, []);

  // Nhóm lịch họp theo Ngày
  const groupedMeetings = React.useMemo(() => {
    const groups: Record<string, GovMeetingSchedule[]> = {};

    meetings.forEach((m) => {
      let dateKey = "Chưa rõ thời gian";
      if (m.scheduledAt) {
        const d = m.scheduledAt.split("T")[0] || m.scheduledAt.split(" ")[0];
        dateKey = d;
      }
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(m);
    });

    // Sắp xếp các ngày theo sortOrder
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Chưa rõ thời gian") return 1;
      if (b === "Chưa rõ thời gian") return -1;
      const timeA = new Date(a).getTime();
      const timeB = new Date(b).getTime();
      return sortOrder === "ASC" ? timeA - timeB : timeB - timeA;
    });

    return sortedKeys.map((key) => ({
      dateKey: key,
      items: groups[key].sort((a, b) => {
        const timeA = new Date(a.scheduledAt?.replace(" ", "T") || 0).getTime();
        const timeB = new Date(b.scheduledAt?.replace(" ", "T") || 0).getTime();
        return sortOrder === "ASC" ? timeA - timeB : timeB - timeA;
      }),
    }));
  }, [meetings, sortOrder]);

  const allCollapsed = React.useMemo(() => {
    return (
      groupedMeetings.length > 0 &&
      groupedMeetings.every((g) => Boolean(collapsedDates[g.dateKey]))
    );
  }, [groupedMeetings, collapsedDates]);

  const collapseAll = React.useCallback(() => {
    const next: Record<string, boolean> = {};
    groupedMeetings.forEach((g) => {
      next[g.dateKey] = true;
    });
    setCollapsedDates(next);
  }, [groupedMeetings]);

  const expandAll = React.useCallback(() => {
    setCollapsedDates({});
  }, []);

  // Danh sách các mốc ngày hiển thị theo phân trang
  const displayedGroups = React.useMemo(() => {
    return groupedMeetings.slice(0, visibleDaysCount);
  }, [groupedMeetings, visibleDaysCount]);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const [isAutoLoading, setIsAutoLoading] = React.useState<boolean>(false);
  const isLoadingRef = React.useRef<boolean>(false);

  const loadMoreDays = React.useCallback(() => {
    if (isLoadingRef.current) return;
    if (visibleDaysCount >= groupedMeetings.length) return;

    isLoadingRef.current = true;
    setIsAutoLoading(true);

    setTimeout(() => {
      setVisibleDaysCount((prev) => Math.min(prev + 7, groupedMeetings.length));
      isLoadingRef.current = false;
      setIsAutoLoading(false);
    }, 200);
  }, [visibleDaysCount, groupedMeetings.length]);

  // Tự động load thêm các ngày tiếp theo khi cuộn xuống gần đáy (Hỗ trợ cả window scroll và main container overflow-y-auto)
  React.useEffect(() => {
    if (visibleDaysCount >= groupedMeetings.length) return;

    const checkShouldLoad = () => {
      if (isLoadingRef.current) return;
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      const rect = sentinel.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      // Kích hoạt sớm khi sentinel nằm trong khoảng 400px so với mép dưới màn hình
      if (rect.top <= viewportHeight + 400) {
        loadMoreDays();
      }
    };

    // Kiểm tra ngay lập tức khi mount / khi visibleDaysCount cập nhật
    const timer = setTimeout(checkShouldLoad, 50);

    // Lắng nghe sự kiện scroll trên cả window và document
    window.addEventListener("scroll", checkShouldLoad, { passive: true });
    window.addEventListener("resize", checkShouldLoad, { passive: true });
    document.addEventListener("scroll", checkShouldLoad, { passive: true });

    // Lắng nghe scroll trên container cha có overflow (đặc biệt là <main className="overflow-y-auto"> của layout)
    const mainEl = document.querySelector("main") || sentinelRef.current?.closest(".overflow-y-auto");
    if (mainEl) {
      mainEl.addEventListener("scroll", checkShouldLoad, { passive: true });
    }

    // Kết hợp IntersectionObserver làm kênh kích hoạt song song
    let observer: IntersectionObserver | null = null;
    if (sentinelRef.current) {
      try {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              checkShouldLoad();
            }
          },
          {
            root: null,
            rootMargin: "400px",
            threshold: 0,
          }
        );
        observer.observe(sentinelRef.current);
      } catch {
        // Fallback an toàn nếu trình duyệt hạn chế
      }
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", checkShouldLoad);
      window.removeEventListener("resize", checkShouldLoad);
      document.removeEventListener("scroll", checkShouldLoad);
      if (mainEl) {
        mainEl.removeEventListener("scroll", checkShouldLoad);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [visibleDaysCount, groupedMeetings.length, loadMoreDays]);

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainEl = document.querySelector("main") || sentinelRef.current?.closest(".overflow-y-auto");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const visibleMeetingsCount = React.useMemo(() => {
    return displayedGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [displayedGroups]);

  const progressPercent = React.useMemo(() => {
    if (groupedMeetings.length === 0) return 0;
    return Math.round((Math.min(visibleDaysCount, groupedMeetings.length) / groupedMeetings.length) * 100);
  }, [visibleDaysCount, groupedMeetings.length]);

  const parseDateInfo = (dateStr: string) => {
    if (dateStr === "Chưa rõ thời gian") {
      return {
        dayNum: "--",
        monthStr: "Chưa rõ",
        yearStr: "",
        dayName: "Chưa xác định",
        fullDateStr: dateStr,
        isToday: false,
        isTomorrow: false,
        isYesterday: false,
        isPast: false,
      };
    }

    try {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      const d = new Date(dateStr);
      const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const dayName = days[d.getDay()];
      const dayNum = d.getDate().toString().padStart(2, "0");
      const monthNum = d.getMonth() + 1;
      const yearStr = d.getFullYear().toString();
      const monthStr = `Tháng ${monthNum}`;
      const fullDateStr = `${dayNum}/${monthNum.toString().padStart(2, "0")}/${yearStr}`;

      const isToday = dateStr === todayStr;
      const isTomorrow = dateStr === tomorrow;
      const isYesterday = dateStr === yesterday;
      const isPast = d.getTime() < new Date(todayStr).getTime();

      return {
        dayNum,
        monthStr,
        yearStr,
        dayName,
        fullDateStr,
        isToday,
        isTomorrow,
        isYesterday,
        isPast,
      };
    } catch {
      return {
        dayNum: "--",
        monthStr: "",
        yearStr: "",
        dayName: "",
        fullDateStr: dateStr,
        isToday: false,
        isTomorrow: false,
        isYesterday: false,
        isPast: false,
      };
    }
  };

  const getStageInfo = (stageId?: string | number | null) => {
    if (!stageId) return null;
    const sStr = String(stageId);
    const stageIdx = STAGE_KEYS.findIndex((k) => k === sStr || k === `STAGE_${sStr}`);
    if (stageIdx !== -1) {
      return {
        stepNumber: stageIdx + 1,
        title: DLTM_STAGES[STAGE_KEYS[stageIdx]]?.shortLabel || sStr,
      };
    }
    const num = parseInt(sStr, 10);
    if (!isNaN(num) && num >= 1 && num <= 7) {
      const stageKey = STAGE_KEYS[num - 1];
      return {
        stepNumber: num,
        title: DLTM_STAGES[stageKey]?.shortLabel || `Bước ${num}`,
      };
    }
    return null;
  };

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-3">
        <div className="p-4 rounded-2xl bg-muted/60 text-muted-foreground">
          <Calendar className="h-8 w-8" />
        </div>
        <h4 className="font-semibold text-foreground text-sm">Không tìm thấy lịch công tác nào</h4>
        <p className="text-xs text-muted-foreground max-w-sm">
          Thử điều chỉnh lại bộ lọc tìm kiếm hoặc bấm nút &ldquo;+ Đặt lịch công tác&rdquo; để tạo cuộc hẹn mới.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thanh điều khiển thứ tự hiển thị & Thu phóng tất cả */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1 py-1 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            Dòng thời gian hiển thị{" "}
            <strong className="text-foreground font-semibold">{meetings.length}</strong> cuộc hẹn
            qua <strong className="text-foreground font-semibold">{groupedMeetings.length}</strong> mốc ngày
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút Thu phóng tất cả các ngày */}
          <button
            type="button"
            onClick={allCollapsed ? expandAll : collapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted/50 text-foreground text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title={allCollapsed ? "Mở rộng danh sách tất cả các ngày" : "Thu gọn danh sách tất cả các ngày"}
          >
            {allCollapsed ? (
              <ChevronsDown className="h-3.5 w-3.5 text-primary" />
            ) : (
              <ChevronsUp className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{allCollapsed ? "Mở rộng tất cả" : "Thu gọn tất cả"}</span>
          </button>

          {/* Nút Đổi chiều sắp xếp thời gian */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted/50 text-foreground text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Đổi chiều sắp xếp thời gian"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <span>{sortOrder === "ASC" ? "Sắp tới trước (Cận ngày nhất)" : "Xa nhất trước"}</span>
          </button>
        </div>
      </div>

      {/* Danh sách các mốc thời gian */}
      <div className="space-y-8">
        {displayedGroups.map(({ dateKey, items }) => {
          const dateInfo = parseDateInfo(dateKey);
          const isCollapsed = Boolean(collapsedDates[dateKey]);

          return (
            <div key={dateKey} className="relative flex flex-col md:flex-row gap-4 md:gap-6 group">
              {/* CỘT MỐC NGÀY (Executive Date Pillar) */}
              <div className="md:w-44 lg:w-48 shrink-0">
                <div
                  onClick={() => toggleDate(dateKey)}
                  className={cn(
                    "sticky top-3 rounded-2xl border p-3.5 transition-all text-left relative overflow-hidden cursor-pointer select-none group/card",
                    dateInfo.isToday
                      ? "bg-primary/10 border-primary/40 ring-2 ring-primary/20 shadow-xs"
                      : "bg-card border-border/80 shadow-2xs hover:border-primary/40",
                    isCollapsed && "bg-muted/25 border-dashed border-border/90"
                  )}
                >
                  {/* Tag nhận diện hôm nay / ngày mai / thứ + Nút Button Down thu phóng */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                        dateInfo.isToday
                          ? "bg-primary text-primary-foreground font-extrabold"
                          : dateInfo.isTomorrow
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
                          : "bg-muted text-muted-foreground font-semibold"
                      )}
                    >
                      {dateInfo.isToday
                        ? "Hôm nay"
                        : dateInfo.isTomorrow
                        ? "Ngày mai"
                        : dateInfo.isYesterday
                        ? "Hôm qua"
                        : dateInfo.dayName}
                    </span>

                    {/* NÚT BUTTON DOWN THU PHÓNG */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDate(dateKey);
                      }}
                      className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer",
                        isCollapsed
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground group-hover/card:bg-primary/10 group-hover/card:text-primary"
                      )}
                      title={isCollapsed ? "Bấm để mở rộng buổi họp" : "Bấm để thu gọn buổi họp"}
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isCollapsed && "-rotate-90"
                        )}
                      />
                    </button>
                  </div>

                  {/* Số ngày to & Tháng */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                        {dateInfo.dayNum}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {dateInfo.monthStr}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {items.length} cuộc hẹn
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center justify-between">
                    <span>{dateInfo.yearStr ? `Năm ${dateInfo.yearStr}` : ""} • {dateInfo.dayName}</span>
                    {isCollapsed && (
                      <span className="text-[10px] text-primary font-bold">Đã thu gọn</span>
                    )}
                  </div>
                </div>
              </div>

              {/* TRỤC DÒNG THỜI GIAN (Vertical Timeline Rail) */}
              <div className="hidden md:flex flex-col items-center shrink-0 relative pt-5">
                {/* Chấm mốc tròn */}
                <div
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border-2 border-background z-10 transition-transform group-hover:scale-125",
                    dateInfo.isToday
                      ? "bg-primary ring-4 ring-primary/30"
                      : items.some((m) => m.status === "UPCOMING")
                      ? "bg-blue-500 ring-4 ring-blue-500/20"
                      : "bg-muted-foreground/60 ring-4 ring-muted/50"
                  )}
                />
                {/* Đường nối dọc */}
                <div className="w-0.5 flex-1 bg-gradient-to-b from-border/90 via-border/60 to-border/30 my-2" />
              </div>

              {/* DANH SÁCH CUỘC HẸN TRONG NGÀY */}
              <div className="flex-1 space-y-3.5 min-w-0">
                {isCollapsed ? (
                  /* GIAO DIỆN KHI THU GỌN NGÀY */
                  <div
                    onClick={() => toggleDate(dateKey)}
                    className="rounded-2xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 p-4 transition-all cursor-pointer flex items-center justify-between gap-4 text-xs group select-none shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">
                          Đang thu gọn {items.length} cuộc hẹn
                        </span>
                        <span className="text-muted-foreground ml-1.5">
                          ({items.filter((x) => x.status === "UPCOMING").length} sắp tới,{" "}
                          {items.filter((x) => x.status === "DONE").length} đã xong)
                        </span>
                      </div>
                      {items.some((x) => Boolean((x as any).hasConflict)) && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold"
                        >
                          ⚠️ Có lãnh đạo bị trùng lịch
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-primary hover:underline shrink-0">
                      Bấm để mở rộng ({items.length} cuộc họp) ↓
                    </span>
                  </div>
                ) : (
                  items.map((m) => {
                    const isUpcoming = m.status === "UPCOMING";
                    const isDone = m.status === "DONE";
                    const isCancelled = m.status === "CANCELLED";
                    const hasConflict = Boolean((m as any).hasConflict);
                    const isOnline =
                      m.location?.toLowerCase().includes("online") ||
                      m.location?.toLowerCase().includes("meet") ||
                      m.location?.toLowerCase().includes("zoom") ||
                      (m as any).meetingType === "ONLINE";

                    const stageInfo = getStageInfo(m.stageId);
                    const timeDisplay = m.scheduledAt
                      ? m.scheduledAt.includes(" ")
                        ? m.scheduledAt.split(" ")[1]?.slice(0, 5)
                        : m.scheduledAt.includes("T")
                        ? m.scheduledAt.split("T")[1]?.slice(0, 5)
                        : m.scheduledAt
                      : "--:--";

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "rounded-2xl border transition-all text-xs relative overflow-hidden bg-card shadow-2xs hover:shadow-xs hover:border-primary/40 p-4 space-y-3",
                          hasConflict && "ring-2 ring-rose-500/50 border-rose-400 bg-rose-500/5",
                          !hasConflict && isUpcoming && "border-border/80",
                          !hasConflict && isDone && "bg-muted/20 border-border/60 opacity-85",
                          !hasConflict && isCancelled && "bg-muted/30 border-border/40 opacity-60"
                        )}
                      >
                        {/* Cảnh báo trùng lịch của Lãnh đạo nếu có - HIỂN THỊ RÕ TÊN LÃNH ĐẠO */}
                        {hasConflict && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                              <span>Cảnh báo trùng lịch lãnh đạo</span>
                            </div>

                            {(m as any).conflicts && (m as any).conflicts.length > 0 ? (
                              <div className="space-y-1.5 pl-6 pt-0.5">
                                {(m as any).conflicts.map((c: any, cIdx: number) => {
                                  const conflictUsers =
                                    c.users && c.users.length > 0
                                      ? c.users.map((u: any) => u.name || u).join(", ")
                                      : m.hostName || "Lãnh đạo phụ trách";
                                  return (
                                    <div
                                      key={cIdx}
                                      className="flex flex-wrap items-center gap-1.5 text-[11px] leading-relaxed"
                                    >
                                      <span className="font-semibold text-rose-950 dark:text-rose-100">
                                        • Lãnh đạo trùng:{" "}
                                        <span className="underline decoration-rose-400 text-rose-700 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded bg-rose-500/15">
                                          {conflictUsers}
                                        </span>
                                      </span>
                                      <span className="text-rose-600/90 dark:text-rose-400/90">
                                        → Trùng với:{" "}
                                        <strong className="text-rose-800 dark:text-rose-200 font-medium">
                                          {c.label}
                                        </strong>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="pl-6 text-[11px] text-rose-700 dark:text-rose-300">
                                {(m as any).conflictingWith ? (
                                  <span>{(m as any).conflictingWith}</span>
                                ) : (
                                  <span>
                                    Thời điểm này lãnh đạo{" "}
                                    <strong className="font-bold underline">
                                      {m.hostName || "phụ trách"}
                                    </strong>{" "}
                                    đã có cuộc họp khác được bố trí.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hàng 1: Thời gian, Tỉnh thành, Giai đoạn, Trạng thái */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/50 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Giờ họp */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{timeDisplay}</span>
                            </div>

                            {/* Tên tỉnh thành */}
                            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                              <Building2 className="h-4 w-4 text-primary shrink-0" />
                              <span>{m.provinceName}</span>
                            </div>

                            {/* Badge Giai đoạn 7 bước */}
                            {stageInfo && (
                              <Badge
                                variant="outline"
                                className="text-[11px] font-semibold px-2 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                              >
                                🏛️ Bước {stageInfo.stepNumber}: {stageInfo.title}
                              </Badge>
                            )}

                            {/* Badge Hình thức */}
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                                isOnline
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              )}
                            >
                              {isOnline ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                              <span>{isOnline ? "Họp Trực Tuyến" : "Trực Tiếp Tại Tỉnh"}</span>
                            </span>
                          </div>

                          {/* Trạng thái cuộc họp */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-semibold px-2.5 py-0.5 shrink-0",
                              isUpcoming && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
                              isDone && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                              isCancelled && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            )}
                          >
                            {isUpcoming ? "⏳ Sắp diễn ra" : isDone ? "✅ Đã họp xong" : "🚫 Đã hủy"}
                          </Badge>
                        </div>

                        {/* Hàng 2: Nội dung & Mục tiêu làm việc */}
                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex items-start gap-2">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mt-0.5">
                              Nội dung:
                            </span>
                            <h4 className="text-sm font-semibold text-foreground leading-snug">
                              {m.title || m.content || "Lịch làm việc với đại diện địa phương"}
                            </h4>
                          </div>

                          {/* Nếu có cả title và content khác nhau thì hiển thị thêm chi tiết */}
                          {m.title && m.content && m.title !== m.content && (
                            <p className="text-xs text-muted-foreground pl-16 leading-relaxed">
                              {m.content}
                            </p>
                          )}

                          {/* Địa điểm chi tiết */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-500/80 shrink-0" />
                            <span>
                              Địa điểm:{" "}
                              <strong className="text-foreground font-medium">
                                {m.location || "Trụ sở cơ quan"}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Hàng 3: Nhân sự chủ trì & Thao tác điều phối */}
                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                          {/* Chips Nhân sự */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Sếp chủ trì */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-[11px]">
                              <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="text-muted-foreground">Chủ trì:</span>
                              <strong className="text-foreground">{m.hostName || "Lãnh đạo IGB"}</strong>
                            </div>

                            {/* Đầu mối địa phương */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-[11px]">
                              <Building className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="text-muted-foreground">Đầu mối:</span>
                              <span className="text-foreground font-medium">{m.contactPerson || "Đại diện Sở/Tỉnh"}</span>
                            </div>
                          </div>

                          {/* Thao tác */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            {isUpcoming && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onUpdateStatus(m.id, "DONE")}
                                  className="h-7.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 cursor-pointer rounded-lg"
                                  title="Xác nhận đã họp xong"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Đã họp xong</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onUpdateStatus(m.id, "CANCELLED")}
                                  className="h-7.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2.5 cursor-pointer rounded-lg"
                                  title="Hủy lịch công tác này"
                                >
                                  <span>Hủy lịch</span>
                                </Button>
                              </>
                            )}

                            {onSelectProject && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSelectProject(m.projectId)}
                                className="h-7.5 text-xs font-medium text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 px-2.5 cursor-pointer rounded-lg"
                                title="Xem chi tiết hồ sơ tỉnh này"
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                <span>Hồ sơ tỉnh</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteMeeting(m.id)}
                              className="h-7.5 w-7.5 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer rounded-lg"
                              title="Xóa lịch hẹn"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Điểm neo Sentinel để phát hiện khi người dùng cuộn đến gần cuối */}
      <div ref={sentinelRef} className="h-12 w-full pointer-events-none -mt-4 opacity-0" />

      {/* Thanh trạng thái Infinite Scroll & Điều khiển (cập nhật từ thanh cũ) */}
      {groupedMeetings.length > 0 && (
        <div className="pt-2">
          <div className="relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-border/80 bg-card/75 backdrop-blur-md shadow-xs text-xs transition-all">
            {/* Thanh tiến trình Progress Bar chạy mỏng ở đỉnh */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted/40">
              <div
                className="h-full bg-linear-to-r from-primary via-indigo-500 to-sky-500 transition-all duration-300 rounded-r-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Thông tin trạng thái phân trang cuộn */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    Đang cuộn hiển thị:{" "}
                    <strong className="text-primary font-bold text-sm">
                      {Math.min(visibleDaysCount, groupedMeetings.length)}
                    </strong>{" "}
                    / <strong className="text-foreground font-bold">{groupedMeetings.length}</strong> mốc ngày
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({visibleMeetingsCount} / {meetings.length} cuộc họp • {progressPercent}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  {isAutoLoading ? (
                    <span className="inline-flex items-center gap-1.5 text-primary font-medium">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Đang tự động nạp thêm 7 mốc ngày tiếp theo...
                    </span>
                  ) : visibleDaysCount < groupedMeetings.length ? (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Zap className="h-3 w-3 text-amber-500" />
                      Tự động hiện khi cuộn trang (còn {groupedMeetings.length - visibleDaysCount} mốc ngày)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Đã hiển thị toàn bộ {groupedMeetings.length} mốc ngày
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Các nút điều khiển tiện ích */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
              {visibleDaysCount < groupedMeetings.length && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadMoreDays}
                    disabled={isAutoLoading}
                    className="h-8 text-xs font-semibold gap-1.5 cursor-pointer rounded-xl border-border/80 bg-card hover:bg-muted/60 text-foreground"
                    title="Bấm để tải thêm 7 mốc ngày tiếp theo (hoặc cuộn xuống để tự động tải)"
                  >
                    {isAutoLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span>Tải thêm 7 ngày (còn {groupedMeetings.length - visibleDaysCount} ngày)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleDaysCount(groupedMeetings.length)}
                    className="h-8 text-xs font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer rounded-xl"
                    title="Mở tất cả mốc ngày ngay lập tức mà không cần cuộn"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
                    <span>Xem toàn bộ ({groupedMeetings.length} ngày)</span>
                  </Button>
                </>
              )}

              {visibleDaysCount > 7 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={scrollToTop}
                    className="h-8 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl border-border/70 bg-card hover:bg-muted/60"
                    title="Cuộn mượt mà lên đầu trang lịch"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span>Lên đầu trang</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setVisibleDaysCount(7);
                      scrollToTop();
                    }}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
                    title="Thu gọn lại chỉ hiển thị 7 ngày đầu tiên"
                  >
                    <ChevronsUp className="h-3.5 w-3.5 mr-1" />
                    <span>Thu gọn về 7 ngày đầu</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


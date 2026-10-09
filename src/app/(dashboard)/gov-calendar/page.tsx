"use client";

import * as React from "react";
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { GovCalendarStats } from "@/modules/gov-solutions/components/calendar/GovCalendarStats";
import { GovCalendarFullView, getCalendarDateRange } from "@/modules/gov-solutions/components/calendar/GovCalendarFullView";
import { GovMeetingDialog } from "@/modules/gov-solutions/components/GovMeetingDialog";
import { GovProjectDetailModal } from "@/modules/gov-solutions/components/GovProjectDetailModal";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  CalendarDays,
  Table as TableIcon,
  CalendarPlus,
  RefreshCw,
  Sparkles,
  Building2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function GovCalendarContent() {
  const [mounted, setMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeFilterConflict, setActiveFilterConflict] = React.useState(false);
  const [activeFilterType, setActiveFilterType] = React.useState<"ALL" | "UPCOMING" | "TRUC_TIEP" | "ONLINE">("ALL");
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Khoảng ngày đang xem trên lịch (mặc định tháng hiện tại)
  const [dateRange, setDateRange] = React.useState<{ start_date: string; end_date: string }>(() =>
    getCalendarDateRange(new Date(), "month")
  );
  const [isCalendarLoading, setIsCalendarLoading] = React.useState(false);

  const {
    projects,
    meetings,
    calendarSummary,
    fetchInitial,
    fetchMasterCalendar,
    fetchMasterCalendarSummary,
    updateMeetingStatus,
    updateMeeting,
    deleteMeeting,
    setSelectedProject,
  } = useGovStore();

  React.useEffect(() => {
    let isCancelled = false;
    const init = async () => {
      setIsLoading(true);
      try {
        const initialRange = getCalendarDateRange(new Date(), "month");
        setDateRange(initialRange);
        await Promise.all([
          fetchInitial(),
          // Chỉ lấy đúng khoảng ngày của tháng đang hiển thị trên calendar
          fetchMasterCalendar({ all: 1, ...initialRange }),
          // Lấy summary tổng quan toàn công ty cho các thẻ KPI phía trên
          fetchMasterCalendarSummary({ all: 1 }),
        ]);
      } catch (err) {
        console.error("Failed to fetch initial calendar data:", err);
      } finally {
        if (!isCancelled) {
          setMounted(true);
          setIsLoading(false);
        }
      }
    };
    init();
    return () => {
      isCancelled = true;
    };
  }, [fetchInitial, fetchMasterCalendar, fetchMasterCalendarSummary]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchMasterCalendar({ all: 1, ...dateRange }),
        fetchMasterCalendarSummary({ all: 1 }),
      ]);
      toast.success("Đã đồng bộ dữ liệu lịch công tác mới nhất");
    } catch {
      toast.error("Không thể tải lịch công tác");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRangeChange = async (newRange: { start_date: string; end_date: string }) => {
    setDateRange(newRange);
    setIsCalendarLoading(true);
    try {
      await fetchMasterCalendar({ all: 1, ...newRange });
    } catch (err) {
      console.error("Lỗi khi tải lịch công tác theo khoảng ngày:", err);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleToggleFilterConflict = () => {
    setActiveFilterConflict((prev) => {
      const next = !prev;
      if (next) {
        setActiveFilterType("ALL");
      }
      return next;
    });
  };

  const handleSelectFilterType = (type: string) => {
    setActiveFilterConflict(false);
    setActiveFilterType(type as any);
  };

  // Lọc danh sách meetings theo điều kiện
  const filteredMeetings = React.useMemo(() => {
    const nowTime = Date.now();
    return meetings
      .map((m) => {
        // Đảm bảo title luôn có giá trị để hiển thị
        return {
          ...m,
          title: m.title || m.content || "Lịch làm việc với địa phương",
          meetingType:
            m.meetingType ||
            (m.location &&
              (m.location.toLowerCase().includes("online") ||
                m.location.toLowerCase().includes("meet") ||
                m.location.toLowerCase().includes("zoom"))
              ? "ONLINE"
              : "TRUC_TIEP"),
        };
      })
      .filter((m) => {
        // 1. Lọc xung đột lịch
        if (activeFilterConflict && !m.hasConflict) {
          return false;
        }

        // 2. Lọc theo hình thức / thời gian
        if (activeFilterType === "UPCOMING") {
          const mTime = new Date(m.scheduledAt?.replace(" ", "T") || 0).getTime();
          if (mTime < nowTime || m.status === "DONE" || m.status === "CANCELLED") {
            return false;
          }
        } else if (activeFilterType === "TRUC_TIEP") {
          if (m.meetingType !== "TRUC_TIEP") {
            return false;
          }
        } else if (activeFilterType === "ONLINE") {
          if (m.meetingType !== "ONLINE") {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.scheduledAt?.replace(" ", "T") || 0).getTime();
        const timeB = new Date(b.scheduledAt?.replace(" ", "T") || 0).getTime();
        return timeA - timeB;
      });
  }, [meetings, activeFilterConflict, activeFilterType]);

  const handleUpdateStatus = async (
    meetingId: string,
    status: "UPCOMING" | "DONE" | "CANCELLED"
  ) => {
    try {
      const ok = await updateMeetingStatus(meetingId, status);
      if (ok) {
        toast.success(
          status === "DONE"
            ? "Đã xác nhận hoàn thành buổi làm việc"
            : status === "CANCELLED"
              ? "Đã hủy lịch công tác"
              : "Đã cập nhật trạng thái"
        );
      }
    } catch {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lịch công tác này khỏi hệ thống?")) {
      return;
    }
    try {
      const ok = await deleteMeeting(meetingId);
      if (ok) {
        toast.success("Đã xóa lịch công tác");
      }
    } catch {
      toast.error("Không thể xóa lịch công tác");
    }
  };

  const handleSelectProject = (projectId: string) => {
    const proj = projects.find((p) => String(p.id) === String(projectId));
    if (proj) {
      setSelectedProject(proj);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="space-y-4 max-w-[1650px] mx-auto pb-10 p-6 animate-pulse">
        <div className="h-10 w-72 bg-muted/60 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="h-24 bg-muted/40 rounded-2xl" />
          <div className="h-24 bg-muted/40 rounded-2xl" />
          <div className="h-24 bg-muted/40 rounded-2xl" />
          <div className="h-24 bg-muted/40 rounded-2xl" />
        </div>
        <div className="h-[600px] w-full bg-muted/30 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1650px] mx-auto pb-10">
      {/* Header trang */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-[11px] font-mono bg-primary/10 text-primary border-primary/20 gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>CRM Lịch Công Tác • B2G Executive</span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              • Quản trị & Điều phối công tác Lãnh đạo IGB với 34 Tỉnh/Thành
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <CalendarDays className="h-6 w-6" />
            </span>
            <span>Lịch Công Tác & Tiếp Xúc Đối Tác</span>
          </h1>

          <p className="text-xs text-muted-foreground mt-1">
            Tổng hợp toàn bộ lịch làm việc, tiếp xúc Sở/Tỉnh của ban lãnh đạo. Cảnh báo trùng lịch
            tự động và kết nối trực tiếp với 7 bước triển khai CĐS.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bỏ view mode toggles ở đây */}

          {/* Đặt lịch công tác mới */}
          <Button
            size="sm"
            onClick={() => setOpenCreateDialog(true)}
            className="h-9 text-xs font-semibold gap-1.5 rounded-xl shadow-2xs cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>+ Đặt lịch công tác</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ KPI Chỉ số nhanh */}
      <GovCalendarStats
        meetings={meetings}
        summary={calendarSummary}
        activeFilterConflict={activeFilterConflict}
        onToggleFilterConflict={handleToggleFilterConflict}
        activeFilterType={activeFilterType}
        onSelectFilterType={handleSelectFilterType}
      />

      {/* Thanh thông báo bộ lọc đang áp dụng */}
      {(activeFilterConflict || activeFilterType !== "ALL") && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Đang lọc danh sách:</span>
            <Badge variant="secondary" className="font-normal text-xs">
              {activeFilterConflict
                ? "Các cuộc họp bị trùng lịch"
                : activeFilterType === "UPCOMING"
                  ? "Chỉ các cuộc họp sắp diễn ra"
                  : activeFilterType === "TRUC_TIEP"
                    ? "Chuyến công tác trực tiếp tại tỉnh"
                    : "Họp trực tuyến qua Meet / Zoom"}
            </Badge>
            <span className="text-muted-foreground">({filteredMeetings.length} cuộc họp phù hợp)</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveFilterConflict(false);
              setActiveFilterType("ALL");
            }}
            className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Xóa bộ lọc
          </Button>
        </div>
      )}

      <div className="pt-1">
        <GovCalendarFullView
          meetings={filteredMeetings}
          onUpdateStatus={handleUpdateStatus}
          onUpdateMeeting={updateMeeting}
          onDeleteMeeting={handleDeleteMeeting}
          onSelectProject={handleSelectProject}
          onRangeChange={handleRangeChange}
          isLoading={isCalendarLoading}
        />
      </div>

      {/* Modal Đặt lịch mới */}
      <GovMeetingDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
      />

      {/* Modal Chi tiết Dự án tỉnh (khi bấm vào tên tỉnh trên lịch) */}
      <GovProjectDetailModal />
    </div>
  );
}

export default function GovCalendarPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 max-w-[1650px] mx-auto pb-10 p-6 animate-pulse">
          <div className="h-10 w-72 bg-muted/60 rounded-xl" />
          <div className="h-28 w-full bg-muted/40 rounded-2xl" />
          <div className="h-96 w-full bg-muted/30 rounded-2xl" />
        </div>
      }
    >
      <GovCalendarContent />
    </React.Suspense>
  );
}

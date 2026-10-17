"use client";

import * as React from "react";
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { GovCalendarStats } from "@/modules/gov-solutions/components/calendar/GovCalendarStats";
import { GovCalendarFullView, getCalendarDateRange } from "@/modules/gov-solutions/components/calendar/GovCalendarFullView";
import { GovMeetingDialog } from "@/modules/gov-solutions/components/GovMeetingDialog";
import { GovProjectDetailModal } from "@/modules/gov-solutions/components/GovProjectDetailModal";
import {
  CalendarFilterState,
  DEFAULT_CALENDAR_FILTERS,
} from "@/modules/gov-solutions/components/calendar/GovCalendarFilters";
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
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

function GovCalendarContent() {
  const [mounted, setMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeFilterConflict, setActiveFilterConflict] = React.useState(false);
  const [activeFilterType, setActiveFilterType] = React.useState<"ALL" | "UPCOMING" | "TRUC_TIEP" | "ONLINE">("ALL");
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [selectedCreateDate, setSelectedCreateDate] = React.useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleOpenCreateForDate = (date?: Date) => {
    setSelectedCreateDate(date || new Date());
    setOpenCreateDialog(true);
  };

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<CalendarFilterState>(DEFAULT_CALENDAR_FILTERS);

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
        await fetchInitial();
        await Promise.all([
          fetchMasterCalendar({ all: 1, ...initialRange }),
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

  const handleFilterChange = (key: keyof CalendarFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_CALENDAR_FILTERS);
  };

  const activeDetailedFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.solutionId !== "ALL") count++;
    if (filters.meetingType !== "ALL") count++;
    if (filters.status !== "ALL") count++;
    return count;
  }, [filters]);

  const filteredMeetings = React.useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).getTime();
    const monthStart = startOfMonth(now).getTime();
    const monthEnd = endOfMonth(now).getTime();

    return meetings
      .map((m) => {
        return {
          ...m,
          title: m.title || m.content || "Lịch làm việc",
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
        // Quick stats filter (Conflict)
        const hasConflict = Boolean(
          m.hasConflict ||
          (m as any).has_conflict ||
          ((m as any).conflicts && (m as any).conflicts.length > 0)
        );
        if (activeFilterConflict && !hasConflict) {
          return false;
        }

        const mTime = new Date(m.scheduledAt?.replace(" ", "T") || 0).getTime();

        // Quick stats filter (Type / Upcoming)
        if (activeFilterType === "UPCOMING") {
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

        // Detailed filter: Solution (Dự án CĐS)
        if (filters.solutionId !== "ALL") {
          if (String(m.solutionId || "") !== String(filters.solutionId)) {
            return false;
          }
        }


        // Detailed filter: Meeting Type
        if (filters.meetingType !== "ALL") {
          if (m.meetingType !== filters.meetingType) {
            return false;
          }
        }

        // Detailed filter: Status
        if (filters.status !== "ALL") {
          if (m.status !== filters.status) {
            return false;
          }
        }

        // Detailed filter: Free text search
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchTitle = m.title?.toLowerCase().includes(q);
          const matchContent = m.content?.toLowerCase().includes(q);
          const matchLocation = m.location?.toLowerCase().includes(q);
          const matchProvince = m.provinceName?.toLowerCase().includes(q);
          const matchHost = m.hostName?.toLowerCase().includes(q);
          const matchContact = m.contactPerson?.toLowerCase().includes(q);
          if (
            !matchTitle &&
            !matchContent &&
            !matchLocation &&
            !matchProvince &&
            !matchHost &&
            !matchContact
          ) {
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
  }, [meetings, activeFilterConflict, activeFilterType, filters, projects]);

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
        fetchMasterCalendar({ all: 1, ...dateRange });
        fetchMasterCalendarSummary({ all: 1 });
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
      <div className="space-y-4 w-full pb-10 p-6 animate-pulse">
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
    <div className="space-y-4 w-full pb-10">
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
          <Button
            size="sm"
            onClick={() => setOpenCreateDialog(true)}
            className="h-9 text-xs font-semibold gap-1.5 rounded-xl shadow-2xs cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>+ Đặt lịch họp</span>
          </Button>
        </div>
      </div>

      <GovCalendarStats
        meetings={meetings}
        summary={calendarSummary}
        activeFilterConflict={activeFilterConflict}
        onToggleFilterConflict={handleToggleFilterConflict}
        activeFilterType={activeFilterType}
        onSelectFilterType={handleSelectFilterType}
      />



      {(activeFilterConflict || activeFilterType !== "ALL" || (!isFilterOpen && activeDetailedFilterCount > 0)) && (
        <div className="flex flex-wrap items-center justify-between px-3.5 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-primary">Đang lọc danh sách:</span>
            {activeFilterConflict && (
              <Badge variant="secondary" className="font-normal text-xs">
                Trùng lịch
              </Badge>
            )}
            {activeFilterType !== "ALL" && (
              <Badge variant="secondary" className="font-normal text-xs">
                {activeFilterType === "UPCOMING"
                  ? "Sắp diễn ra"
                  : activeFilterType === "TRUC_TIEP"
                    ? "Trực tiếp tại tỉnh"
                    : "Họp trực tuyến"}
              </Badge>
            )}
            {!isFilterOpen && activeDetailedFilterCount > 0 && (
              <Badge variant="secondary" className="font-normal text-xs">
                {activeDetailedFilterCount} bộ lọc nâng cao
              </Badge>
            )}
            <span className="text-muted-foreground">({filteredMeetings.length} cuộc họp phù hợp)</span>
          </div>

          <div className="flex items-center gap-2">
            {!isFilterOpen && activeDetailedFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="h-7 text-xs text-primary hover:underline cursor-pointer"
              >
                Mở bộ lọc
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveFilterConflict(false);
                setActiveFilterType("ALL");
                handleResetFilters();
              }}
              className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </Button>
          </div>
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
          onAddMeeting={handleOpenCreateForDate}
          isLoading={isCalendarLoading}
          filterContext={{
            isFilterOpen,
            setIsFilterOpen,
            activeFilterCount: activeDetailedFilterCount,
            filters,
            onFilterChange: handleFilterChange,
            onResetFilters: handleResetFilters,
            projects,
            totalMatches: filteredMeetings.length,
          }}
        />
      </div>

      <GovMeetingDialog
        open={openCreateDialog}
        onOpenChange={(open) => {
          setOpenCreateDialog(open);
          if (!open) setSelectedCreateDate(null);
        }}
        defaultDate={selectedCreateDate}
      />

      <GovProjectDetailModal />
    </div>
  );
}

export default function GovCalendarPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 w-full pb-10 p-6 animate-pulse">
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

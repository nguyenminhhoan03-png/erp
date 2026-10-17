"use client";

import * as React from "react";
import { GovMeetingSchedule } from "../../types";
import { Calendar, dateFnsLocalizer, Event as CalendarEvent, Views, DateHeaderProps } from "react-big-calendar";
import { format, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { MapPin, Video, UserCheck, Calendar as CalendarIcon, Check, X, Trash2, ExternalLink, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Filter, Plus, Info, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DLTM_STAGES } from "../../constants";
import { GovCalendarFilters, CalendarFilterState } from "./GovCalendarFilters";
import { DltmProject } from "../../types";

export interface CalendarFilterContextType {
  isFilterOpen: boolean;
  setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilterCount: number;
  filters: CalendarFilterState;
  onFilterChange: (key: keyof CalendarFilterState, value: string) => void;
  onResetFilters: () => void;
  projects?: DltmProject[];
  totalMatches: number;
}

export const CalendarFilterContext = React.createContext<CalendarFilterContextType | null>(null);

export interface CalendarActionContextType {
  onAddMeeting?: (date?: Date) => void;
}
export const CalendarActionContext = React.createContext<CalendarActionContextType>({});

const locales = {
  "vi": vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function getCalendarDateRange(currentDate: Date, currentView: string) {
  let start: Date;
  let end: Date;

  if (currentView === "month") {
    start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  } else if (currentView === "week") {
    start = startOfWeek(currentDate, { weekStartsOn: 1 });
    end = endOfWeek(currentDate, { weekStartsOn: 1 });
  } else {
    start = startOfDay(currentDate);
    end = currentView === "agenda" ? endOfMonth(currentDate) : endOfDay(currentDate);
  }

  return {
    start_date: format(start, "yyyy-MM-dd 00:00:00"),
    end_date: format(end, "yyyy-MM-dd 23:59:59"),
  };
}

interface GovCalendarFullViewProps {
  meetings: GovMeetingSchedule[];
  onUpdateStatus: (meetingId: string, status: "UPCOMING" | "DONE" | "CANCELLED") => Promise<boolean | void>;
  onDeleteMeeting: (meetingId: string) => Promise<boolean | void>;
  onSelectProject?: (projectId: string) => void;
  onUpdateMeeting?: (meetingId: string, updates: any, projectId?: string) => Promise<boolean | void>;
  onRangeChange?: (range: { start_date: string; end_date: string }) => void;
  onAddMeeting?: (date?: Date) => void;
  isLoading?: boolean;
  filterContext?: CalendarFilterContextType;
}

interface MappedEvent extends CalendarEvent {
  id: string;
  resource: GovMeetingSchedule;
  isConflict: boolean;
}

function CustomMonthDateHeader({ date, label, isOffRange, onDrillDown }: DateHeaderProps) {
  const { onAddMeeting } = React.useContext(CalendarActionContext);

  return (
    <div className="flex items-center justify-between px-1.5 py-0.5 w-full group/date-header">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddMeeting?.(date);
        }}
        title={`Thêm lịch công tác ngày ${format(date, "dd/MM/yyyy")}`}
        className="opacity-40 group-hover/date-header:opacity-100 hover:!opacity-100 h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-white hover:bg-primary transition-all duration-150 cursor-pointer shadow-2xs"
      >
        <Plus className="h-3 w-3 stroke-[2.5]" />
      </button>

      <button
        type="button"
        onClick={onDrillDown}
        className={cn(
          "rbc-button-link font-bold text-xs hover:text-primary transition-colors",
          isOffRange ? "text-muted-foreground/40" : "text-foreground"
        )}
      >
        {label}
      </button>
    </div>
  );
}

function CustomToolbar(toolbar: any) {
  const filterCtx = React.useContext(CalendarFilterContext);
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
    setTimeout(() => {
      const calendar = document.querySelector('.rbc-calendar');
      if (calendar) {
        calendar.classList.remove('flash-today-trigger');
        void (calendar as HTMLElement).offsetWidth; 
        calendar.classList.add('flash-today-trigger');
      }
    }, 10);
  };

  const label = () => {
    const date = toolbar.date;
    const view = toolbar.view;
    let text = toolbar.label;

    if (view === 'month') {
      text = `Tháng ${format(date, "MM, yyyy")}`;
    } else if (view === 'day') {
      text = format(date, "EEEE, 'ngày' dd/MM/yyyy", { locale: vi });
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    return (
      <span className="text-base font-bold tracking-wide text-foreground">
        {text}
      </span>
    );
  };

  return (
    <div className="space-y-3 mb-4 rbc-toolbar-sticky">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-muted/20 p-2 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between w-full sm:w-auto gap-1.5">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={goToCurrent} className="h-8 font-semibold rounded-lg text-xs">
              Hôm nay
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-card shadow-2xs" onClick={goToBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-card shadow-2xs" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="sm:hidden text-center font-bold text-primary text-sm">
            {label()}
          </div>
        </div>

        <div className="hidden sm:block text-center font-bold text-primary">
          {label()}
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center bg-card rounded-lg shadow-2xs p-1 overflow-x-auto max-w-full">
            {["month", "week", "day", "agenda"].map((viewName) => (
              <button
                key={viewName}
                type="button"
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap",
                  toolbar.view === viewName
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => toolbar.onView(viewName)}
              >
                {toolbar.localizer.messages[viewName]}
              </button>
            ))}
          </div>

          {filterCtx && (
            <Button
              variant={filterCtx.isFilterOpen || filterCtx.activeFilterCount > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => filterCtx.setIsFilterOpen(!filterCtx.isFilterOpen)}
              className="h-8.5 text-xs font-semibold gap-1.5 rounded-lg shadow-2xs cursor-pointer shrink-0"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Bộ lọc</span>
              {filterCtx.activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-4.5 px-1.5 text-[10px] ml-0.5 font-bold"
                >
                  {filterCtx.activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {(toolbar.view === "month" || toolbar.view === "week") && (
        <div className="sm:hidden flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            👉 Vuốt ngang bảng để xem đủ 7 ngày
          </span>
          <span className="text-primary font-semibold text-[10px]">Cuộn ↔</span>
        </div>
      )}

      {filterCtx && filterCtx.isFilterOpen && (
        <GovCalendarFilters
          filters={filterCtx.filters}
          onChange={filterCtx.onFilterChange}
          onReset={filterCtx.onResetFilters}
          onClose={() => filterCtx.setIsFilterOpen(false)}
          projects={filterCtx.projects}
          totalMatches={filterCtx.totalMatches}
        />
      )}
    </div>
  );
}

export function GovCalendarFullView({
  meetings,
  onUpdateStatus,
  onDeleteMeeting,
  onSelectProject,
  onUpdateMeeting,
  onRangeChange,
  onAddMeeting,
  isLoading = false,
  filterContext,
}: GovCalendarFullViewProps) {
  const { users } = useUserStore();
  const [selectedEvent, setSelectedEvent] = React.useState<MappedEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editStart, setEditStart] = React.useState("");
  const [editEnd, setEditEnd] = React.useState("");
  const [editParticipantIds, setEditParticipantIds] = React.useState<(string | number)[]>([]);
  const [searchParticipant, setSearchParticipant] = React.useState("");
  const searchParticipantRef = React.useRef<HTMLInputElement>(null);
  const [editContent, setEditContent] = React.useState("");
  const [editLocation, setEditLocation] = React.useState("");

  const [view, setView] = React.useState<any>(Views.MONTH);
  const [date, setDate] = React.useState<Date>(new Date());

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
    if (onRangeChange) {
      onRangeChange(getCalendarDateRange(newDate, view));
    }
  };

  const handleView = (newView: any) => {
    setView(newView);
    if (onRangeChange) {
      onRangeChange(getCalendarDateRange(date, newView));
    }
  };

  const events: MappedEvent[] = React.useMemo(() => {
    return meetings
      .filter((m) => m.scheduledAt || (m as any).startTime || (m as any).start_time)
      .map((m) => {
        const startRaw = m.scheduledAt || (m as any).startTime || (m as any).start_time;
        const startClean = String(startRaw).replace(" ", "T");
        const start = new Date(startClean);
        let end = new Date(start);

        const endRaw = (m as any).endTime || (m as any).end_time;
        if (endRaw) {
          end = new Date(String(endRaw).replace(" ", "T"));
        } else {
          end.setHours(end.getHours() + 1);
        }

        const title = m.title || m.content || "Lịch công tác";
        const hasConflict = Boolean(
          (m as any).hasConflict ||
          (m as any).has_conflict ||
          ((m as any).conflicts && (m as any).conflicts.length > 0)
        );

        return {
          id: m.id,
          title: m.provinceName ? `[${m.provinceName}] ${title}` : title,
          start,
          end,
          resource: {
            ...m,
            hasConflict,
            conflictingWith: (m as any).conflictingWith || (m as any).conflicting_with || "",
          },
          isConflict: hasConflict,
        };
      });
  }, [meetings]);

  const handleSelectEvent = (event: MappedEvent) => {
    setSelectedEvent(event);
    setEditStart(event.start ? format(event.start as Date, "yyyy-MM-dd'T'HH:mm") : "");
    setEditEnd(event.end ? format(event.end as Date, "yyyy-MM-dd'T'HH:mm") : "");
    setEditParticipantIds(event.resource.participantIds?.map(String) || []);
    setEditContent(event.resource.title || event.resource.content || "");
    setEditLocation(event.resource.location || "");
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent || !onUpdateMeeting) return;
    if (!editContent.trim()) {
      return;
    }
    const cleanStart = editStart.includes("T") ? editStart.replace("T", " ") : editStart;
    const cleanEnd = editEnd ? (editEnd.includes("T") ? editEnd.replace("T", " ") : editEnd) : undefined;
    const updates = {
      title: editContent.trim(),
      content: editContent.trim(),
      location: editLocation.trim(),
      start_time: cleanStart + (cleanStart.length === 16 ? ":00" : ""),
      end_time: cleanEnd ? cleanEnd + (cleanEnd.length === 16 ? ":00" : "") : undefined,
      participant_ids: editParticipantIds,
    };
    const success = await onUpdateMeeting(selectedEvent.id, updates, selectedEvent.resource.projectId);
    if (success) {
       setIsEditing(false);
       setIsDetailOpen(false);
    }
  };

  const getStageInfo = (stageId?: string | number | null) => {
    if (!stageId) return null;
    const stageKeys = ["DISPATCHED", "FEEDBACK", "MOU_SIGNED", "SPONSOR_AGREED", "DATA_COLLECT", "DEPLOYING", "COMPLETED"] as const;
    const sStr = String(stageId);
    const stageIdx = stageKeys.findIndex((k) => k === sStr || k === `STAGE_${sStr}`);
    if (stageIdx !== -1) {
      return { stepNumber: stageIdx + 1, title: DLTM_STAGES[stageKeys[stageIdx] as keyof typeof DLTM_STAGES]?.shortLabel || sStr };
    }
    const num = parseInt(sStr, 10);
    if (!isNaN(num) && num >= 1 && num <= 7) {
      const stageKey = stageKeys[num - 1];
      return { stepNumber: num, title: DLTM_STAGES[stageKey as keyof typeof DLTM_STAGES]?.shortLabel || `Bước ${num}` };
    }
    return null;
  };

  const eventPropGetter = (event: MappedEvent) => {
    const isDone = (event.resource.status as string) === "DONE" || (event.resource.status as string) === "COMPLETED";
    const isCancelled = event.resource.status === "CANCELLED";
    const isInProgress = (event.resource.status as string) === "IN_PROGRESS";

    let backgroundColor = "#3b82f6"; 
    let borderColor = "transparent";

    const isConflict = Boolean(event.isConflict || (event.resource as any)?.hasConflict);

    if (isConflict) {
      backgroundColor = "#f43f5e"; 
      borderColor = "#be123c"; 
    } else if (isInProgress) {
      backgroundColor = "#f59e0b"; 
      borderColor = "#d97706";
    } else if (isDone) {
      backgroundColor = "#10b981"; 
    } else if (isCancelled) {
      backgroundColor = "#64748b"; 
    }

    return {
      style: {
        backgroundColor,
        borderColor: event.isConflict ? borderColor : "transparent",
        borderRadius: "6px",
        opacity: isCancelled ? 0.7 : 1,
        color: "white",
        borderWidth: "1px",
        borderStyle: "solid",
        fontWeight: 600,
        fontSize: "11px",
        outline: "2px solid hsl(var(--card))",
        outlineOffset: "-2px"
      }
    };
  };

  return (
    <CalendarFilterContext.Provider value={filterContext || null}>
      <CalendarActionContext.Provider value={{ onAddMeeting }}>
        <div className="bg-card rounded-2xl border border-border/80 shadow-2xs p-3 sm:p-4 overflow-hidden relative">
      <style>{`
        .rbc-calendar {
          min-height: 920px;
          height: auto !important;
          font-family: inherit;
        }
        .rbc-month-view {
          min-height: 860px;
          height: auto;
        }
        .rbc-month-row {
          min-height: 135px;
          height: auto;
        }
        @media (max-width: 768px) {
          .rbc-month-view,
          .rbc-time-view {
            min-width: 680px;
          }
          .rbc-calendar {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .rbc-month-row {
            min-height: 120px;
          }
          .rbc-toolbar-sticky {
            position: sticky;
            left: 0;
            width: 100%;
            z-index: 10;
          }
        }
        .rbc-date-cell {
          padding: 2px 4px;
          font-weight: 600;
          font-size: 12px;
        }
        .rbc-toolbar button {
          border-radius: 8px;
          padding: 6px 12px;
          font-weight: 600;
          font-size: 13px;
        }
        .rbc-toolbar button.rbc-active {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          box-shadow: none;
        }
        .rbc-event {
          padding: 2px 6px;
          font-size: 11px;
          margin-bottom: 2px;
          border-radius: 6px;
        }
        .rbc-show-more {
          font-size: 11px;
          font-weight: 700;
          color: hsl(var(--primary));
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        .rbc-show-more:hover {
          text-decoration: underline;
        }
        .rbc-overlay {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 8px;
          z-index: 50;
        }
        .rbc-overlay-header {
          font-weight: 700;
          font-size: 12px;
          color: hsl(var(--foreground));
          border-bottom: 1px solid hsl(var(--border));
          padding: 4px 6px 6px;
          margin-bottom: 6px;
        }
        .rbc-today {
          background-color: rgba(59, 130, 246, 0.05); /* light primary */
        }
        .rbc-header {
          padding: 8px 0;
          font-weight: 700;
          color: hsl(var(--primary));
        }
        .rbc-time-header-content {
          border-left: 1px solid #e2e8f0;
        }
        @keyframes flash-today {
          0% { background-color: rgba(59, 130, 246, 0.05); }
          15% { background-color: rgba(59, 130, 246, 0.7); box-shadow: inset 0 0 30px rgba(59, 130, 246, 0.5); }
          100% { background-color: rgba(59, 130, 246, 0.05); box-shadow: inset 0 0 0 rgba(59, 130, 246, 0); }
        }
        .flash-today-trigger .rbc-today {
          animation: flash-today 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ minHeight: 920, height: "auto" }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        view={view}
        onView={handleView}
        date={date}
        onNavigate={handleNavigate}
        culture="vi"
        messages={{
          month: 'Tháng',
          week: 'Tuần',
          day: 'Ngày',
          agenda: 'Danh sách',
          today: 'Hôm nay',
          previous: '<',
          next: '>',
          noEventsInRange: 'Không có lịch trình nào trong khoảng thời gian này.',
          date: 'Ngày',
          time: 'Thời gian',
          event: 'Nội dung công việc',
          allDay: 'Cả ngày',
          showMore: (total) => `+ Xem thêm (${total})`
        }}
        components={{
          toolbar: CustomToolbar,
          month: {
            dateHeader: CustomMonthDateHeader,
          },
        }}
        onSelectSlot={({ start }) => {
          onAddMeeting?.(start as Date);
        }}
        popup
        selectable
      />

      <div className="mt-4 pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>Chú thích màu sắc:</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#f43f5e] border border-[#be123c] shadow-2xs shrink-0" />
            <span className="font-semibold text-rose-600 dark:text-rose-400">Trùng lịch</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#3b82f6] shadow-2xs shrink-0" />
            <span className="text-foreground font-medium">Kế hoạch / Sắp diễn ra</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#10b981] shadow-2xs shrink-0" />
            <span className="text-foreground font-medium">Đã hoàn thành</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#64748b] shadow-2xs opacity-75 shrink-0" />
            <span className="text-muted-foreground font-medium">Đã hủy</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-20 rounded-2xl">
          <div className="flex items-center gap-2 bg-card/95 border border-border/80 shadow-md px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Đang tải lịch công tác...</span>
          </div>
        </div>
      )}

      {selectedEvent && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <div className={cn(
              "h-14 flex items-center pl-6 pr-14 border-b",
              (selectedEvent.isConflict || (selectedEvent.resource as any)?.hasConflict) ? "bg-rose-500/10 border-rose-500/20" : "bg-muted/40"
            )}>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <CalendarIcon className={cn("h-5 w-5 shrink-0", (selectedEvent.isConflict || (selectedEvent.resource as any)?.hasConflict) ? "text-rose-600" : "text-primary")} />
                <span className={cn("text-base font-bold", (selectedEvent.isConflict || (selectedEvent.resource as any)?.hasConflict) ? "text-rose-700" : "text-foreground")}>
                  Chi tiết lịch trình công việc
                </span>
                {(selectedEvent.isConflict || (selectedEvent.resource as any)?.hasConflict) && (
                  <Badge variant="destructive" className="bg-rose-600 hover:bg-rose-600 text-white font-bold text-[10px] animate-pulse px-2 py-0.5 ml-1">
                    ⚠️ Trùng lịch
                  </Badge>
                )}
                {selectedEvent.resource.status === "IN_PROGRESS" && (
                  <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-bold text-[10px] animate-pulse px-2 py-0.5 ml-1">
                    ⚡ Đang diễn ra
                  </Badge>
                )}
                {((selectedEvent.resource.status as string) === "DONE" || (selectedEvent.resource.status as string) === "COMPLETED") && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 ml-1">
                    ✓ Đã xong
                  </Badge>
                )}
                {selectedEvent.resource.status === "CANCELLED" && (
                  <Badge className="bg-slate-500 hover:bg-slate-500 text-white font-bold text-[10px] px-2 py-0.5 ml-1">
                    Đã hủy
                  </Badge>
                )}
              </DialogTitle>
            </div>

            <div className="px-6 py-5 space-y-4 text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tên Công Việc
                </label>
                {isEditing ? (
                  <Textarea
                    className="min-h-[60px] text-sm resize-none font-medium"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Nhập nội dung công việc..."
                  />
                ) : (
                  <div className="font-semibold text-foreground text-base">
                    {selectedEvent.resource.title || selectedEvent.resource.content}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Địa phương
                  </label>
                  <div className="font-medium text-foreground">
                    {selectedEvent.resource.provinceName}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Giai đoạn
                  </label>
                  <div>
                    {(() => {
                      const stageInfo = getStageInfo(selectedEvent.resource.stageId);
                      return stageInfo ? (
                        <Badge variant="secondary" className="text-[11px]">
                          Bước {stageInfo.stepNumber}: {stageInfo.title}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Bắt đầu
                  </label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                    />
                  ) : (
                    <div className="font-medium text-foreground">
                      {selectedEvent.start ? format(selectedEvent.start as Date, "dd/MM/yyyy HH:mm") : ""}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Kết thúc
                  </label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                    />
                  ) : (
                    <div className="font-medium text-foreground">
                      {selectedEvent.end ? format(selectedEvent.end as Date, "dd/MM/yyyy HH:mm") : ""}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Người Phụ Trách (Chủ trì)
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 text-xs font-normal bg-background">
                          <span className="text-muted-foreground">Chọn người chủ trì...</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-[250px]"
                        align="start"
                        onOpenAutoFocus={(e) => {
                          e.preventDefault();
                          searchParticipantRef.current?.focus();
                          setTimeout(() => {
                            searchParticipantRef.current?.focus();
                          }, 10);
                        }}
                      >
                        <div className="p-1">
                          <Input
                            ref={searchParticipantRef}
                            placeholder="Tìm kiếm..."
                            value={searchParticipant}
                            onChange={(e) => setSearchParticipant(e.target.value)}
                            className="text-xs h-8 mb-2"
                          />
                          <div className="max-h-[150px] overflow-y-auto space-y-1">
                            {users.filter(u => !searchParticipant || u.name.toLowerCase().includes(searchParticipant.toLowerCase())).map(u => (
                              <label key={u.id} className="flex items-center gap-2 cursor-pointer text-xs hover:bg-muted/50 p-1.5 rounded">
                                <Checkbox 
                                  checked={editParticipantIds.map(String).includes(String(u.id))} 
                                  onCheckedChange={(checked) => {
                                    const uid = String(u.id);
                                    if (checked) setEditParticipantIds([...editParticipantIds, uid]);
                                    else setEditParticipantIds(editParticipantIds.filter(id => String(id) !== uid));
                                  }}
                                />
                                <UserAvatar user={u} size="sm" />
                                <span className="truncate">{u.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {editParticipantIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {editParticipantIds.map(id => {
                          const u = users.find(user => String(user.id) === String(id));
                          if (!u) return null;
                          return (
                            <div key={id} className="flex items-center gap-1.5 bg-accent rounded-full pl-2 pr-1 py-1 text-[11px]">
                              <UserAvatar user={u} size="sm" />
                              <span className="font-medium truncate max-w-[80px]">{u.name}</span>
                              <button
                                onClick={() => setEditParticipantIds(editParticipantIds.filter(pid => String(pid) !== String(id)))}
                                className="hover:bg-muted/50 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span>{selectedEvent.resource.hostName || "Lãnh đạo IGB"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hình thức / Địa điểm
                </label>
                {isEditing ? (
                  <Input
                    className="h-9 text-sm font-medium"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="VD: Trụ sở UBND Tỉnh..."
                  />
                ) : (
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    {selectedEvent.resource.location?.toLowerCase().includes("online") ? (
                      <Video className="h-4 w-4 text-blue-500" />
                    ) : (
                      <MapPin className="h-4 w-4 text-emerald-500" />
                    )}
                    <span>{selectedEvent.resource.location || "Trụ sở cơ quan"}</span>
                  </div>
                )}
              </div>

              {(selectedEvent.isConflict || (selectedEvent.resource as any)?.hasConflict) && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 text-xs mt-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>Cảnh báo: Trùng lịch công tác</span>
                  </div>
                  <p className="text-rose-600 leading-relaxed text-[11px]">
                    Lãnh đạo phụ trách đang có cuộc họp khác bị trùng khung giờ này:
                  </p>

                  {((selectedEvent.resource as any)?.conflicts && Array.isArray((selectedEvent.resource as any).conflicts) && (selectedEvent.resource as any).conflicts.length > 0) ? (
                    <div className="space-y-1.5 mt-1">
                      {((selectedEvent.resource as any).conflicts as any[]).map((c: any, i: number) => {
                        const leaderNames = c.users?.map((u: any) => u.name).filter(Boolean).join(", ");
                        return (
                          <div key={i} className="bg-rose-500/15 border border-rose-500/25 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-rose-900">
                              <span className="font-semibold text-rose-700">👤 Nhân sự trùng:</span>
                              <strong className="font-bold text-rose-950">{leaderNames || "Lãnh đạo phụ trách"}</strong>
                            </div>
                            <div className="text-rose-800 text-[11px] pl-3 flex items-start gap-1">
                              <span className="text-rose-500 mt-0.5">•</span>
                              <span>Có lịch họp: <strong className="font-semibold text-rose-950">"{c.label}"</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedEvent.resource.conflictingWith ? (
                    <div className="bg-rose-500/15 border border-rose-500/25 p-2.5 rounded-lg text-xs text-rose-900 font-medium leading-relaxed">
                      {selectedEvent.resource.conflictingWith}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex flex-wrap items-center justify-between gap-3 sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {selectedEvent.resource.status !== "DONE" && selectedEvent.resource.status !== "CANCELLED" && (
                  (selectedEvent.start && new Date() >= selectedEvent.start) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onUpdateStatus(selectedEvent.id, "DONE");
                        setIsDetailOpen(false);
                      }}
                      className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <Check className="h-4 w-4 mr-1" /> Đã xong
                    </Button>
                  ) : null
                )}

                {selectedEvent.resource.status !== "CANCELLED" && selectedEvent.resource.status !== "DONE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) {
                        onUpdateStatus(selectedEvent.id, "CANCELLED");
                        setIsDetailOpen(false);
                      }
                    }}
                    className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                  >
                    <X className="h-4 w-4 mr-1" /> Hủy lịch
                  </Button>
                )}

                {selectedEvent.resource.status === "DONE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onUpdateStatus(selectedEvent.id, "UPCOMING");
                      setIsDetailOpen(false);
                    }}
                    className="text-blue-600 border-blue-500/30 hover:bg-blue-500/10 cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Đặt lại sắp tới
                  </Button>
                )}

                {onUpdateMeeting && selectedEvent.resource.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (isEditing) {
                        handleSaveEdit();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className={isEditing ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" : "cursor-pointer"}
                  >
                    {isEditing ? "Lưu thông tin" : "Chỉnh sửa"}
                  </Button>
                )}

                {onDeleteMeeting && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Bạn có chắc chắn muốn xóa lịch hẹn này không?")) {
                        onDeleteMeeting(selectedEvent.id);
                        setIsDetailOpen(false);
                      }
                    }}
                    className="text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    title="Xóa lịch hẹn"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Xóa
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Hủy</Button>
                )}
                <Button size="sm" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
      </CalendarActionContext.Provider>
  </CalendarFilterContext.Provider>
  );
}

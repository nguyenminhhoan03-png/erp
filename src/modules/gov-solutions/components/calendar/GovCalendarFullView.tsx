"use client";

import * as React from "react";
import { GovMeetingSchedule } from "../../types";
import { Calendar, dateFnsLocalizer, Event as CalendarEvent, Views } from "react-big-calendar";
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
import { MapPin, Video, UserCheck, Calendar as CalendarIcon, Check, X, Trash2, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DLTM_STAGES } from "../../constants";

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
    // Tháng: Thứ 2 đầu tiên của lưới đến Chủ nhật cuối cùng của lưới (chuẩn của react-big-calendar)
    start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  } else if (currentView === "week") {
    // Tuần: Thứ 2 đến Chủ nhật của tuần đó
    start = startOfWeek(currentDate, { weekStartsOn: 1 });
    end = endOfWeek(currentDate, { weekStartsOn: 1 });
  } else {
    // Ngày hoặc Danh sách (Agenda)
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
  isLoading?: boolean;
}

interface MappedEvent extends CalendarEvent {
  id: string;
  resource: GovMeetingSchedule;
  isConflict: boolean;
}

function CustomToolbar(toolbar: any) {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
    // Toggle class trên wrapper của calendar để trigger animation
    setTimeout(() => {
      const calendar = document.querySelector('.rbc-calendar');
      if (calendar) {
        calendar.classList.remove('flash-today-trigger');
        void (calendar as HTMLElement).offsetWidth; // trigger reflow
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
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3 bg-muted/20 p-2 rounded-xl shadow-2xs">
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={goToCurrent} className="h-8 font-semibold rounded-lg">
          Hôm nay
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-card shadow-2xs" onClick={goToBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-card shadow-2xs" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center font-bold text-primary">
        {label()}
      </div>

      <div className="flex items-center bg-card rounded-lg shadow-2xs p-1">
        {["month", "week", "day", "agenda"].map((viewName) => (
          <button
            key={viewName}
            type="button"
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
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
  isLoading = false,
}: GovCalendarFullViewProps) {
  const { users } = useUserStore();
  const [selectedEvent, setSelectedEvent] = React.useState<MappedEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editStart, setEditStart] = React.useState("");
  const [editEnd, setEditEnd] = React.useState("");
  const [editParticipantIds, setEditParticipantIds] = React.useState<(string | number)[]>([]);
  const [searchParticipant, setSearchParticipant] = React.useState("");
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
      .filter((m) => m.scheduledAt)
      .map((m) => {
        const cleanDate = m.scheduledAt?.replace(" ", "T") || "";
        const start = new Date(cleanDate);
        let end = new Date(start);

        // Cố gắng parse end_time nếu có (Dựa theo dữ liệu từ Backend)
        if ((m as any).end_time) {
          const endClean = (m as any).end_time.replace(" ", "T");
          end = new Date(endClean);
        } else {
          // Mặc định 1 cuộc họp là 1 tiếng
          end.setHours(end.getHours() + 1);
        }

        const isConflict = Boolean((m as any).hasConflict);
        const title = m.title || m.content || "Lịch công tác";

        return {
          id: m.id,
          title: `[${m.provinceName}] ${title}`,
          start,
          end,
          resource: m,
          isConflict,
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
    const updates = {
      title: editContent,
      content: editContent,
      location: editLocation,
      start_time: editStart.replace("T", " ") + ":00",
      end_time: editEnd ? editEnd.replace("T", " ") + ":00" : undefined,
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
    const isDone = event.resource.status === "DONE";
    const isCancelled = event.resource.status === "CANCELLED";

    let backgroundColor = "#3b82f6"; // primary blue
    let borderColor = "transparent";

    if (event.isConflict) {
      backgroundColor = "#f43f5e"; // rose-500
      borderColor = "#be123c"; // rose-700
    } else if (isDone) {
      backgroundColor = "#10b981"; // emerald-500
    } else if (isCancelled) {
      backgroundColor = "#64748b"; // slate-500
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
    <div className="bg-card rounded-2xl border border-border/80 shadow-2xs p-4 overflow-hidden relative">
      <style>{`
        .rbc-calendar {
          min-height: 700px;
          font-family: inherit;
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
        style={{ height: 700 }}
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
        }}
        popup
        selectable
      />

      {/* Loading Overlay khi lật tháng/tuần */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-20 rounded-2xl">
          <div className="flex items-center gap-2 bg-card/95 border border-border/80 shadow-md px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Đang tải lịch công tác...</span>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Lịch Hẹn */}
      {selectedEvent && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <div className={cn(
              "h-14 flex items-center px-6 border-b",
              selectedEvent.isConflict ? "bg-rose-500/10 border-rose-500/20" : "bg-muted/40"
            )}>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span>Chi tiết lịch trình công việc</span>
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
                      <DropdownMenuContent className="w-[250px]" align="start">
                        <div className="p-1">
                          <Input
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

              {selectedEvent.isConflict && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 text-xs mt-4">
                  <span className="font-bold">⚠️ Cảnh báo:</span> Lãnh đạo đã bị trùng lịch công tác tại thời điểm này.
                  {selectedEvent.resource.conflictingWith && (
                    <div className="mt-1.5 font-semibold text-rose-800">
                      Chi tiết: {selectedEvent.resource.conflictingWith}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex flex-wrap items-center justify-between gap-3 sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {selectedEvent.resource.status === "UPCOMING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onUpdateStatus(selectedEvent.id, "DONE");
                      setIsDetailOpen(false);
                    }}
                    className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <Check className="h-4 w-4 mr-1" /> Đã xong
                  </Button>
                )}
                {onUpdateMeeting && selectedEvent.resource.status === "UPCOMING" && selectedEvent.end && new Date() <= selectedEvent.end && (
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
                    className={isEditing ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                  >
                    {isEditing ? "Lưu thông tin" : "Chỉnh sửa"}
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
  );
}

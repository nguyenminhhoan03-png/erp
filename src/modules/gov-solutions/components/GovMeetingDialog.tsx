"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useGovStore } from "../store/govStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { DLTM_STAGES } from "../constants";
import { GovStage } from "../types";
import { toast } from "sonner";
import {
  CalendarPlus,
  Clock,
  X,
  Video,
  MapPin,
  User,
  Users,
  Sparkles,
  Plus,
  AlertCircle,
  Loader2,
  Tag,
  Settings2,
} from "lucide-react";
import { GovAddProvinceModal } from "./GovAddProvinceModal";

const STAGE_STEPS: GovStage[] = [
  "DISPATCHED",
  "FEEDBACK",
  "MOU_SIGNED",
  "SPONSOR_AGREED",
  "DATA_COLLECT",
  "DEPLOYING",
  "COMPLETED",
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 phút" },
  { value: 30, label: "30 phút" },
  { value: 45, label: "45 phút" },
  { value: 60, label: "1 giờ" },
  { value: 90, label: "1 giờ 30 phút" },
  { value: 120, label: "2 giờ" },
  { value: 150, label: "2 giờ 30 phút" },
  { value: 180, label: "3 giờ" },
  { value: 240, label: "4 giờ" },
  { value: 300, label: "5 giờ" },
  { value: 360, label: "6 giờ" },
  { value: 480, label: "8 giờ" },
];

function addMinutesToLocalDatetime(isoLocal: string, minutes: number): string {
  if (!isoLocal) return "";
  const [datePart, timePart] = isoLocal.split("T");
  if (!datePart || !timePart) return "";
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  const dt = new Date(y, m - 1, d, h, min + minutes);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const mins = String(dt.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

function diffMinutesLocalDatetime(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 60;
  const [d1, t1] = startIso.split("T");
  const [d2, t2] = endIso.split("T");
  if (!d1 || !t1 || !d2 || !t2) return 60;
  const [y1, m1, day1] = d1.split("-").map(Number);
  const [h1, min1] = t1.split(":").map(Number);
  const [y2, m2, day2] = d2.split("-").map(Number);
  const [h2, min2] = t2.split(":").map(Number);
  const dt1 = new Date(y1, m1 - 1, day1, h1, min1);
  const dt2 = new Date(y2, m2 - 1, day2, h2, min2);
  const diff = Math.round((dt2.getTime() - dt1.getTime()) / 60000);
  return diff > 0 ? diff : 15;
}

function formatMinutesToHours(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export interface GovMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultSolutionId?: string;
  defaultDate?: Date | string | null;
}
export type DltmMeetingDialogProps = GovMeetingDialogProps;

export function GovMeetingDialog({
  open,
  onOpenChange,
  defaultProjectId,
  defaultSolutionId,
  defaultDate,
}: GovMeetingDialogProps) {
  const {
    solutions,
    activeSolutionId,
    setActiveSolutionId,
    projects,
    fetchInitial,
    addMeeting,
    initAllTargetProvinces,
  } = useGovStore();
  const { users, fetchUsers } = useUserStore();

  const [solutionId, setSolutionId] = React.useState<string>(defaultSolutionId || "");
  const [projectId, setProjectId] = React.useState<string>(defaultProjectId || "");
  const [stageId, setStageId] = React.useState<string>("1");
  const [title, setTitle] = React.useState("");
  const [meetingType, setMeetingType] = React.useState<"TRUC_TIEP" | "ONLINE">("TRUC_TIEP");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [durationMode, setDurationMode] = React.useState<"preset" | "custom_hours" | "end_time">("preset");
  const [durationMinutes, setDurationMinutes] = React.useState<number>(60);
  const [customHours, setCustomHours] = React.useState<string>("1");
  const [endTime, setEndTime] = React.useState<string>("");
  const [location, setLocation] = React.useState("");
  const [content, setContent] = React.useState("");
  const [hostUserId, setHostUserId] = React.useState<string>("");
  const [contactPerson, setContactPerson] = React.useState("");
  const [participantIds, setParticipantIds] = React.useState<string[]>([]);
  const [searchParticipant, setSearchParticipant] = React.useState("");
  const searchParticipantRef = React.useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [openAddProvince, setOpenAddProvince] = React.useState(false);
  const [isInitializingProvinces, setIsInitializingProvinces] = React.useState(false);

  const currentSolutionId = solutionId || defaultSolutionId;
  const selectedSolution = solutions.find((s) => s.id === currentSolutionId);
  const isGovProject = selectedSolution ? (selectedSolution.category === "GOV" || !selectedSolution.category) : false;

  const isGovMission = Boolean(defaultProjectId) || (Boolean(currentSolutionId) && isGovProject);

  const handleSolutionChange = (newSolId: string) => {
    if (newSolId === "none") {
      setSolutionId("");
      setProjectId("");
      return;
    }
    setSolutionId(newSolId);
    setProjectId("");
  };

  const handleQuickInitAll = async () => {
    if (!solutionId) return;
    setIsInitializingProvinces(true);
    try {
      const res = await initAllTargetProvinces(solutionId);
      if (res.success) {
        toast.success(`Đã khởi tạo thành công ${res.insertedCount || 34} tỉnh mục tiêu!`);
      } else {
        toast.error("Không thể khởi tạo các tỉnh. Vui lòng thử lại!");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi khởi tạo tỉnh");
    } finally {
      setIsInitializingProvinces(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      fetchUsers().catch(() => {});

      if (defaultDate) {
        try {
          let dt: Date;
          if (typeof defaultDate === "string") {
            dt = new Date(defaultDate.includes("T") ? defaultDate : `${defaultDate}T09:00:00`);
          } else {
            dt = new Date(defaultDate);
          }
          if (!isNaN(dt.getTime())) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, "0");
            const d = String(dt.getDate()).padStart(2, "0");
            const h = dt.getHours() !== 0 ? String(dt.getHours()).padStart(2, "0") : "09";
            const min = dt.getMinutes() !== 0 ? String(dt.getMinutes()).padStart(2, "0") : "00";
            const initStart = `${y}-${m}-${d}T${h}:${min}`;
            setScheduledAt(initStart);
            setEndTime(addMinutesToLocalDatetime(initStart, durationMinutes || 60));
          }
        } catch (e) {
          console.error("Error setting default date:", e);
        }
      }

      if (defaultProjectId) {
        setProjectId(defaultProjectId);
        const targetProj = projects.find((p) => p.id === defaultProjectId);
        if (targetProj?.solutionId) {
          setSolutionId(targetProj.solutionId);
        }
      } else if (defaultSolutionId) {
        setSolutionId(defaultSolutionId);
      } else {
        setSolutionId("");
        setProjectId("");
      }
    }
  }, [open, defaultProjectId, defaultSolutionId, defaultDate]);

  React.useEffect(() => {
    if (projectId && isGovMission) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        if (proj.leaderContact?.fullName) {
          setContactPerson(`${proj.leaderContact.fullName} - ${proj.leaderContact.position}`);
        }
        const stageIdx = STAGE_STEPS.indexOf(proj.stage);
        if (stageIdx >= 0) {
          setStageId(String(stageIdx + 1));
        }
      }
    }
  }, [projectId, projects, isGovMission]);

  const handleStartTimeChange = (val: string) => {
    setScheduledAt(val);
    if (val && durationMinutes > 0) {
      setEndTime(addMinutesToLocalDatetime(val, durationMinutes));
    }
  };

  const handleDurationPresetChange = (val: string) => {
    if (val === "custom") {
      setDurationMode("custom_hours");
      setCustomHours((durationMinutes / 60).toString());
    } else {
      const mins = Number(val);
      setDurationMinutes(mins);
      setCustomHours((mins / 60).toString());
      if (scheduledAt) {
        setEndTime(addMinutesToLocalDatetime(scheduledAt, mins));
      }
    }
  };

  const handleCustomHoursChange = (val: string) => {
    setCustomHours(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const mins = Math.round(num * 60);
      setDurationMinutes(mins);
      if (scheduledAt) {
        setEndTime(addMinutesToLocalDatetime(scheduledAt, mins));
      }
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (scheduledAt && val) {
      const mins = diffMinutesLocalDatetime(scheduledAt, val);
      setDurationMinutes(mins);
      setCustomHours((mins / 60).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !scheduledAt) {
      toast.error("Vui lòng nhập tiêu đề và thời gian bắt đầu");
      return;
    }

    const targetProject = projects.find((p) => p.id === projectId);
    const provinceName = targetProject ? targetProject.provinceName : (selectedSolution ? selectedSolution.name : "Nội bộ");

    setIsSubmitting(true);
    try {
      const selectedHost = users.find((u) => String(u.id) === String(hostUserId));
      const hostName = selectedHost
        ? selectedHost.name
        : participantIds.length > 0
          ? participantIds.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(", ")
          : "Đại diện IGB";

      const defaultLoc =
        meetingType === "ONLINE"
          ? "Phòng họp trực tuyến (Google Meet/Zoom)"
          : isGovMission
            ? "Trụ sở UBND / Sở ban ngành"
            : "Văn phòng IGB";

      const finalLocation = location.trim() || defaultLoc;
      const computedEndTime =
        endTime || (scheduledAt ? addMinutesToLocalDatetime(scheduledAt, durationMinutes) : undefined);

      const result = await addMeeting({
        category: (isGovMission ? "CONG_TAC" : "HOP_NOI_BO") as any,
        eventType: (isGovMission ? "CONG_TAC" : "HOP_NOI_BO") as any,
        projectId: (isGovMission && projectId) ? projectId : undefined,
        stageId: (isGovMission && projectId && stageId) ? Number(stageId) : undefined,
        solutionId: solutionId || undefined,
        provinceName,
        title: title.trim(),
        meetingType,
        durationMinutes: Number(durationMinutes),
        endTime: computedEndTime ? computedEndTime.replace("T", " ") : undefined,
        scheduledAt: scheduledAt.replace("T", " "),
        location: finalLocation,
        content: content.trim() || title.trim(),
        hostUserId: hostUserId ? Number(hostUserId) : undefined,
        hostName,
        participantIds,
        contactPerson: contactPerson.trim() || "Thành viên IGB",
        status: "UPCOMING",
      });

      if (result) {
        if (typeof result === "object" && (result as any).hasConflict) {
          toast.warning(`Đã lên lịch "${title}" (Cảnh báo: Có nhân sự bị trùng lịch họp!)`);
        } else {
          toast.success(`Đã lên lịch thành công: "${title}"`);
        }
        setTitle("");
        setContent("");
        setScheduledAt("");
        setEndTime("");
        setLocation("");
        setDurationMinutes(60);
        setCustomHours("1");
        setDurationMode("preset");
        setMeetingType("TRUC_TIEP");
        setHostUserId("");
        setParticipantIds([]);
        setContactPerson("");
        onOpenChange(false);
      } else {
        toast.error("Không thể lưu lịch hẹn, vui lòng thử lại");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi lưu lịch hẹn");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            <span>Lên Lịch Cuộc Họp / Sự Kiện</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Tiêu đề cuộc họp / sự kiện <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: Họp giao ban đầu tuần, Đi công tác Sở TT&TT, Tiệc liên hoan quý III..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Dự án liên quan <span className="text-muted-foreground font-normal">(Tùy chọn)</span>
              </label>
              {selectedSolution && (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {selectedSolution.category === "INTERNAL"
                    ? "Dự án Nội bộ"
                    : selectedSolution.category === "OUTSOURCE"
                    ? "Dự án Outsource"
                    : "Dự án CĐS"}
                </span>
              )}
            </div>
            <Select value={solutionId || "none"} onValueChange={handleSolutionChange}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Không gắn dự án cụ thể" />
              </SelectTrigger>
              <SelectContent className="max-h-[220px]">
                <SelectItem value="none" className="text-xs">
                  Chưa có (Không gắn dự án)
                </SelectItem>
                {solutions.map((sol) => (
                  <SelectItem key={sol.id} value={sol.id} className="text-xs">
                    {sol.name} {sol.category === "INTERNAL" ? "(Nội bộ)" : sol.category === "OUTSOURCE" ? "(Outsource)" : "(CĐS)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isGovMission && (
            <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Địa phương triển khai <span className="text-muted-foreground font-normal">(Tùy chọn)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setOpenAddProvince(true)}
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Thêm tỉnh
                    </button>
                  </div>
                  <Select
                    value={projectId || "none"}
                    onValueChange={(val) => setProjectId(val === "none" ? "" : val)}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Toàn quốc / Chưa chỉ định tỉnh" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[220px]">
                      <SelectItem value="none" className="text-xs">
                        (Toàn quốc / Chưa gắn tỉnh cụ thể)
                      </SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.provinceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Giai đoạn tiếp cận (Nếu có)
                  </label>
                  <Select value={stageId} onValueChange={setStageId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Chọn giai đoạn" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[220px]">
                      {STAGE_STEPS.map((stKey, idx) => {
                        const cfg = DLTM_STAGES[stKey];
                        return (
                          <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs">
                            {idx + 1}. {cfg.label.replace(/^\d+\.\s*/, "")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Thời gian bắt đầu</span> <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{durationMode === "end_time" ? "Giờ kết thúc" : "Thời lượng"}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (durationMode === "end_time") {
                      setDurationMode("preset");
                    } else {
                      setDurationMode("end_time");
                      if (scheduledAt && !endTime) {
                        setEndTime(addMinutesToLocalDatetime(scheduledAt, durationMinutes));
                      }
                    }
                  }}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                >
                  {durationMode === "end_time" ? "Chọn thời lượng" : "Nhập giờ kết thúc"}
                </button>
              </div>

              {durationMode === "end_time" ? (
                <div className="space-y-1">
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="text-xs h-9"
                  />
                  {scheduledAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Thời lượng: <span className="font-semibold text-foreground">{formatMinutesToHours(durationMinutes)}</span>
                    </p>
                  )}
                </div>
              ) : durationMode === "custom_hours" ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="24"
                        value={customHours}
                        onChange={(e) => handleCustomHoursChange(e.target.value)}
                        placeholder="VD: 1.5"
                        className="text-xs h-9 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                        giờ
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDurationMode("preset")}
                      className="text-xs h-9 shrink-0 px-2.5"
                    >
                      Mẫu sẵn
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tương đương: <span className="font-semibold text-foreground">{durationMinutes} phút</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Select
                    value={DURATION_OPTIONS.some((d) => d.value === durationMinutes) ? String(durationMinutes) : "custom"}
                    onValueChange={handleDurationPresetChange}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Chọn thời lượng" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[220px]">
                      {DURATION_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={String(item.value)} className="text-xs">
                          {item.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-xs font-semibold text-primary">
                        + Nhập số giờ tùy chỉnh...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {scheduledAt && endTime && (
                    <p className="text-[11px] text-muted-foreground">
                      Đến: <span className="font-medium text-foreground">{endTime.replace("T", " ")}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Hình thức & Địa điểm</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border/50">
              <button
                type="button"
                onClick={() => setMeetingType("TRUC_TIEP")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  meetingType === "TRUC_TIEP"
                    ? "bg-background text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Trực tiếp tại địa điểm</span>
              </button>
              <button
                type="button"
                onClick={() => setMeetingType("ONLINE")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  meetingType === "ONLINE"
                    ? "bg-background text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Trực tuyến (Meet / Zoom)</span>
              </button>
            </div>
            <Input
              placeholder={
                meetingType === "ONLINE"
                  ? "Dán đường dẫn Google Meet, Zoom hoặc MS Teams..."
                  : "VD: Phòng họp A - Tầng 3 / Trụ sở UBND / Nhà hàng Sen Tây Hồ..."
              }
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Nội dung cuộc họp <span className="text-muted-foreground font-normal">(Chi tiết)</span>
            </label>
            <Textarea
              placeholder="VD: Trao đổi kế hoạch triển khai, phân công nhiệm vụ, nội dung ăn uống hoặc liên hoan..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[65px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Cán bộ trong công ty tham gia</span>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9 text-xs font-normal bg-background">
                    <span className="text-muted-foreground truncate">
                      {participantIds.length > 0
                        ? `Đã chọn ${participantIds.length} nhân sự`
                        : "Chọn cán bộ tham gia..."}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[230px]"
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
                      placeholder="Tìm kiếm cán bộ..."
                      value={searchParticipant}
                      onChange={(e) => setSearchParticipant(e.target.value)}
                      className="text-xs h-8 mb-2 bg-background"
                    />
                    <div className="max-h-[160px] overflow-y-auto space-y-1">
                      {users
                        .filter((u) => !searchParticipant || u.name.toLowerCase().includes(searchParticipant.toLowerCase()))
                        .map((u) => (
                          <label
                            key={u.id}
                            className="flex items-center gap-2 cursor-pointer text-xs hover:bg-muted/60 p-1.5 rounded transition-colors"
                          >
                            <Checkbox
                              checked={participantIds.includes(String(u.id))}
                              onCheckedChange={(checked) => {
                                const uid = String(u.id);
                                if (checked) {
                                  setParticipantIds([...participantIds, uid]);
                                } else {
                                  setParticipantIds(participantIds.filter((id) => id !== uid));
                                  if (String(hostUserId) === uid) {
                                    setHostUserId("");
                                  }
                                }
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

              {participantIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {participantIds.map((id) => {
                    const u = users.find((user) => String(user.id) === String(id));
                    if (!u) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-1.5 bg-accent/60 rounded-full px-2 py-0.5 text-[11px] max-w-full"
                      >
                        <UserAvatar user={u} size="sm" />
                        <span className="truncate max-w-[80px] font-medium">{u.name}</span>
                        <X
                          className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => {
                            setParticipantIds(participantIds.filter((pid) => pid !== id));
                            if (String(hostUserId) === String(id)) {
                              setHostUserId("");
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Người chủ trì cuộc họp</span>
              </label>
              <Select
                value={hostUserId || "none"}
                onValueChange={(val) => setHostUserId(val === "none" ? "" : val)}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Chọn người chủ trì" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  <SelectItem value="none" className="text-xs">
                    (Không chỉ định riêng)
                  </SelectItem>
                  {participantIds.length > 0
                    ? participantIds.map((id) => {
                        const u = users.find((user) => String(user.id) === String(id));
                        if (!u) return null;
                        return (
                          <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                            {u.name}
                          </SelectItem>
                        );
                      })
                    : users.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                          {u.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu lịch hẹn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <GovAddProvinceModal
        open={openAddProvince}
        onOpenChange={setOpenAddProvince}
        solutionId={solutionId}
        onOpenInitAll={handleQuickInitAll}
      />
    </Dialog>
  );
}

export const DltmMeetingDialog = GovMeetingDialog;

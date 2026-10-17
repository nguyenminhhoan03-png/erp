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
  User,
  AlertTriangle,
  Check,
  X,
  Trash2,
  ExternalLink,
  Building2,
  Calendar,
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

interface GovCalendarTableViewProps {
  meetings: GovMeetingSchedule[];
  onUpdateStatus: (meetingId: string, status: "UPCOMING" | "DONE" | "CANCELLED") => Promise<boolean | void>;
  onDeleteMeeting: (meetingId: string) => Promise<boolean | void>;
  onSelectProject?: (projectId: string) => void;
}

export function GovCalendarTableView({
  meetings,
  onUpdateStatus,
  onDeleteMeeting,
  onSelectProject,
}: GovCalendarTableViewProps) {
  const formatDateTime = (scheduledAt?: string) => {
    if (!scheduledAt) return { date: "--/--/----", time: "--:--" };
    const cleanStr = scheduledAt.replace(" ", "T");
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return { date: scheduledAt, time: "" };

    const date = d.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return { date, time };
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
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
        <div className="p-4 rounded-2xl bg-muted/60 text-muted-foreground mb-3">
          <Calendar className="h-8 w-8" />
        </div>
        <h4 className="font-semibold text-foreground text-sm">Không tìm thấy lịch công tác nào</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Thử điều chỉnh lại bộ lọc tìm kiếm hoặc thêm lịch công tác mới cho các địa phương.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3.5 px-4 w-[160px]">Thời gian</th>
              <th className="py-3.5 px-4 w-[200px]">Địa phương & Mốc</th>
              <th className="py-3.5 px-4 min-w-[220px]">Nội dung công tác</th>
              <th className="py-3.5 px-4 w-[180px]">Hình thức & Địa điểm</th>
              <th className="py-3.5 px-4 w-[180px]">Chủ trì & Thành phần</th>
              <th className="py-3.5 px-4 w-[120px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 w-[130px] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {meetings.map((m) => {
              const { date, time } = formatDateTime(m.scheduledAt);
              const stageInfo = getStageInfo(m.stageId);
              const isDirect = m.meetingType === "TRUC_TIEP";
              const isDone = m.status === "DONE";
              const isCancelled = m.status === "CANCELLED";

              return (
                <tr
                  key={m.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors group",
                    m.hasConflict && "bg-destructive/5 hover:bg-destructive/10",
                    isDone && "opacity-75 bg-muted/10",
                    isCancelled && "opacity-60 bg-muted/20"
                  )}
                >
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{time || "--:--"}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground capitalize">{date}</span>

                      {m.hasConflict && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-1.5 py-0.5 w-fit">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>Trùng lịch</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                          onClick={() => m.projectId && onSelectProject?.(m.projectId)}
                        >
                          {m.provinceName || "Toàn quốc"}
                        </span>
                        {m.projectId && onSelectProject && (
                          <button
                            type="button"
                            onClick={() => m.projectId && onSelectProject(m.projectId)}
                            className="text-muted-foreground hover:text-primary p-0.5 rounded cursor-pointer"
                            title="Mở chi tiết dự án tỉnh này"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {stageInfo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary/90 bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5 w-fit">
                          🏛️ Bước {stageInfo.stepNumber}: {stageInfo.title}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          Chưa gắn mốc bước
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <p className={cn("font-medium text-foreground", isCancelled && "line-through text-muted-foreground")}>
                        {m.title}
                      </p>
                      {m.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {m.notes}
                        </p>
                      )}
                      {m.hasConflict && m.conflictingWith && (
                        <p className="text-[10px] text-destructive/90 bg-destructive/5 p-1 rounded border border-destructive/15 mt-1">
                          ⚠️ Trùng giờ với: {m.conflictingWith}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        {isDirect ? (
                          <Badge variant="outline" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0 h-5">
                            <MapPin className="h-3 w-3 mr-1" /> Trực tiếp
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 py-0 h-5">
                            <Video className="h-3 w-3 mr-1" /> Online
                          </Badge>
                        )}
                      </div>

                      {isDirect ? (
                        <span className="text-[11px] text-muted-foreground line-clamp-2">
                          {m.location || "Tại trụ sở đối tác"}
                        </span>
                      ) : (
                        m.location ? (
                          <a
                            href={m.location.startsWith("http") ? m.location : `https://${m.location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-primary hover:underline line-clamp-1 inline-flex items-center gap-1"
                          >
                            <span>{m.location}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Google Meet / Zoom</span>
                        )
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <User className="h-3 w-3 text-primary shrink-0" />
                        <span>{m.hostUser || m.hostName || "Chưa chỉ định sếp"}</span>
                      </div>
                      {m.partnerParticipants && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{m.partnerParticipants}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 align-top text-center">
                    {isDone ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                        Đã họp xong
                      </Badge>
                    ) : isCancelled ? (
                      <Badge variant="secondary" className="text-muted-foreground text-[10px] font-medium">
                        Đã hủy
                      </Badge>
                    ) : m.status === "IN_PROGRESS" ? (
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold animate-pulse">
                        Đang diễn ra
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-semibold">
                        Sắp diễn ra
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!isDone && !isCancelled && m.scheduledAt && new Date() >= new Date(m.scheduledAt.replace(" ", "T")) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateStatus(m.id, "DONE")}
                          title="Đánh dấu đã hoàn thành"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!isCancelled && !isDone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateStatus(m.id, "CANCELLED")}
                          title="Hủy lịch công tác"
                          className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteMeeting(m.id)}
                        title="Xóa lịch"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

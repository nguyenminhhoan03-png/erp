"use client";

import * as React from "react";
import { GovProject, GovMeetingSchedule, GovStage } from "../../types";
import { DLTM_STAGES } from "../../constants";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { User, FileText, Calendar, Clock, Plus, Check, Trash2, Edit3 } from "lucide-react";
import { useGovStore } from "../../store/govStore";
import { toast } from "sonner";
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

interface ProjectOverviewTabProps {
  project: GovProject;
  meetings: GovMeetingSchedule[];
  notes: string;
  setNotes: (notes: string) => void;
  isEditingNotes: boolean;
  setIsEditingNotes: (isEditing: boolean) => void;
  onSaveNotes: () => void;
  onOpenMeetingDialog: () => void;
  onUpdateMeetingStatus: (meetingId: string, status: "UPCOMING" | "DONE" | "CANCELLED") => Promise<boolean | void>;
  onDeleteMeeting: (meetingId: string) => Promise<boolean | void>;
}

export function ProjectOverviewTab({
  project,
  meetings,
  notes,
  setNotes,
  isEditingNotes,
  setIsEditingNotes,
  onSaveNotes,
  onOpenMeetingDialog,
  onUpdateMeetingStatus,
  onDeleteMeeting,
}: ProjectOverviewTabProps) {
  const { updateLeaderContact } = useGovStore();
  const upcomingMeetings = meetings.filter((m) => m.status === "UPCOMING");

  const [isEditingLeader, setIsEditingLeader] = React.useState(false);
  const [leaderForm, setLeaderForm] = React.useState({
    fullName: project.leaderContact.fullName || "",
    position: project.leaderContact.position || "",
    departmentName: project.leaderContact.departmentName || "",
    phone: project.leaderContact.phone || "",
    email: project.leaderContact.email || "",
  });
  const [isSavingLeader, setIsSavingLeader] = React.useState(false);

  React.useEffect(() => {
    setLeaderForm({
      fullName: project.leaderContact.fullName || "",
      position: project.leaderContact.position || "",
      departmentName: project.leaderContact.departmentName || "",
      phone: project.leaderContact.phone || "",
      email: project.leaderContact.email || "",
    });
  }, [project.leaderContact]);

  const handleSaveLeader = async () => {
    setIsSavingLeader(true);
    try {
      const ok = await updateLeaderContact(project.id, leaderForm);
      if (ok) {
        toast.success("Đã cập nhật thông tin đầu mối địa phương");
        setIsEditingLeader(false);
      } else {
        toast.error("Không thể lưu thông tin đầu mối lên máy chủ");
      }
    } finally {
      setIsSavingLeader(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Đầu mối Lãnh đạo Địa phương</span>
            </h4>
            {!isEditingLeader ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingLeader(true)}
                className="h-7 text-xs text-primary cursor-pointer gap-1"
              >
                <Edit3 className="h-3 w-3" />
                <span>Sửa đầu mối</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingLeader(false)}
                  className="h-7 text-xs text-muted-foreground cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveLeader}
                  disabled={isSavingLeader}
                  className="h-7 text-xs font-semibold cursor-pointer"
                >
                  {isSavingLeader ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            )}
          </div>

          {!isEditingLeader ? (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Đơn vị:</span>{" "}
                <strong className="text-foreground">
                  {project.leaderContact.departmentName || "Sở chuyên ngành"}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Họ tên:</span>{" "}
                <strong className="text-foreground">{project.leaderContact.fullName || "Chưa cập nhật"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Chức vụ:</span>{" "}
                <span className="text-foreground">{project.leaderContact.position || "Đang cập nhật"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Điện thoại:</span>{" "}
                <span className="font-mono text-foreground">{project.leaderContact.phone || "Chưa có"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-mono text-foreground">{project.leaderContact.email || "Chưa có"}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Họ và tên lãnh đạo *</label>
                <Input
                  value={leaderForm.fullName}
                  onChange={(e) => setLeaderForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ví dụ: Ông Trần Văn B"
                  className="h-7 text-xs rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Chức vụ</label>
                  <Input
                    value={leaderForm.position}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, position: e.target.value }))}
                    placeholder="Ví dụ: Giám đốc Sở"
                    className="h-7 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Đơn vị công tác</label>
                  <Input
                    value={leaderForm.departmentName}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, departmentName: e.target.value }))}
                    placeholder="Ví dụ: Sở Du lịch"
                    className="h-7 text-xs rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Số điện thoại</label>
                  <Input
                    value={leaderForm.phone}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="0912..."
                    className="h-7 text-xs rounded-lg font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Email</label>
                  <Input
                    value={leaderForm.email}
                    onChange={(e) => setLeaderForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@tinh.gov.vn"
                    className="h-7 text-xs rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Ghi chú chi tiết & Định hướng</span>
              </h4>
              {!isEditingNotes ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingNotes(true)}
                  className="h-7 text-xs text-primary cursor-pointer"
                >
                  Sửa ghi chú
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onSaveNotes}
                  className="h-7 text-xs font-semibold cursor-pointer"
                >
                  Lưu
                </Button>
              )}
            </div>

            {isEditingNotes ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs min-h-[95px] resize-none mt-1"
                placeholder="Nhập ghi chú quan trọng về tiến độ tiếp cận, yêu cầu đặc thù của địa phương..."
              />
            ) : (
              <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50 min-h-[95px] mt-1">
                {project.notes || "Chưa có ghi chú nào cho địa phương này."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Danh sách lịch hẹn ({meetings.length})</span>
              </h4>
              {upcomingMeetings.length > 0 && (
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                  {upcomingMeetings.length} sắp tới
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Toàn bộ lịch làm việc, trao đổi và họp trực tiếp/online với {project.provinceName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onOpenMeetingDialog}
              className="h-7 text-xs font-semibold gap-1 px-2.5 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>Đặt lịch mới</span>
            </Button>
          </div>
        </div>

        {meetings.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-xs border border-dashed border-border/80 rounded-xl space-y-2">
            <Calendar className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p>Chưa có lịch hẹn nào được tạo cho {project.provinceName}.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMeetingDialog}
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>Lên lịch làm việc đầu tiên</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {meetings.map((m) => {
              const isUpcoming = m.status === "UPCOMING";
              const isDone = m.status === "DONE";
              const isCancelled = m.status === "CANCELLED";

              return (
                <div
                  key={m.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-xs space-y-2",
                    isUpcoming && "bg-card border-border/80 hover:border-primary/40 shadow-2xs",
                    isDone && "bg-muted/20 border-border/60 opacity-90",
                    isCancelled && "bg-muted/10 border-border/40 opacity-60"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0",
                          isUpcoming && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                          isDone && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                          isCancelled && "bg-rose-500/10 text-rose-600 border-rose-500/30"
                        )}
                      >
                        {isUpcoming ? "Sắp tới" : isDone ? "Đã hoàn thành" : "Đã hủy"}
                      </Badge>

                      {Boolean(m.stageId) && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold px-2 py-0 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 shadow-2xs"
                          title="Giai đoạn dự án gắn với buổi làm việc này"
                        >
                          🏛️ Bước {m.stageId}: {m.stageName ? m.stageName.replace(/^\d+\.\s*/, "") : (DLTM_STAGES[STAGE_KEYS[(Number(m.stageId) || 1) - 1]]?.shortLabel || `Bước ${m.stageId}`)}
                        </Badge>
                      )}

                      <span className="font-mono text-[11px] font-bold text-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" />
                        {m.scheduledAt || "Chưa rõ thời gian"}
                      </span>

                      <span className="text-[11px] text-muted-foreground">
                        • {m.location || "Trụ sở Sở"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isUpcoming && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdateMeetingStatus(m.id, "DONE")}
                            className="h-6 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 px-2 cursor-pointer"
                            title="Đánh dấu đã hoàn thành"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            <span>Đã họp</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdateMeetingStatus(m.id, "CANCELLED")}
                            className="h-6 text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 px-2 cursor-pointer"
                            title="Hủy lịch hẹn"
                          >
                            <span>Hủy</span>
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteMeeting(m.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        title="Xóa lịch hẹn"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-foreground font-medium text-xs leading-snug">
                    {m.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 gap-2">
                    <span>
                      Chủ trì / Phụ trách: <strong className="text-foreground">{m.hostName || "IGB Team"}</strong>
                    </span>
                    <span>
                      Đầu mối: <span className="text-foreground">{m.contactPerson || project.leaderContact.fullName}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

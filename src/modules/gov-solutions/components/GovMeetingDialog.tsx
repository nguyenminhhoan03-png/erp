"use client";

import * as React from "react";
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
import { CalendarPlus, Clock, X } from "lucide-react";

const STAGE_STEPS: GovStage[] = [
  "DISPATCHED",
  "FEEDBACK",
  "MOU_SIGNED",
  "SPONSOR_AGREED",
  "DATA_COLLECT",
  "DEPLOYING",
  "COMPLETED",
];

export interface GovMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}
export type DltmMeetingDialogProps = GovMeetingDialogProps;

export function GovMeetingDialog({
  open,
  onOpenChange,
  defaultProjectId,
}: GovMeetingDialogProps) {
  const { projects, addMeeting } = useGovStore();

  const [projectId, setProjectId] = React.useState(defaultProjectId || projects[0]?.id || "");
  const [stageId, setStageId] = React.useState<string>("1");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [content, setContent] = React.useState("");
  const [hostName, setHostName] = React.useState("");
  const [contactPerson, setContactPerson] = React.useState("");
  const [participantIds, setParticipantIds] = React.useState<string[]>([]);
  const [searchParticipant, setSearchParticipant] = React.useState("");
  const { users } = useUserStore();

  React.useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  React.useEffect(() => {
    if (projectId) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        setContactPerson(`${proj.leaderContact.fullName} - ${proj.leaderContact.position}`);
        const stageIdx = STAGE_STEPS.indexOf(proj.stage);
        if (stageIdx >= 0) {
          setStageId(String(stageIdx + 1));
        }
      }
    }
  }, [projectId, projects]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !scheduledAt || !content.trim()) {
      toast.error("Vui lòng nhập đầy đủ các trường bắt buộc");
      return;
    }

    const targetProject = projects.find((p) => p.id === projectId);
    const provinceName = targetProject ? targetProject.provinceName : "Địa phương";

    setIsSubmitting(true);
    try {
      const ok = await addMeeting({
        projectId,
        stageId: Number(stageId),
        solutionId: targetProject?.solutionId,
        provinceName,
        scheduledAt: scheduledAt.replace("T", " "),
        location: location.trim() || "Trụ sở Sở",
        content: content.trim(),
        hostName: participantIds.length > 0 ? participantIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(", ") : "Đại diện IGB",
        participantIds,
        contactPerson: contactPerson.trim() || "Đại diện Tỉnh",
        status: "UPCOMING",
      });

      if (ok) {
        toast.success(`Đã lên lịch hẹn thành công với ${provinceName}`);
        setContent("");
        setScheduledAt("");
        setParticipantIds([]);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            <span>Đặt Lịch Hẹn Làm Việc Với Địa Phương</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Địa phương (Tỉnh / Thành phố) <span className="text-destructive">*</span>
              </label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Chọn tỉnh thành" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.provinceName} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Giai đoạn (Mục tiêu cuộc họp)
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Thời gian hẹn làm việc <span className="text-destructive">*</span>
            </label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Địa điểm / Hình thức</label>
            <Input
              placeholder="VD: Trụ sở UBND / Sở ban ngành / Google Meet Online"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Nội dung làm việc <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="VD: Họp trao đổi triển khai giải pháp và ký biên bản làm việc..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Thành phần IGB tham gia</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9 text-xs font-normal bg-white">
                    <span className="text-muted-foreground">Thêm cán bộ IGB...</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="start">
                  <div className="p-1">
                    <Input
                      placeholder="Tìm kiếm cán bộ..."
                      value={searchParticipant}
                      onChange={(e) => setSearchParticipant(e.target.value)}
                      className="text-xs h-8 mb-2 bg-white"
                    />
                    <div className="max-h-[140px] overflow-y-auto space-y-1">
                      {users.filter(u => !searchParticipant || u.name.toLowerCase().includes(searchParticipant.toLowerCase())).map(u => (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer text-xs hover:bg-muted/50 p-1.5 rounded">
                          <Checkbox 
                            checked={participantIds.includes(u.id)} 
                            onCheckedChange={(checked) => {
                              if (checked) setParticipantIds([...participantIds, u.id]);
                              else setParticipantIds(participantIds.filter(id => id !== u.id));
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

              {/* Danh sách người đã chọn */}
              {participantIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {participantIds.map(id => {
                    const u = users.find(user => user.id === id);
                    if (!u) return null;
                    return (
                      <div key={id} className="flex items-center gap-1.5 bg-accent/60 rounded-full px-2 py-1 text-[11px] max-w-full">
                        <UserAvatar user={u} size="sm" />
                        <span className="truncate max-w-[80px] font-medium">{u.name}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground shrink-0" 
                          onClick={() => setParticipantIds(participantIds.filter(pid => pid !== id))}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Khách mời địa phương</label>
              <Input
                placeholder="VD: Giám đốc Sở, chuyên viên..."
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="text-xs h-9"
              />
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
    </Dialog>
  );
}

export const DltmMeetingDialog = GovMeetingDialog;

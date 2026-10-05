"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useGovStore } from "../store/govStore";
import { toast } from "sonner";
import { CalendarPlus, Clock } from "lucide-react";

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
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [location, setLocation] = React.useState("Trực tiếp tại trụ sở Sở Du lịch");
  const [content, setContent] = React.useState("");
  const [hostName, setHostName] = React.useState("Lê Văn Cường (Trưởng phòng IT)");
  const [contactPerson, setContactPerson] = React.useState("");

  React.useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  React.useEffect(() => {
    const selected = projects.find((p) => p.id === projectId);
    if (selected) {
      setContactPerson(`${selected.leaderContact.fullName} - ${selected.leaderContact.position}`);
    }
  }, [projectId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = projects.find((p) => p.id === projectId);
    if (!selected) {
      toast.error("Vui lòng chọn tỉnh thành");
      return;
    }
    if (!scheduledAt) {
      toast.error("Vui lòng chọn thời gian hẹn làm việc");
      return;
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung làm việc");
      return;
    }

    addMeeting({
      projectId,
      provinceName: selected.provinceName,
      scheduledAt: scheduledAt.replace("T", " "),
      location,
      content: content.trim(),
      hostName,
      contactPerson,
      status: "UPCOMING",
    });

    toast.success("Đã đặt lịch hẹn làm việc!", {
      description: `Lịch họp với ${selected.provinceName} đã được cập nhật lên Dashboard.`,
    });

    setContent("");
    setScheduledAt("");
    onOpenChange(false);
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
          {/* Chọn Tỉnh thành */}
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

          {/* Ngày giờ hẹn */}
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

          {/* Địa điểm / Hình thức */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Địa điểm / Hình thức</label>
            <Input
              placeholder="VD: Trụ sở Sở Du lịch tỉnh / Google Meet Online"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Nội dung làm việc */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Nội dung làm việc <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="VD: Họp tiếp nhận dữ liệu cẩm nang du lịch và ký biên bản làm việc..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
              required
            />
          </div>

          {/* Người chủ trì & Đầu mối địa phương */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Người chủ trì (IGB)</label>
              <Input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Đầu mối địa phương</label>
              <Input
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
              className="text-xs"
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" className="text-xs font-semibold">
              Lưu lịch hẹn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DltmMeetingDialog = GovMeetingDialog;


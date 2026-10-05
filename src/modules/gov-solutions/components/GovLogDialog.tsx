"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useGovStore } from "../store/govStore";
import { GovWorkLog, DltmWorkLog } from "../types";
import { toast } from "sonner";
import { BookOpen, Calendar } from "lucide-react";

export interface GovLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  provinceName: string;
}
export type DltmLogDialogProps = GovLogDialogProps;

export function GovLogDialog({
  open,
  onOpenChange,
  projectId,
  provinceName,
}: GovLogDialogProps) {
  const { addWorkLog } = useGovStore();

  const todayStr = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  const [meetingDate, setMeetingDate] = React.useState(todayStr);
  const [meetingType, setMeetingType] = React.useState<DltmWorkLog["meetingType"]>("TRUC_TIEP");
  const [participants, setParticipants] = React.useState("");
  const [content, setContent] = React.useState("");
  const [agreements, setAgreements] = React.useState("");
  const [nextSteps, setNextSteps] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung buổi làm việc");
      return;
    }

    addWorkLog({
      projectId,
      meetingDate: meetingDate.replace("T", " "),
      meetingType,
      participants: participants.trim() || `Lãnh đạo địa phương + Đội ngũ IGB`,
      content: content.trim(),
      agreements: agreements.trim(),
      nextSteps: nextSteps.trim(),
      recordedBy: "Lê Văn Cường (Trưởng phòng IT)",
    });

    toast.success("Đã ghi nhận nhật ký làm việc!", {
      description: `Lịch sử làm việc với tỉnh ${provinceName} đã được cập nhật.`,
    });

    setContent("");
    setAgreements("");
    setNextSteps("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Ghi nhận Nhật ký làm việc - {provinceName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Ngày giờ & Hình thức */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Thời gian làm việc</label>
              <Input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Hình thức</label>
              <Select
                value={meetingType}
                onValueChange={(val) => setMeetingType(val as DltmWorkLog["meetingType"])}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Hình thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRUC_TIEP" className="text-xs">
                    🏢 Họp trực tiếp tại địa phương
                  </SelectItem>
                  <SelectItem value="ONLINE" className="text-xs">
                    💻 Họp trực tuyến (Google Meet/Zoom)
                  </SelectItem>
                  <SelectItem value="DIEN_THOAI" className="text-xs">
                    📞 Trao đổi qua điện thoại
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thành phần tham gia */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Thành phần tham gia</label>
            <Input
              placeholder="VD: Giám đốc Sở, Chánh VP Sở Du lịch + Đoàn IGB (Mr. Đăng, Mr. Cường)"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Nội dung làm việc */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Nội dung buổi làm việc <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Chi tiết các nội dung đã trình bày, khảo sát, trao đổi yêu cầu số hóa du lịch..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[80px] resize-none"
              required
            />
          </div>

          {/* Thỏa thuận đạt được */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Kết quả / Thỏa thuận đạt được</label>
            <Textarea
              placeholder="VD: Hai bên thống nhất ký MOU vào ngày 15 tới, Sở giao phòng CNTT làm đầu mối..."
              value={agreements}
              onChange={(e) => setAgreements(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* Kế hoạch tiếp theo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Các bước tiếp theo (Next Steps)</label>
            <Input
              placeholder="VD: Gửi dự thảo quyết định tiếp nhận tài trợ trước ngày 20"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              className="text-xs h-9"
            />
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
              Lưu nhật ký
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DltmLogDialog = GovLogDialog;


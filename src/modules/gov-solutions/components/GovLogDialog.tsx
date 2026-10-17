"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useGovStore } from "../store/govStore";
import { GovLogType, DltmWorkLog, GovWorkLog } from "../types";
import { GOV_LOG_TYPES, STAGE_OPTIONS } from "../constants";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";
import {
  BookOpen,
  Send,
  Inbox,
  PhoneCall,
  Users,
  FileSignature,
  FolderDown,
  Wrench,
  CheckCircle2,
  Milestone,
  Loader2,
  X,
  Paperclip,
  UploadCloud,
  FileText,
  MapPin,
  Pencil,
} from "lucide-react";

export interface GovLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  provinceName: string;
  editingLog?: GovWorkLog | null;
}
export type DltmLogDialogProps = GovLogDialogProps;

const LOG_TYPE_ICONS: Record<GovLogType, React.ReactNode> = {
  DISPATCH_SENT: <Send className="h-3.5 w-3.5 text-blue-500" />,
  DISPATCH_RECEIVED: <Inbox className="h-3.5 w-3.5 text-amber-500" />,
  CALL: <PhoneCall className="h-3.5 w-3.5 text-purple-500" />,
  MEETING: <Users className="h-3.5 w-3.5 text-emerald-500" />,
  MOU_SIGNING: <FileSignature className="h-3.5 w-3.5 text-indigo-500" />,
  DATA_COLLECT: <FolderDown className="h-3.5 w-3.5 text-cyan-500" />,
  TECHNICAL: <Wrench className="h-3.5 w-3.5 text-orange-500" />,
  ACCEPTANCE: <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />,
  STAGE_CHANGE: <Milestone className="h-3.5 w-3.5 text-slate-500" />,
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};


export function GovLogDialog({
  open,
  onOpenChange,
  projectId,
  provinceName,
  editingLog,
}: GovLogDialogProps) {
  const { projects, addWorkLog, updateWorkLog, teamMembers } = useGovStore();
  const currentProject = projects.find((p) => p.id === projectId);
  const leaders = React.useMemo(
    () => (teamMembers || []).filter((u: any) => u.id !== "unassigned"),
    [teamMembers]
  );

  const isEditing = Boolean(editingLog);
  const todayStr = new Date().toISOString().slice(0, 16);

  const [meetingDate, setMeetingDate] = React.useState(todayStr);
  const [stageId, setStageId] = React.useState<number>(1);
  const [logType, setLogType] = React.useState<GovLogType>("MEETING");
  const [title, setTitle] = React.useState("");
  const [meetingType, setMeetingType] = React.useState<DltmWorkLog["meetingType"]>("TRUC_TIEP");
  const [location, setLocation] = React.useState("");
  const [participants, setParticipants] = React.useState("");
  const [picName, setPicName] = React.useState("");
  const [content, setContent] = React.useState("");
  const [agreements, setAgreements] = React.useState("");
  const [nextSteps, setNextSteps] = React.useState("");

  const [attachments, setAttachments] = React.useState<
    Array<{ name: string; url: string; size?: number; type?: string }>
  >([]);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (editingLog) {
        setStageId(editingLog.stageId || 1);
        setLogType(editingLog.logType || "MEETING");
        setTitle(editingLog.title || "");
        setMeetingDate(
          editingLog.meetingDate ? editingLog.meetingDate.replace(" ", "T").slice(0, 16) : todayStr
        );
        setMeetingType(editingLog.meetingType || "TRUC_TIEP");
        setLocation(editingLog.location || "");
        setParticipants(editingLog.participants || "");
        setPicName(editingLog.recordedBy || "");
        setContent(editingLog.content || "");
        setAgreements(editingLog.agreements || "");
        setNextSteps(editingLog.nextSteps || "");
        setAttachments(editingLog.attachments || []);
      } else if (currentProject) {
        const stageMap: Record<string, number> = {
          DISPATCHED: 1,
          FEEDBACK: 2,
          MOU_SIGNED: 3,
          SPONSOR_AGREED: 4,
          DATA_COLLECT: 5,
          DEPLOYING: 6,
          COMPLETED: 7,
        };
        const initialStage = stageMap[currentProject.stage] || 1;
        setStageId(initialStage);
        setLogType("MEETING");
        setTitle(GOV_LOG_TYPES["MEETING"].defaultTitle);
        setMeetingDate(todayStr);
        setMeetingType("TRUC_TIEP");
        setLocation(`Trụ sở UBND / Sở - ${provinceName}`);

        if (currentProject.leaderContact?.fullName) {
          setParticipants(`${currentProject.leaderContact.fullName} - ${currentProject.leaderContact.position}`);
        } else {
          setParticipants("");
        }

        if (currentProject.igbAssignee?.name) {
          setPicName(currentProject.igbAssignee.name);
        } else {
          setPicName("");
        }

        setContent("");
        setAgreements("");
        setNextSteps("");
        setAttachments([]);
      }
    }
  }, [open, editingLog, currentProject, provinceName, todayStr]);

  const handleLogTypeChange = (newType: GovLogType) => {
    setLogType(newType);
    const config = GOV_LOG_TYPES[newType];
    if (config && !isEditing) {
      setTitle(config.defaultTitle);
      if (config.suggestedStageId) {
        setStageId(config.suggestedStageId);
      }
    }
    if (newType === "MEETING") {
      setMeetingType("TRUC_TIEP");
    } else if (newType === "CALL") {
      setMeetingType("DIEN_THOAI");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "gov-work-logs");

        const res = await apiRequest<{
          success: boolean;
          message?: string;
          data: {
            url: string;
            file_name?: string;
            original_name?: string;
            file_size?: number;
            size?: number;
            mime_type?: string;
          };
        }>("/erp/gov-projects/upload", {
          method: "POST",
          body: formData,
        });

        if (res?.data?.url) {
          const newAtt = {
            name: res.data.file_name || res.data.original_name || file.name,
            url: res.data.url,
            size: res.data.file_size || res.data.size || file.size,
            type: res.data.mime_type || file.type,
          };
          setAttachments((prev) => [...prev, newAtt]);
          toast.success(`Đã tải lên tệp: ${file.name}`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tải tệp lên máy chủ");
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung chi tiết");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingLog) {
        const ok = await updateWorkLog(editingLog.id, {
          stage_id: stageId,
          log_type: logType,
          title: title.trim() || GOV_LOG_TYPES[logType].defaultTitle,
          meeting_date: meetingDate.replace("T", " "),
          meeting_type: meetingType,
          location: location.trim() || undefined,
          participants: participants.trim() || "Đại diện Tỉnh",
          content: content.trim(),
          agreements: agreements.trim() || undefined,
          next_steps: nextSteps.trim() || undefined,
          attachments,
          recorded_by: picName.trim() || "IGB Representative",
        });

        if (ok) {
          toast.success(`Đã cập nhật nhật ký làm việc thành công!`);
          onOpenChange(false);
        } else {
          toast.error("Không thể cập nhật nhật ký, vui lòng thử lại");
        }
      } else {
        const ok = await addWorkLog({
          projectId,
          solutionId: currentProject?.solutionId,
          stageId,
          logType,
          title: title.trim() || GOV_LOG_TYPES[logType].defaultTitle,
          meetingDate: meetingDate.replace("T", " "),
          meetingType,
          location: location.trim() || undefined,
          participants: participants.trim() || "Đại diện Tỉnh",
          content: content.trim(),
          agreements: agreements.trim() || undefined,
          nextSteps: nextSteps.trim() || undefined,
          attachments,
          recordedBy: picName.trim() || "IGB Representative",
        });

        if (ok) {
          toast.success(`Đã ghi nhận nhật ký làm việc thành công với ${provinceName}`);
          onOpenChange(false);
        } else {
          toast.error("Không thể lưu nhật ký, vui lòng thử lại");
        }
      }
    } catch {
      toast.error("Có lỗi xảy ra khi lưu nhật ký");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            {isEditing ? (
              <Pencil className="h-5 w-5 text-amber-500" />
            ) : (
              <BookOpen className="h-5 w-5 text-primary" />
            )}
            <span>
              {isEditing
                ? `Chỉnh sửa Nhật ký làm việc - ${provinceName}`
                : `Ghi nhận Nhật ký làm việc - ${provinceName}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Khâu vòng đời dự án <span className="text-destructive">*</span>
              </label>
              <Select
                value={String(stageId)}
                onValueChange={(val) => setStageId(Number(val))}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Chọn khâu" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Loại sự vụ / Hành động <span className="text-destructive">*</span>
              </label>
              <Select
                value={logType}
                onValueChange={(val) => handleLogTypeChange(val as GovLogType)}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Loại sự vụ" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOV_LOG_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <div className="flex items-center gap-2">
                        {LOG_TYPE_ICONS[key as GovLogType]}
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tiêu đề sự vụ</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Gửi công văn số 12/IGB-CV, Họp trao đổi tiến độ..."
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Thời gian thực hiện</label>
              <Input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Hình thức làm việc</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Đại diện Tỉnh / Sở</label>
              <Input
                placeholder="VD: Giám đốc Sở, Chánh VP Sở TT&TT / Du lịch"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Nhân sự IGB phụ trách</label>
              <Select
                value={picName}
                onValueChange={(val) => setPicName(val)}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Chọn nhân sự" />
                </SelectTrigger>
                <SelectContent>
                  {leaders.map((user: any) => (
                    <SelectItem key={user.id} value={user.name} className="text-xs">
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>Địa điểm / Địa chỉ làm việc</span>
            </label>
            <Input
              placeholder="VD: Trụ sở UBND Tỉnh, Văn phòng Sở Du lịch, Google Meet link..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Nội dung chi tiết buổi làm việc <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Chi tiết các nội dung đã trình bày, khảo sát, trao đổi yêu cầu số hóa, số công văn đã trao đổi..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[85px] leading-relaxed resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Kết quả / Thỏa thuận đạt được
              </label>
              <Textarea
                placeholder="VD: Hai bên thống nhất ký MOU vào ngày 15 tới..."
                value={agreements}
                onChange={(e) => setAgreements(e.target.value)}
                className="text-xs min-h-[60px] resize-y"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Các bước tiếp theo (Next Steps)
              </label>
              <Textarea
                placeholder="VD: Gửi dự thảo quyết định tiếp nhận tài trợ; Phối hợp kỹ thuật..."
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                className="text-xs min-h-[60px] resize-y"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                <span>Bằng chứng / Biên bản làm việc / Ảnh chụp buổi họp</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {attachments.length > 0 ? `${attachments.length} tệp đã chọn` : "Tùy chọn"}
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card border border-border/60 text-xs shadow-2xs hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium text-foreground hover:text-primary hover:underline text-xs"
                        title={att.name}
                      >
                        {att.name}
                      </a>
                      {att.size ? (
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          ({formatFileSize(att.size)})
                        </span>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                id="workLogFilesInput"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              <label
                htmlFor="workLogFilesInput"
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border/90 hover:border-primary/60 bg-background/50 hover:bg-primary/5 transition-all cursor-pointer text-xs ${
                  isUploadingFile ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {isUploadingFile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground font-medium">Đang tải tệp lên hệ thống...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      Nhấn để tải lên <strong className="text-foreground">Biên bản họp, Ảnh buổi làm việc</strong> (Tối đa 50MB)
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>


          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || isUploadingFile}
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUploadingFile}
              className="text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : isEditing ? (
                <span>Cập nhật nhật ký</span>
              ) : (
                <span>Lưu nhật ký</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DltmLogDialog = GovLogDialog;

"use client";

import * as React from "react";
import { GovWorkLog } from "../../types";
import { GOV_LOG_TYPES } from "../../constants";
import { useGovStore } from "../../store/govStore";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Plus,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  MapPin,
  CheckCircle2,
  ArrowRightCircle,
  Paperclip,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectLogsTabProps {
  logs: GovWorkLog[];
  onOpenLogDialog: () => void;
  onEditLog?: (log: GovWorkLog) => void;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ProjectLogsTab({ logs, onOpenLogDialog, onEditLog }: ProjectLogsTabProps) {
  const { deleteWorkLog } = useGovStore();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (logId: string, logTitle?: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa nhật ký "${logTitle || "này"}" không? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }
    setDeletingId(logId);
    try {
      const ok = await deleteWorkLog(logId);
      if (ok) {
        toast.success("Đã xóa nhật ký làm việc thành công");
      } else {
        toast.error("Không thể xóa nhật ký, vui lòng thử lại");
      }
    } catch {
      toast.error("Lỗi khi xóa nhật ký");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Nhật ký & Lịch sử các buổi làm việc
          </h4>
          <p className="text-xs text-muted-foreground">
            Bảng lưu vết chi tiết từng lần trao đổi, họp trực tiếp hoặc trực tuyến với tỉnh
          </p>
        </div>
        <Button
          size="sm"
          onClick={onOpenLogDialog}
          className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ghi nhận nhật ký</span>
        </Button>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs border border-dashed border-border/80 rounded-xl">
            Chưa có nhật ký làm việc nào được ghi nhận cho tỉnh này.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl border border-border/80 bg-card space-y-3 relative hover:border-primary/40 transition-all shadow-2xs group"
            >
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {log.logType && GOV_LOG_TYPES[log.logType] && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium border px-1.5 py-0.5 ${GOV_LOG_TYPES[log.logType].badgeClass}`}
                    >
                      {GOV_LOG_TYPES[log.logType].label}
                    </Badge>
                  )}
                  {log.stageName && (
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {log.stageName}
                    </Badge>
                  )}
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {log.meetingDate}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    •{" "}
                    {log.meetingType === "TRUC_TIEP"
                      ? "Trực tiếp"
                      : log.meetingType === "ONLINE"
                      ? "Online"
                      : "Điện thoại"}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Phụ trách: <strong className="text-foreground">{log.recordedBy || "IGB"}</strong>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === log.id}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                      >
                        {deletingId === log.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MoreVertical className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => onEditLog?.(log)}
                        className="text-xs cursor-pointer gap-2"
                      >
                        <Pencil className="h-3.5 w-3.5 text-amber-500" />
                        <span>Chỉnh sửa</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(log.id, log.title)}
                        className="text-xs text-destructive hover:text-destructive focus:text-destructive cursor-pointer gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa nhật ký</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {log.title && (
                <h5 className="text-sm font-bold text-foreground">
                  {log.title}
                </h5>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                {log.participants && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground">Đại diện Tỉnh/Sở:</strong> {log.participants}
                    </span>
                  </div>
                )}
                {log.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>
                      <strong className="text-foreground">Địa điểm:</strong> {log.location}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap">
                {log.content}
              </p>

              {log.agreements && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Kết quả / Thỏa thuận đạt được:
                    </strong>
                    <p className="leading-relaxed">{log.agreements}</p>
                  </div>
                </div>
              )}

              {log.nextSteps && (
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-950 dark:text-indigo-200 text-xs flex items-start gap-2">
                  <ArrowRightCircle className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="block text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                      Các bước tiếp theo (Next Steps):
                    </strong>
                    <p className="leading-relaxed">{log.nextSteps}</p>
                  </div>
                </div>
              )}

              {log.attachments && log.attachments.length > 0 && (
                <div className="pt-1.5 border-t border-border/50 space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    Biên bản & Tệp đính kèm ({log.attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {log.attachments.map((file, fileIdx) => (
                      <a
                        key={fileIdx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-primary/10 border border-border/70 hover:border-primary/40 text-[11px] font-medium text-foreground hover:text-primary transition-colors max-w-full"
                      >
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        {file.size ? (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({formatFileSize(file.size)})
                          </span>
                        ) : null}
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import {
  AlertCircle,
  FileText,
  Paperclip,
  MessageSquare,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react";
import { DailyReport, DailyReportStatus } from "@/modules/tasks/types";
import { Department, User } from "@/shared/types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { formatDate } from "@/lib/date";
import { DailyReportStatusBadge } from "./DailyReportStatusBadge";

interface DailyReportDetailDialogProps {
  report: DailyReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  users: User[];
  departments: Department[];
  canEditReport: (report: DailyReport) => boolean;
  canDeleteReport: (report: DailyReport) => boolean;
  onEdit: (report: DailyReport) => void;
  onDelete: (report: DailyReport) => void;
  onUpdateStatus: (reportId: string, status: DailyReportStatus) => Promise<void>;
}

export function DailyReportDetailDialog({
  report,
  open,
  onOpenChange,
  currentUser,
  users,
  departments,
  canEditReport,
  canDeleteReport,
  onEdit,
  onDelete,
  onUpdateStatus,
}: DailyReportDetailDialogProps) {
  if (!report) return null;

  const viewingUser = users.find((u) => u.id === report.userId) || report.user;
  const viewingDept = departments.find((d) => d.id === viewingUser?.departmentId);
  const viewingApprover = users.find((u) => u.id === report.approverId) || report.approver;
  const viewingCcUsers = report.ccRecipientIds
    ? users.filter((u) => report.ccRecipientIds?.includes(u.id))
    : report.ccRecipients || [];

  const isReviewerOrAdmin =
    currentUser.id === report.approverId ||
    currentUser.role === "ADMIN" ||
    currentUser.role === "MANAGER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4 pb-2 border-b border-border/70">
            <div className="flex items-center gap-3">
              {viewingUser && <UserAvatar user={viewingUser} size="md" />}
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {viewingUser?.name || "Báo cáo công việc"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {viewingUser?.title || "Nhân viên"}
                  {viewingDept?.name ? ` • ${viewingDept.name} (${viewingDept.code || ""})` : ""}
                </p>
              </div>
            </div>
            <div>
              <DailyReportStatusBadge status={report.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3 rounded-xl border border-border/70">
            <div>
              <span className="text-muted-foreground block text-[10px]">Ngày báo cáo</span>
              <span className="font-semibold text-foreground">
                {formatDate(report.date, "dd/MM/yyyy")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Người duyệt</span>
              <span className="font-semibold text-foreground">
                {viewingApprover ? viewingApprover.name : "Chưa có"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Trạng thái</span>
              <div>
                <DailyReportStatusBadge status={report.status} />
              </div>
            </div>
          </div>

          {viewingCcUsers.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Đồng kính gửi:</span>
              <div className="flex flex-wrap gap-1">
                {viewingCcUsers.map((u) => (
                  <Badge key={u.id} variant="secondary" className="text-[10px]">
                    {u.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5 text-xs">
              <span>1. Các đầu việc đã thực hiện:</span>
            </h4>
            {report.todayWorks && report.todayWorks.length > 0 ? (
              <div className="space-y-2">
                {report.todayWorks.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors space-y-1"
                  >
                    <div className="flex justify-between items-start text-foreground">
                      <span className="font-medium text-xs">• {w.taskTitle}</span>
                    </div>
                    {w.note && (
                      <p className="text-[11px] text-muted-foreground pl-2.5 border-l-2 border-primary/40">
                        {w.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs italic p-2 bg-muted/20 rounded-lg border border-border/60">
                Không có danh sách đầu việc chi tiết
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1.5 text-xs">
              2. Kế hoạch công việc tiếp theo:
            </h4>
            <p className="p-3 rounded-xl border border-border/70 bg-muted/20 whitespace-pre-line text-muted-foreground text-xs leading-relaxed">
              {report.tomorrowPlans || "Chưa có nội dung"}
            </p>
          </div>

          {report.blockers && (
            <div>
              <h4 className="font-semibold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>3. Vấn đề vướng mắc / Cần hỗ trợ:</span>
              </h4>
              <p className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
                {report.blockers}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              <span>
                4. Tệp tin đính kèm & Minh chứng
                {report.attachments && report.attachments.length > 0
                  ? ` (${report.attachments.length})`
                  : ""}
                :
              </span>
            </h4>
            {report.attachments && report.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.attachments.map((item, i) => {
                  const str = typeof item === "string" ? item : (item as any)?.name || "";
                  const fileName = str.split("/").pop() || str;
                  const fileUrl = str.startsWith("http")
                    ? str
                    : str.startsWith("storage/") ||
                      str.startsWith("daily-reports/") ||
                      str.startsWith("gov-docs/")
                    ? `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8000/storage/${str.replace(/^storage\//, "")}`
                    : "";

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-muted/20 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate" title={fileName}>
                          {fileName}
                        </span>
                      </div>
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 shrink-0 ml-2 font-medium text-[11px]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Tải về / Xem</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs italic p-3 rounded-xl border border-border/70 bg-muted/20">
                Không có tệp tin đính kèm
              </p>
            )}
          </div>

          {report.feedbacks && report.feedbacks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/70">
              <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span>Nhận xét & Góp ý:</span>
              </h4>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {report.feedbacks.map((fb) => {
                  const fbUser = users.find((u) => u.id === fb.feedbackBy);
                  return (
                    <div
                      key={fb.id}
                      className="p-2.5 rounded-lg border border-border/70 bg-muted/20 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">
                          {fbUser?.name || "Người đánh giá"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(fb.createdAt, "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{fb.feedbackContent}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border/70 gap-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8.5 rounded-xl cursor-pointer"
            >
              Đóng
            </Button>
            {canEditReport(report) && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onEdit(report)}
                className="text-xs h-8.5 rounded-xl gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Sửa báo cáo</span>
              </Button>
            )}
            {canDeleteReport(report) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(report)}
                className="text-xs h-8.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa báo cáo</span>
              </Button>
            )}
          </div>
          {isReviewerOrAdmin && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onUpdateStatus(report.id, "REJECTED")}
                className="text-xs h-8.5 rounded-xl"
              >
                Yêu cầu sửa
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onUpdateStatus(report.id, "APPROVED")}
                className="text-xs h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Phê duyệt
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

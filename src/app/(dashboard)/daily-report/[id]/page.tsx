"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileSpreadsheet,
  ChevronRight,
  ArrowLeft,
  Calendar,
  UserCheck,
  FileText,
  Paperclip,
  AlertCircle,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { DailyReport, DailyReportStatus } from "@/modules/tasks/types";
import { useUserStore } from "@/shared/store/useUserStore";
import { reportService } from "@/modules/tasks/services/reportService";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatDate } from "@/lib/date";
import { DailyReportStatusBadge } from "@/modules/tasks/components/daily-report/DailyReportStatusBadge";

export default function DailyReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const { currentUser, users, departments } = useUserStore();
  const [report, setReport] = React.useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const fetchReport = React.useCallback(async () => {
    if (!reportId) return;
    setIsLoading(true);
    try {
      const data = await reportService.getReportById(reportId);
      if (data) {
        setReport(data);
      } else {
        toast.error("Không tìm thấy dữ liệu báo cáo");
      }
    } catch {
      toast.error("Không thể tải thông tin chi tiết báo cáo");
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  React.useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const viewingUser = users.find((u) => u.id === report?.userId) || report?.user;
  const viewingDept = departments.find((d) => d.id === viewingUser?.departmentId);
  const viewingApprover = users.find((u) => u.id === report?.approverId) || report?.approver;
  const viewingCcUsers = report?.ccRecipientIds
    ? users.filter((u) => report.ccRecipientIds?.includes(u.id))
    : report?.ccRecipients || [];

  const isOwner = Boolean(
    report &&
      currentUser.id &&
      (String(report.userId) === String(currentUser.id) ||
        String(report.user?.id) === String(currentUser.id))
  );

  const isReviewerOrAdmin = Boolean(
    currentUser.role === "ADMIN" ||
      currentUser.role === "MANAGER" ||
      (report && String(currentUser.id) === String(report.approverId))
  );

  const canEdit = isOwner && report?.status?.toLowerCase() !== "approved";
  const canDelete = isOwner && report?.status?.toLowerCase() !== "approved";

  const handleUpdateStatus = async (newStatus: DailyReportStatus) => {
    if (!report) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await reportService.updateReportStatus(report.id, newStatus);
      setReport(updated);
      toast.success(
        newStatus === "APPROVED" || newStatus === "approved"
          ? "Đã duyệt báo cáo thành công!"
          : "Đã từ chối/yêu cầu sửa báo cáo!"
      );
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    const confirmMsg = `Bạn có chắc chắn muốn xóa báo cáo ngày ${report.date} không?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const ok = await reportService.deleteReport(report.id);
      if (!ok) {
        toast.error("Không thể xóa báo cáo");
        return;
      }
      toast.success("Đã xóa báo cáo thành công!");
      router.push("/daily-report");
    } catch {
      toast.error("Không thể xóa báo cáo");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full p-8 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md" />
        <div className="h-12 w-96 bg-muted rounded-xl" />
        <div className="h-64 w-full bg-muted/60 rounded-2xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-muted-foreground text-sm">Báo cáo không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => router.push("/daily-report")} variant="outline" size="sm">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link
              href="/daily-report"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Báo cáo công việc</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-medium">Chi tiết báo cáo</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/daily-report"
              className="h-8 w-8 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <span>Báo cáo ngày {formatDate(report.date, "EEEE, dd/MM/yyyy")}</span>
                <DailyReportStatusBadge status={report.status} />
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bởi <strong className="text-foreground">{viewingUser?.name}</strong>
                {viewingDept?.name ? ` • Phòng ${viewingDept.name}` : ""}
                {report.submittedAt ? ` • Nộp lúc ${formatDate(report.submittedAt, "HH:mm dd/MM/yyyy")}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/daily-report/create?date=${report.date}`)}
              className="rounded-xl text-xs gap-1.5 h-9"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Chỉnh sửa báo cáo</span>
            </Button>
          )}

          {canDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="rounded-xl text-xs gap-1.5 h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa</span>
            </Button>
          )}

          {isReviewerOrAdmin && (
            <>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus("REJECTED")}
                className="rounded-xl text-xs gap-1.5 h-9"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Yêu cầu sửa</span>
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus("APPROVED")}
                className="rounded-xl text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Phê duyệt</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Left details & Right summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column (8 cols): Report Contents */}
        <div className="lg:col-span-8 space-y-6">
          {/* User & Date Banner */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-border/70">
              <div className="flex items-center gap-3">
                {viewingUser && <UserAvatar user={viewingUser} size="lg" />}
                <div>
                  <h3 className="font-bold text-base text-foreground">{viewingUser?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {viewingUser?.title || "Nhân viên"}
                    {viewingDept?.name ? ` • ${viewingDept.name} (${viewingDept.code || ""})` : ""}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Ngày nộp</span>
                <span className="text-xs font-semibold text-foreground">
                  {report.submittedAt ? formatDate(report.submittedAt, "HH:mm dd/MM/yyyy") : "Bản nháp"}
                </span>
              </div>
            </div>

            {/* 1. Công việc đã thực hiện */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>1. Công việc đã thực hiện trong ngày</span>
              </h4>

              {report.todayWorks && report.todayWorks.length > 0 ? (
                <div className="space-y-2.5">
                  {report.todayWorks.map((w, idx) => (
                    <div
                      key={w.id || idx}
                      className="p-4 rounded-xl border border-border/70 bg-muted/15 space-y-1.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xs font-bold text-primary w-5 text-center shrink-0 mt-0.5">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{w.taskTitle}</p>
                            {w.hoursSpent ? (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                <span>Thời gian dành: {w.hoursSpent} giờ</span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {w.status && (
                          <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                            {w.status}
                          </Badge>
                        )}
                      </div>

                      {w.note && (
                        <p className="text-xs text-muted-foreground pl-7 border-l-2 border-primary/30 mt-1 whitespace-pre-line">
                          {w.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 text-xs text-muted-foreground italic">
                  Không có danh sách đầu việc chi tiết
                </div>
              )}
            </div>

            {/* 2. Kế hoạch tiếp theo */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>2. Kế hoạch công việc ngày tiếp theo</span>
              </h4>
              <div className="p-4 rounded-xl border border-border/70 bg-muted/15 whitespace-pre-line text-xs leading-relaxed text-foreground">
                {report.tomorrowPlans || "Chưa có kế hoạch ghi nhận"}
              </div>
            </div>

            {/* 3. Vướng mắc & Khó khăn */}
            {report.blockers && (
              <div className="space-y-2 pt-2 border-t border-border/70">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>3. Vấn đề vướng mắc / Cần hỗ trợ</span>
                </h4>
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-xs leading-relaxed text-rose-700 dark:text-rose-300 whitespace-pre-line">
                  {report.blockers}
                </div>
              </div>
            )}

            {/* 4. Tệp tin đính kèm */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-primary" />
                <span>
                  4. Tệp tin đính kèm & Minh chứng
                  {report.attachments && report.attachments.length > 0
                    ? ` (${report.attachments.length})`
                    : ""}
                </span>
              </h4>

              {report.attachments && report.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/15 text-xs"
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
                            <span>Tải về</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-border/70 bg-muted/15 text-xs text-muted-foreground italic">
                  Không có tệp tin đính kèm
                </div>
              )}
            </div>

            {/* Feedbacks / Comments */}
            {report.feedbacks && report.feedbacks.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border/70">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Ý kiến nhận xét & Phản hồi ({report.feedbacks.length})</span>
                </h4>
                <div className="space-y-2.5">
                  {report.feedbacks.map((fb) => {
                    const fbUser = users.find((u) => u.id === fb.feedbackBy);
                    return (
                      <div
                        key={fb.id}
                        className="p-3.5 rounded-xl border border-border/70 bg-muted/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {fbUser?.name || "Người đánh giá"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(fb.createdAt, "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed">{fb.feedbackContent}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Meta Summary Widget */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Thông tin thẩm định</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Trạng thái:</span>
                <DailyReportStatusBadge status={report.status} />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Ngày báo cáo:</span>
                <span className="font-semibold text-foreground">
                  {formatDate(report.date, "dd/MM/yyyy")}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Người duyệt:</span>
                <div className="flex items-center gap-1.5">
                  {viewingApprover ? (
                    <>
                      <UserAvatar user={viewingApprover} size="sm" />
                      <span className="font-medium text-foreground">{viewingApprover.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Chưa chỉ định</span>
                  )}
                </div>
              </div>

              {viewingCcUsers.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-border/60">
                  <span className="text-muted-foreground block">Đồng kính gửi (CC):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingCcUsers.map((u) => (
                      <Badge
                        key={u.id}
                        variant="secondary"
                        className="text-[11px] font-normal px-2 py-0.5 gap-1"
                      >
                        <UserAvatar user={u} size="sm" />
                        <span>{u.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {report.submittedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Thời điểm nộp:</span>
                  <span className="font-medium text-foreground">
                    {formatDate(report.submittedAt, "HH:mm dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

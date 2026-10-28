"use client";

import * as React from "react";
import {
  Search,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { DailyReport, DailyReportStatus } from "@/modules/tasks/types";
import { User } from "@/shared/types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatDate } from "@/lib/date";
import { DailyReportStatusBadge } from "./DailyReportStatusBadge";

interface DailyReportHistoryTableProps {
  reports: DailyReport[];
  users: User[];
  isLoading: boolean;
  currentUser: User;
  onViewDetail: (report: DailyReport) => void;
  onEditReport: (report: DailyReport) => void;
  onDeleteReport: (report: DailyReport) => void;
  canEditReport: (report: DailyReport) => boolean;
  canDeleteReport: (report: DailyReport) => boolean;
  onGoToCreate: () => void;
}

export function DailyReportHistoryTable({
  reports,
  users,
  isLoading,
  currentUser,
  onViewDetail,
  onEditReport,
  onDeleteReport,
  canEditReport,
  canDeleteReport,
  onGoToCreate,
}: DailyReportHistoryTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [dateFilter, setDateFilter] = React.useState("");

  const filteredReports = React.useMemo(() => {
    return reports.filter((r) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const hasTaskMatch = r.todayWorks?.some((w) =>
          w.taskTitle.toLowerCase().includes(query)
        );
        const hasTomorrowMatch = r.tomorrowPlans?.toLowerCase().includes(query);
        const hasBlockerMatch = r.blockers?.toLowerCase().includes(query);
        const approverName = users.find((u) => u.id === r.approverId)?.name?.toLowerCase() || "";
        const hasApproverMatch = approverName.includes(query);

        if (!hasTaskMatch && !hasTomorrowMatch && !hasBlockerMatch && !hasApproverMatch) {
          return false;
        }
      }

      if (statusFilter !== "ALL") {
        if (r.status?.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      if (dateFilter) {
        if (r.date !== dateFilter) {
          return false;
        }
      }

      return true;
    });
  }, [reports, searchQuery, statusFilter, dateFilter, users]);

  const approvedCount = React.useMemo(() => {
    return reports.filter((r) => r.status?.toLowerCase() === "approved").length;
  }, [reports]);

  const submittedCount = React.useMemo(() => {
    return reports.filter((r) => r.status?.toLowerCase() === "submitted").length;
  }, [reports]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground block">{reports.length}</span>
            <span className="text-xs text-muted-foreground">Tổng số báo cáo đã gửi</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block">
              {approvedCount}
            </span>
            <span className="text-xs text-muted-foreground">Đã được phê duyệt</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-sky-600 dark:text-sky-400 block">
              {submittedCount}
            </span>
            <span className="text-xs text-muted-foreground">Đang chờ xem xét</span>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border border-border/80 bg-card flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm theo nội dung công việc, người duyệt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-muted/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[150px] bg-muted/20">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="SUBMITTED">Đã nộp</SelectItem>
              <SelectItem value="REJECTED">Cần sửa</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 text-xs rounded-xl w-[140px] bg-muted/20"
            />
          </div>

          {(searchQuery || statusFilter !== "ALL" || dateFilter) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setDateFilter("");
              }}
              className="h-9 text-xs gap-1 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Đặt lại</span>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 font-semibold text-muted-foreground">
                <th className="py-3 px-4">Ngày báo cáo</th>
                <th className="py-3 px-4">Đầu việc trọng tâm</th>
                <th className="py-3 px-4">Người duyệt</th>
                <th className="py-3 px-4">Thời gian gửi</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Phản hồi của sếp</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-muted rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-sm text-foreground">Không tìm thấy báo cáo nào</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Thử điều chỉnh lại bộ lọc tìm kiếm hoặc nộp báo cáo mới.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onGoToCreate}
                      className="mt-4 rounded-xl text-xs"
                    >
                      Tạo báo cáo ngay
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const approver = users.find((u) => u.id === report.approverId) || report.approver;
                  const latestFb =
                    report.feedbacks && report.feedbacks.length > 0
                      ? report.feedbacks[report.feedbacks.length - 1]
                      : null;

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => onViewDetail(report)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-xs">
                          {formatDate(report.date, "EEEE, dd/MM/yyyy")}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        {report.todayWorks && report.todayWorks.length > 0 ? (
                          <div className="space-y-0.5">
                            {report.todayWorks.slice(0, 2).map((w, idx) => (
                              <div
                                key={idx}
                                className="truncate text-foreground/90 font-medium"
                              >
                                • {w.taskTitle}
                              </div>
                            ))}
                            {report.todayWorks.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{report.todayWorks.length - 2} đầu việc khác...
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            {report.tomorrowPlans || "Chưa có chi tiết"}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {approver ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={approver} size="sm" />
                            <div>
                              <div className="font-medium text-foreground text-xs">
                                {approver.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {approver.title}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Chưa chỉ định</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {report.submittedAt
                          ? formatDate(report.submittedAt, "HH:mm dd/MM")
                          : "Bản nháp"}
                      </td>

                      <td className="py-3 px-4">
                        <DailyReportStatusBadge status={report.status} />
                      </td>

                      <td className="py-3 px-4 max-w-xs" onClick={(e) => e.stopPropagation()}>
                        {latestFb ? (
                          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60 text-xs">
                            <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold text-foreground">
                                {users.find((u) => u.id === latestFb.feedbackBy)?.name || "Người duyệt"}:
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {latestFb.feedbackContent}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetail(report)}
                            className="h-7 px-2.5 text-xs rounded-lg gap-1 hover:bg-muted"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem</span>
                          </Button>

                          {canEditReport(report) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onEditReport(report)}
                              className="h-7 px-2.5 text-xs rounded-lg gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Sửa</span>
                            </Button>
                          )}

                          {canDeleteReport(report) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteReport(report)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                              title="Xóa báo cáo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-border/80 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Hiển thị {filteredReports.length} báo cáo</span>
          <span>Quản lý báo cáo công việc ERP</span>
        </div>
      </div>
    </div>
  );
}

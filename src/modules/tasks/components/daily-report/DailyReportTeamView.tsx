"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Users,
  Search,
  Bell,
  BellRing,
  Check,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Building2,
  Calendar,
} from "lucide-react";
import { DailyReport, DailyReportStatus } from "@/modules/tasks/types";
import { Department, DepartmentId, User } from "@/shared/types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatDate } from "@/lib/date";
import { DailyReportStatusBadge } from "./DailyReportStatusBadge";

interface DailyReportTeamViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedDepartment: DepartmentId | "ALL";
  setSelectedDepartment: (dept: DepartmentId | "ALL") => void;
  reports: DailyReport[];
  users: User[];
  departments: Department[];
  currentUser: User;
  onViewDetail: (report: DailyReport) => void;
  onEditReport: (report: DailyReport) => void;
  onDeleteReport: (report: DailyReport) => void;
  onApproveReport: (reportId: string) => void;
  onRemindUser: (userName: string) => void;
  onRemindAll: (count: number) => void;
  canEditReport: (report: DailyReport) => boolean;
  canDeleteReport: (report: DailyReport) => boolean;
}

export function DailyReportTeamView({
  selectedDate,
  setSelectedDate,
  selectedDepartment,
  setSelectedDepartment,
  reports,
  users,
  departments,
  currentUser,
  onViewDetail,
  onEditReport,
  onDeleteReport,
  onApproveReport,
  onRemindUser,
  onRemindAll,
  canEditReport,
  canDeleteReport,
}: DailyReportTeamViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "SUBMITTED" | "NOT_SUBMITTED">("ALL");
  const [approvalStatusFilter, setApprovalStatusFilter] = React.useState<"ALL" | "APPROVED" | "SUBMITTED" | "REJECTED">("ALL");
  const [onlyBlockers, setOnlyBlockers] = React.useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isFutureDate = selectedDate > todayStr;

  const handleStepDate = (days: number) => {
    try {
      const current = new Date(selectedDate);
      current.setDate(current.getDate() + days);
      setSelectedDate(format(current, "yyyy-MM-dd"));
    } catch {}
  };

  const departmentAllUsers = React.useMemo(() => {
    if (selectedDepartment === "ALL") return users;
    return users.filter((u) => u.departmentId === selectedDepartment);
  }, [users, selectedDepartment]);

  const departmentReports = React.useMemo(() => {
    return reports.filter((r) => r.date === selectedDate);
  }, [reports, selectedDate]);

  const reportMapByUser = React.useMemo(() => {
    const map = new Map<string, DailyReport>();
    departmentReports.forEach((r) => {
      map.set(r.userId, r);
    });
    return map;
  }, [departmentReports]);

  const submittedCount = React.useMemo(() => {
    return departmentAllUsers.filter((u) => {
      const rep = reportMapByUser.get(u.id);
      return rep && rep.status !== "DRAFT" && rep.status !== "draft";
    }).length;
  }, [departmentAllUsers, reportMapByUser]);

  const notSubmittedCount = Math.max(0, departmentAllUsers.length - submittedCount);

  const filteredUsers = React.useMemo(() => {
    return departmentAllUsers.filter((user) => {
      const rep = reportMapByUser.get(user.id);
      const isSubmitted = Boolean(rep && rep.status !== "DRAFT" && rep.status !== "draft");

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = user.name.toLowerCase().includes(query);
        const emailMatch = user.email.toLowerCase().includes(query);
        const titleMatch = user.title?.toLowerCase().includes(query);
        const taskMatch = rep?.todayWorks?.some((w) =>
          w.taskTitle.toLowerCase().includes(query)
        );

        if (!nameMatch && !emailMatch && !titleMatch && !taskMatch) {
          return false;
        }
      }

      if (statusFilter === "SUBMITTED" && !isSubmitted) return false;
      if (statusFilter === "NOT_SUBMITTED" && isSubmitted) return false;

      if (approvalStatusFilter !== "ALL") {
        if (!rep) return false;
        if (rep.status?.toLowerCase() !== approvalStatusFilter.toLowerCase()) {
          return false;
        }
      }

      if (onlyBlockers) {
        if (!rep?.blockers || !rep.blockers.trim()) return false;
      }

      return true;
    });
  }, [departmentAllUsers, reportMapByUser, searchQuery, statusFilter, approvalStatusFilter, onlyBlockers]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground block">
              {departmentAllUsers.length}
            </span>
            <span className="text-xs text-muted-foreground">Tổng nhân sự theo dõi</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block">
              {submittedCount}
            </span>
            <span className="text-xs text-muted-foreground">Đã nộp báo cáo hôm nay</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400 block">
                {notSubmittedCount}
              </span>
              <span className="text-xs text-muted-foreground">Chưa nộp báo cáo</span>
            </div>
          </div>
          {notSubmittedCount > 0 && !isFutureDate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemindAll(notSubmittedCount)}
              className="h-8 text-xs gap-1 rounded-xl border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <BellRing className="h-3.5 w-3.5 text-amber-500" />
              <span>Nhắc tất cả</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border border-border/80 bg-card flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/70">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleStepDate(-1)}
              className="h-7 w-7 rounded-lg"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-7 text-xs border-0 bg-transparent shadow-none p-0 w-[115px] focus-visible:ring-0"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleStepDate(1)}
              className="h-7 w-7 rounded-lg"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Select
            value={selectedDepartment}
            onValueChange={(val) => setSelectedDepartment(val as DepartmentId | "ALL")}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl w-[170px] bg-muted/20">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm nhân sự, đầu việc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-muted/20"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "ALL" | "SUBMITTED" | "NOT_SUBMITTED")}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl w-[130px] bg-muted/20">
              <SelectValue placeholder="Tiến độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả tiến độ</SelectItem>
              <SelectItem value="SUBMITTED">Đã nộp</SelectItem>
              <SelectItem value="NOT_SUBMITTED">Chưa nộp</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || statusFilter !== "ALL" || approvalStatusFilter !== "ALL" || onlyBlockers) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setApprovalStatusFilter("ALL");
                setOnlyBlockers(false);
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
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Chức vụ / Phòng ban</th>
                <th className="py-3 px-4">Trạng thái báo cáo</th>
                <th className="py-3 px-4">Người duyệt</th>
                <th className="py-3 px-4">Thời gian nộp</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-sm text-foreground">Không tìm thấy nhân sự phù hợp</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Thử thay đổi bộ lọc tìm kiếm hoặc chọn phòng ban khác.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userReport = reportMapByUser.get(user.id);
                  const userDept = departments.find((d) => d.id === user.departmentId);
                  const approver = userReport
                    ? users.find((u) => u.id === userReport.approverId) || userReport.approver
                    : null;
                  const isSubmitted = Boolean(
                    userReport && userReport.status !== "DRAFT" && userReport.status !== "draft"
                  );
                  const canReview =
                    userReport &&
                    (userReport.status === "SUBMITTED" || userReport.status === "submitted") &&
                    (userReport.approverId === currentUser.id ||
                      currentUser.role === "ADMIN" ||
                      currentUser.role === "MANAGER");

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (userReport) onViewDetail(userReport);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={user} size="sm" />
                          <div>
                            <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {userReport?.blockers && (
                                <span title="Có vấn đề cần hỗ trợ">
                                  <AlertTriangle className="h-3 w-3 text-rose-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-foreground font-medium text-xs">
                          {user.title || "Nhân viên"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {userDept?.name || "Chưa phân ban"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <DailyReportStatusBadge status={userReport?.status} />
                      </td>

                      <td className="py-3 px-4">
                        {approver ? (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar user={approver} size="sm" />
                            <span className="text-foreground text-xs">{approver.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {userReport?.submittedAt
                          ? formatDate(userReport.submittedAt, "HH:mm dd/MM")
                          : "—"}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isSubmitted && userReport ? (
                            <>
                              {canReview && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onApproveReport(userReport.id)}
                                  className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 rounded-lg border-emerald-300 dark:border-emerald-800"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Duyệt</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewDetail(userReport)}
                                className="h-7 px-2.5 text-xs rounded-lg gap-1 hover:bg-muted"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Xem</span>
                              </Button>
                              {canEditReport(userReport) && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => onEditReport(userReport)}
                                  className="h-7 px-2 text-xs rounded-lg gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Sửa</span>
                                </Button>
                              )}
                              {canDeleteReport(userReport) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteReport(userReport)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                                  title="Xóa báo cáo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          ) : (
                            !isFutureDate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemindUser(user.name)}
                                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1 rounded-lg"
                              >
                                <Bell className="h-3 w-3 text-amber-500" />
                                <span>Nhắc nộp</span>
                              </Button>
                            )
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
          <span>
            Hiển thị {filteredUsers.length} / {departmentAllUsers.length} nhân sự
          </span>
          <span>Quản lý báo cáo công việc ERP</span>
        </div>
      </div>
    </div>
  );
}

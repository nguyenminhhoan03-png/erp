"use client";

import * as React from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  Users,
  PenLine,
  BellRing,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { DailyReport, DailyReportStatus } from "@/modules/tasks/types";
import { DepartmentId } from "@/shared/types";
import { useUserStore } from "@/shared/store/useUserStore";
import { Button } from "@/shared/components/ui/button";
import { reportService } from "@/modules/tasks/services/reportService";
import { DailyReportHistoryTable } from "@/modules/tasks/components/daily-report/DailyReportHistoryTable";
import { DailyReportTeamView } from "@/modules/tasks/components/daily-report/DailyReportTeamView";
import { DailyReportTab } from "@/modules/tasks/components/daily-report/types";

export default function DailyReportPage() {
  const router = useRouter();
  const { currentUser, users, departments } = useUserStore();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = React.useState(todayStr);
  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [myAllReports, setMyAllReports] = React.useState<DailyReport[]>([]);
  const [existingReport, setExistingReport] = React.useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [selectedDepartment, setSelectedDepartment] = React.useState<DepartmentId | "ALL">(() => {
    if (currentUser.role === "ADMIN") return "ALL";
    return (currentUser.departmentId as DepartmentId) || "ALL";
  });

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = React.useState<DailyReportTab>(() => {
    if (tabParam === "team-reports") return "team-reports";
    return "my-history";
  });

  React.useEffect(() => {
    if (tabParam === "team-reports") {
      setActiveTab("team-reports");
    } else if (tabParam === "my-report" || tabParam === "create") {
      router.replace("/daily-report/create");
    } else {
      setActiveTab("my-history");
    }
  }, [tabParam, router]);

  React.useEffect(() => {
    if (currentUser.role === "ADMIN") {
      setSelectedDepartment("ALL");
    } else if (currentUser.departmentId) {
      setSelectedDepartment(currentUser.departmentId as DepartmentId);
    }
  }, [currentUser.id, currentUser.role, currentUser.departmentId]);

  const loadReports = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getReports({
        tab: "all",
        departmentId: selectedDepartment === "ALL" ? "ALL" : selectedDepartment,
        date: selectedDate,
      });
      setReports(data);

      const allUserReports = await reportService.getReports({
        tab: "my-history",
      });
      setMyAllReports(
        allUserReports.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );

      const myReport = await reportService.getReportByUserAndDate(
        currentUser.id,
        selectedDate
      );
      setExistingReport(myReport);
    } catch {
      toast.error("Không thể tải danh sách báo cáo công việc");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, selectedDepartment, selectedDate]);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  const canEditReport = React.useCallback(
    (report: DailyReport) => {
      const reportOwnerId = String(report.userId || report.user?.id || "");
      const currentUserId = String(currentUser.id || "");
      const isOwner = Boolean(reportOwnerId && currentUserId && reportOwnerId === currentUserId);

      if (!isOwner) return false;

      const status = report.status?.toLowerCase();
      if (status === "approved") {
        return false;
      }

      return true;
    },
    [currentUser.id]
  );

  const canDeleteReport = React.useCallback(
    (report: DailyReport) => {
      const reportOwnerId = String(report.userId || report.user?.id || "");
      const currentUserId = String(currentUser.id || "");
      const isOwner = Boolean(reportOwnerId && currentUserId && reportOwnerId === currentUserId);

      if (!isOwner) return false;

      const status = report.status?.toLowerCase();
      if (status === "approved") {
        return false;
      }

      return true;
    },
    [currentUser.id]
  );

  const handleOpenReportDetail = React.useCallback(
    (report: DailyReport) => {
      if (!report?.id) return;
      router.push(`/daily-report/${report.id}`);
    },
    [router]
  );

  const handleUpdateStatus = async (reportId: string, newStatus: DailyReportStatus) => {
    try {
      const updated = await reportService.updateReportStatus(reportId, newStatus);
      setExistingReport(updated);
      toast.success(
        newStatus === "APPROVED" || newStatus === "approved"
          ? "Đã duyệt báo cáo thành công!"
          : "Đã từ chối/yêu cầu sửa báo cáo!"
      );
      loadReports();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteReport = async (report: DailyReport) => {
    const confirmMsg = `Bạn có chắc chắn muốn xóa báo cáo ngày ${report.date} không? Hành động này không thể hoàn tác.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const ok = await reportService.deleteReport(report.id);
      if (!ok) {
        toast.error("Không thể xóa báo cáo công việc");
        return;
      }
      toast.success("Đã xóa báo cáo công việc thành công!");
      loadReports();
    } catch {
      toast.error("Không thể xóa báo cáo công việc");
    }
  };

  const handleEditReport = (report: DailyReport) => {
    router.push(`/daily-report/create?date=${report.date}`);
  };

  const handleRemindUser = (userName: string) => {
    toast.info(`Đã gửi thông báo nhắc nhở nộp báo cáo tới ${userName}`);
  };

  const handleRemindAll = (count: number) => {
    if (count === 0) {
      toast.success("Tất cả nhân sự trong phòng ban đã hoàn thành nộp báo cáo!");
      return;
    }
    toast.info(`Đã gửi thông báo nhắc nhở tới ${count} nhân sự chưa hoàn thành báo cáo`);
  };

  const todayReport = React.useMemo(() => {
    return myAllReports.find((r) => r.date === todayStr);
  }, [myAllReports, todayStr]);

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {activeTab === "team-reports" ? (
              <>
                <Users className="h-6 w-6 text-primary" />
                <span>Báo cáo phòng ban</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <span>Báo cáo của tôi</span>
              </>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === "team-reports"
              ? "Theo dõi tiến độ nộp báo cáo, kiểm tra nội dung công việc và hỗ trợ tháo gỡ khó khăn cho nhân sự."
              : "Danh sách và lịch sử báo cáo công việc cá nhân."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (todayReport) {
                router.push(`/daily-report/create?date=${todayStr}`);
              } else {
                router.push("/daily-report/create");
              }
            }}
            className="rounded-xl text-xs gap-1.5 h-9 bg-primary shadow-sm shadow-primary/20"
          >
            {todayReport ? (
              <>
                <PenLine className="h-4 w-4" />
                <span>Sửa báo cáo hôm nay</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Viết báo cáo hôm nay</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {activeTab === "team-reports" ? (
        <DailyReportTeamView
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          reports={reports}
          users={users}
          departments={departments}
          currentUser={currentUser}
          onViewDetail={handleOpenReportDetail}
          onEditReport={handleEditReport}
          onDeleteReport={handleDeleteReport}
          onApproveReport={(reportId) => handleUpdateStatus(reportId, "APPROVED")}
          onRemindUser={handleRemindUser}
          onRemindAll={handleRemindAll}
          canEditReport={canEditReport}
          canDeleteReport={canDeleteReport}
        />
      ) : (
        <DailyReportHistoryTable
          reports={myAllReports}
          users={users}
          isLoading={isLoading}
          currentUser={currentUser}
          onViewDetail={handleOpenReportDetail}
          onEditReport={handleEditReport}
          onDeleteReport={handleDeleteReport}
          canEditReport={canEditReport}
          canDeleteReport={canDeleteReport}
          onGoToCreate={() => {
            if (todayReport) {
              router.push(`/daily-report/create?date=${todayStr}`);
            } else {
              router.push("/daily-report/create");
            }
          }}
        />
      )}
    </div>
  );
}

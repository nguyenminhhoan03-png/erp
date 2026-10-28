"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, PenLine, ChevronRight, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DailyReport } from "@/modules/tasks/types";
import { useUserStore } from "@/shared/store/useUserStore";
import { reportService } from "@/modules/tasks/services/reportService";
import { DailyReportForm } from "@/modules/tasks/components/daily-report/DailyReportForm";
import { Button } from "@/shared/components/ui/button";

export default function CreateDailyReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, users } = useUserStore();

  const queryDate = searchParams.get("date");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = React.useState(queryDate || todayStr);
  const [existingReport, setExistingReport] = React.useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchReport() {
      if (!currentUser?.id) return;
      setIsLoading(true);
      try {
        const report = await reportService.getReportByUserAndDate(
          currentUser.id,
          selectedDate
        );
        if (!cancelled) {
          setExistingReport(report);
        }
      } catch {
        if (!cancelled) {
          setExistingReport(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, selectedDate]);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/daily-report" className="hover:text-foreground transition-colors flex items-center gap-1">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Báo cáo công việc</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-medium">
              {existingReport ? "Chỉnh sửa báo cáo" : "Nộp báo cáo mới"}
            </span>
          </div>

          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <PenLine className="h-6 w-6 text-primary" />
            <span>{existingReport ? "Chỉnh sửa báo cáo công việc" : "Nộp báo cáo công việc"}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Ghi nhận tiến độ công việc, kế hoạch tiếp theo và gửi tới người duyệt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/daily-report")}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách</span>
          </Button>
        </div>
      </div>

      {/* Main Report Form */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu báo cáo...
        </div>
      ) : (
        <DailyReportForm
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          existingReport={existingReport}
          currentUser={currentUser}
          users={users}
          onSaved={() => {
            toast.success("Đã lưu báo cáo thành công!");
            router.push("/daily-report");
          }}
          onBack={() => router.push("/daily-report")}
        />
      )}
    </div>
  );
}

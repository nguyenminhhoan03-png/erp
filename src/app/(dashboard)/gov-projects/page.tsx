"use client";

import * as React from "react";
import { GovStatsHeader } from "@/modules/gov-solutions/components/GovStatsHeader";
import { GovTableView } from "@/modules/gov-solutions/components/GovTableView";
import { GovKanbanPipeline } from "@/modules/gov-solutions/components/GovKanbanPipeline";
import { GovProjectDetailModal } from "@/modules/gov-solutions/components/GovProjectDetailModal";
import { GovMeetingDialog } from "@/modules/gov-solutions/components/GovMeetingDialog";
import { GovSolutionSwitcher } from "@/modules/gov-solutions/components/GovSolutionSwitcher";
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Compass,
  LayoutList,
  KanbanSquare,
  CalendarPlus,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function GovProjectsContent() {
  const [mounted, setMounted] = React.useState(false);
  const {
    viewMode,
    setViewMode,
    fetchInitial,
    getActiveSolution,
    setFilters,
  } = useGovStore();

  const [openMeetingDialog, setOpenMeetingDialog] = React.useState(false);
  const searchParams = useSearchParams();
  const urlStage = searchParams.get("stage");

  React.useEffect(() => {
    setMounted(true);
    fetchInitial();
    if (urlStage) {
      setFilters({ stage: urlStage as any });
    }
  }, [fetchInitial, urlStage, setFilters]);

  const activeSolution = getActiveSolution();

  if (!mounted) {
    return (
      <div className="space-y-4 max-w-[1650px] mx-auto pb-10 p-6 animate-pulse">
        <div className="h-10 w-72 bg-muted/60 rounded-xl" />
        <div className="h-28 w-full bg-muted/40 rounded-2xl" />
        <div className="h-96 w-full bg-muted/30 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1650px] mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-[11px] font-mono bg-primary/10 text-primary border-primary/20 gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Chính Quyền Số IGB</span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              • Quản trị Tiếp cận & Tài trợ Chuyển đổi số 34 Tỉnh/Thành
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <span
              className="p-1.5 rounded-xl border"
              style={{
                borderColor: `${activeSolution.colorHex}40`,
                backgroundColor: `${activeSolution.colorHex}15`,
                color: activeSolution.colorHex,
              }}
            >
              <Compass className="h-6 w-6" />
            </span>
            <span>
              Dự Án {activeSolution.name}
            </span>
          </h1>

          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi tiến trình tiếp cận, đề nghị tài trợ và triển khai kỹ thuật cho{" "}
            <strong className="text-foreground font-bold">34 đơn vị hành chính cấp tỉnh mới</strong> của Việt Nam.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/70">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "table"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Bảng 34 Tỉnh</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              <span>Pipeline 7 Bước</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setOpenMeetingDialog(true)}
            className="h-9 text-xs font-semibold gap-1.5 rounded-xl shadow-2xs"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Đặt lịch làm việc</span>
          </Button>
        </div>
      </div>

      <GovSolutionSwitcher />

      <GovStatsHeader onOpenCreateMeeting={() => setOpenMeetingDialog(true)} />

      <div className="pt-1">
        {viewMode === "table" ? <GovTableView /> : <GovKanbanPipeline />}
      </div>

      <GovProjectDetailModal />

      <GovMeetingDialog
        open={openMeetingDialog}
        onOpenChange={setOpenMeetingDialog}
      />
    </div>
  );
}

export default function GovProjectsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 max-w-[1650px] mx-auto pb-10 p-6 animate-pulse">
          <div className="h-10 w-72 bg-muted/60 rounded-xl" />
          <div className="h-28 w-full bg-muted/40 rounded-2xl" />
          <div className="h-96 w-full bg-muted/30 rounded-2xl" />
        </div>
      }
    >
      <GovProjectsContent />
    </React.Suspense>
  );
}

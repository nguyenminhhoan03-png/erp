"use client";

import * as React from "react";
import Link from "next/link";
import { GovStatsHeader } from "@/modules/gov-solutions/components/GovStatsHeader";
import { GovTableView } from "@/modules/gov-solutions/components/GovTableView";
import { GovKanbanPipeline } from "@/modules/gov-solutions/components/GovKanbanPipeline";
import { GovProjectDetailModal } from "@/modules/gov-solutions/components/GovProjectDetailModal";
import { GovMeetingDialog } from "@/modules/gov-solutions/components/GovMeetingDialog";
import { GovSolutionSwitcher } from "@/modules/gov-solutions/components/GovSolutionSwitcher";
import { ProjectWorkspaceNonGov } from "@/modules/gov-solutions/components/ProjectWorkspaceNonGov";
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Compass,
  LayoutList,
  KanbanSquare,
  CalendarPlus,
  Sparkles,
  Tag,
  Landmark,
  Building2,
  Handshake,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TaskFormDialog } from "@/modules/tasks/components/TaskFormDialog";
import { TaskDialog } from "@/modules/tasks/components/TaskDialog";
import { KanbanWorkflowDialog } from "@/modules/tasks/components/KanbanWorkflowDialog";

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
  const isGov = !activeSolution.category || activeSolution.category === "GOV";

  if (!mounted) {
    return (
      <div className="space-y-4 w-full pb-10 p-6 animate-pulse">
        <div className="h-10 w-72 bg-muted/60 rounded-xl" />
        <div className="h-28 w-full bg-muted/40 rounded-2xl" />
        <div className="h-96 w-full bg-muted/30 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-mono gap-1",
                isGov
                  ? "bg-primary/10 text-primary border-primary/20"
                  : activeSolution.category === "INTERNAL"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              )}
            >
              {isGov ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span>Chính Quyền Số IGB</span>
                </>
              ) : activeSolution.category === "INTERNAL" ? (
                <>
                  <Building2 className="h-3 w-3" />
                  <span>Dự Án Nội Bộ IGB</span>
                </>
              ) : (
                <>
                  <Handshake className="h-3 w-3" />
                  <span>Dự Án Outsource B2B</span>
                </>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {isGov
                ? "• Quản trị Tiếp cận & Tài trợ Chuyển đổi số 34 Tỉnh/Thành"
                : activeSolution.category === "INTERNAL"
                ? "• Quản trị Phát triển Phần mềm, Hạ tầng & Vận hành Nội bộ"
                : "• Quản trị Hợp đồng Gia công, Sản phẩm Bàn giao & Đối tác"}
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
              {isGov ? (
                <Compass className="h-6 w-6" />
              ) : activeSolution.category === "INTERNAL" ? (
                <Building2 className="h-6 w-6" />
              ) : (
                <Handshake className="h-6 w-6" />
              )}
            </span>
            <span>
              Dự Án {activeSolution.name}
            </span>
          </h1>

          <p className="text-xs text-muted-foreground mt-1">
            {isGov ? (
              <>
                Theo dõi tiến trình tiếp cận, đề nghị tài trợ và triển khai kỹ thuật cho{" "}
                <strong className="text-foreground font-bold">34 đơn vị hành chính cấp tỉnh mới</strong> của Việt Nam.
              </>
            ) : activeSolution.category === "INTERNAL" ? (
              <>
                Quản lý kế hoạch phát triển, tiến độ công việc theo phòng ban và mục tiêu sản phẩm nội bộ.
              </>
            ) : (
              <>
                Quản lý các mốc bàn giao, tiến độ công việc và hợp đồng giải pháp cho khách hàng & đối tác B2B.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isGov && (
            <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/70">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
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
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === "kanban"
                    ? "bg-card text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <KanbanSquare className="h-3.5 w-3.5" />
                <span>Pipeline 7 Bước</span>
              </button>
            </div>
          )}

          <Link href="/gov-projects/categories">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/80 hover:bg-muted/60 cursor-pointer shadow-2xs"
            >
              <Tag className="h-4 w-4" />
              <span>Danh mục dự án</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setOpenMeetingDialog(true)}
            className="h-9 text-xs font-semibold gap-1.5 rounded-xl shadow-2xs cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Đặt lịch làm việc</span>
          </Button>
        </div>
      </div>

      <GovSolutionSwitcher />

      {isGov ? (
        <>
          <GovStatsHeader onOpenCreateMeeting={() => setOpenMeetingDialog(true)} />
          <div className="pt-1">
            {viewMode === "table" ? <GovTableView /> : <GovKanbanPipeline />}
          </div>
        </>
      ) : (
        <ProjectWorkspaceNonGov onOpenCreateMeeting={() => setOpenMeetingDialog(true)} />
      )}

      <GovProjectDetailModal />

      <GovMeetingDialog
        open={openMeetingDialog}
        onOpenChange={setOpenMeetingDialog}
      />

      <TaskFormDialog />
      <TaskDialog />
      <KanbanWorkflowDialog />
    </div>
  );
}

export default function GovProjectsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 w-full pb-10 p-6 animate-pulse">
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

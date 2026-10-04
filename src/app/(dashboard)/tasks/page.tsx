"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { TaskListView } from "@/modules/tasks/components/TaskListView";
import { TaskFilters } from "@/modules/tasks/components/TaskFilters";
import { TaskDialog } from "@/modules/tasks/components/TaskDialog";
import { TaskFormDialog } from "@/modules/tasks/components/TaskFormDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { AlertCircle, RefreshCw, Layers, KanbanSquare, FileSpreadsheet, FileCheck2 } from "lucide-react";
import { Task } from "@/modules/tasks/types";

const KanbanBoard = dynamic(
  () => import("@/modules/tasks/components/KanbanBoard").then((m) => m.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[calc(100vh-230px)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col flex-1 min-w-[280px] max-w-[340px] rounded-2xl bg-muted/40 border border-border/80 p-3 space-y-3"
          >
            <div className="h-5 w-24 bg-muted rounded-md animate-pulse" />
            <div className="h-28 w-full bg-muted/60 rounded-xl animate-pulse" />
            <div className="h-28 w-full bg-muted/60 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    ),
  }
);

export default function TasksPage() {
  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    resetToDefault,
    viewMode,
    openDetail,
    openCreate,
    filters,
  } = useTaskStore();
  const { currentUser } = useUserStore();

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskClick = (task: Task) => {
    openDetail(task);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Phân hệ Công việc: Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/60">
          <Link
            href="/tasks"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card text-foreground shadow-2xs"
          >
            <KanbanSquare className="h-3.5 w-3.5 text-primary" />
            <span>Bảng công việc (Jira Board)</span>
          </Link>
          <Link
            href="/daily-report"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Báo cáo ngày</span>
          </Link>
          {(currentUser.role === "ADMIN" || currentUser.role === "MANAGER") && (
            <Link
              href="/approvals"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Duyệt công việc</span>
            </Link>
          )}
        </div>

        <p className="text-xs text-muted-foreground hidden md:block">
          Phân hệ: <strong className="text-foreground">Quản lý Công việc & Quy trình</strong>
        </p>
      </div>

      {/* Filter and Control Bar */}
      <TaskFilters />

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
          {Array.from({ length: 5 }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col flex-1 min-w-[280px] max-w-[340px] rounded-2xl bg-muted/40 border border-border/60 p-3 space-y-3"
            >
              <div className="flex items-center justify-between pb-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center p-10 rounded-2xl border border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 text-center my-6">
          <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
          <h3 className="text-base font-semibold text-rose-800 dark:text-rose-200">
            Không thể tải danh sách công việc
          </h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm mt-1 mb-4">
            {error}
          </p>
          <Button
            size="sm"
            onClick={() => fetchTasks()}
            variant="outline"
            className="gap-2 border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && tasks.length === 0 && (
        <EmptyState
          title="Không tìm thấy công việc nào"
          description={
            filters.search || filters.departmentId !== "ALL"
              ? "Không có công việc nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại."
              : "Bộ nhớ tạm chưa có dữ liệu công việc. Hãy bấm nút dưới đây để nạp đầy đủ 40+ công việc mẫu."
          }
          actionLabel="Khôi phục 40+ công việc mẫu"
          onAction={resetToDefault}
        />
      )}

      {/* Main Kanban or List Content */}
      {!isLoading && !error && tasks.length > 0 && (
        <>
          {viewMode === "kanban" ? (
            <KanbanBoard onTaskClick={handleTaskClick} onAddTask={() => openCreate()} />
          ) : (
            <TaskListView tasks={tasks} onTaskClick={handleTaskClick} />
          )}
        </>
      )}

      {/* Dialogs */}
      <TaskDialog />
      <TaskFormDialog />
    </div>
  );
}

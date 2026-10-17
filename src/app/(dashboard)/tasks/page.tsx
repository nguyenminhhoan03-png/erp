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
import { useSearchParams } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
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

function TasksPageContent() {
  const {
    tasks,
    statuses,
    isLoading,
    error,
    fetchTasks,
    setFilters,
    viewMode,
    openDetail,
    openCreate,
    filters,
    isFetchingMore,
    hasMore,
    fetchMoreTasks,
  } = useTaskStore();
  const { currentUser } = useUserStore();
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get("projectId");

  React.useEffect(() => {
    if (urlProjectId) {
      setFilters({ projectId: urlProjectId });
    } else {
      fetchTasks();
    }
  }, [urlProjectId, fetchTasks, setFilters]);



  const handleTaskClick = (task: Task) => {
    openDetail(task);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <TaskFilters />

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

      {!isLoading && !error && viewMode === "kanban" && (
        <KanbanBoard
          onTaskClick={handleTaskClick}
          onAddTask={(colStatus) =>
            openCreate(colStatus, filters.projectId !== "ALL" ? filters.projectId : undefined)
          }
        />
      )}

      {!isLoading && !error && viewMode === "list" && tasks.length === 0 && (
        <EmptyState
          title={
            filters.search || filters.departmentId !== "ALL"
              ? "Không tìm thấy công việc nào"
              : "Chưa có công việc nào"
          }
          description={
            filters.search || filters.departmentId !== "ALL"
              ? "Không có công việc nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại."
              : "Dự án hiện chưa có dữ liệu công việc. Hãy bắt đầu bằng cách tạo công việc mới."
          }
          actionLabel={
            filters.search || filters.departmentId !== "ALL"
              ? undefined
              : "Tạo công việc mới"
          }
          onAction={
            filters.search || filters.departmentId !== "ALL"
              ? undefined
              : () => openCreate("TODO", filters.projectId !== "ALL" ? filters.projectId : undefined)
          }
        />
      )}

      {!isLoading && !error && viewMode === "list" && tasks.length > 0 && (
        <div className="space-y-4 pb-6">
          <TaskListView tasks={tasks} onTaskClick={handleTaskClick} />
          {hasMore["ALL"] && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchMoreTasks()}
                disabled={isFetchingMore["ALL"]}
                className="w-full max-w-sm rounded-xl border-dashed bg-muted/30"
              >
                {isFetchingMore["ALL"] ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang tải thêm...</span>
                  </div>
                ) : (
                  "Tải thêm công việc"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <TaskDialog />
      <TaskFormDialog />
    </div>
  );
}

export default function TasksPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-muted-foreground text-xs">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" />
          <span>Đang tải bảng công việc...</span>
        </div>
      }
    >
      <TasksPageContent />
    </React.Suspense>
  );
}

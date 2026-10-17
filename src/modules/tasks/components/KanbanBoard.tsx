"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CustomTaskStatus, Task, TaskStatus } from "../types";
import { TASK_STATUS_CONFIG } from "../constants";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { KanbanWorkflowDialog } from "./KanbanWorkflowDialog";
import { MoveWorkDialog } from "./MoveWorkDialog";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { toast } from "sonner";

interface KanbanBoardProps {
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanBoard({ onTaskClick, onAddTask }: KanbanBoardProps) {
  const {
    tasks,
    moveTask,
    fetchMoreTasks,
    statuses,
    isFetchingMore,
    hasMore,
    deleteStatus,
    openWorkflowConfig,
    reorderStatuses,
    syncStatuses,
    filters,
  } = useTaskStore();
  const { currentUser } = useUserStore();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [statusToDelete, setStatusToDelete] = React.useState<CustomTaskStatus | null>(null);
  const [isMoveWorkOpen, setIsMoveWorkOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isStatusFiltered = Boolean(filters.status && filters.status !== "ALL");

  const activeColumns = React.useMemo(() => {
    if (statuses && statuses.length > 0) {
      if (isStatusFiltered) {
        const matched = statuses.filter((s) => s.key === filters.status);
        if (matched.length > 0) return matched;
      }
      return statuses;
    }
    return [];
  }, [statuses, filters.status, isStatusFiltered]);

  const activeColumnKeys = React.useMemo(() => {
    return activeColumns.map((c) => c.key);
  }, [activeColumns]);

  const tasksByColumn = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    activeColumns.forEach((col) => (grouped[col.key] = []));

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        const statusDef = statuses?.find((s) => s.key === task.status);
        if (statusDef && grouped[statusDef.key]) {
          grouped[statusDef.key].push(task);
        }
      }
    });
    return grouped;
  }, [tasks, activeColumns, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    let targetStatus: TaskStatus | null = null;

    if (activeColumnKeys.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (!targetStatus) return;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask || draggedTask.status === targetStatus) return;

    const targetStatusObj = activeColumns.find((c) => c.key === targetStatus);
    const targetLabel = targetStatusObj?.name || TASK_STATUS_CONFIG[targetStatus]?.label || targetStatus;

    const result = await moveTask(taskId, targetStatus, currentUser);

    if (!result.success) {
      toast.error("Không được phép chuyển trạng thái", {
        description: result.reason || "Bạn không đủ quyền thực hiện hành động này.",
      });
    } else {
      toast.success("Cập nhật tiến độ thành công", {
        description: `${draggedTask.code} ➔ ${targetLabel}`,
      });
    }
  };

  const handleDeleteColumnFromBoard = (col: CustomTaskStatus) => {
    if (activeColumns.length <= 2) {
      toast.error("Cần giữ lại ít nhất 2 cột trong quy trình làm việc!");
      return;
    }
    setStatusToDelete(col);
    setIsMoveWorkOpen(true);
  };

  const handleConfirmMoveAndDelete = async (sourceId: string, targetKey: string) => {
    try {
      await deleteStatus(
        sourceId,
        targetKey,
        filters.projectId !== "ALL" ? filters.projectId : undefined
      );
      toast.success(`Đã xóa cột "${statusToDelete?.name}" và chuyển các công việc sang cột mới!`);
    } catch {
      toast.error("Không thể xóa cột trạng thái.");
    }
  };

  const handleMoveColumn = async (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeColumns.length) return;

    const newColumns = [...activeColumns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[targetIndex];
    newColumns[targetIndex] = temp;

    const pId = filters.projectId !== "ALL" ? filters.projectId : undefined;
    try {
      if (pId) {
        await syncStatuses({
          projectId: pId,
          departmentId: filters.departmentId !== "ALL" ? filters.departmentId : undefined,
          statuses: newColumns.map((c, idx) => ({
            name: c.name,
            category: c.category,
            color: c.color,
            key: c.key,
          })),
        });
      } else {
        const reorderPayload = newColumns
          .filter((c) => !isNaN(Number(c.id)))
          .map((c, idx) => ({
            id: Number(c.id),
            order_index: idx,
          }));
        if (reorderPayload.length > 0) {
          await reorderStatuses(reorderPayload);
        }
      }
      toast.success(
        `Đã chuyển cột "${temp.name}" sang ${direction === "left" ? "trái" : "phải"}!`
      );
    } catch {
      toast.error("Không thể thay đổi thứ tự cột");
    }
  };

  if (!statuses || statuses.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/80 rounded-2xl bg-card/40 my-8 max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4 ring-8 ring-amber-500/5">
            <Workflow className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Dự án chưa được cấu hình cột trạng thái
          </h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
            Bảng Kanban yêu cầu dự án phải thiết lập quy trình các cột trạng thái (ví dụ: Cần làm, Đang làm, Hoàn thành...) trước khi có thể hiển thị và quản lý công việc.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Button
              type="button"
              onClick={() => openWorkflowConfig(filters.projectId !== "ALL" ? filters.projectId : undefined)}
              className="gap-2 shadow-sm font-medium"
            >
              <Workflow className="h-4 w-4" />
              <span>Cấu hình cột trạng thái ngay</span>
            </Button>
          </div>
        </div>
        <KanbanWorkflowDialog />
      </>
    );
  }

  return (
    <DndContext
      id="kanban-board-dnd-context"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[calc(100vh-230px)]">
        {activeColumns.map((col, index) => {
          const columnTasks = tasksByColumn[col.key] || [];
          return (
            <KanbanColumn
              key={col.key}
              status={col.key}
              customStatus={col}
              tasks={columnTasks}
              isLoadingMore={Boolean(isFetchingMore[col.key])}
              hasMore={hasMore[col.key] !== false}
              isFirst={index === 0}
              isLast={index === activeColumns.length - 1}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
              onConfigureColumn={() =>
                openWorkflowConfig(filters.projectId !== "ALL" ? filters.projectId : undefined)
              }
              onDeleteColumn={handleDeleteColumnFromBoard}
              onMoveLeft={() => handleMoveColumn(index, "left")}
              onMoveRight={() => handleMoveColumn(index, "right")}
              onScrollBottom={() => fetchMoreTasks(col.key)}
            />
          );
        })}

        <button
          type="button"
          onClick={() => openWorkflowConfig(filters.projectId !== "ALL" ? filters.projectId : undefined)}
          className="h-10 px-3.5 rounded-xl border border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs self-start mt-0.5"
          title="Thêm cột mới vào quy trình"
        >
          <Plus className="h-4 w-4 text-primary" />
          <span>Thêm cột</span>
        </button>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>

      <KanbanWorkflowDialog />

      <MoveWorkDialog
        open={isMoveWorkOpen}
        onOpenChange={setIsMoveWorkOpen}
        sourceStatus={statusToDelete}
        availableStatuses={statuses || []}
        onConfirm={handleConfirmMoveAndDelete}
      />
    </DndContext>
  );
}

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
import { Task, TaskStatus } from "../types";
import { KANBAN_COLUMNS, TASK_STATUS_CONFIG } from "../constants";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { KanbanWorkflowDialog } from "./KanbanWorkflowDialog";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { toast } from "sonner";

interface KanbanBoardProps {
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanBoard({ onTaskClick, onAddTask }: KanbanBoardProps) {
  const { tasks, moveTask, fetchMoreTasks, statuses, isFetchingMore, hasMore } = useTaskStore();
  const { currentUser } = useUserStore();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

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

  const activeColumns = React.useMemo(() => {
    if (statuses && statuses.length > 0) {
      return statuses;
    }
    return KANBAN_COLUMNS.map((colKey, idx) => ({
      id: String(idx + 1),
      key: colKey,
      name: TASK_STATUS_CONFIG[colKey]?.label || colKey,
      category: (colKey === "DONE" || colKey === "CANCELLED"
        ? "DONE"
        : colKey === "IN_PROGRESS" || colKey === "IN_REVIEW"
        ? "IN_PROGRESS"
        : "TODO") as "TODO" | "IN_PROGRESS" | "DONE",
      color: TASK_STATUS_CONFIG[colKey]?.color || "#64748b",
      orderIndex: idx,
      isSystem: true,
    }));
  }, [statuses]);

  const activeColumnKeys = React.useMemo(() => {
    return activeColumns.map((c) => c.key);
  }, [activeColumns]);

  const tasksByColumn = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    activeColumns.forEach(col => grouped[col.key] = []);
    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks, activeColumns]);

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

  return (
    <DndContext
      id="kanban-board-dnd-context"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[calc(100vh-230px)]">
        {activeColumns.map((col) => {
          const columnTasks = tasksByColumn[col.key] || [];
          return (
            <KanbanColumn
              key={col.key}
              status={col.key}
              customStatus={col}
              tasks={columnTasks}
              isLoadingMore={Boolean(isFetchingMore[col.key])}
              hasMore={hasMore[col.key] !== false}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
              onScrollBottom={() => fetchMoreTasks(col.key)}
            />
          );
        })}
      </div>

      {/* Drag Overlay: hiển thị bóng của task khi đang kéo */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>

      {/* Modal Cấu hình Workflow Jira */}
      <KanbanWorkflowDialog />
    </DndContext>
  );
}

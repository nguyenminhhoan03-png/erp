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
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { toast } from "sonner";

interface KanbanBoardProps {
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanBoard({ onTaskClick, onAddTask }: KanbanBoardProps) {
  const { tasks, moveTask } = useTaskStore();
  const { currentUser } = useUserStore();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  // Cấu hình sensors để kéo mượt mà, không kích hoạt nhầm khi click chuột
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

    // Xác định trạng thái đích:
    // 1. Thả trực tiếp lên cột (overId là một trong các TaskStatus)
    // 2. Thả lên 1 task khác nằm trong cột đó
    let targetStatus: TaskStatus | null = null;

    if (KANBAN_COLUMNS.includes(overId as TaskStatus)) {
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

    // Thực hiện di chuyển với optimistic update & kiểm tra quyền
    const result = await moveTask(taskId, targetStatus, currentUser);

    if (!result.success) {
      toast.error("Không được phép chuyển trạng thái", {
        description: result.reason || "Bạn không đủ quyền thực hiện hành động này.",
      });
    } else {
      toast.success("Cập nhật tiến độ thành công", {
        description: `${draggedTask.code} ➔ ${TASK_STATUS_CONFIG[targetStatus].label}`,
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
        {KANBAN_COLUMNS.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
            />
          );
        })}
      </div>

      {/* Drag Overlay: hiển thị bóng của task khi đang kéo */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

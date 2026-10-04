"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Task, TaskStatus } from "../types";
import { TASK_STATUS_CONFIG } from "../constants";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const config = TASK_STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "Column",
      status,
    },
  });

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      suppressHydrationWarning
      className={cn(
        "flex flex-col flex-1 min-w-[280px] max-w-[340px] rounded-2xl bg-muted/40 border border-border/80 p-3 transition-colors duration-200",
        isOver && "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", config.dotColor)} />
          <h3 className="font-semibold text-sm text-foreground tracking-tight">
            {config.label}
          </h3>
          <Badge
            variant="secondary"
            className="text-[11px] h-5 px-1.5 font-bold rounded-full bg-background/80"
            suppressHydrationWarning
          >
            {tasks.length}
          </Badge>
        </div>

        {onAddTask && status !== "CANCELLED" && (
          <button
            onClick={() => onAddTask(status)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors cursor-pointer"
            title="Thêm công việc nhanh"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[150px] pr-0.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={cn(
              "h-28 rounded-xl border border-dashed border-border/60 flex flex-col items-center justify-center text-xs text-muted-foreground/60 transition-colors text-center px-2",
              isOver && "border-primary/50 bg-primary/10 text-primary font-medium"
            )}
          >
            <span>
              {isOver
                ? status === "CANCELLED"
                  ? "Thả để đóng task"
                  : "Thả task vào đây"
                : status === "CANCELLED"
                ? "Không có task bị đóng"
                : "Không có công việc"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

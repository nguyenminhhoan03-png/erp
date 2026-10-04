"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CheckSquare,
  Clock,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Task } from "../types";
import { TASK_PRIORITY_CONFIG, TASK_RESOLUTION_CONFIG } from "../constants";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { formatDate, isOverdue } from "@/lib/date";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isOverlay?: boolean;
}

export function TaskCard({ task, onClick, isOverlay = false }: TaskCardProps) {
  const { getUserById } = useUserStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const department = MOCK_DEPARTMENTS.find((d) => d.id === task.departmentId);
  const overdue = isOverdue(task.dueDate, task.status);

  // Lấy danh sách users được gán
  const assignees = task.assigneeIds
    .map((id) => getUserById(id))
    .filter(Boolean);

  const completedChecklistCount = task.checklist.filter(
    (item) => item.isCompleted
  ).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      suppressHydrationWarning
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 select-none cursor-grab active:cursor-grabbing border-border/80 hover:border-primary/40",
        isDragging && "opacity-30 border-dashed border-primary",
        isOverlay && "shadow-xl border-primary/60 rotate-1 cursor-grabbing scale-102 ring-2 ring-primary/20",
        overdue && "border-rose-300/80 dark:border-rose-900/60"
      )}
    >
      {/* Top Header: Code, Department, Priority / Resolution */}
      <div className="flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            "font-mono font-bold text-[11px] transition-colors",
            task.status === "CANCELLED" ? "text-muted-foreground line-through" : "text-muted-foreground group-hover:text-primary"
          )}>
            {task.code}
          </span>
          {department && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 font-medium"
              style={{
                borderColor: `${department.color}50`,
                color: department.color,
                backgroundColor: `${department.color}10`,
              }}
            >
              {department.code}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task.status === "CANCELLED" && task.resolution && TASK_RESOLUTION_CONFIG[task.resolution] ? (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 h-4.5 font-semibold",
                TASK_RESOLUTION_CONFIG[task.resolution].badgeBg,
                TASK_RESOLUTION_CONFIG[task.resolution].badgeText
              )}
              title={`Lý do đóng: ${TASK_RESOLUTION_CONFIG[task.resolution].description}`}
            >
              {TASK_RESOLUTION_CONFIG[task.resolution].badgeLabel}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-2 py-0.5 h-4.5 font-semibold", priorityConfig.badgeBg, priorityConfig.badgeText)}
            >
              {priorityConfig.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className={cn(
        "text-sm font-semibold line-clamp-2 leading-snug transition-colors",
        task.status === "CANCELLED"
          ? "text-muted-foreground line-through decoration-muted-foreground/60"
          : "text-foreground group-hover:text-primary"
      )}>
        {task.title}
      </h4>

      {/* Footer Info: Due Date, Checklist, Comments, Assignees */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-2.5">
          {/* Due date */}
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium",
              overdue
                ? "text-rose-600 dark:text-rose-400 font-semibold"
                : "text-muted-foreground"
            )}
            title={overdue ? "Quá hạn hoàn thành" : "Hạn chót"}
          >
            {overdue ? (
              <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span>{formatDate(task.dueDate, "dd/MM")}</span>
          </div>

          {/* Checklist counter */}
          {task.checklist.length > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-[11px]",
                completedChecklistCount === task.checklist.length
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-muted-foreground"
              )}
              title="Tiến độ checklist"
            >
              <CheckSquare className="h-3 w-3" />
              <span>
                {completedChecklistCount}/{task.checklist.length}
              </span>
            </div>
          )}

          {/* Comments counter */}
          {task.commentsCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground" title="Số bình luận">
              <MessageSquare className="h-3 w-3" />
              <span>{task.commentsCount}</span>
            </div>
          )}
        </div>

        {/* Assignees avatars list */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {assignees.length === 0 ? (
            <UserAvatar user={null} size="sm" />
          ) : (
            assignees.slice(0, 3).map((u) => (
              <UserAvatar
                key={u!.id}
                user={u}
                size="sm"
                className="ring-2 ring-card hover:z-10 transition-transform hover:scale-110"
              />
            ))
          )}
          {assignees.length > 3 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
              +{assignees.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

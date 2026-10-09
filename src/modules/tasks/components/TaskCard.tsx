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
import { useTaskStore } from "../store/taskStore";
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

interface TaskCardContentProps extends TaskCardProps {
  isDragging?: boolean;
}

const TaskCardContent = React.memo(
  function TaskCardContentComponent({ task, onClick, isOverlay = false, isDragging = false }: TaskCardContentProps) {
  const { getUserById, departments } = useUserStore();
  const { projects } = useTaskStore();

  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const department = departments.find((d) => d.id === task.departmentId);
  const project = projects.find((p) => p.id === task.projectId);
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
      onClick={onClick}
      suppressHydrationWarning
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 shadow-2xs hover:shadow-md select-none cursor-grab active:cursor-grabbing border-border/80 hover:border-primary/40",
        !isOverlay && !isDragging && "transition-[border-color,box-shadow] duration-150",
        isDragging && "opacity-25 border-dashed border-primary transition-none",
        isOverlay && "shadow-2xl border-primary/60 rotate-1 cursor-grabbing scale-[1.02] ring-2 ring-primary/20 pointer-events-none transition-none",
        overdue && "border-rose-300/80 dark:border-rose-900/60"
      )}
    >

      {/* Top Header: Code, Department, Project, Priority / Resolution */}
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
          {project && (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 h-4 font-semibold uppercase tracking-tight max-w-[120px] truncate block text-center", project.badgeBg, project.badgeText)}
              title={project.name}
            >
              {project.code ? project.code : project.name}
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

      {/* Task Title & Project Subtitle */}
      <div className="flex flex-col gap-0.5">
        {project && project.category === "GOV_SOLUTION" && (
          <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {project.name}
          </span>
        )}
        <h4 className={cn(
          "text-sm font-semibold line-clamp-2 leading-snug transition-colors",
          task.status === "CANCELLED"
            ? "text-muted-foreground line-through decoration-muted-foreground/60"
            : "text-foreground group-hover:text-primary"
        )}>
          {task.title}
        </h4>
      </div>

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
  },
  (prev, next) => {
    return prev.task === next.task && prev.isOverlay === next.isOverlay && prev.isDragging === next.isDragging;
  }
);

export function TaskCard({ task, onClick, isOverlay = false }: TaskCardProps) {
  if (isOverlay) {
    return <TaskCardContent task={task} onClick={onClick} isOverlay={true} />;
  }

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
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none select-none"
    >
      <TaskCardContent task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

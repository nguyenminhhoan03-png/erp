"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Loader2, MoreHorizontal, Settings2, Trash2 } from "lucide-react";
import { CustomTaskStatus, Task, TaskStatus } from "../types";
import { TASK_STATUS_CONFIG } from "../constants";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  customStatus?: CustomTaskStatus;
  tasks: Task[];
  isLoadingMore?: boolean;
  hasMore?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
  onConfigureColumn?: (status: CustomTaskStatus) => void;
  onDeleteColumn?: (status: CustomTaskStatus) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onScrollBottom?: () => void;
}

export const KanbanColumn = React.memo(function KanbanColumnComponent({
  status,
  customStatus,
  tasks,
  isLoadingMore = false,
  hasMore = true,
  isFirst = false,
  isLast = false,
  onTaskClick,
  onAddTask,
  onConfigureColumn,
  onDeleteColumn,
  onMoveLeft,
  onMoveRight,
  onScrollBottom,
}: KanbanColumnProps) {
  const config = TASK_STATUS_CONFIG[status];
  const label = customStatus?.name || config?.label || status;
  const dotClass = config?.dotColor;
  const customColor = customStatus?.color;

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "Column",
      status,
    },
  });

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);
  const observerRef = React.useRef<HTMLDivElement>(null);
  const onScrollBottomRef = React.useRef(onScrollBottom);

  React.useEffect(() => {
    onScrollBottomRef.current = onScrollBottom;
  }, [onScrollBottom]);

  React.useEffect(() => {
    if (!observerRef.current) return;
    if (tasks.length < 5 || hasMore === false || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onScrollBottomRef.current?.();
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [tasks.length, hasMore, isLoadingMore]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isLoadingMore || hasMore === false) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      onScrollBottomRef.current?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      suppressHydrationWarning
      className={cn(
        "flex flex-col flex-1 min-w-[280px] max-w-[340px] rounded-2xl bg-muted/40 border border-border/80 p-3 transition-colors duration-200",
        isOver && "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotClass)}
            style={!dotClass && customColor ? { backgroundColor: customColor } : undefined}
          />
          <h3 className="font-semibold text-sm text-foreground tracking-tight">
            {label}
          </h3>
          <Badge
            variant="secondary"
            className="text-[11px] h-5 px-1.5 font-bold rounded-full transition-colors bg-background/80"
            title={`${tasks.length} công việc`}
            suppressHydrationWarning
          >
            {tasks.length}
          </Badge>
        </div>

        <div className="flex items-center gap-0.5">
          {onAddTask && status !== "CANCELLED" && (
            <button
              onClick={() => onAddTask(status)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors cursor-pointer"
              title="Thêm công việc nhanh"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all cursor-pointer data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:border-primary data-[state=open]:text-primary data-[state=open]:bg-primary/5"
                title="Tùy chọn cột"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card shadow-xl border-border/80 p-1 rounded-xl">
              <DropdownMenuItem
                onClick={onMoveLeft}
                disabled={isFirst || !onMoveLeft}
                className="text-xs font-medium cursor-pointer py-1.5 px-2.5 rounded-lg text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Chuyển cột sang trái</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onMoveRight}
                disabled={isLast || !onMoveRight}
                className="text-xs font-medium cursor-pointer py-1.5 px-2.5 rounded-lg text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Chuyển cột sang phải</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-border/60" />

              {onDeleteColumn && (
                <DropdownMenuItem
                  onClick={() =>
                    onDeleteColumn(
                      customStatus || {
                        id: status,
                        key: status,
                        name: label,
                        category: "TODO",
                        color: "#64748b",
                        orderIndex: 0,
                      }
                    )
                  }
                  className="text-xs font-medium cursor-pointer py-1.5 px-2.5 rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                >
                  <span>Xóa trạng thái</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        onScroll={handleScroll}
        className="flex-1 space-y-2.5 min-h-[150px] max-h-[calc(100vh-230px)] overflow-y-auto pr-1 scroll-smooth"
      >
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

        {isLoadingMore && (
          <div className="py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-xs rounded-xl border border-border/70 shadow-2xs my-1 animate-in fade-in zoom-in-95 duration-200">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="font-medium text-[11px] text-foreground/85">Đang tải thêm công việc...</span>
          </div>
        )}

        {!isLoadingMore && hasMore === false && tasks.length >= 10 && (
          <div className="py-2 text-center text-[10px] text-muted-foreground/50 select-none">
            Đã tải hết {tasks.length} công việc
          </div>
        )}
        
        <div ref={observerRef} className="h-2 w-full pointer-events-none" />
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.tasks === next.tasks && 
         prev.status === next.status && 
         prev.customStatus === next.customStatus &&
         prev.isLoadingMore === next.isLoadingMore &&
         prev.hasMore === next.hasMore &&
         prev.isFirst === next.isFirst &&
         prev.isLast === next.isLast &&
         prev.onConfigureColumn === next.onConfigureColumn &&
         prev.onDeleteColumn === next.onDeleteColumn &&
         prev.onMoveLeft === next.onMoveLeft &&
         prev.onMoveRight === next.onMoveRight;
});

"use client";

import * as React from "react";
import { GovProject } from "../../types";
import { Task } from "@/modules/tasks/types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { KanbanSquare, Check, Loader2, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { TASK_STATUS_CONFIG } from "@/modules/tasks/constants";

interface ProjectTasksTabProps {
  project: GovProject;
  tasks: Task[];
  isLoading?: boolean;
  onQuickAddTask?: (title: string, priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => void;
  onUpdateTaskStatus: (taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function ProjectTasksTab({
  project,
  tasks,
  isLoading,
  onUpdateTaskStatus,
  onTaskDeleted,
}: ProjectTasksTabProps) {
  const { openDetail, deleteTask, openCreate } = useTaskStore();

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa công việc này?")) return;
    try {
      const ok = await deleteTask(taskId);
      if (ok && onTaskDeleted) {
        onTaskDeleted(taskId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-border/60 gap-3">
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Công việc triển khai cho {project.provinceName}
          </h4>
          <p className="text-xs text-muted-foreground">
            Các đầu việc phân bổ cho nhân sự thực hiện riêng cho địa phương này
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => openCreate("TODO", `gov_${project.id}`)}
            className="h-8.5 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo & Giao việc mới</span>
          </Button>

          <Link
            href={`/tasks?projectId=gov_${project.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/80 transition-all shrink-0 cursor-pointer shadow-2xs"
            title="Mở bảng Kanban của địa phương này"
          >
            <KanbanSquare className="h-3.5 w-3.5 text-primary" />
            <span>Mở trên Jira Board ↗</span>
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Đang tải công việc của tỉnh...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center text-xs border border-dashed border-border/80 rounded-2xl bg-card/40 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <div>
              <h5 className="font-semibold text-foreground text-xs">
                Chưa có công việc nào cho {project.provinceName}
              </h5>
              <p className="text-muted-foreground text-[11px] mt-0.5 max-w-sm mx-auto">
                Bấm nút bên dưới để tạo & phân công công việc với đầy đủ hạn chót, người thực hiện và mức độ ưu tiên.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => openCreate("TODO", `gov_${project.id}`)}
              className="h-8 text-xs font-semibold gap-1.5 rounded-lg shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo công việc đầu tiên</span>
            </Button>
          </div>
        ) : (
          tasks.map((t) => {
            const isDone = t.status === "DONE" || t.status === "CANCELLED";
            const statusConfig = TASK_STATUS_CONFIG[t.status];

            return (
              <div
                key={t.id}
                onClick={() => openDetail(t)}
                className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3 hover:border-primary/40 transition-colors shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTaskStatus(t.id, isDone ? "TODO" : "DONE");
                    }}
                    className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer",
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-muted-foreground/40 hover:border-primary"
                    )}
                  >
                    {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>

                  <div className="flex items-center gap-2 min-w-0">
                    {t.code && (
                      <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {t.code}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium truncate group-hover:text-primary transition-colors",
                        isDone && "line-through text-muted-foreground group-hover:text-muted-foreground"
                      )}
                    >
                      {t.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
                  {statusConfig && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 hidden sm:inline-flex"
                      style={{ color: statusConfig.color, borderColor: `${statusConfig.color}40` }}
                    >
                      {statusConfig.label}
                    </Badge>
                  )}

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      t.priority === "URGENT" && "bg-rose-500/10 text-rose-600 border-rose-500/30",
                      t.priority === "HIGH" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                      t.priority === "MEDIUM" && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                      t.priority === "LOW" && "bg-slate-500/10 text-slate-600 border-slate-500/30"
                    )}
                  >
                    {t.priority}
                  </Badge>

                  {t.dueDate && (
                    <span className="text-[10px] text-muted-foreground hidden md:inline">
                      {new Date(t.dueDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-all cursor-pointer"
                    title="Xóa công việc"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { GovProject, GovProjectTask } from "../../types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { KanbanSquare, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";

interface ProjectTasksTabProps {
  project: GovProject;
  tasks: GovProjectTask[];
  onQuickAddTask: (title: string, priority?: "LOW"|"MEDIUM"|"HIGH"|"URGENT") => void;
  onUpdateTaskStatus: (taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

export function ProjectTasksTab({
  project,
  tasks,
  onQuickAddTask,
  onUpdateTaskStatus,
}: ProjectTasksTabProps) {
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  
  // Lấy hàm openDetail từ taskStore (dùng chung với phân hệ Tasks)
  const { openDetail } = useTaskStore();
  const { currentUser } = useUserStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onQuickAddTask(newTaskTitle.trim());
    setNewTaskTitle("");
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60 gap-3">
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Công việc triển khai cho {project.provinceName}
          </h4>
          <p className="text-xs text-muted-foreground">
            Các đầu việc phân bổ cho nhân sự IT, Content, Design thực hiện riêng cho tỉnh này
          </p>
        </div>

        <Link
          href={`/tasks?projectId=GOV_${project.id}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shrink-0 cursor-pointer"
        >
          <KanbanSquare className="h-3.5 w-3.5" />
          <span>Mở trên Jira Board ↗</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="+ Thêm nhanh công việc mới cho tỉnh này..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="text-xs h-9 flex-1"
        />
        <Button type="submit" size="sm" className="h-9 text-xs font-semibold shrink-0 cursor-pointer">
          Thêm Task
        </Button>
      </form>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs border border-dashed border-border/80 rounded-xl">
            Chưa có công việc nào được gán cho tỉnh này.
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3 hover:border-primary/40 transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus = t.status === "DONE" ? "TODO" : "DONE";
                    onUpdateTaskStatus(t.id, nextStatus);
                  }}
                  className={cn(
                    "h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer",
                    t.status === "DONE"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-muted-foreground/40 hover:border-primary"
                  )}
                >
                  {t.status === "DONE" && <Check className="h-3 w-3 stroke-[3]" />}
                </button>
                <span
                  onClick={() => {
                    // Chuyển đổi định dạng GovProjectTask sang định dạng Task chuẩn để hiển thị trong Modal
                    // Tạm thời mock các trường bắt buộc của Task, backend sẽ xử lý việc đồng bộ sau
                    openDetail({
                      id: t.id,
                      code: `TASK-${t.id}`,
                      title: t.title,
                      description: "",
                      projectId: t.projectId,
                      projectKey: "DLTM",
                      projectName: `Dự án CĐS ${project.provinceName}`,
                      departmentId: "it",
                      assigneeIds: [],
                      creatorId: currentUser.id,
                      dueDate: new Date().toISOString(),
                      tags: [],
                      status: t.status,
                      priority: t.priority,

                      checklist: [],
                      commentsCount: 0,
                      isApproved: true,
                      requiresApproval: false,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className={cn(
                    "text-xs font-medium truncate cursor-pointer group-hover:text-primary transition-colors",
                    t.status === "DONE" && "line-through text-muted-foreground group-hover:text-muted-foreground"
                  )}
                >
                  {t.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    t.priority === "URGENT" && "bg-rose-500/10 text-rose-600 border-rose-500/30",
                    t.priority === "HIGH" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                    t.priority === "MEDIUM" && "bg-blue-500/10 text-blue-600 border-blue-500/30"
                  )}
                >
                  {t.priority}
                </Badge>
                <span className="text-muted-foreground">{t.dueDate}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

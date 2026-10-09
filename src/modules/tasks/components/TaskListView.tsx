"use client";

import * as React from "react";
import {
  Calendar,
  AlertCircle,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Task } from "../types";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, TASK_RESOLUTION_CONFIG } from "../constants";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatDate, isOverdue } from "@/lib/date";
import { cn } from "@/lib/utils";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  const { getUserById, departments } = useUserStore();
  const { projects } = useTaskStore();

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4 w-24">Mã</th>
              <th className="py-3 px-4 w-36">Dự án</th>
              <th className="py-3 px-4 min-w-[280px]">Tiêu đề công việc</th>
              <th className="py-3 px-4 w-32">Phòng ban</th>
              <th className="py-3 px-4 w-36">Trạng thái</th>
              <th className="py-3 px-4 w-32">Độ ưu tiên</th>
              <th className="py-3 px-4 w-40">Người thực hiện</th>
              <th className="py-3 px-4 w-32">Hạn chót</th>
              <th className="py-3 px-4 w-16 text-center">Xem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {tasks.map((task) => {
              const statusCfg = TASK_STATUS_CONFIG[task.status];
              const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
              const dept = departments.find((d) => d.id === task.departmentId);
              const project = projects.find((p) => p.id === task.projectId);
              const overdue = isOverdue(task.dueDate, task.status);
              const assignees = task.assigneeIds
                .map((id) => getUserById(id))
                .filter(Boolean);

              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  {/* Mã Task */}
                  <td className="py-3 px-4 font-mono font-semibold text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    {task.code}
                  </td>

                  {/* Dự án */}
                  <td className="py-3 px-4">
                    {project ? (
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-semibold max-w-[200px] truncate block text-center", project.badgeBg, project.badgeText)}
                        title={project.name}
                      >
                        {project.code ? project.code : project.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs font-mono">-</span>
                    )}
                  </td>

                  {/* Tiêu đề & tags */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {task.title}
                      </span>
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.2 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Phòng ban */}
                  <td className="py-3 px-4">
                    {dept && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium"
                        style={{
                          borderColor: `${dept.color}40`,
                          color: dept.color,
                          backgroundColor: `${dept.color}10`,
                        }}
                      >
                        {dept.code}
                      </Badge>
                    )}
                  </td>

                  {/* Trạng thái & Resolution */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", statusCfg.dotColor)} />
                      <span className="text-xs font-medium text-foreground">
                        {statusCfg.label}
                      </span>
                      {task.status === "CANCELLED" && task.resolution && TASK_RESOLUTION_CONFIG[task.resolution] && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 font-semibold",
                            TASK_RESOLUTION_CONFIG[task.resolution].badgeBg,
                            TASK_RESOLUTION_CONFIG[task.resolution].badgeText
                          )}
                          title={`Resolution: ${TASK_RESOLUTION_CONFIG[task.resolution].description}`}
                        >
                          {TASK_RESOLUTION_CONFIG[task.resolution].badgeLabel}
                        </Badge>
                      )}
                    </div>
                  </td>

                  {/* Độ ưu tiên */}
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-2 py-0.5", priorityCfg.badgeBg, priorityCfg.badgeText)}
                    >
                      {priorityCfg.label}
                    </Badge>
                  </td>

                  {/* Người thực hiện */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {assignees.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Chưa giao</span>
                      ) : (
                        <div className="flex items-center -space-x-1.5">
                          {assignees.slice(0, 2).map((u) => (
                            <UserAvatar key={u!.id} user={u} size="sm" />
                          ))}
                          {assignees.length > 2 && (
                            <span className="text-[10px] text-muted-foreground font-semibold pl-2">
                              +{assignees.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Deadline */}
                  <td className="py-3 px-4">
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        overdue
                          ? "text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {overdue ? (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      )}
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

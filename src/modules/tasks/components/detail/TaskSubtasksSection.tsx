"use client";

import * as React from "react";
import {
  ListTree,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Task } from "../../types";
import { useTaskStore } from "../../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { UserSingleSelect } from "../form/UserSingleSelect";
import { formatDate, isOverdue } from "@/lib/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskSubtasksSectionProps {
  task: Task;
}

export function TaskSubtasksSection({ task }: TaskSubtasksSectionProps) {
  const { createSubtask, updateTask, deleteTask, openDetail, tasks, statuses } = useTaskStore();
  const { users, currentUser } = useUserStore();

  const [isAdding, setIsAdding] = React.useState(false);
  const [subtaskTitle, setSubtaskTitle] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState<string>(String(currentUser.id));
  const [dueDate, setDueDate] = React.useState<string>(
    task.dueDate ? task.dueDate.split("T")[0] : ""
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const subtasks = React.useMemo(() => {
    const directSubtasks = task.subTasks || [];
    const directIds = new Set(directSubtasks.map((st) => String(st.id)));
    const storeSubtasks = tasks.filter((t) => String(t.parentId) === String(task.id));
    return [
      ...directSubtasks.map((st) => tasks.find((t) => String(t.id) === String(st.id)) || st),
      ...storeSubtasks.filter((st) => !directIds.has(String(st.id))),
    ];
  }, [task.id, task.subTasks, tasks]);

  const isSubtaskCompleted = React.useCallback(
    (st: Task) => {
      const statusDef = statuses.find((s) => s.key === st.status);
      if (statusDef) {
        return statusDef.category === "DONE";
      }
      return st.status === "DONE" || st.status === "CANCELLED" || Boolean(st.closedAt);
    },
    [statuses]
  );

  const totalCount = subtasks.length;
  const completedCount = subtasks.filter(isSubtaskCompleted).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const parentTask =
    task.parent ||
    tasks.find((t) => String(t.id) === String(task.parentId));

  const parentCode =
    parentTask?.code ||
    (task.code && task.code.includes(".")
      ? task.code.split(".").slice(0, -1).join(".")
      : `#${task.parentId}`);

  const parentTitle = parentTask?.title;

  const handleToggleSubtaskStatus = async (st: Task) => {
    const isCurrentlyDone = isSubtaskCompleted(st);
    const doneStatus = statuses.find((s) => s.category === "DONE")?.key || "DONE";
    const todoStatus = statuses.find((s) => s.category === "TODO")?.key || statuses[0]?.key || "TODO";
    const nextStatus = isCurrentlyDone ? todoStatus : doneStatus;
    const isNextDone = !isCurrentlyDone;

    try {
      await updateTask(st.id, {
        status: nextStatus,
        closedAt: isNextDone ? new Date().toISOString() : undefined,
      });
      toast.success(
        isNextDone
          ? `Đã hoàn thành việc con: ${st.title}`
          : `Đã mở lại việc con: ${st.title}`
      );
    } catch {
      toast.error("Không thể cập nhật trạng thái việc con.");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTask(subtaskId);
      toast.info("Đã xóa công việc con.");
    } catch {
      toast.error("Không thể xóa công việc con.");
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề việc con.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubtask(task.id, {
        title: subtaskTitle.trim(),
        assigneeIds: assigneeId ? [assigneeId] : [],
        dueDate: dueDate ? new Date(dueDate).toISOString() : task.dueDate,
        priority: task.priority || "MEDIUM",
      });

      toast.success("Đã thêm công việc con mới thành công!");
      setSubtaskTitle("");
      setIsAdding(false);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo công việc con.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ListTree className="h-4 w-4 text-primary" />
          <span>Công việc con (Subtasks)</span>
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary font-mono">{percent}%</span>
          <span className="text-xs font-medium text-muted-foreground">
            ({completedCount}/{totalCount} hoàn tất)
          </span>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              percent === 100 ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-card p-2 space-y-1 shadow-2xs">
        {subtasks.length === 0 ? (
          <div className="py-6 text-center">
            <ListTree className="h-7 w-7 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">
              Chưa có công việc con nào. Chia nhỏ việc lớn giúp theo dõi tiến độ dễ dàng hơn.
            </p>
          </div>
        ) : (
          subtasks.map((st) => {
            const isDone = isSubtaskCompleted(st);
            const assignee = st.assignees?.[0] || users.find((u) => st.assigneeIds?.includes(String(u.id)));
            const isLate = st.dueDate && !isDone && isOverdue(st.dueDate, isDone, st.closedAt);

            return (
              <div
                key={st.id}
                onClick={() => openDetail(st)}
                className="group flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer select-none border border-transparent hover:border-border/60"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Checkbox
                    checked={isDone}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSubtaskStatus(st);
                    }}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0 font-medium">
                        {st.code || `#${st.id}`}
                      </span>
                      <p
                        className={cn(
                          "text-xs font-medium text-foreground truncate transition-colors",
                          isDone && "line-through text-muted-foreground opacity-70"
                        )}
                      >
                        {st.title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {assignee ? (
                    <div className="flex items-center gap-1.5" title={`Người làm: ${assignee.name}`}>
                      <UserAvatar user={assignee} size="sm" className="h-5 w-5 text-[10px]" />
                      <span className="text-[11px] text-muted-foreground hidden sm:inline max-w-[80px] truncate">
                        {assignee.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60 italic">Chưa gán</span>
                  )}

                  {st.dueDate && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[11px]",
                        isLate
                          ? "text-rose-600 font-medium"
                          : isDone
                          ? "text-muted-foreground"
                          : "text-muted-foreground"
                      )}
                      title={`Hạn chót: ${formatDate(st.dueDate, "dd/MM/yyyy")}`}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(st.dueDate, "dd/MM")}</span>
                    </div>
                  )}

                  <Badge
                    variant={isDone ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] h-5 px-1.5 font-normal",
                      isDone
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? "Hoàn tất" : st.status === "IN_PROGRESS" ? "Đang làm" : "Cần làm"}
                  </Badge>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteSubtask(st.id, e)}
                    className="h-6 w-6 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa công việc con"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {!isAdding ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full justify-start text-xs text-primary hover:text-primary hover:bg-primary/5 h-8 gap-1.5 font-medium mt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm công việc con mới</span>
          </Button>
        ) : (
          <form
            onSubmit={handleCreateSubtask}
            className="p-2.5 rounded-lg border border-border/80 bg-muted/20 space-y-2.5 mt-2"
          >
            <Input
              type="text"
              autoFocus
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Nhập tên việc con (VD: Thiết kế mockup, Viết API...)"
              className="h-8 text-xs bg-background"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                  Người thực hiện
                </label>
                <UserSingleSelect
                  value={assigneeId}
                  onChange={setAssigneeId}
                  users={users}
                  currentUser={currentUser}
                  placeholder="Chọn người làm"
                  triggerClassName="h-7 text-xs bg-background"
                  allowClear
                  clearLabel="Chưa gán người làm"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                  Hạn hoàn thành (Deadline)
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-7 text-xs bg-background"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="h-7 text-xs px-2.5"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !subtaskTitle.trim()}
                className="h-7 text-xs px-3 gap-1 bg-primary text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Đang thêm...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Lưu việc con</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

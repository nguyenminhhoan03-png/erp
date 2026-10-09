"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Kanban,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { CustomTaskStatus, StatusCategory } from "../types";
import { Badge } from "@/shared/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditableStatus {
  id: string;
  key: string;
  name: string;
  category: StatusCategory;
  color: string;
  orderIndex: number;
  isSystem?: boolean;
  isNew?: boolean;
}

const CATEGORY_CONFIG: Record<
  StatusCategory,
  { label: string; bg: string; text: string; dot: string }
> = {
  TODO: {
    label: "To Do",
    bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  DONE: {
    label: "Done",
    bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

export function KanbanWorkflowDialog() {
  const {
    isWorkflowConfigOpen,
    closeWorkflowConfig,
    statuses,
    fetchStatuses,
    addStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    filters,
  } = useTaskStore();

  const [localStatuses, setLocalStatuses] = React.useState<EditableStatus[]>([]);
  const [deletedIds, setDeletedIds] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isWorkflowConfigOpen) {
      setLocalStatuses(
        statuses.map((s, idx) => ({
          id: s.id,
          key: s.key,
          name: s.name,
          category: s.category,
          color: s.color,
          orderIndex: idx,
          isSystem: s.isSystem,
        }))
      );
      setDeletedIds([]);
    }
  }, [isWorkflowConfigOpen, statuses]);

  const handleNameChange = (id: string, newName: string) => {
    setLocalStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleCategoryCycle = (id: string) => {
    const cycle: StatusCategory[] = ["TODO", "IN_PROGRESS", "DONE"];
    setLocalStatuses((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextIdx = (cycle.indexOf(s.category) + 1) % cycle.length;
        return { ...s, category: cycle[nextIdx] };
      })
    );
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localStatuses.length) return;

    setLocalStatuses((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((it, idx) => ({ ...it, orderIndex: idx }));
    });
  };

  const handleDelete = (id: string) => {
    if (localStatuses.length <= 2) {
      toast.error("Cần giữ lại ít nhất 2 cột trong quy trình làm việc!");
      return;
    }
    setLocalStatuses((prev) => prev.filter((s) => s.id !== id));
    if (!id.startsWith("temp-")) {
      setDeletedIds((prev) => [...prev, id]);
    }
  };

  const handleAddStatus = () => {
    const newId = `temp-${Date.now()}`;
    const newOrder = localStatuses.length;
    const newStatus: EditableStatus = {
      id: newId,
      key: `STATUS_${Date.now()}`,
      name: "Trạng thái mới",
      category: "IN_PROGRESS",
      color: "#2563eb",
      orderIndex: newOrder,
      isNew: true,
    };
    setLocalStatuses((prev) => [...prev, newStatus]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Xóa các status bị remove
      for (const delId of deletedIds) {
        await deleteStatus(delId, "TODO");
      }

      // 2. Thêm hoặc cập nhật từng status
      const updatedList: CustomTaskStatus[] = [];
      for (let i = 0; i < localStatuses.length; i++) {
        const item = localStatuses[i];
        if (item.isNew) {
          const created = await addStatus({
            name: item.name,
            category: item.category,
            color: item.color,
            projectId: filters.projectId !== "ALL" ? filters.projectId : undefined,
            departmentId: filters.departmentId !== "ALL" ? filters.departmentId : undefined,
          });
          updatedList.push(created);
        } else {
          const original = statuses.find((s) => s.id === item.id);
          if (
            original &&
            (original.name !== item.name ||
              original.category !== item.category ||
              original.orderIndex !== i)
          ) {
            const updated = await updateStatus(item.id, {
              name: item.name,
              category: item.category,
              orderIndex: i,
            });
            updatedList.push(updated);
          } else if (original) {
            updatedList.push(original);
          }
        }
      }

      // 3. Reorder lại backend
      const reorderPayload = localStatuses
        .filter((s) => !s.isNew)
        .map((s, idx) => ({ id: Number(s.id), order_index: idx }));

      if (reorderPayload.length > 0) {
        await reorderStatuses(reorderPayload);
      }

      await fetchStatuses(filters.projectId, filters.departmentId);
      toast.success("Cập nhật quy trình làm việc thành công!");
      closeWorkflowConfig();
    } catch {
      toast.error("Không thể lưu cấu hình. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isWorkflowConfigOpen}
      onOpenChange={(open) => !open && closeWorkflowConfig()}
    >
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header Jira style */}
        <div className="p-6 pb-4 border-b border-border/80 bg-muted/20 pr-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Kanban className="h-4 w-4" />
            <span>Jira Workflow Builder</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Thiết lập Quy trình & Cột Kanban
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Tùy biến các bước thực hiện công việc phù hợp với thực tế phòng ban của bạn.
            Mỗi trạng thái thuộc về một nhóm cốt lõi (To Do, In Progress, Done) để tự động hóa tính KPI.
          </p>
        </div>

        {/* Content Body: Chia 2 cột như Jira */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Cấu hình danh sách Status */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Danh sách cột hiện tại ({localStatuses.length} cột)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Bấm vào nhãn để đổi Nhóm trạng thái
              </span>
            </div>

            <div className="space-y-2.5">
              {localStatuses.map((st, index) => {
                const catInfo = CATEGORY_CONFIG[st.category];
                return (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-2xs"
                  >
                    {/* Nút di chuyển vị trí */}
                    <div className="flex flex-col gap-0.5 text-muted-foreground shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                        className="p-1 hover:text-foreground disabled:opacity-30 cursor-pointer"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, "down")}
                        disabled={index === localStatuses.length - 1}
                        className="p-1 hover:text-foreground disabled:opacity-30 cursor-pointer"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Số thứ tự */}
                    <span className="w-5 text-center text-xs font-mono font-semibold text-muted-foreground">
                      {index + 1}
                    </span>

                    {/* Input Tên trạng thái */}
                    <Input
                      value={st.name}
                      onChange={(e) => handleNameChange(st.id, e.target.value)}
                      className="h-8.5 text-xs font-medium flex-1"
                      placeholder="Nhập tên trạng thái..."
                    />

                    {/* Button Category Tag */}
                    <button
                      type="button"
                      onClick={() => handleCategoryCycle(st.id)}
                      className={cn(
                        "h-8 px-2.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer",
                        catInfo.bg
                      )}
                      title="Bấm để chuyển đổi Nhóm trạng thái (To Do -> In Progress -> Done)"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", catInfo.dot)} />
                      <span>{catInfo.label}</span>
                    </button>

                    {/* Nút Xóa */}
                    <button
                      type="button"
                      onClick={() => handleDelete(st.id)}
                      className="h-8 w-8 rounded-md hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      title="Xóa cột này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Nút + Add status */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddStatus}
              className="w-full h-9 border-dashed text-xs text-primary border-primary/40 hover:bg-primary/5 hover:border-primary gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm trạng thái mới (Add status)</span>
            </Button>
          </div>

          {/* Cột phải: Live Preview Jira Kanban Board */}
          <div className="lg:col-span-5 bg-muted/30 rounded-xl p-4 border border-border/80 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Xem trước Bảng Kanban (Live Preview)</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-normal">
                {localStatuses.length} cột
              </Badge>
            </div>

            <div className="flex-1 bg-card rounded-lg border border-border/70 p-3 overflow-x-auto shadow-inner flex gap-2.5 min-h-[220px]">
              {localStatuses.map((st) => {
                const cat = CATEGORY_CONFIG[st.category];
                return (
                  <div
                    key={st.id}
                    className="w-28 shrink-0 bg-muted/40 rounded-md border border-border/60 p-2 flex flex-col gap-1.5 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-1">
                      <span className="text-[11px] font-bold text-foreground truncate max-w-[80px]" title={st.name}>
                        {st.name || "..."}
                      </span>
                    </div>

                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium inline-block w-fit", cat.bg)}>
                      {cat.label}
                    </span>

                    {/* Giả lập Task Card */}
                    <div className="p-1.5 bg-background rounded border border-border/50 shadow-2xs mt-1 space-y-1">
                      <div className="h-2 w-16 bg-muted-foreground/30 rounded-full" />
                      <div className="h-1.5 w-10 bg-muted-foreground/20 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              💡 <strong>Mẹo Jira:</strong> Các task thuộc nhóm <strong>Done</strong> sẽ được hệ thống tự động ghi nhận hoàn thành mục tiêu và chốt thời gian giải quyết (Resolution).
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20">
          <Button type="button" variant="outline" onClick={closeWorkflowConfig}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Đang lưu quy trình..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

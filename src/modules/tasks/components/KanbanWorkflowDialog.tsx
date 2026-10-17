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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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

import { MoveWorkDialog } from "./MoveWorkDialog";

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

const WORKFLOW_PRESETS = [
  {
    name: "Kanban cơ bản",
    description: "Cần làm ➔ Đang làm ➔ Hoàn thành",
    statuses: [
      { key: "TODO", name: "Cần làm", category: "TODO" as StatusCategory, color: "#64748b" },
      { key: "IN_PROGRESS", name: "Đang làm", category: "IN_PROGRESS" as StatusCategory, color: "#2563eb" },
      { key: "DONE", name: "Hoàn thành", category: "DONE" as StatusCategory, color: "#10b981" },
    ],
  },
  {
    name: "Phát triển phần mềm",
    description: "Cần làm ➔ Đang làm ➔ Đánh giá ➔ Hoàn thành",
    statuses: [
      { key: "TODO", name: "Cần làm", category: "TODO" as StatusCategory, color: "#64748b" },
      { key: "IN_PROGRESS", name: "Đang làm", category: "IN_PROGRESS" as StatusCategory, color: "#2563eb" },
      { key: "IN_REVIEW", name: "Đánh giá", category: "IN_PROGRESS" as StatusCategory, color: "#9333ea" },
      { key: "DONE", name: "Hoàn thành", category: "DONE" as StatusCategory, color: "#10b981" },
    ],
  },
];

export function KanbanWorkflowDialog() {
  const {
    isWorkflowConfigOpen,
    closeWorkflowConfig,
    workflowConfigProjectId,
    statuses,
    fetchStatuses,
    syncStatuses,
    filters,
    projects,
  } = useTaskStore();

  const [activeProjectId, setActiveProjectId] = React.useState<string>("ALL");
  const [localStatuses, setLocalStatuses] = React.useState<EditableStatus[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  // Lưu lại các trạng thái ban đầu của dự án để biết cột nào bị xóa
  const initialStatusesRef = React.useRef<CustomTaskStatus[]>([]);
  // Lưu bảng mapping di chuyển công việc: { [deletedKey]: targetKey }
  const [migrateMap, setMigrateMap] = React.useState<Record<string, string>>({});

  // Quản lý dialog chuyển việc khi xóa cột
  const [statusToDelete, setStatusToDelete] = React.useState<{ id: string; key: string; name: string } | null>(null);
  const [isMoveWorkOpen, setIsMoveWorkOpen] = React.useState(false);

  React.useEffect(() => {
    if (isWorkflowConfigOpen) {
      const targetProj = workflowConfigProjectId || (filters.projectId && filters.projectId !== "ALL" ? filters.projectId : "ALL") || "ALL";
      setActiveProjectId(targetProj);
      fetchStatuses(
        targetProj !== "ALL" ? targetProj : undefined,
        filters.departmentId !== "ALL" ? filters.departmentId : undefined,
        targetProj === "ALL"
      );
    }
  }, [isWorkflowConfigOpen, workflowConfigProjectId, filters.projectId, filters.departmentId, fetchStatuses]);

  React.useEffect(() => {
    if (isWorkflowConfigOpen) {
      initialStatusesRef.current = statuses;
      setMigrateMap({});
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
    }
  }, [isWorkflowConfigOpen, statuses]);

  const handleProjectChange = (projId: string) => {
    setActiveProjectId(projId);
    setMigrateMap({});
    fetchStatuses(
      projId !== "ALL" ? projId : undefined,
      filters.departmentId !== "ALL" ? filters.departmentId : undefined,
      projId === "ALL"
    );
  };

  const handleApplyPreset = (preset: (typeof WORKFLOW_PRESETS)[number]) => {
    setLocalStatuses(
      preset.statuses.map((s, idx) => ({
        id: `preset-${Date.now()}-${idx}`,
        key: s.key,
        name: s.name,
        category: s.category,
        color: s.color,
        orderIndex: idx,
        isNew: true,
      }))
    );
    toast.info(`Đã áp dụng mẫu "${preset.name}". Bấm "Lưu thay đổi" để áp dụng cho dự án!`);
  };

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

    const itemToDelete = localStatuses.find((s) => s.id === id);
    if (!itemToDelete) return;

    // Kiểm tra xem cột này có phải là cột đang có trong dự án (initialStatuses) không
    const isExistingColumn = initialStatusesRef.current.some(
      (init) => init.id === itemToDelete.id || init.key === itemToDelete.key
    );

    if (isExistingColumn) {
      // Mở popup hỏi chuyển task về cột nào như form trong ảnh 2
      setStatusToDelete({
        id: itemToDelete.id,
        key: itemToDelete.key,
        name: itemToDelete.name,
      });
      setIsMoveWorkOpen(true);
    } else {
      // Cột mới thêm tạm thời chưa lưu thì xóa luôn
      setLocalStatuses((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleConfirmMoveWork = async (sourceId: string, targetKey: string) => {
    const itemToDelete = localStatuses.find((s) => s.id === sourceId) || statusToDelete;
    if (!itemToDelete) return;

    // Ghi nhận mapping chuyển task từ deletedKey sang targetKey
    setMigrateMap((prev) => ({
      ...prev,
      [itemToDelete.key]: targetKey,
    }));

    // Xóa cột khỏi danh sách local
    setLocalStatuses((prev) => prev.filter((s) => s.id !== itemToDelete.id));

    const targetStatusObj = localStatuses.find((s) => s.key === targetKey);
    toast.success(
      `Đã chọn chuyển công việc từ cột "${itemToDelete.name}" sang cột "${targetStatusObj?.name || targetKey}". Bấm "Lưu thay đổi" để áp dụng.`
    );
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
    if (localStatuses.length < 2) {
      toast.error("Cần có ít nhất 2 cột trong quy trình làm việc!");
      return;
    }
    const hasEmpty = localStatuses.some((s) => !s.name?.trim());
    if (hasEmpty) {
      toast.error("Vui lòng điền tên cho tất cả các cột trạng thái!");
      return;
    }

    // Kiểm tra nếu có cột ban đầu bị thiếu mà chưa được gán migrateMap
    const currentRemainingKeys = new Set(localStatuses.map((s) => s.key));
    const unmappedDeleted = initialStatusesRef.current.filter(
      (init) => !currentRemainingKeys.has(init.key) && !migrateMap[init.key]
    );

    if (unmappedDeleted.length > 0) {
      // Nếu có cột cũ bị xóa mà chưa chọn đích (ví dụ khi áp dụng mẫu Preset)
      // Mở dialog hỏi chuyển việc cho cột đầu tiên chưa map
      const firstUnmapped = unmappedDeleted[0];
      setStatusToDelete({
        id: firstUnmapped.id,
        key: firstUnmapped.key,
        name: firstUnmapped.name,
      });
      setIsMoveWorkOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const targetProj = activeProjectId !== "ALL" ? activeProjectId : undefined;
      await syncStatuses({
        projectId: targetProj,
        departmentId: filters.departmentId !== "ALL" ? filters.departmentId : undefined,
        statuses: localStatuses.map((s) => ({
          name: s.name.trim(),
          category: s.category,
          color: s.color || "#2563eb",
          key: s.key,
        })),
        migrateMap,
      });

      toast.success("Cập nhật quy trình làm việc thành công!");
      closeWorkflowConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể lưu cấu hình. Vui lòng thử lại!";
      toast.error(msg);
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
        <div className="p-6 pb-4 border-b border-border/80 bg-muted/20 pr-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Kanban className="h-4 w-4" />
            <span>Cấu hình Cột Kanban & Quy trình</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Thiết lập Quy trình & Cột Công Việc
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Tùy biến các bước thực hiện công việc phù hợp với thực tế dự án của bạn (To Do, In Progress, Done,...).
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3 border-t border-border/60">
            <span className="text-xs font-semibold text-foreground shrink-0">Áp dụng cho dự án:</span>
            <Select value={activeProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="h-8 text-xs max-w-sm bg-card border-primary/30">
                <SelectValue placeholder="Chọn dự án cấu hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Mặc định toàn hệ thống (Áp dụng chung)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-6 py-2.5 bg-muted/40 border-b border-border/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-foreground">Chọn nhanh mẫu quy trình:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WORKFLOW_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="h-7 px-3 rounded-lg border border-border/80 bg-background hover:bg-primary/5 hover:border-primary/50 text-xs font-medium text-foreground transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title={preset.description}
              >
                <span>{preset.name}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({preset.statuses.length} cột)
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
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

                    <span className="w-5 text-center text-xs font-mono font-semibold text-muted-foreground">
                      {index + 1}
                    </span>

                    <Input
                      value={st.name}
                      onChange={(e) => handleNameChange(st.id, e.target.value)}
                      className="h-8.5 text-xs font-medium flex-1"
                      placeholder="Nhập tên trạng thái..."
                    />

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

            <Button
              type="button"
              variant="outline"
              onClick={handleAddStatus}
              className="w-full h-9 border-dashed text-xs text-primary border-primary/40 hover:bg-primary/5 hover:border-primary gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm trạng thái mới</span>
            </Button>
          </div>

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

            <div className="flex-1 bg-card rounded-lg border border-border/70 p-2.5 overflow-x-auto shadow-inner flex gap-2 min-h-[220px]">
              {localStatuses.map((st) => {
                const cat = CATEGORY_CONFIG[st.category];
                return (
                  <div
                    key={st.id}
                    className="flex-1 min-w-[62px] bg-muted/40 rounded-md border border-border/60 p-1.5 flex flex-col gap-1.5 text-left transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-1">
                      <span className="text-[11px] font-bold text-foreground truncate block w-full" title={st.name}>
                        {st.name || "..."}
                      </span>
                    </div>

                    <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium inline-block w-fit truncate max-w-full", cat.bg)}>
                      {cat.label}
                    </span>

                    <div className="p-1.5 bg-background rounded border border-border/50 shadow-2xs mt-1 space-y-1">
                      <div className="h-2 w-full bg-muted-foreground/30 rounded-full" />
                      <div className="h-1.5 w-2/3 bg-muted-foreground/20 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              💡Các task thuộc nhóm <strong>Done</strong> sẽ được hệ thống tự động ghi nhận hoàn thành mục tiêu và chốt thời gian giải quyết (Resolution).
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20">
          <Button type="button" variant="outline" onClick={closeWorkflowConfig}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Đang lưu quy trình..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <MoveWorkDialog
        open={isMoveWorkOpen}
        onOpenChange={setIsMoveWorkOpen}
        sourceStatus={statusToDelete}
        availableStatuses={localStatuses.filter((s) => s.id !== statusToDelete?.id && s.key !== statusToDelete?.key)}
        onConfirm={handleConfirmMoveWork}
      />
    </Dialog>
  );
}

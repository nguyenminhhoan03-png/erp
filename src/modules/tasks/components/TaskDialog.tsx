"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  MessageSquare,
  Send,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  UserPlus,
  Shield,
  ArrowRight,
  RotateCcw,
  Ban,
  HelpCircle,
  Check,
  ChevronDown,
  Pencil,
  CornerDownRight,
  ArrowUpRight,
  X,
  Search,
} from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TASK_RESOLUTION_CONFIG,
} from "../constants";
import { TaskPriority, TaskResolution } from "../types";
import type { User as UserModel } from "@/shared/types";
import { can, checkTaskTransitionPermission } from "@/shared/permissions/can";
import { formatDate, formatDateTime, formatRelativeTime, isOverdue } from "@/lib/date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TaskSubtasksSection } from "./detail/TaskSubtasksSection";
import { TaskAttachmentsSection } from "./detail/TaskAttachmentsSection";
import { TaskCommentsSection } from "./detail/TaskCommentsSection";

function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function TaskDialog() {
  const {
    activeTask,
    isDetailOpen,
    closeDetail,
    updateTask,
    addComment,
    moveTask,
    deleteTask,
    closeTask,
    reopenTask,
    projects,
    statuses,
    tasks,
    openDetail,
  } = useTaskStore();
  const { currentUser, getUserById, departments, users } = useUserStore();

  const [isCloseModalOpen, setIsCloseModalOpen] = React.useState(false);
  const [selectedResolution, setSelectedResolution] = React.useState<TaskResolution>("NOT_A_BUG");
  const [resolutionNote, setResolutionNote] = React.useState("");

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState("");
  const [isEditingDesc, setIsEditingDesc] = React.useState(false);
  const [descDraft, setDescDraft] = React.useState("");
  const [isEditingDueDate, setIsEditingDueDate] = React.useState(false);
  const [assigneeSearch, setAssigneeSearch] = React.useState("");
  const [reportSearch, setReportSearch] = React.useState("");
  const assigneeSearchRef = React.useRef<HTMLInputElement>(null);
  const reportSearchRef = React.useRef<HTMLInputElement>(null);

  const filteredAssigneeUsers = React.useMemo(() => {
    if (!assigneeSearch.trim()) return users;
    const term = assigneeSearch.trim().toLowerCase();
    const termNoAccent = removeVietnameseTones(term);
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const title = (u.title || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return (
        name.includes(term) ||
        removeVietnameseTones(name).includes(termNoAccent) ||
        title.includes(term) ||
        removeVietnameseTones(title).includes(termNoAccent) ||
        email.includes(term)
      );
    });
  }, [users, assigneeSearch]);

  const filteredReportUsers = React.useMemo(() => {
    if (!reportSearch.trim()) return users;
    const term = reportSearch.trim().toLowerCase();
    const termNoAccent = removeVietnameseTones(term);
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const title = (u.title || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return (
        name.includes(term) ||
        removeVietnameseTones(name).includes(termNoAccent) ||
        title.includes(term) ||
        removeVietnameseTones(title).includes(termNoAccent) ||
        email.includes(term)
      );
    });
  }, [users, reportSearch]);

  React.useEffect(() => {
    if (activeTask) {
      setTitleDraft(activeTask.title);
      setDescDraft(activeTask.description || "");
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setIsEditingDueDate(false);
    }
  }, [activeTask?.id]);

  if (!activeTask) return null;

  const customStatus = statuses?.find((s) => s.key === activeTask.status);
  const statusCfg = (activeTask.status && TASK_STATUS_CONFIG[activeTask.status])
    ? {
      ...TASK_STATUS_CONFIG[activeTask.status],
      ...(customStatus ? { label: customStatus.name, color: customStatus.color } : {})
    }
    : {
      id: activeTask.status || "TODO",
      label: customStatus?.name || activeTask.status || "Chưa phân loại",
      color: customStatus?.color || "#64748b",
      badgeBg: "bg-slate-100 dark:bg-slate-800/80",
      badgeText: "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-medium",
      dotColor: "bg-slate-500",
      borderColor: "border-slate-300 dark:border-slate-800",
      description: customStatus?.name || activeTask.status || "Chưa phân loại",
    };

  const availableStatuses = (statuses && statuses.length > 0)
    ? statuses.map((s) => ({
      key: s.key,
      label: s.name,
      color: s.color,
      category: s.category,
    }))
    : [];

  const priorityCfg = TASK_PRIORITY_CONFIG[activeTask.priority];
  const dept = departments.find((d) => String(d.id) === String(activeTask.departmentId));
  const departmentName = activeTask.departmentName || dept?.name || dept?.code;
  const project = projects.find((p) => p.id === activeTask.projectId);
  const creator = getUserById(activeTask.creatorId);
  const rawReportToIds = Array.isArray(activeTask.reportToIds)
    ? activeTask.reportToIds.map(String)
    : (Array.isArray(activeTask.reportTos)
      ? activeTask.reportTos.map((u) => String(u.id))
      : (Array.isArray(activeTask.reporters)
        ? activeTask.reporters.map((u) => String(u.id))
        : (activeTask.reportToId ? [String(activeTask.reportToId)] : [])));
  const reportToUsers: UserModel[] = (
    (Array.isArray(activeTask.reportTos) && activeTask.reportTos.length > 0)
      ? activeTask.reportTos
      : (Array.isArray(activeTask.reporters) && activeTask.reporters.length > 0)
        ? activeTask.reporters
        : rawReportToIds.map((id) => getUserById(String(id))).filter(Boolean)
  ) as UserModel[];
  const overdue = isOverdue(activeTask.dueDate, activeTask.status, activeTask.closedAt);

  const rawAssigneeIds = Array.isArray(activeTask.assigneeIds)
    ? activeTask.assigneeIds
    : (Array.isArray(activeTask.assignees) ? activeTask.assignees.map((u) => u.id) : []);

  const assignees = (Array.isArray(activeTask.assignees) && activeTask.assignees.length > 0)
    ? activeTask.assignees
    : rawAssigneeIds
      .map((id) => getUserById(String(id)))
      .filter(Boolean);



  const handleQuickStatusChange = async (toStatus: typeof activeTask.status) => {
    const res = await moveTask(activeTask.id, toStatus, currentUser);
    if (!res.success) {
      toast.error("Không được phép", { description: res.reason });
    } else {
      const targetLabel = statuses?.find((s) => s.key === toStatus)?.name || TASK_STATUS_CONFIG[toStatus]?.label || toStatus;
      toast.success("Cập nhật thành công", {
        description: `Chuyển sang: ${targetLabel}`,
      });
    }
  };

  const handleDelete = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa công việc này không?")) {
      await deleteTask(activeTask.id);
      toast.success("Đã xóa công việc thành công");
      closeDetail();
    }
  };

  const handleConfirmClose = async () => {
    if (!activeTask) return;
    const res = await closeTask(activeTask.id, selectedResolution, resolutionNote, currentUser);
    if (!res.success) {
      toast.error("Không được phép đóng công việc", { description: res.reason });
    } else {
      toast.success("Đã đóng công việc thành công", {
        description: `Kết quả: ${TASK_RESOLUTION_CONFIG[selectedResolution].label}`,
      });
      setIsCloseModalOpen(false);
      setResolutionNote("");
    }
  };

  const handleReopen = async () => {
    if (!activeTask) return;
    const res = await reopenTask(activeTask.id, currentUser);
    if (!res.success) {
      toast.error("Không được phép mở lại công việc", { description: res.reason });
    } else {
      toast.success("Đã mở lại công việc thành công", {
        description: "Công việc đã chuyển về trạng thái Cần làm (To Do).",
      });
    }
  };

  const parentTask =
    activeTask.parent ||
    tasks.find((t) => String(t.id) === String(activeTask.parentId));

  const parentCode =
    parentTask?.code ||
    (activeTask.code && activeTask.code.includes(".")
      ? activeTask.code.split(".").slice(0, -1).join(".")
      : `#${activeTask.parentId}`);

  const parentTitle = parentTask?.title;

  const handleNavigateToParent = async () => {
    if (parentTask) {
      openDetail(parentTask);
      return;
    }
    if (activeTask.parentId) {
      try {
        const { apiRequest } = await import("@/lib/api-client");
        const res = await apiRequest<{ success: boolean; data: any }>(`/erp/tasks/${activeTask.parentId}`);
        if (res?.data) {
          openDetail(res.data);
          return;
        }
      } catch {
      }
    }
    toast.info(`Công việc cha mã: ${parentCode}`);
  };

  const handleSaveTitle = async () => {
    if (!titleDraft.trim() || titleDraft.trim() === activeTask.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateTask(activeTask.id, { title: titleDraft.trim() });
      toast.success("Đã cập nhật tiêu đề!");
    } catch {
      toast.error("Không thể cập nhật tiêu đề.");
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateTask(activeTask.id, { description: descDraft.trim() });
      toast.success("Đã lưu mô tả công việc!");
      setIsEditingDesc(false);
    } catch {
      toast.error("Không thể lưu mô tả.");
    }
  };

  const handleUpdatePriority = async (newPriority: TaskPriority) => {
    if (newPriority === activeTask.priority) return;
    try {
      await updateTask(activeTask.id, { priority: newPriority });
      toast.success(`Đã đổi ưu tiên: ${TASK_PRIORITY_CONFIG[newPriority]?.label}`);
    } catch {
      toast.error("Không thể cập nhật độ ưu tiên.");
    }
  };

  const handleSaveDueDate = async (newDateStr: string) => {
    if (!newDateStr) return;
    try {
      await updateTask(activeTask.id, { dueDate: new Date(newDateStr).toISOString() });
      toast.success("Đã cập nhật hạn chót!");
      setIsEditingDueDate(false);
    } catch {
      toast.error("Không thể cập nhật hạn chót.");
    }
  };

  const handleToggleAssignee = async (userId: string) => {
    const isAssigned = rawAssigneeIds.includes(userId);
    const next = isAssigned
      ? rawAssigneeIds.filter((id) => id !== userId)
      : [...rawAssigneeIds, userId];
    try {
      await updateTask(activeTask.id, { assigneeIds: next });
      toast.success(isAssigned ? "Đã gỡ người thực hiện" : "Đã thêm người thực hiện");
    } catch {
      toast.error("Lỗi cập nhật người thực hiện");
    }
  };

  const handleToggleReportTo = async (userId: string) => {
    const isReportTo = rawReportToIds.includes(userId);
    const next = isReportTo
      ? rawReportToIds.filter((id) => id !== userId)
      : [...rawReportToIds, userId];
    try {
      await updateTask(activeTask.id, { reportToIds: next, reportToId: next[0] || undefined });
      toast.success(isReportTo ? "Đã gỡ người nhận báo cáo" : "Đã thêm người nhận báo cáo");
    } catch {
      toast.error("Lỗi cập nhật người báo cáo");
    }
  };

  const canDelete = can(currentUser, "delete", "task", { task: activeTask });
  const isAssignee = rawAssigneeIds.includes(currentUser.id);
  const isManagerOfDept =
    currentUser.role === "MANAGER" &&
    currentUser.departmentId === activeTask.departmentId;
  const isManagerOrAdmin = currentUser.role === "ADMIN" || isManagerOfDept;

  return (
    <Dialog open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          {activeTask.parentId && (
            <div className="w-full flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <CornerDownRight className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Việc cha:</span>
              <button
                type="button"
                onClick={handleNavigateToParent}
                className="font-mono font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-1.5 py-0.5 rounded text-[11px]"
                title="Bấm để xem công việc cha"
              >
                <span>{parentCode}</span>
                {parentTitle && <span className="font-normal text-foreground truncate max-w-xs">({parentTitle})</span>}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5 mb-2.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                {activeTask.code}
              </span>
              {project && (
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold shrink-0", project.badgeBg, project.badgeText)}
                >
                  {project.category === "GOV_SOLUTION"
                    ? `🏛️ ${project.code ? `[${project.code}] ` : ""}${project.name}`
                    : (project.code ? `[${project.code}] ${project.name}` : project.name)}
                </Badge>
              )}
              {departmentName && (
                <Badge
                  variant="outline"
                  className="text-xs shrink-0"
                  style={{
                    borderColor: dept?.color ? `${dept.color}40` : undefined,
                    color: dept?.color || undefined,
                    backgroundColor: dept?.color ? `${dept.color}10` : undefined,
                  }}
                >
                  {departmentName}
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn("text-xs px-2 py-0.5 rounded border font-medium flex items-center gap-1 cursor-pointer hover:opacity-85 transition-opacity shrink-0", priorityCfg.badgeBg, priorityCfg.badgeText)}
                    title="Bấm để đổi mức độ ưu tiên"
                  >
                    <span>Ưu tiên: {priorityCfg.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Đổi mức độ ưu tiên
                  </div>
                  {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => handleUpdatePriority(p)}
                      className={cn("text-xs cursor-pointer flex items-center justify-between", activeTask.priority === p && "font-bold bg-muted")}
                    >
                      <span>{TASK_PRIORITY_CONFIG[p].label}</span>
                      {activeTask.priority === p && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {activeTask.resolution && activeTask.resolution !== "DONE" && TASK_RESOLUTION_CONFIG[activeTask.resolution] && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold shrink-0",
                    TASK_RESOLUTION_CONFIG[activeTask.resolution].badgeBg,
                    TASK_RESOLUTION_CONFIG[activeTask.resolution].badgeText
                  )}
                  title={TASK_RESOLUTION_CONFIG[activeTask.resolution].description}
                >
                  {TASK_RESOLUTION_CONFIG[activeTask.resolution].label}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 pr-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:opacity-90 shrink-0",
                      statusCfg.badgeBg,
                      statusCfg.badgeText,
                      statusCfg.borderColor
                    )}
                    title="Bấm để chuyển trạng thái công việc nhanh"
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", statusCfg.dotColor)} />
                    <span>{statusCfg.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Chuyển trạng thái công việc
                  </div>
                  {availableStatuses.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                      Chưa có cột trạng thái nào được cấu hình
                    </div>
                  ) : (
                    availableStatuses.map((st) => {
                      const cfg = TASK_STATUS_CONFIG[st.key];
                      const isCurrent = activeTask.status === st.key;
                      return (
                        <DropdownMenuItem
                          key={st.key}
                          onClick={() => {
                            if (isCurrent) return;
                            const isCancelOrClose = st.key === "CANCELLED" || st.label.toLowerCase().includes("hủy") || st.label.toLowerCase().includes("đóng");
                            if (isCancelOrClose) {
                              setIsCloseModalOpen(true);
                            } else {
                              handleQuickStatusChange(st.key);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer",
                            isCurrent && "bg-muted font-bold text-primary"
                          )}
                        >
                          <span
                            className={cn("w-2 h-2 rounded-full shrink-0", !st.color && (cfg?.dotColor || "bg-slate-500"))}
                            style={{ backgroundColor: st.color || undefined }}
                          />
                          <span className="flex-1">{st.label}</span>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 mt-2">
              <Input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="text-lg font-bold h-10 bg-background"
                placeholder="Nhập tiêu đề công việc..."
              />
              <Button size="sm" onClick={handleSaveTitle} className="h-10 px-3 shrink-0">
                Lưu
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)} className="h-10 px-3 shrink-0">
                Hủy
              </Button>
            </div>
          ) : (
            <div
              className="group inline-flex items-center gap-2 mt-1 cursor-pointer max-w-full"
              onClick={() => {
                setTitleDraft(activeTask.title);
                setIsEditingTitle(true);
              }}
            >
              <DialogTitle className="text-xl font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                {activeTask.title}
              </DialogTitle>
              <button
                type="button"
                className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-primary transition-all shrink-0 cursor-pointer"
                title="Sửa tiêu đề"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {(activeTask.status === "CANCELLED" || (activeTask.resolution && activeTask.resolution !== "DONE")) && (
            <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/60 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <Ban className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-foreground">
                      Công việc đã đóng / không tiếp tục thực hiện
                    </h5>
                    <p className="text-[11px] text-muted-foreground">
                      Không tính vào tiến độ nghiệm thu hoàn thành
                    </p>
                  </div>
                </div>

                {activeTask.resolution && TASK_RESOLUTION_CONFIG[activeTask.resolution] && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold px-2.5 py-1",
                      TASK_RESOLUTION_CONFIG[activeTask.resolution].badgeBg,
                      TASK_RESOLUTION_CONFIG[activeTask.resolution].badgeText
                    )}
                  >
                    Resolution: {TASK_RESOLUTION_CONFIG[activeTask.resolution].badgeLabel}
                  </Badge>
                )}
              </div>

              {activeTask.resolutionNote ? (
                <div className="text-xs bg-background/80 p-3 rounded-lg border border-border/60">
                  <strong className="text-foreground">Lý do đóng / Giải thích: </strong>
                  <span className="text-muted-foreground">{activeTask.resolutionNote}</span>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  Không có ghi chú giải thích thêm.
                </p>
              )}

              {activeTask.closedById && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/40">
                  <span>Người đóng: <strong className="text-foreground">{getUserById(activeTask.closedById)?.name || "Thành viên"}</strong></span>
                  {activeTask.closedAt && (
                    <>
                      <span>•</span>
                      <span>Thời điểm: {formatDateTime(activeTask.closedAt)}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Người thực hiện</span>
                  <span className="text-muted-foreground/60">({assignees.length})</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap min-h-7">
                  {assignees.map((u) => (
                    <div
                      key={u!.id}
                      className="inline-flex items-center gap-1.5 py-0.5 pl-1 pr-2 rounded-full bg-background border border-border/80 shadow-2xs hover:border-primary/40 transition-colors text-xs font-medium"
                    >
                      <UserAvatar user={u} size="sm" className="h-5 w-5" />
                      <span className="text-foreground">{u!.name}</span>
                      {u!.id === currentUser.id && (
                        <span className="text-[9px] px-1 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                          Tôi
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleAssignee(String(u!.id))}
                        className="text-muted-foreground hover:text-rose-500 rounded-full hover:bg-rose-500/10 p-0.5 transition-colors cursor-pointer"
                        title="Bỏ gán"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <DropdownMenu onOpenChange={(open) => { if (!open) setAssigneeSearch(""); }}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border border-dashed transition-all cursor-pointer text-xs",
                          assignees.length === 0
                            ? "h-7 px-3 border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 font-medium"
                            : "h-6 px-2 border-border hover:border-primary hover:text-primary hover:bg-primary/5 text-muted-foreground"
                        )}
                      >
                        <Plus className="h-3 w-3" />
                        <span>{assignees.length === 0 ? "Gán người làm" : "Thêm"}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-64 p-1.5 flex flex-col"
                      onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        assigneeSearchRef.current?.focus();
                        setTimeout(() => {
                          assigneeSearchRef.current?.focus();
                        }, 10);
                      }}
                    >
                      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Chọn người thực hiện
                      </div>
                      <div className="px-1 pb-1.5 pt-0.5 border-b border-border/50 mb-1">
                        <div className="relative flex items-center">
                          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            ref={assigneeSearchRef}
                            type="text"
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Tìm nhân sự, chức vụ..."
                            className="h-8 pl-8 pr-7 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border-border/60 rounded-lg shadow-none"
                            autoFocus
                          />
                          {assigneeSearch && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssigneeSearch("");
                              }}
                              className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                              title="Xóa tìm kiếm"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                        {filteredAssigneeUsers.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            Không tìm thấy nhân sự phù hợp
                          </div>
                        ) : (
                          filteredAssigneeUsers.map((u) => {
                            const isAssigned = rawAssigneeIds.includes(String(u.id));
                            const isSelf = String(u.id) === String(currentUser.id);
                            return (
                              <DropdownMenuItem
                                key={u.id}
                                onSelect={(e) => e.preventDefault()}
                                onClick={() => handleToggleAssignee(String(u.id))}
                                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg py-1.5"
                              >
                                <UserAvatar user={u} size="sm" className="h-6 w-6" />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-1">
                                    <span className="truncate font-medium">{u.name}</span>
                                    {isSelf && (
                                      <span className="text-[9px] px-1 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                                        Tôi
                                      </span>
                                    )}
                                  </div>
                                  {u.title && (
                                    <span className="text-[10px] text-muted-foreground truncate">{u.title}</span>
                                  )}
                                </div>
                                {isAssigned && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </DropdownMenuItem>
                            );
                          })
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-500" />
                  <span>Báo cáo cho</span>
                  <span className="text-muted-foreground/60">({reportToUsers.length})</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap min-h-7">
                  {reportToUsers.map((u) => (
                    <div
                      key={u!.id}
                      className="inline-flex items-center gap-1.5 py-0.5 pl-1 pr-2 rounded-full bg-background border border-border/80 shadow-2xs hover:border-blue-500/40 transition-colors text-xs font-medium"
                    >
                      <UserAvatar user={u} size="sm" className="h-5 w-5" />
                      <span className="text-foreground">{u!.name}</span>
                      {u!.id === currentUser.id && (
                        <span className="text-[9px] px-1 py-0.2 rounded-full bg-blue-500/10 text-blue-600 font-bold">
                          Tôi
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleReportTo(String(u!.id))}
                        className="text-muted-foreground hover:text-rose-500 rounded-full hover:bg-rose-500/10 p-0.5 transition-colors cursor-pointer"
                        title="Bỏ người này"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <DropdownMenu onOpenChange={(open) => { if (!open) setReportSearch(""); }}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border border-dashed transition-all cursor-pointer text-xs",
                          reportToUsers.length === 0
                            ? "h-7 px-3 border-blue-400/50 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10 font-medium"
                            : "h-6 px-2 border-border hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/5 text-muted-foreground"
                        )}
                      >
                        <Plus className="h-3 w-3" />
                        <span>{reportToUsers.length === 0 ? "Chọn người nhận" : "Thêm"}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-64 p-1.5 flex flex-col"
                      onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        reportSearchRef.current?.focus();
                        setTimeout(() => {
                          reportSearchRef.current?.focus();
                        }, 10);
                      }}
                    >
                      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Chọn người nhận báo cáo
                      </div>
                      <div className="px-1 pb-1.5 pt-0.5 border-b border-border/50 mb-1">
                        <div className="relative flex items-center">
                          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            ref={reportSearchRef}
                            type="text"
                            value={reportSearch}
                            onChange={(e) => setReportSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Tìm nhân sự, chức vụ..."
                            className="h-8 pl-8 pr-7 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border-border/60 rounded-lg shadow-none"
                            autoFocus
                          />
                          {reportSearch && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportSearch("");
                              }}
                              className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                              title="Xóa tìm kiếm"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                        {filteredReportUsers.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            Không tìm thấy nhân sự phù hợp
                          </div>
                        ) : (
                          filteredReportUsers.map((u) => {
                            const isSelected = rawReportToIds.includes(String(u.id));
                            const isSelf = String(u.id) === String(currentUser.id);
                            return (
                              <DropdownMenuItem
                                key={u.id}
                                onSelect={(e) => e.preventDefault()}
                                onClick={() => handleToggleReportTo(String(u.id))}
                                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg py-1.5"
                              >
                                <UserAvatar user={u} size="sm" className="h-6 w-6" />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-1">
                                    <span className="truncate font-medium">{u.name}</span>
                                    {isSelf && (
                                      <span className="text-[9px] px-1 py-0.2 rounded-full bg-blue-500/10 text-blue-600 font-bold">
                                        Tôi
                                      </span>
                                    )}
                                  </div>
                                  {u.title && (
                                    <span className="text-[10px] text-muted-foreground truncate">{u.title}</span>
                                  )}
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </DropdownMenuItem>
                            );
                          })
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/50">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-amber-500" />
                  <span>Người tạo task</span>
                </span>
                <div className="flex items-center gap-2.5 py-0.5">
                  <UserAvatar user={creator} size="sm" className="h-7 w-7" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-foreground text-xs">{creator?.name || "Chưa rõ"}</span>
                    <span className="text-[11px] text-muted-foreground">{creator?.title || "Thành viên"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-rose-500" />
                  <span>Hạn hoàn thành</span>
                </span>
                {isEditingDueDate ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      autoFocus
                      defaultValue={activeTask.dueDate ? activeTask.dueDate.split("T")[0] : ""}
                      onChange={(e) => handleSaveDueDate(e.target.value)}
                      className="h-7 text-xs bg-background"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDueDate(false)}
                      className="h-7 text-xs px-2 cursor-pointer"
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDueDate(true)}
                    className={cn(
                      "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/70 hover:border-primary/50 bg-background/80 hover:bg-background cursor-pointer group transition-all text-xs w-fit",
                      overdue ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20" : ""
                    )}
                    title="Bấm để đổi hạn hoàn thành"
                  >
                    <Calendar className={cn("h-3.5 w-3.5", overdue ? "text-rose-500" : "text-muted-foreground group-hover:text-primary")} />
                    <span className={cn("font-medium", overdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-foreground")}>
                      {formatDate(activeTask.dueDate, "EEEE, dd/MM/yyyy")}
                    </span>
                    {overdue && (
                      <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                        Trễ hạn
                      </Badge>
                    )}
                    <Pencil className="h-3 w-3 text-muted-foreground opacity-40 group-hover:opacity-100 ml-0.5 transition-opacity" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex-wrap gap-2.5">
              <div className="flex items-center gap-3.5 flex-wrap">
                <div className="flex items-center gap-1.5" title={formatDateTime(activeTask.createdAt)}>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>Khởi tạo: <strong className="text-foreground font-medium">{formatDateTime(activeTask.createdAt)}</strong></span>
                </div>
                {activeTask.updatedAt && (
                  <div className="flex items-center gap-1.5" title={`Thời điểm kéo/cập nhật gần nhất: ${formatDateTime(activeTask.updatedAt)}`}>
                    <span>Trạng thái cập nhật: <strong className="text-foreground font-medium">{formatRelativeTime(activeTask.updatedAt)}</strong> ({formatDateTime(activeTask.updatedAt)})</span>
                  </div>
                )}
                {activeTask.closedAt && (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400" title={`Hoàn thành lúc: ${formatDateTime(activeTask.closedAt)}`}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Hoàn thành: <strong className="font-medium text-emerald-600 dark:text-emerald-400">{formatDateTime(activeTask.closedAt)}</strong></span>
                  </div>
                )}
              </div>
              {activeTask.estimatedHours ? (
                <div className="flex items-center gap-1 shrink-0">
                  <span>Ước tính giờ làm: <strong className="text-foreground font-medium">{activeTask.estimatedHours} giờ</strong></span>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mô tả chi tiết công việc
              </h4>
              {!isEditingDesc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDescDraft(activeTask.description || "");
                    setIsEditingDesc(true);
                  }}
                  className="h-6 text-xs text-primary gap-1 px-2 cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Chỉnh sửa</span>
                </Button>
              )}
            </div>
            {isEditingDesc ? (
              <div className="space-y-2">
                <Textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  placeholder="Nhập mô tả chi tiết công việc..."
                  rows={4}
                  className="text-sm bg-background"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDesc(false)}
                    className="h-7 text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveDescription}
                    className="h-7 text-xs px-3"
                  >
                    Lưu mô tả
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setDescDraft(activeTask.description || "");
                  setIsEditingDesc(true);
                }}
                className="p-4 rounded-xl border border-border/80 bg-card text-sm leading-relaxed whitespace-pre-line text-foreground/90 cursor-pointer hover:border-primary/50 transition-colors"
                title="Bấm để chỉnh sửa mô tả"
              >
                {activeTask.description || (
                  <span className="text-muted-foreground italic">Chưa có mô tả chi tiết. Bấm vào đây để thêm...</span>
                )}
              </div>
            )}
          </div>

          <TaskSubtasksSection task={activeTask} />

          <TaskAttachmentsSection task={activeTask} />

          <TaskCommentsSection task={activeTask} />
        </div>

        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-2">
          <div>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 text-xs h-8 cursor-pointer"
                title="Chỉ dùng khi cần xóa vĩnh viễn task tạo nhầm. Thông thường nên kéo vào cột Đã đóng / Hủy."
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa task</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={closeDetail}
              className="h-8 text-xs font-semibold px-4 cursor-pointer"
            >
              Đóng cửa sổ
            </Button>
          </div>
        </div>

        {isCloseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-background border border-border/80 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <Ban className="h-5 w-5" />
                  <h3 className="font-bold text-sm text-foreground">Đóng công việc • Chọn lý do (Resolution)</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="h-7 w-7 p-0 rounded-full"
                >
                  ✕
                </Button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Theo chuẩn Jira: Khi đóng task không tiếp tục làm, chọn chính xác lý do để không làm sai lệch báo cáo KPI và biểu đồ Sprint của nhóm.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Kết quả xử lý (Resolution):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(["NOT_A_BUG", "WONT_FIX", "CANNOT_REPRODUCE", "DUPLICATE"] as TaskResolution[]).map(
                    (resKey) => {
                      const cfg = TASK_RESOLUTION_CONFIG[resKey];
                      const isSelected = selectedResolution === resKey;
                      return (
                        <div
                          key={resKey}
                          onClick={() => setSelectedResolution(resKey)}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                              : "border-border/80 bg-muted/20 hover:border-border"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{cfg.label}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                            {cfg.description}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ghi chú giải thích chi tiết (tùy chọn):
                </label>
                <Input
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Ví dụ: Tính năng hoạt động đúng SRS v1.2 / Trùng với ERP-102..."
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmClose}
                  className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Xác nhận đóng công việc</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

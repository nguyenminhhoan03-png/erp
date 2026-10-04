"use client";

import * as React from "react";
import {
  Calendar,
  CheckSquare,
  Clock,
  MessageSquare,
  Send,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Shield,
  ArrowRight,
  RotateCcw,
  Ban,
  HelpCircle,
  Check,
} from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, TASK_RESOLUTION_CONFIG } from "../constants";
import { TaskResolution } from "../types";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { can, checkTaskTransitionPermission } from "@/shared/permissions/can";
import { formatDate, formatDateTime, isOverdue } from "@/lib/date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TaskDialog() {
  const {
    activeTask,
    isDetailOpen,
    closeDetail,
    toggleChecklistItem,
    updateTask,
    addComment,
    moveTask,
    deleteTask,
    approveTask,
    rejectTask,
    closeTask,
    reopenTask,
  } = useTaskStore();
  const { currentUser, getUserById } = useUserStore();

  const [newChecklistTitle, setNewChecklistTitle] = React.useState("");
  const [newComment, setNewComment] = React.useState("");
  const [mockComments, setMockComments] = React.useState<
    Array<{ id: string; authorName: string; text: string; time: string }>
  >([]);

  // State đóng task (Resolution Modal)
  const [isCloseModalOpen, setIsCloseModalOpen] = React.useState(false);
  const [selectedResolution, setSelectedResolution] = React.useState<TaskResolution>("NOT_A_BUG");
  const [resolutionNote, setResolutionNote] = React.useState("");

  // Reset or load comments when activeTask changes
  React.useEffect(() => {
    if (activeTask) {
      setMockComments([
        {
          id: "cmt-1",
          authorName: "Trần Minh Quân",
          text: `Đã cập nhật mục tiêu dự án và giao nhiệm vụ ${activeTask.code}.`,
          time: "Hôm qua lúc 14:30",
        },
      ]);
      setNewComment("");
    }
  }, [activeTask?.id]);

  if (!activeTask) return null;

  const statusCfg = TASK_STATUS_CONFIG[activeTask.status];
  const priorityCfg = TASK_PRIORITY_CONFIG[activeTask.priority];
  const dept = MOCK_DEPARTMENTS.find((d) => d.id === activeTask.departmentId);
  const creator = getUserById(activeTask.creatorId);
  const overdue = isOverdue(activeTask.dueDate, activeTask.status);

  const assignees = activeTask.assigneeIds
    .map((id) => getUserById(id))
    .filter(Boolean);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setMockComments((prev) => [
      ...prev,
      {
        id: `cmt-${Date.now()}`,
        authorName: currentUser.name,
        text: newComment.trim(),
        time: "Vừa xong",
      },
    ]);
    addComment(activeTask.id, currentUser.id, newComment.trim());
    setNewComment("");
    toast.success("Đã đăng bình luận");
  };

  const handleQuickStatusChange = async (toStatus: typeof activeTask.status) => {
    const res = await moveTask(activeTask.id, toStatus, currentUser);
    if (!res.success) {
      toast.error("Không được phép", { description: res.reason });
    } else {
      toast.success("Cập nhật thành công", {
        description: `Chuyển sang: ${TASK_STATUS_CONFIG[toStatus].label}`,
      });
    }
  };

  const handleApprove = async () => {
    const res = await approveTask(activeTask.id, currentUser);
    if (res.success) {
      toast.success("Đã phê duyệt công việc!");
      closeDetail();
    } else {
      toast.error(res.reason || "Lỗi phê duyệt");
    }
  };

  const handleReject = async () => {
    const res = await rejectTask(activeTask.id, currentUser);
    if (res.success) {
      toast.info("Đã từ chối công việc");
      closeDetail();
    } else {
      toast.error(res.reason || "Lỗi từ chối");
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

  const canDelete = can(currentUser, "delete", "task", { task: activeTask });
  const isAssignee = activeTask.assigneeIds.includes(currentUser.id);
  const isManagerOfDept =
    currentUser.role === "MANAGER" &&
    currentUser.departmentId === activeTask.departmentId;
  const isManagerOrAdmin = currentUser.role === "ADMIN" || isManagerOfDept;

  return (
    <Dialog open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2 mb-2 flex-wrap pr-12">
            <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {activeTask.code}
            </span>
            {dept && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: `${dept.color}40`,
                  color: dept.color,
                  backgroundColor: `${dept.color}10`,
                }}
              >
                {dept.name}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn("text-xs", priorityCfg.badgeBg, priorityCfg.badgeText)}
            >
              Ưu tiên: {priorityCfg.label}
            </Badge>

            {activeTask.status === "CANCELLED" && activeTask.resolution && TASK_RESOLUTION_CONFIG[activeTask.resolution] && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold",
                  TASK_RESOLUTION_CONFIG[activeTask.resolution].badgeBg,
                  TASK_RESOLUTION_CONFIG[activeTask.resolution].badgeText
                )}
                title={TASK_RESOLUTION_CONFIG[activeTask.resolution].description}
              >
                {TASK_RESOLUTION_CONFIG[activeTask.resolution].label}
              </Badge>
            )}

            <Badge
              variant="outline"
              className={cn("text-xs font-semibold ml-auto", statusCfg.badgeBg, statusCfg.badgeText)}
            >
              {statusCfg.label}
            </Badge>
          </div>

          <DialogTitle className="text-xl font-bold leading-snug text-foreground">
            {activeTask.title}
          </DialogTitle>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Closed / Cancelled Banner (Jira Resolution) */}
          {activeTask.status === "CANCELLED" && (
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground font-medium">Người tạo / Giao việc:</span>
              <div className="flex items-center gap-2">
                <UserAvatar user={creator} size="sm" />
                <span className="font-medium text-foreground">{creator?.name || "Chưa rõ"}</span>
                <span className="text-muted-foreground">({creator?.title})</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground font-medium">Người thực hiện:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {assignees.length === 0 ? (
                  <span className="text-muted-foreground italic">Chưa giao cho ai</span>
                ) : (
                  assignees.map((u) => (
                    <div key={u!.id} className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-md border border-border/60">
                      <UserAvatar user={u} size="sm" />
                      <span className="font-medium text-foreground">{u!.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground font-medium">Hạn hoàn thành:</span>
              <div
                className={cn(
                  "flex items-center gap-1.5 font-medium",
                  overdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-foreground"
                )}
              >
                <Calendar className="h-4 w-4" />
                <span>{formatDate(activeTask.dueDate, "EEEE, dd/MM/yyyy")}</span>
                {overdue && (
                  <Badge variant="destructive" className="text-[10px] h-4.5 px-1.5 ml-1">
                    Trễ hạn
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground font-medium">Ngày khởi tạo:</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDateTime(activeTask.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Mô tả chi tiết công việc
            </h4>
            <div className="p-4 rounded-xl border border-border/80 bg-card text-sm leading-relaxed whitespace-pre-line text-foreground/90">
              {activeTask.description || "Không có mô tả chi tiết."}
            </div>
          </div>

          {/* Checklist */}
          {(() => {
            const completedCount = activeTask.checklist.filter((i) => i.isCompleted).length;
            const totalCount = activeTask.checklist.length;
            const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            const handleAddChecklist = async (e?: React.FormEvent) => {
              if (e) e.preventDefault();
              if (!newChecklistTitle.trim()) return;
              const newItem = {
                id: `chk-${Date.now()}`,
                title: newChecklistTitle.trim(),
                isCompleted: false,
              };
              await updateTask(activeTask.id, {
                checklist: [...activeTask.checklist, newItem],
              });
              setNewChecklistTitle("");
              toast.success("Đã thêm hạng mục công việc con");
            };

            const handleDeleteChecklist = async (itemId: string) => {
              await updateTask(activeTask.id, {
                checklist: activeTask.checklist.filter((i) => i.id !== itemId),
              });
              toast.info("Đã xóa hạng mục công việc con");
            };

            return (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Danh sách hạng mục công việc (Checklist)</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary font-mono">{percent}%</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      ({completedCount} / {totalCount} hoàn tất)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      percent === 100 ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="space-y-1.5 rounded-xl border border-border/80 p-3 bg-card shadow-2xs">
                  {activeTask.checklist.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-2">
                      Chưa có hạng mục công việc con nào.
                    </p>
                  ) : (
                    activeTask.checklist.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors select-none"
                      >
                        <label className="flex items-start gap-3 flex-1 cursor-pointer">
                          <Checkbox
                            checked={item.isCompleted}
                            onCheckedChange={() => toggleChecklistItem(activeTask.id, item.id)}
                            className="mt-0.5"
                          />
                          <span
                            className={cn(
                              "text-sm text-foreground leading-snug",
                              item.isCompleted && "line-through text-muted-foreground opacity-70"
                            )}
                          >
                            {item.title}
                          </span>
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteChecklist(item.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa hạng mục"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}

                  {/* Inline Add Checklist Input */}
                  <form onSubmit={handleAddChecklist} className="flex items-center gap-2 pt-2 mt-1 border-t border-border/60">
                    <Input
                      placeholder="Thêm hạng mục công việc con mới..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      className="h-8 text-xs bg-background/60"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs px-3 gap-1 shrink-0 rounded-lg hover:bg-primary/5"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      <span>Thêm</span>
                    </Button>
                  </form>
                </div>
              </div>
            );
          })()}

          {/* Comments & Discussion */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Trao đổi & Bình luận ({mockComments.length})</span>
            </h4>

            {/* Existing comments */}
            <div className="space-y-3 mb-4">
              {mockComments.map((cmt) => (
                <div key={cmt.id} className="flex gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {cmt.authorName[0]}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{cmt.authorName}</span>
                      <span className="text-[10px] text-muted-foreground">{cmt.time}</span>
                    </div>
                    <p className="text-foreground/90">{cmt.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                placeholder="Nhập nội dung trao đổi hoặc cập nhật tiến độ..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
              <Button type="submit" size="sm" className="h-9 px-3 gap-1 rounded-xl shrink-0">
                <Send className="h-3.5 w-3.5" />
                <span>Gửi</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Action Footer with Workflow Actions */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Delete task if permitted */}
          <div>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 text-xs h-8.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa task</span>
              </Button>
            )}
          </div>

          {/* Right: State workflow action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* If Task is PENDING_APPROVAL */}
            {activeTask.status === "PENDING_APPROVAL" && isManagerOrAdmin && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  className="gap-1.5 h-8.5 text-xs"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Từ chối</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApprove}
                  className="gap-1.5 h-8.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Duyệt công việc</span>
                </Button>
              </>
            )}

            {/* If Task is TODO and assignee */}
            {activeTask.status === "TODO" && (
              <Button
                size="sm"
                onClick={() => handleQuickStatusChange("IN_PROGRESS")}
                className="gap-1.5 h-8.5 text-xs"
              >
                <span>Bắt đầu thực hiện</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* If Task is IN_PROGRESS and assignee */}
            {activeTask.status === "IN_PROGRESS" && (
              <Button
                size="sm"
                onClick={() => handleQuickStatusChange("IN_REVIEW")}
                className="gap-1.5 h-8.5 text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                <span>Gửi nghiệm thu (Review)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* If Task is IN_REVIEW and manager */}
            {activeTask.status === "IN_REVIEW" && isManagerOrAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickStatusChange("IN_PROGRESS")}
                  className="gap-1.5 h-8.5 text-xs"
                >
                  <span>Yêu cầu sửa đổi</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleQuickStatusChange("DONE")}
                  className="gap-1.5 h-8.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Nghiệm thu hoàn thành</span>
                </Button>
              </>
            )}

            {/* Nếu task đã đóng (CANCELLED): Nút mở lại công việc (Reopen) */}
            {activeTask.status === "CANCELLED" && (
              <Button
                size="sm"
                onClick={handleReopen}
                className="gap-1.5 h-8.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Mở lại công việc (Reopen)</span>
              </Button>
            )}

            {/* Nút Đóng task chuẩn Jira (Won't Fix / Not a Bug / Duplicate): hiển thị khi task chưa đóng */}
            {activeTask.status !== "CANCELLED" && activeTask.status !== "DONE" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCloseModalOpen(true)}
                className="gap-1.5 h-8.5 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                title="Đóng task nếu phát hiện không phải bug, trùng lặp hoặc không cần fix nữa"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Đóng task (Won&apos;t Fix)</span>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={closeDetail} className="h-8.5 text-xs">
              Đóng cửa sổ
            </Button>
          </div>
        </div>

        {/* Modal Chọn Resolution Chuẩn Jira khi Đóng Task */}
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

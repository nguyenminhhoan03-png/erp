"use client";

import * as React from "react";
import {
  MessageSquare,
  Send,
  Trash2,
  RefreshCw,
  Sparkles,
  CornerDownRight,
  Loader2,
} from "lucide-react";
import { Task, TaskComment } from "../../types";
import { useUserStore } from "@/shared/store/useUserStore";
import { useNotificationStore } from "@/shared/store/useNotificationStore";
import { taskService } from "../../services/taskService";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskCommentsSectionProps {
  task: Task;
}

interface LocalComment extends TaskComment {
  isOptimistic?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 30) return "Vừa xong";
    if (diffSec < 60) return `${diffSec} giây trước`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Date(dateStr).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "Vừa xong";
  }
}

export function TaskCommentsSection({ task }: TaskCommentsSectionProps) {
  const { currentUser, getUserById } = useUserStore();
  const { addNotification } = useNotificationStore();

  const [comments, setComments] = React.useState<LocalComment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Initial fetch
  const fetchComments = React.useCallback(
    async (isBackground = false) => {
      if (!task?.id) return;
      if (!isBackground) setIsLoading(true);
      else setIsSyncing(true);

      try {
        const fetched = await taskService.getComments(task.id);
        setComments((prev) => {
          // Keep any optimistic comments still being submitted
          const optimistic = prev.filter((p) => p.isOptimistic);
          const merged = [...fetched, ...optimistic];
          // Deduplicate by id
          const seen = new Set<string>();
          return merged.filter((c) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });
        });
        setLastSyncedAt(new Date());
      } catch (err) {
        if (!isBackground) {
          toast.error("Không thể tải danh sách bình luận");
        }
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [task?.id]
  );

  React.useEffect(() => {
    fetchComments();

    // Jira-style real-time polling every 10 seconds while modal is active
    const timer = setInterval(() => {
      fetchComments(true);
    }, 10000);

    return () => clearInterval(timer);
  }, [fetchComments]);

  // Handle send comment
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = newComment.trim();
    if (!content || !task?.id || isSubmitting) return;

    const tempId = `optimistic-${Date.now()}`;
    const optimisticComment: LocalComment = {
      id: tempId,
      taskId: task.id,
      authorId: currentUser.id,
      author: currentUser,
      content,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic UI update
    setComments((prev) => [optimisticComment, ...prev]);
    setNewComment("");
    setIsSubmitting(true);

    try {
      const savedComment = await taskService.addComment(task.id, content);

      // Replace optimistic comment with saved comment
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...savedComment, isOptimistic: false } : c))
      );

      // Trigger bell notification for user activity
      addNotification({
        type: "comment",
        title: "Bình luận mới",
        message: `Bạn vừa trao đổi về ${task.code}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
        taskId: task.id,
        taskCode: task.code,
        taskTitle: task.title,
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
      });

      toast.success("Đã đăng bình luận");
    } catch {
      toast.error("Không thể gửi bình luận, vui lòng thử lại.");
      // Rollback optimistic item
      setComments((prev) => prev.filter((c) => c.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Delete comment
  const handleDelete = async (commentId: string) => {
    try {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await taskService.deleteComment(task.id, commentId);
      toast.success("Đã xóa bình luận");
    } catch {
      toast.error("Lỗi khi xóa bình luận");
      fetchComments();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          <span>Trao đổi & Bình luận ({comments.length})</span>
        </h4>
      </div>

      {/* Input box */}
      <div className="p-3 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2.5 focus-within:border-primary/50 transition-colors">
        <div className="flex items-start gap-2.5">
          <UserAvatar user={currentUser} size="sm" className="h-6 w-6 mt-1 shrink-0" />
          <Textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Viết bình luận, phản hồi tiến độ hoặc ghi chú... (Ctrl + Enter để gửi)"
            rows={2}
            className="min-h-[64px] text-xs resize-none border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none leading-relaxed placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline text-muted-foreground/70">
            Mẹo: Nhấn <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Enter</kbd> để gửi nhanh
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {newComment.trim() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNewComment("")}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Hủy
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={!newComment.trim() || isSubmitting}
              className="h-7 px-3 text-xs gap-1.5 rounded-lg cursor-pointer font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              <span>{isSubmitting ? "Đang gửi..." : "Gửi"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading && comments.length === 0 ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Đang tải bình luận...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 px-4 rounded-xl border border-dashed border-border/80 text-center flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground">Chưa có bình luận nào</p>
            <p className="text-[11px] text-muted-foreground">
              Hãy bắt đầu trao đổi hoặc chia sẻ cập nhật đầu tiên cho nhiệm vụ này.
            </p>
          </div>
        ) : (
          comments.map((cmt) => {
            const author = getUserById(cmt.authorId) || cmt.author || {
              id: cmt.authorId,
              name: "Thành viên",
              email: "",
              avatar: "",
              role: "STAFF" as const,
              departmentId: "dept-it",
              title: "Thành viên",
            };

            const isAuthor = String(cmt.authorId) === String(currentUser.id);
            const canDeleteComment = isAuthor || currentUser.role === "ADMIN" || currentUser.role === "MANAGER";

            return (
              <div
                key={cmt.id}
                className={cn(
                  "group p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors text-xs flex gap-3 relative",
                  cmt.isOptimistic && "opacity-70 border-dashed border-primary/40"
                )}
              >
                <UserAvatar user={author} size="sm" className="h-7 w-7 shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground text-xs">
                        {author.name}
                      </span>
                      {isAuthor && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                          Tôi
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        • {formatRelativeTime(cmt.createdAt)}
                      </span>
                      {cmt.isOptimistic && (
                        <span className="text-[10px] text-amber-500 font-medium">
                          (Đang gửi...)
                        </span>
                      )}
                    </div>

                    {canDeleteComment && !cmt.isOptimistic && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cmt.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 p-1 rounded transition-all cursor-pointer"
                        title="Xóa bình luận"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words text-xs">
                    {cmt.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

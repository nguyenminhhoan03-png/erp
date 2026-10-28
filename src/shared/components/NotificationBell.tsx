"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  UserPlus,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useNotificationStore, NotificationFilter } from "../store/useNotificationStore";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { NotificationItem } from "../types/notification";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "Vừa xong";
  }
}

export function NotificationBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationStore();

  const { tasks, openDetail } = useTaskStore();
  const [isOpen, setIsOpen] = React.useState(false);

  // Background polling for notifications every 30s
  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    const handleFocus = () => fetchNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchNotifications]);

  const filteredNotifications = React.useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (filter === "TASK" || filter === "MEETING" || filter === "REPORT") {
      return notifications.filter((n) => n.category === filter);
    }
    return notifications;
  }, [notifications, filter]);

  const counts = React.useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      meeting: notifications.filter((n) => n.category === "MEETING").length,
      task: notifications.filter((n) => n.category === "TASK").length,
      report: notifications.filter((n) => n.category === "REPORT").length,
    };
  }, [notifications]);

  // Scalable Action Dispatcher
  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);

    const action = item.action;
    const taskTarget = item.taskId || item.taskCode || action?.payload?.taskId || action?.payload?.taskCode;

    // 1. If Action is OPEN_TASK or has Task ID/Code
    if (action?.type === "OPEN_TASK" || (!action && taskTarget)) {
      const codeOrId = taskTarget;
      const foundTask = tasks.find(
        (t) => String(t.id) === String(codeOrId) || t.code === codeOrId
      );

      if (foundTask) {
        openDetail(foundTask);
        return;
      }

      if (item.taskId || action?.payload?.taskId) {
        const id = item.taskId || action?.payload?.taskId;
        import("@/lib/api-client").then(({ apiRequest }) => {
          apiRequest<{ success: boolean; data: any }>(`/erp/tasks/${id}`)
            .then((res) => {
              if (res?.data) openDetail(res.data);
            })
            .catch(() => {});
        });
      }
      return;
    }

    // 2. If Action is NAVIGATE to specific page (e.g. /gov-calendar, /daily-report)
    if (action?.url) {
      router.push(action.url);
      return;
    }

    // 3. Fallback based on category
    if (item.category === "MEETING") {
      router.push("/gov-calendar");
    } else if (item.category === "REPORT") {
      router.push("/daily-report");
    }
  };

  const getVisualMeta = (item: NotificationItem) => {
    const rawType = String(item.type || "").toUpperCase();
    if (rawType.includes("CONFLICT") || item.priority === "URGENT") {
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 animate-pulse" />,
        badgeText: "Trùng lịch",
        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      };
    }
    if (item.category === "MEETING" || rawType.includes("MEETING") || rawType.includes("SCHEDULE")) {
      return {
        icon: <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />,
        badgeText: "Lịch họp",
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    }
    if (item.category === "REPORT" || rawType.includes("REPORT")) {
      return {
        icon: <FileText className="h-3.5 w-3.5 text-emerald-500 shrink-0" />,
        badgeText: "Báo cáo",
        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    }
    if (rawType.includes("ASSIGNED") || rawType.includes("PROJECT_MANAGER")) {
      return {
        icon: <UserPlus className="h-3.5 w-3.5 text-emerald-500 shrink-0" />,
        badgeText: "Phân công",
        badgeBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      };
    }
    if (rawType.includes("CANCEL") || rawType.includes("DELETED")) {
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5 text-slate-500 shrink-0" />,
        badgeText: "Hủy bỏ",
        badgeBg: "bg-slate-500/10 text-slate-600 border-slate-500/20",
      };
    }
    if (rawType.includes("PARTNER") || rawType.includes("CUSTOMER") || rawType.includes("CONTACT")) {
      return {
        icon: <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />,
        badgeText: "Khách hàng",
        badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    }
    return {
      icon: <MessageSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />,
      badgeText: "Công việc",
      badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Thông báo hệ thống"
          className={cn(
            "relative p-2 rounded-xl border border-border/60 hover:bg-muted/70 transition-colors cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
            isOpen && "bg-muted text-foreground"
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-[420px] p-0 shadow-2xl rounded-2xl border-border/80 bg-background overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">Trung tâm thông báo</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary font-bold">
                {unreadCount} mới
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-7 text-xs text-muted-foreground hover:text-primary gap-1 px-2 cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Đã đọc tất cả</span>
            </Button>
          )}
        </div>

        {/* Scalable Multi-Module Filters */}
        <div className="px-2.5 py-1.5 border-b border-border/40 flex items-center gap-1 overflow-x-auto bg-background no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0",
              filter === "all"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tất cả ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0",
              filter === "unread"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Chưa đọc ({counts.unread})
          </button>
          <button
            type="button"
            onClick={() => setFilter("MEETING")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1",
              filter === "MEETING"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Lịch họp</span>
            {counts.meeting > 0 && <span className="text-[10px]">({counts.meeting})</span>}
          </button>
          <button
            type="button"
            onClick={() => setFilter("TASK")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1",
              filter === "TASK"
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Công việc</span>
            {counts.task > 0 && <span className="text-[10px]">({counts.task})</span>}
          </button>
          <button
            type="button"
            onClick={() => setFilter("REPORT")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1",
              filter === "REPORT"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Báo cáo</span>
            {counts.report > 0 && <span className="text-[10px]">({counts.report})</span>}
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-border/40">
          {filteredNotifications.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-xs">
                {filter === "unread" ? "Không có thông báo chưa đọc nào." : "Chưa có thông báo nào trong danh mục này."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const meta = getVisualMeta(item);
              const isUrgent = item.priority === "URGENT" || item.type === "MEETING_CONFLICT";

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "p-3.5 flex gap-3 cursor-pointer transition-colors text-xs relative group hover:bg-muted/50",
                    !item.isRead && "bg-primary/5 hover:bg-primary/10",
                    isUrgent && "border-l-2 border-l-rose-500 bg-rose-500/5 hover:bg-rose-500/10"
                  )}
                >
                  <div className="mt-0.5">{meta.icon}</div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground text-xs truncate">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-medium px-1.5 py-0.2 rounded-full border",
                            meta.badgeBg
                          )}
                        >
                          {meta.badgeText}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[11px]">
                      {item.message}
                    </p>

                    {item.taskCode && (
                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                          {item.taskCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {!item.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

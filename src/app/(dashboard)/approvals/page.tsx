"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  ShieldAlert,
  FileCheck2,
} from "lucide-react";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatDate } from "@/lib/date";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const { tasks, fetchTasks, approveTask, rejectTask, openDetail } = useTaskStore();
  const { currentUser, getUserById, departments } = useUserStore();

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Lọc danh sách task chờ duyệt theo quyền:
  // - Admin: thấy toàn bộ task PENDING_APPROVAL
  // - Manager: thấy task PENDING_APPROVAL trong phòng ban của mình
  // - Employee: chỉ thấy task do chính mình tạo đang chờ sếp duyệt
  const pendingTasks = tasks.filter((t) => {
    if (t.status !== "PENDING_APPROVAL") return false;
    if (currentUser.role === "ADMIN") return true;
    if (currentUser.role === "MANAGER") return t.departmentId === currentUser.departmentId;
    return t.creatorId === currentUser.id;
  });

  const isManagerOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "MANAGER";

  const handleApprove = async (taskId: string, title: string) => {
    const res = await approveTask(taskId, currentUser);
    if (res.success) {
      toast.success("Đã phê duyệt công việc!", {
        description: `Task "${title}" đã được đưa vào cột 'Cần làm'.`,
      });
    } else {
      toast.error(res.reason || "Lỗi phê duyệt");
    }
  };

  const handleReject = async (taskId: string, title: string) => {
    const res = await rejectTask(taskId, currentUser);
    if (res.success) {
      toast.info("Đã từ chối công việc", {
        description: `Task "${title}" đã bị từ chối và chuyển sang 'Đã hủy'.`,
      });
    } else {
      toast.error(res.reason || "Lỗi từ chối");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <FileCheck2 className="h-6 w-6 text-primary" />
          <span>Duyệt & Phê duyệt Công việc</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isManagerOrAdmin
            ? "Danh sách các đề xuất công việc do nhân viên khởi tạo cần Trưởng phòng hoặc Ban Giám Đốc xét duyệt."
            : "Theo dõi trạng thái các đề xuất công việc của bạn đang chờ cấp trên phê duyệt."}
        </p>
      </div>

      {pendingTasks.length === 0 ? (
        <EmptyState
          title="Không có công việc nào chờ duyệt"
          description={
            isManagerOrAdmin
              ? "Tuyệt vời! Tất cả đề xuất công việc trong phòng ban đều đã được xử lý."
              : "Bạn hiện không có đề xuất công việc nào đang chờ duyệt."
          }
          icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
        />
      ) : (
        <div className="space-y-3">
          {pendingTasks.map((task) => {
            const creator = getUserById(task.creatorId);
            const dept = departments.find((d) => d.id === task.departmentId);

            return (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all shadow-2xs"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {task.code}
                    </span>
                    {dept && (
                      <Badge variant="outline" className="text-[10px]">
                        {dept.name}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Gửi lúc: {formatDate(task.createdAt, "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>

                  <h4
                    onClick={() => openDetail(task)}
                    className="text-base font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {task.title}
                  </h4>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Người đề xuất:</span>
                      <UserAvatar user={creator} size="sm" />
                      <span className="font-medium text-foreground">{creator?.name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Hạn đề xuất: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetail(task)}
                    className="text-xs h-8.5"
                  >
                    Xem chi tiết
                  </Button>

                  {isManagerOrAdmin && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(task.id, task.title)}
                        className="gap-1 text-xs h-8.5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Từ chối</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(task.id, task.title)}
                        className="gap-1 text-xs h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Phê duyệt</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

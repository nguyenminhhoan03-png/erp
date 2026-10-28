"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Calendar,
  ListTodo,
  CalendarClock,
  ChevronRight,
  FolderKanban,
  KanbanSquare,
  FileSpreadsheet,
  MapPin,
  Flame,
  Building2,
  Landmark,
  Cpu,
} from "lucide-react";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/modules/tasks/constants";
import { TaskDialog } from "@/modules/tasks/components/TaskDialog";
import { TaskFormDialog } from "@/modules/tasks/components/TaskFormDialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatDate, isOverdue } from "@/lib/date";
import { reportService } from "@/modules/tasks/services/reportService";
import { DailyReport, Task } from "@/modules/tasks/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { tasks, fetchTasks, openDetail, projects: taskProjects, statuses: taskStatuses } = useTaskStore();
  const { currentUser, departments } = useUserStore();
  const {
    solutions,
    projects,
    meetings,
    fetchInitial: fetchGovInitial,
  } = useGovStore();

  const [todayReport, setTodayReport] = React.useState<DailyReport | null>(null);
  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  React.useEffect(() => {
    fetchTasks();
    fetchGovInitial();
    reportService
      .getReportByUserAndDate(currentUser.id, todayStr)
      .then(setTodayReport)
      .catch(() => setTodayReport(null));
  }, [fetchTasks, currentUser, todayStr, fetchGovInitial]);

  const userTasks = React.useMemo(() => {
    if (currentUser.role === "ADMIN") return tasks;
    if (currentUser.role === "MANAGER") {
      return tasks.filter((t) => t.departmentId === currentUser.departmentId);
    }
    return tasks.filter((t) => (t.assigneeIds || []).includes(currentUser.id));
  }, [tasks, currentUser]);

  const isTaskClosed = React.useCallback(
    (t: Task) => Boolean(t.closedAt) || t.status === "DONE" || taskStatuses?.find((s) => s.key === t.status)?.category === "DONE",
    [taskStatuses]
  );
  const doneTasks = userTasks.filter((t) => isTaskClosed(t));
  const activeTasks = userTasks.filter((t) => !isTaskClosed(t));
  const urgentOrOverdue = userTasks.filter(
    (t) => (t.priority === "URGENT" || isOverdue(t.dueDate, t.status, t.closedAt)) && !isTaskClosed(t)
  );
  const completionRate = userTasks.length > 0 ? Math.round((doneTasks.length / userTasks.length) * 100) : 0;

  const upcomingMeetings = React.useMemo(() => {
    return [...meetings]
      .filter((m) => m.status === "UPCOMING")
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, 4);
  }, [meetings]);

  const priorityTasks = React.useMemo(() => {
    return [...userTasks]
      .filter((t) => !isTaskClosed(t))
      .sort((a, b) => {
        const aOverdue = isOverdue(a.dueDate, a.status, a.closedAt) ? 1 : 0;
        const bOverdue = isOverdue(b.dueDate, b.status, b.closedAt) ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        const orderMap = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return orderMap[b.priority] - orderMap[a.priority];
      })
      .slice(0, 6);
  }, [userTasks, isTaskClosed]);

  const getProjectInfo = React.useCallback((projectId?: string) => {
    const fallback = taskProjects[0] || { id: "0", key: "ERP", name: "Dự án chung", category: "INTERNAL", badgeBg: "bg-muted", badgeText: "text-muted-foreground" };
    if (!projectId) return fallback;
    return taskProjects.find((p) => p.id === projectId) || fallback;
  }, [taskProjects]);

  return (
    <div className="space-y-5 w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Tổng quan hệ thống</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xin chào, <strong className="text-foreground">{currentUser.name}</strong> • Hôm nay là {formatDate(new Date(), "EEEE, dd/MM/yyyy")}
          </p>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Active Tasks */}
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Việc đang xử lý</span>
            <span className="p-1 rounded-md bg-muted text-foreground/70">
              <ListTodo className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{activeTasks.length}</span>
            <span className="text-[11px] text-muted-foreground">/ {userTasks.length} nhiệm vụ</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
            <span>Hoàn thành:</span>
            <span className="font-semibold text-foreground">{completionRate}%</span>
          </div>
        </div>

        {/* Card 2: Urgent / Overdue */}
        <div className={cn(
          "p-4 rounded-xl border shadow-2xs flex flex-col justify-between",
          urgentOrOverdue.length > 0 ? "border-rose-500/30 bg-rose-500/[0.03]" : "border-border/80 bg-card"
        )}>
          <div className="flex items-center justify-between">
            <span className={cn("text-xs font-medium", urgentOrOverdue.length > 0 ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground")}>
              Khẩn cấp / Quá hạn
            </span>
            <span className={cn("p-1 rounded-md", urgentOrOverdue.length > 0 ? "bg-rose-500/15 text-rose-600" : "bg-muted text-muted-foreground")}>
              <Flame className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={cn("text-2xl font-bold", urgentOrOverdue.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
              {urgentOrOverdue.length}
            </span>
            <span className="text-[11px] text-muted-foreground">cần xử lý ngay</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {urgentOrOverdue.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">Ưu tiên xử lý hôm nay</span>
            ) : (
              <span>Không có việc quá hạn</span>
            )}
          </div>
        </div>

        {/* Card 3: Projects */}
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Dự án theo dõi</span>
            <span className="p-1 rounded-md bg-muted text-foreground/70">
              <FolderKanban className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{solutions.length}</span>
            <Link href="/projects" className="text-[11px] text-primary hover:underline font-medium">
              Xem tất cả ➔
            </Link>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span>CĐS: {solutions.filter(s => s.category === "GOV").length}</span>
            <span>•</span>
            <span>Nội bộ: {solutions.filter(s => s.category === "INTERNAL").length}</span>
            <span>•</span>
            <span>Outsource: {solutions.filter(s => s.category === "OUTSOURCE").length}</span>
          </div>
        </div>

        {/* Card 4: Daily Report */}
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Báo cáo ngày</span>
            <span className="p-1 rounded-md bg-muted text-foreground/70">
              <Calendar className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-sm font-bold">
              {todayReport?.status === "SUBMITTED" ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã nộp đầy đủ
                </span>
              ) : todayReport?.status === "DRAFT" ? (
                <span className="text-amber-600 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Đang lưu nháp
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Chưa nộp hôm nay
                </span>
              )}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatDate(todayStr, "dd/MM/yyyy")}</span>
            <Link href="/daily-report" className="text-primary hover:underline font-medium">
              Khai báo ➔
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Tasks & Projects (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Priority Tasks */}
          <div className="rounded-xl border border-border/80 bg-card p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  Nhiệm vụ ưu tiên cần tập trung
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {priorityTasks.length}
                </Badge>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>Xem Kanban Board</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {priorityTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  Không có nhiệm vụ nào bị quá hạn hoặc khẩn cấp.
                </div>
              ) : (
                priorityTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status, task.closedAt);
                  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
                  const statusCfg = TASK_STATUS_CONFIG[task.status];
                  const statusDef = taskStatuses?.find((s) => s.key === task.status);
                  const statusLabel = statusDef?.name || statusCfg?.label || task.status;
                  const projInfo = getProjectInfo(task.projectId);

                  return (
                    <div
                      key={task.id}
                      onClick={() => openDetail(task)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg border border-border/70 hover:border-primary/40 bg-muted/15 hover:bg-muted/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-primary shrink-0 group-hover:underline">
                          {task.code}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="truncate max-w-[140px] font-medium text-foreground/80">{projInfo.name}</span>
                            <span>•</span>
                            <span className={cn(overdue && "text-rose-600 font-semibold")}>
                              Hạn: {formatDate(task.dueDate, "dd/MM")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 font-medium", priorityCfg.badgeBg, priorityCfg.badgeText)}
                        >
                          {priorityCfg.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-medium text-muted-foreground bg-muted/60"
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clean Projects Overview */}
          <div className="rounded-xl border border-border/80 bg-card p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Khối dự án đang vận hành
              </span>
              <Link
                href="/projects"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>Xem danh sách</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* GOV */}
              <Link
                href="/projects"
                className="p-3 rounded-lg border border-border/70 hover:border-primary/50 bg-muted/10 hover:bg-muted/30 transition-all space-y-1 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Landmark className="h-3.5 w-3.5 text-blue-600" />
                    <span>Chính quyền CĐS</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {solutions.filter(s => s.category === "GOV").length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">34 Tỉnh/Thành mục tiêu</p>
              </Link>

              {/* INTERNAL */}
              <Link
                href="/projects"
                className="p-3 rounded-lg border border-border/70 hover:border-primary/50 bg-muted/10 hover:bg-muted/30 transition-all space-y-1 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Cpu className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Nội bộ công ty</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {solutions.filter(s => s.category === "INTERNAL").length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Phần mềm & hạ tầng IGB</p>
              </Link>

              {/* OUTSOURCE */}
              <Link
                href="/projects"
                className="p-3 rounded-lg border border-border/70 hover:border-primary/50 bg-muted/10 hover:bg-muted/30 transition-all space-y-1 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Building2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>Outsource Đối tác</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {solutions.filter(s => s.category === "OUTSOURCE").length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Hợp đồng B2B khách hàng</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Meetings & Quick Navigation (1/3) */}
        <div className="space-y-5">
          {/* Upcoming Meetings */}
          <div className="rounded-xl border border-border/80 bg-card p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                <span>Lịch hẹn & Sự kiện sắp tới</span>
              </span>
              <Link
                href="/gov-calendar"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Xem lịch</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingMeetings.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  Chưa có lịch hẹn nào sắp tới.
                </div>
              ) : (
                upcomingMeetings.map((m) => {
                  const [datePart = "", timePart = ""] = (m.scheduledAt || "").replace("T", " ").split(" ");
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg border border-border/70 hover:border-primary/40 bg-muted/15 transition-all text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground truncate max-w-[140px] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{m.provinceName || "Nội bộ"}</span>
                        </span>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground">
                          {timePart.slice(0, 5)} • {formatDate(datePart, "dd/MM")}
                        </span>
                      </div>

                      <p className="font-medium text-foreground line-clamp-1 text-xs">
                        {m.title || m.content}
                      </p>

                      <div className="text-[10.5px] text-muted-foreground truncate">
                        {m.location || (m.meetingType === "ONLINE" ? "Trực tuyến" : "Văn phòng")}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Access */}
          <div className="rounded-xl border border-border/80 bg-card p-4.5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-foreground">
              Truy cập nhanh
            </span>

            <div className="space-y-2">
              <Link
                href="/tasks"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-all text-xs group"
              >
                <div className="flex items-center gap-2">
                  <KanbanSquare className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Bảng việc Kanban
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {tasks.length}
                </Badge>
              </Link>

              <Link
                href="/gov-calendar"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-all text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Lịch công tác & Sự kiện
                  </span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/daily-report"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-all text-xs group"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Báo cáo ngày
                  </span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <TaskDialog />
      <TaskFormDialog />
    </div>
  );
}

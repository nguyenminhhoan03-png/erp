"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  KanbanSquare,
  FileSpreadsheet,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  Send,
  Calendar,
  Sparkles,
  Flame,
  ShieldCheck,
  ListTodo,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/modules/tasks/constants";
import { TaskDialog } from "@/modules/tasks/components/TaskDialog";
import { TaskFormDialog } from "@/modules/tasks/components/TaskFormDialog";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatDate, isOverdue } from "@/lib/date";
import { reportService } from "@/modules/tasks/services/reportService";
import { DailyReport, Task } from "@/modules/tasks/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { tasks, fetchTasks, openDetail, openCreate, approveTask } = useTaskStore();
  const { currentUser, getUserById } = useUserStore();
  const [mounted, setMounted] = React.useState(false);
  const [todayReport, setTodayReport] = React.useState<DailyReport | null>(null);

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  React.useEffect(() => {
    setMounted(true);
    fetchTasks();
    reportService
      .getReportByUserAndDate(currentUser.id, todayStr)
      .then(setTodayReport)
      .catch(() => setTodayReport(null));
  }, [fetchTasks, currentUser, todayStr]);

  // Lọc dữ liệu theo phạm vi vai trò
  const userTasks = React.useMemo(() => {
    if (currentUser.role === "ADMIN") return tasks;
    if (currentUser.role === "MANAGER") {
      return tasks.filter((t) => t.departmentId === currentUser.departmentId);
    }
    return tasks.filter((t) => t.assigneeIds.includes(currentUser.id));
  }, [tasks, currentUser]);

  const dept = MOCK_DEPARTMENTS.find((d) => d.id === currentUser.departmentId);

  // Số liệu KPI
  const activeTasks = userTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "TODO");
  const urgentOrOverdue = userTasks.filter(
    (t) => (t.priority === "URGENT" || isOverdue(t.dueDate, t.status)) && t.status !== "DONE"
  );
  const pendingApprovals = tasks.filter((t) => {
    if (t.status !== "PENDING_APPROVAL") return false;
    if (currentUser.role === "ADMIN") return true;
    if (currentUser.role === "MANAGER") return t.departmentId === currentUser.departmentId;
    return t.creatorId === currentUser.id;
  });
  const doneTasks = userTasks.filter((t) => t.status === "DONE");
  const completionRate = userTasks.length > 0 ? Math.round((doneTasks.length / userTasks.length) * 100) : 0;

  // Dữ liệu biểu đồ trạng thái (Donut Chart)
  const statusChartData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    userTasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });

    return Object.entries(counts).map(([stKey, count]) => {
      const cfg = TASK_STATUS_CONFIG[stKey as keyof typeof TASK_STATUS_CONFIG];
      return {
        name: cfg?.label || stKey,
        value: count,
        color: cfg?.color || "#94a3b8",
      };
    });
  }, [userTasks]);

  // Dữ liệu xu hướng tuần
  const weeklyTrends = [
    { name: "T2", done: 6, target: 8 },
    { name: "T3", done: 9, target: 8 },
    { name: "T4", done: 12, target: 10 },
    { name: "T5", done: 15, target: 12 },
    { name: "T6", done: Math.max(doneTasks.length, 14), target: 15 },
    { name: "T7", done: 4, target: 5 },
  ];

  // Danh sách công việc ưu tiên cần làm gấp (Top 5)
  const priorityTasks = React.useMemo(() => {
    return [...userTasks]
      .filter((t) => t.status !== "DONE" && t.status !== "CANCELLED")
      .sort((a, b) => {
        const aOverdue = isOverdue(a.dueDate, a.status) ? 1 : 0;
        const bOverdue = isOverdue(b.dueDate, b.status) ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        const orderMap = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return orderMap[b.priority] - orderMap[a.priority];
      })
      .slice(0, 5);
  }, [userTasks]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* 1. WELCOME BANNER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/15">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              {currentUser.role === "ADMIN" ? "Quản trị viên Hệ thống" : currentUser.role === "MANAGER" ? "Trưởng phòng" : "Nhân viên"}
            </span>
            <span className="text-xs text-white/80">•</span>
            <span className="text-xs text-white/90 font-medium">
              {currentUser.role === "ADMIN" ? "Toàn công ty" : dept?.name}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Chào mừng trở lại, {currentUser.name}! 👋
          </h2>
          <p className="text-xs text-white/80 max-w-xl">
            Hôm nay là {formatDate(new Date(), "EEEE, dd/MM/yyyy")}. Bạn có{" "}
            <strong>{urgentOrOverdue.length} việc cần chú ý gấp</strong> và{" "}
            <strong>{activeTasks.length} nhiệm vụ</strong> đang trong tiến trình xử lý.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={openCreate}
            size="sm"
            className="h-10 px-4 bg-white text-blue-700 hover:bg-white/90 font-semibold rounded-xl shadow-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo việc mới</span>
          </Button>

          <Link href="/daily-report">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl gap-1.5 backdrop-blur-xs"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Báo cáo ngày</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Đang thực hiện */}
        <div className="rounded-2xl border border-border/80 bg-card p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đang xử lý</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{activeTasks.length}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
            <span>Cần làm & Đang làm</span>
          </div>
        </div>

        {/* KPI 2: Khẩn cấp & Quá hạn */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Khẩn cấp & Quá hạn
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center animate-pulse">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {urgentOrOverdue.length}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600/80 font-medium mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>Cần ưu tiên xử lý trước</span>
          </div>
        </div>

        {/* KPI 3: Chờ duyệt (hoặc Hoàn thành) */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {currentUser.role === "EMPLOYEE" ? "Đã nghiệm thu" : "Đề xuất chờ duyệt"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              {currentUser.role === "EMPLOYEE" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <FileCheck2 className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-2">
            {currentUser.role === "EMPLOYEE" ? doneTasks.length : pendingApprovals.length}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-600/90 mt-1">
            {currentUser.role === "EMPLOYEE" ? (
              <span>Tỷ lệ hoàn thành: {completionRate}%</span>
            ) : (
              <Link href="/approvals" className="hover:underline flex items-center gap-1">
                <span>Vào trang phê duyệt</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* KPI 4: Trạng thái báo cáo hôm nay */}
        <div className="rounded-2xl border border-border/80 bg-card p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Báo cáo ngày hôm nay</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-base font-bold mt-2">
            {todayReport?.status === "SUBMITTED" ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" />
                Đã nộp đầy đủ
              </span>
            ) : todayReport?.status === "DRAFT" ? (
              <span className="text-amber-600 flex items-center gap-1.5">
                <Clock className="h-5 w-5" />
                Đang lưu nháp
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="h-5 w-5" />
                Chưa nộp hôm nay
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-border/50">
            <span className="text-muted-foreground">{formatDate(todayStr, "dd/MM/yyyy")}</span>
            <Link href="/daily-report" className="text-primary hover:underline font-semibold">
              Khai báo ➔
            </Link>
          </div>
        </div>
      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Tiến độ nghiệm thu công việc trong tuần
              </h3>
              <p className="text-xs text-muted-foreground">
                So sánh số task hoàn thành thực tế và mục tiêu cam kết
              </p>
            </div>
            <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-300">
              <TrendingUp className="h-3 w-3" />
              <span>+18% so với tuần trước</span>
            </Badge>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrends}>
                  <defs>
                    <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="done"
                    name="Task hoàn thành"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#dashboardArea)"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Chỉ tiêu kế hoạch"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-muted/20 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
                Đang chuẩn bị biểu đồ tiến độ...
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Donut Chart (1 col) */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col">
          <h3 className="text-sm font-bold text-foreground mb-1">
            Phân bổ trạng thái công việc
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            Tổng cộng: {userTasks.length} nhiệm vụ
          </p>

          <div className="flex-1 h-56 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-muted/20 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
                Đang tải phân bổ trạng thái...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. WORKFLOW FOCUS: TOP PRIORITY TASKS & PENDING ACTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Nhiệm vụ cần ưu tiên hôm nay */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm font-bold text-foreground">
                Nhiệm vụ trọng tâm cần tập trung hôm nay
              </h3>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Xem bảng Kanban</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {priorityTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Tuyệt vời! Không có nhiệm vụ nào bị quá hạn hoặc khẩn cấp lúc này.
              </div>
            ) : (
              priorityTasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
                const statusCfg = TASK_STATUS_CONFIG[task.status];
                const taskDept = MOCK_DEPARTMENTS.find((d) => d.id === task.departmentId);

                return (
                  <div
                    key={task.id}
                    onClick={() => openDetail(task)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/70 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                        {task.code}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {taskDept && <span>{taskDept.code}</span>}
                          <span>•</span>
                          <span
                            className={cn(
                              "font-medium",
                              overdue && "text-rose-600 dark:text-rose-400 font-bold"
                            )}
                          >
                            Hạn: {formatDate(task.dueDate, "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0.5 font-semibold", priorityCfg.badgeBg, priorityCfg.badgeText)}
                      >
                        {priorityCfg.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0.5 font-medium", statusCfg.badgeBg, statusCfg.badgeText)}
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (1 col): Approvals Quick Action / System Activity */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-amber-500" />
                <span>
                  {currentUser.role === "EMPLOYEE" ? "Đề xuất của bạn" : "Chờ xét duyệt"}
                </span>
              </h3>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {pendingApprovals.length}
              </Badge>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl my-4">
                Không có đề xuất nào đang chờ xử lý.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openDetail(item)}
                    className="p-3 rounded-xl border border-border/70 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                        {item.code}
                      </span>
                      <span className="text-muted-foreground">{formatDate(item.createdAt, "dd/MM")}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{item.title}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Người tạo: {getUserById(item.creatorId)?.name || "Nhân viên"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/70 mt-4">
            <Link href={currentUser.role === "EMPLOYEE" ? "/tasks" : "/approvals"}>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 rounded-xl">
                <span>{currentUser.role === "EMPLOYEE" ? "Xem tất cả task" : "Quản lý hàng đợi duyệt"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Detail Dialog & Create Dialog */}
      <TaskDialog />
      <TaskFormDialog />
    </div>
  );
}

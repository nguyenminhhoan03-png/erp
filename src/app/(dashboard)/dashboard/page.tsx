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
  Building2,
  Globe,
  Compass,
  Award,
  Rocket,
  Users,
  ChevronRight,
  MapPin,
  CalendarClock,
  Briefcase,
  ExternalLink,
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
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { GOV_STAGES } from "@/modules/gov-solutions/constants";
import { GovStage } from "@/modules/gov-solutions/types";
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
  const { tasks, fetchTasks, openDetail, openCreate, projects: taskProjects } = useTaskStore();
  const { currentUser, getUserById, departments } = useUserStore();
  const {
    projects,
    meetings,
    solutions,
    activeSolutionId,
    setActiveSolutionId,
    getActiveSolution,
    fetchInitial: fetchGovInitial,
  } = useGovStore();

  const [mounted, setMounted] = React.useState(false);
  const [todayReport, setTodayReport] = React.useState<DailyReport | null>(null);

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  React.useEffect(() => {
    setMounted(true);
    fetchTasks();
    fetchGovInitial();
    reportService
      .getReportByUserAndDate(currentUser.id, todayStr)
      .then(setTodayReport)
      .catch(() => setTodayReport(null));
  }, [fetchTasks, currentUser, todayStr, fetchGovInitial]);

  // Lọc task theo vai trò
  const userTasks = React.useMemo(() => {
    if (currentUser.role === "ADMIN") return tasks;
    if (currentUser.role === "MANAGER") {
      return tasks.filter((t) => t.departmentId === currentUser.departmentId);
    }
    return tasks.filter((t) => t.assigneeIds.includes(currentUser.id));
  }, [tasks, currentUser]);

  const dept = departments.find((d) => d.id === currentUser.departmentId);

  // Số liệu Vận hành Nội bộ (Operational Task KPIs)
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

  // Số liệu Chiến lược B2G (34 Tỉnh thành CĐS Quốc Gia)
  const activeSolution = getActiveSolution();
  const currentSolutionProjects = React.useMemo(() => {
    return projects.filter((p) => !activeSolutionId || p.solutionId === activeSolutionId);
  }, [projects, activeSolutionId]);

  const govTotalCount = currentSolutionProjects.length;
  const govDispatchedCount = currentSolutionProjects.filter((p) => p.stage !== "NOT_STARTED").length;
  const govWorkedWithCount = React.useMemo(() => {
    return currentSolutionProjects.filter((p) =>
      ["MOU_SIGNED", "SPONSOR_AGREED", "DATA_COLLECT", "DEPLOYING", "COMPLETED"].includes(p.stage)
    ).length;
  }, [currentSolutionProjects]);
  const govDeployingCount = React.useMemo(() => {
    return currentSolutionProjects.filter((p) => p.stage === "DEPLOYING").length;
  }, [currentSolutionProjects]);
  const govCompletedCount = React.useMemo(() => {
    return currentSolutionProjects.filter((p) => p.stage === "COMPLETED").length;
  }, [currentSolutionProjects]);

  // Danh sách tên tỉnh đang thi công / đã nghiệm thu hiển thị động theo giải pháp
  const deployingProvinceNames = React.useMemo(() => {
    const provs = currentSolutionProjects
      .filter((p) => p.stage === "DEPLOYING")
      .map((p) => p.provinceName.replace(/^(Tỉnh|Thành phố)\s+/i, ""));
    if (provs.length === 0) return "Chưa có địa phương thi công";
    return provs.slice(0, 3).join(", ") + (provs.length > 3 ? ` +${provs.length - 3}` : "");
  }, [currentSolutionProjects]);

  const completedProvinceNames = React.useMemo(() => {
    const provs = currentSolutionProjects
      .filter((p) => p.stage === "COMPLETED")
      .map((p) => p.provinceName.replace(/^(Tỉnh|Thành phố)\s+/i, ""));
    if (provs.length === 0) return "Đang trong tiến trình tiếp cận";
    return provs.slice(0, 3).join(", ") + (provs.length > 3 ? ` +${provs.length - 3}` : "");
  }, [currentSolutionProjects]);

  // Đếm theo từng giai đoạn của pipeline 7 bước
  const stageCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    currentSolutionProjects.forEach((p) => {
      counts[p.stage] = (counts[p.stage] || 0) + 1;
    });
    return counts;
  }, [currentSolutionProjects]);

  // Danh sách các cuộc họp tiếp xúc tỉnh sắp tới (Top 3)
  const upcomingMeetings = React.useMemo(() => {
    return [...meetings]
      .filter((m) => m.status === "UPCOMING")
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, 3);
  }, [meetings]);

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

  // Helper lấy thông tin Project cho Task
  const getProjectInfo = React.useCallback((projectId?: string) => {
    const fallback = taskProjects[0] || { id: "ERP_CORE", key: "ERP", name: "Hệ thống ERP Doanh nghiệp", category: "INTERNAL", badgeBg: "bg-blue-500/10", badgeText: "text-blue-600" };
    if (!projectId) return fallback;
    return taskProjects.find((p) => p.id === projectId) || fallback;
  }, [taskProjects]);

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

  // 7 Bước chuẩn Pipeline để hiển thị strip trực quan
  const pipelineStages: GovStage[] = [
    "DISPATCHED",
    "FEEDBACK",
    "MOU_SIGNED",
    "SPONSOR_AGREED",
    "DATA_COLLECT",
    "DEPLOYING",
    "COMPLETED",
  ];

  return (
    <div className="space-y-6 w-full max-w-[1720px] mx-auto pb-10">
      {/* 1. EXECUTIVE WELCOME BANNER & STRATEGIC JUMP BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white shadow-xl shadow-indigo-500/15 border border-white/10 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md flex items-center gap-1.5 border border-white/20">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>
                {currentUser.role === "ADMIN"
                  ? "Bàn Điều Hành Chiến Lược (BOD / Executive)"
                  : currentUser.role === "MANAGER"
                  ? "Trưởng Phòng Quản Lý"
                  : "Chuyên Viên Triển Khai"}
              </span>
            </span>
            <span className="text-xs text-white/70">•</span>
            <span className="text-xs text-white/90 font-medium">
              {currentUser.role === "ADMIN" ? "Tập đoàn IGB Group" : dept?.name}
            </span>
            <span className="text-xs text-white/70">•</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              Hệ thống ERP v2.6 • Live
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Chào mừng trở lại, {currentUser.name}! 👋
          </h2>

          <p className="text-xs sm:text-sm text-white/85 max-w-2xl leading-relaxed">
            Hôm nay là <strong>{formatDate(new Date(), "EEEE, dd/MM/yyyy")}</strong>. Dự án CĐS{" "}
            <strong className="text-white font-bold">{activeSolution.name}</strong> đang có{" "}
            <strong className="text-amber-200 underline decoration-amber-300/50 decoration-2 underline-offset-2">
              {govDeployingCount} tỉnh đang thi công
            </strong>
            ,{" "}
            <strong className="text-emerald-200 underline decoration-emerald-300/50 decoration-2 underline-offset-2">
              {govCompletedCount} tỉnh đã bàn giao
            </strong>
            , và{" "}
            <strong className="text-rose-200">
              {urgentOrOverdue.length} nhiệm vụ nội bộ
            </strong>{" "}
            cần chú ý gấp.
          </p>
        </div>

        {/* Action jump buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
          <Link href="/gov-projects">
            <Button
              size="sm"
              className="h-10 px-4 bg-white text-indigo-900 hover:bg-white/90 font-bold rounded-xl shadow-md gap-2 transition-all hover:scale-[1.02]"
            >
              <Compass className="h-4 w-4 text-indigo-600" />
              <span>Chiến dịch 34 Tỉnh</span>
            </Button>
          </Link>

          <Link href="/tasks">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3.5 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl gap-1.5 backdrop-blur-xs font-semibold"
            >
              <KanbanSquare className="h-4 w-4" />
              <span>Jira Board</span>
            </Button>
          </Link>

          <Button
            onClick={openCreate}
            size="sm"
            variant="outline"
            className="h-10 px-3.5 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl gap-1.5 backdrop-blur-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo việc mới</span>
          </Button>

          <Link href="/daily-report">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3.5 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl gap-1.5 backdrop-blur-xs font-semibold"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Báo cáo ngày</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. B2G NATIONAL STRATEGIC COMMAND CENTER (CHIẾN DỊCH CHUYỂN ĐỔI SỐ 34 TỈNH) */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Header of Strategic Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Bàn Điều Hành Chiến Lược: Chiến Dịch Chuyển Đổi Số 34 Tỉnh Thành
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tiến trình tiếp cận công văn, thỏa thuận tài trợ & thi công nền tảng số cấp Tỉnh trên toàn quốc
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Solution Switcher Pills */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/70 overflow-x-auto max-w-full">
              {solutions.map((sol) => (
                <button
                  key={sol.id}
                  type="button"
                  onClick={() => setActiveSolutionId(sol.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0",
                    activeSolutionId === sol.id
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sol.shortName || sol.name}
                </button>
              ))}
            </div>

            <Link href="/gov-projects">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-primary/30 hover:bg-primary/10 text-primary"
              >
                <span>Xem Ma trận & Bảng</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Macro Strategic KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Độ phủ công văn */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                Độ Phủ Công Văn
              </span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
                <Send className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-foreground">
                {govDispatchedCount} <span className="text-sm font-medium text-muted-foreground">/ {govTotalCount} Tỉnh</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600/90 dark:text-blue-400 mt-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>100% hoàn thành phát hành</span>
              </div>
            </div>
          </div>

          {/* Card 2: Đã tiếp xúc & làm việc */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Tiếp Xúc & Phản Hồi
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-600 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {govWorkedWithCount} <span className="text-sm font-medium text-muted-foreground">/ {govTotalCount} Tỉnh</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1 font-medium">
                <span>Chuyển đổi tiếp cận:</span>
                <span className="font-bold text-foreground">
                  {Math.round((govWorkedWithCount / govTotalCount) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Đang thi công / triển khai */}
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                Đang Triển Khai Kỹ Thuật
              </span>
              <div className="h-7 w-7 rounded-lg bg-orange-500/15 text-orange-600 flex items-center justify-center">
                <Rocket className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {govDeployingCount} <span className="text-sm font-medium text-muted-foreground">Tỉnh</span>
              </div>
              <div className="text-[11px] text-orange-700/80 dark:text-orange-400/90 mt-1 font-medium truncate" title={deployingProvinceNames}>
                {deployingProvinceNames}
              </div>
            </div>
          </div>

          {/* Card 4: Đã bàn giao / nghiệm thu */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Nghiệm Thu Bàn Giao
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <Award className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {govCompletedCount} <span className="text-sm font-medium text-muted-foreground">Tỉnh</span>
              </div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/90 mt-1 font-medium truncate" title={completedProvinceNames}>
                {completedProvinceNames}
              </div>
            </div>
          </div>
        </div>

        {/* 7-Stage Interactive Pipeline Strip */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>Phễu Tiếp Cận 7 Giai Đoạn Toàn Quốc (Click vào bước để lọc chi tiết)</span>
            </span>
            <Link
              href="/gov-projects"
              className="text-primary hover:underline text-[11px] font-medium flex items-center gap-0.5"
            >
              <span>Xem Kanban Pipeline</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {pipelineStages.map((stageKey) => {
              const stageCfg = GOV_STAGES[stageKey];
              const count = stageCounts[stageKey] || 0;
              const isHighlight = count > 0;

              return (
                <Link
                  key={stageKey}
                  href={`/gov-projects?stage=${stageKey}`}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between",
                    isHighlight
                      ? "bg-card border-border/80 hover:border-primary/50 shadow-2xs"
                      : "bg-muted/10 border-border/40 opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                      GĐ {stageCfg.stepNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-bold",
                        count > 0 ? stageCfg.badgeClass : "text-muted-foreground"
                      )}
                    >
                      {count}
                    </Badge>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-foreground line-clamp-1">
                      {stageCfg.shortLabel}
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: stageCfg.colorHex,
                          width: `${Math.min(100, Math.round((count / 34) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL HEALTH & TASK DELIVERY KPIS (CHỈ SỐ VẬN HÀNH & SLA NỘI BỘ) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Chỉ Số Vận Hành Nội Bộ & Tiến Độ Công Việc (SLA)
          </h3>
        </div>

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

          {/* KPI 3: Chờ duyệt */}
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
      </div>

      {/* 4. VISUAL ANALYTICS GRID (CHARTS ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Tiến độ nghiệm thu công việc trong tuần
              </h3>
              <p className="text-xs text-muted-foreground">
                So sánh số task hoàn thành thực tế và mục tiêu cam kết giữa các bộ phận
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
            Tổng cộng: {userTasks.length} nhiệm vụ được theo dõi
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

      {/* 5. SITUATIONAL AWARENESS: PRIORITY TASKS & UPCOMING DIPLOMATIC MEETINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Nhiệm vụ trọng tâm cần tập trung hôm nay */}
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
              <span>Xem Jira Board</span>
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
                const taskDept = departments.find((d) => d.id === task.departmentId);
                const projInfo = getProjectInfo(task.projectId);

                return (
                  <div
                    key={task.id}
                    onClick={() => openDetail(task)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                          {task.code}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-mono px-1.5 py-0", projInfo.badgeBg, projInfo.badgeText)}
                        >
                          {projInfo.key}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground/80">{projInfo.name}</span>
                          <span>•</span>
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

        {/* Right (1 col): Situational Awareness: Upcoming Diplomatic Meetings & Approvals */}
        <div className="space-y-6">
          {/* Upcoming Provincial Diplomatic Meetings */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-foreground">
                  Lịch Tiếp Xúc & Họp Tỉnh Sắp Tới
                </h3>
              </div>
              <Link
                href="/gov-projects"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingMeetings.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  Chưa có lịch hẹn tỉnh nào trong tuần này.
                </div>
              ) : (
                upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-indigo-500/20 bg-card hover:border-indigo-400 transition-all text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-indigo-500" />
                        {m.provinceName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                      >
                        {m.scheduledAt.split(" ")[1]} • {formatDate(m.scheduledAt.split(" ")[0], "dd/MM")}
                      </Badge>
                    </div>

                    <p className="font-semibold text-foreground line-clamp-1">
                      {m.content}
                    </p>

                    <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-1 border-t border-border/50">
                      <span className="truncate max-w-[170px]">{m.contactPerson}</span>
                      <span className="font-medium text-foreground/70 truncate max-w-[120px]">
                        {m.location.includes("Online") ? "Google Meet" : "Trực tiếp"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approvals Quick Queue */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
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
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  Không có đề xuất nào đang chờ xử lý.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingApprovals.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openDetail(item)}
                      className="p-2.5 rounded-xl border border-border/70 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          {item.code}
                        </span>
                        <span className="text-muted-foreground">{formatDate(item.createdAt, "dd/MM")}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{item.title}</p>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Người tạo: {getUserById(item.creatorId)?.name || "Nhân viên"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/70 mt-3">
              <Link href={currentUser.role === "EMPLOYEE" ? "/tasks" : "/approvals"}>
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 rounded-xl">
                  <span>{currentUser.role === "EMPLOYEE" ? "Xem tất cả task" : "Quản lý hàng đợi duyệt"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Dialog & Create Dialog */}
      <TaskDialog />
      <TaskFormDialog />
    </div>
  );
}

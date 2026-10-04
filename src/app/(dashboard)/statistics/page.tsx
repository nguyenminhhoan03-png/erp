"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { TASK_STATUS_CONFIG } from "@/modules/tasks/constants";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { isOverdue } from "@/lib/date";

export default function StatisticsPage() {
  const { tasks, fetchTasks } = useTaskStore();
  const { currentUser, users } = useUserStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    fetchTasks();
  }, [fetchTasks]);

  // Lọc task theo phạm vi vai trò người dùng:
  // - Admin: Toàn công ty
  // - Manager: Phòng ban của mình
  // - Employee: Task được gán cho chính mình
  const filteredTasks = React.useMemo(() => {
    if (currentUser.role === "ADMIN") return tasks;
    if (currentUser.role === "MANAGER") {
      return tasks.filter((t) => t.departmentId === currentUser.departmentId);
    }
    return tasks.filter((t) => t.assigneeIds.includes(currentUser.id));
  }, [tasks, currentUser]);

  // 1. Thẻ tổng quan
  const totalTasks = filteredTasks.length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneTasks = filteredTasks.filter((t) => t.status === "DONE").length;
  const overdueTasks = filteredTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // 2. Dữ liệu Biểu đồ Tròn: Phân bổ theo trạng thái
  const statusChartData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });

    return Object.entries(counts).map(([statusKey, count]) => {
      const cfg = TASK_STATUS_CONFIG[statusKey as keyof typeof TASK_STATUS_CONFIG];
      return {
        name: cfg?.label || statusKey,
        value: count,
        color: cfg?.color || "#94a3b8",
      };
    });
  }, [filteredTasks]);

  // 3. Dữ liệu Biểu đồ Cột: Phân bổ theo phòng ban
  const departmentChartData = React.useMemo(() => {
    return MOCK_DEPARTMENTS.map((dept) => {
      const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
      return {
        name: dept.code,
        fullName: dept.name,
        total: deptTasks.length,
        done: deptTasks.filter((t) => t.status === "DONE").length,
        inProgress: deptTasks.filter((t) => t.status === "IN_PROGRESS").length,
      };
    });
  }, [tasks]);

  // 4. Dữ liệu Biểu đồ Xu hướng hoàn thành theo tuần (mock 4 tuần)
  const trendData = [
    { week: "Tuần 1", completed: 8, target: 10 },
    { week: "Tuần 2", completed: 14, target: 12 },
    { week: "Tuần 3", completed: 19, target: 15 },
    { week: "Tuần này", completed: doneTasks, target: 20 },
  ];

  // 5. Danh sách nhân sự chưa nộp báo cáo hôm nay (trong phạm vi quyền)
  const missingReportUsers = React.useMemo(() => {
    const deptUsers =
      currentUser.role === "ADMIN"
        ? users.filter((u) => u.role !== "ADMIN")
        : users.filter((u) => u.departmentId === currentUser.departmentId && u.role !== "ADMIN");

    // Lọc ra các nhân viên mẫu chưa nộp (index chẵn hoặc ID dev1, tax, ads)
    return deptUsers.filter(
      (u) =>
        u.id === "user-it-dev1" ||
        u.id === "user-mkt-ads" ||
        u.id === "user-hr-cb" ||
        u.id === "user-sales-b2b" ||
        u.id === "user-acc-tax"
    );
  }, [currentUser, users]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span>Thống kê & Hiệu suất Công việc</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Phạm vi dữ liệu:{" "}
          <strong className="text-foreground">
            {currentUser.role === "ADMIN"
              ? "Toàn bộ 5 phòng ban công ty"
              : currentUser.role === "MANAGER"
              ? `Phòng ban ${currentUser.departmentId.toUpperCase()}`
              : `Cá nhân (${currentUser.name})`}
          </strong>
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Tổng số công việc</span>
          <div className="text-2xl font-bold text-foreground mt-1">{totalTasks}</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Trong hệ thống</span>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 p-4 shadow-2xs">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Đang triển khai</span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {inProgressTasks}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Đang hoạt động</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 shadow-2xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Đã hoàn thành</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {doneTasks}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            Nghiệm thu đạt
          </span>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 p-4 shadow-2xs">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Trễ hạn (Overdue)</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {overdueTasks}
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block font-medium">
            Cần xử lý gấp
          </span>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 p-4 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Tỷ lệ hoàn thành</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {completionRate}%
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Trạng thái công việc */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Cơ cấu công việc theo trạng thái
          </h3>
          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-muted/20 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
                Đang tải cơ cấu công việc...
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Xu hướng hoàn thành */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Tiến độ hoàn thành theo tuần
          </h3>
          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend iconType="plainline" wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Đã hoàn thành"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Mục tiêu KPI"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-muted/20 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
                Đang tải tiến độ hoàn thành...
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: So sánh phòng ban (Hiện cho Admin hoặc Manager) */}
        {currentUser.role === "ADMIN" && (
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs lg:col-span-2">
            <h3 className="text-sm font-bold text-foreground mb-4">
              Khối lượng công việc theo phòng ban
            </h3>
            <div className="h-72 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="total" name="Tổng task" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inProgress" name="Đang làm" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="done" name="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-xl bg-muted/20 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
                  Đang tải khối lượng phòng ban...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bảng nhân sự chưa nộp báo cáo hôm nay */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <h3 className="text-sm font-bold text-foreground">
              Nhân viên chưa nộp báo cáo ngày hôm nay ({missingReportUsers.length} nhân sự)
            </h3>
          </div>
          <Badge variant="destructive" className="text-xs">
            Cần nhắc nhở
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 font-semibold text-muted-foreground uppercase">
                <th className="py-2.5 px-3">Họ và tên</th>
                <th className="py-2.5 px-3">Chức danh</th>
                <th className="py-2.5 px-3">Phòng ban</th>
                <th className="py-2.5 px-3">Email liên hệ</th>
                <th className="py-2.5 px-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {missingReportUsers.map((user) => {
                const dept = MOCK_DEPARTMENTS.find((d) => d.id === user.departmentId);
                return (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={user} size="sm" />
                        <span className="font-semibold text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{user.title}</td>
                    <td className="py-2.5 px-3">
                      {dept && (
                        <Badge variant="outline" className="text-[10px]">
                          {dept.name}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">{user.email}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full text-[10px]">
                        Chưa nộp
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

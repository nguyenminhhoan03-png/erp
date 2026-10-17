import * as React from "react";
import { Users, UserCheck, Clock, UserPlus, TrendingUp } from "lucide-react";
import { useEmployeeStore } from "../store/employeeStore";

export function EmployeeStats() {
  const employees = useEmployeeStore((s) => s.employees);

  const total = employees.length;
  const official = employees.filter((e) => e.userType === "nhan_vien_chinh_thuc").length;
  const probationOrIntern = employees.filter(
    (e) => e.userType === "thu_viec" || e.userType === "thuc_tap_sinh"
  ).length;
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const activeRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  const statItems = [
    {
      title: "Tổng nhân sự",
      value: total,
      sub: "Toàn bộ thành viên",
      icon: Users,
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40",
      indicator: "+2 tháng này",
    },
    {
      title: "Nhân viên chính thức",
      value: official,
      sub: `${Math.round((official / (total || 1)) * 100)}% cơ cấu nhân sự`,
      icon: UserCheck,
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40",
      indicator: "Hợp đồng dài hạn",
    },
    {
      title: "Thử việc & Thực tập",
      value: probationOrIntern,
      sub: "Đang trong lộ trình đánh giá",
      icon: Clock,
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40",
      indicator: "Cần theo dõi KPI",
    },
    {
      title: "Tỷ lệ hoạt động",
      value: `${activeRate}%`,
      sub: `${activeCount}/${total} đang làm việc`,
      icon: TrendingUp,
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40",
      indicator: "Trạng thái tích cực",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 transition-all duration-200 hover:shadow-md hover:border-border`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} pointer-events-none`} />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.title}
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {item.value}
                </div>
              </div>
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-xs ${item.iconBg}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="relative mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{item.sub}</span>
              <span className="font-medium text-foreground/80 shrink-0">
                {item.indicator}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

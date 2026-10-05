"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckSquare2,
  FileCheck2,
  FileSpreadsheet,
  KanbanSquare,
  LayoutDashboard,
  Layers,
  Sparkles,
  Users2,
  Building2,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "../store/useUserStore";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useSidebarStore } from "../store/useSidebarStore";
import { can } from "../permissions/can";
import { Badge } from "./ui/badge";

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, users } = useUserStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const [mounted, setMounted] = React.useState(false);

  // Đồng bộ dữ liệu sau khi component mount phía client để tránh hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    fetchTasks();
  }, [fetchTasks]);

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  // Đếm số task đang chờ duyệt thuộc quyền user
  const pendingApprovalsCount = tasks.filter((t) => {
    if (t.status !== "PENDING_APPROVAL") return false;
    if (currentUser.role === "ADMIN") return true;
    if (currentUser.role === "MANAGER") return t.departmentId === currentUser.departmentId;
    return false;
  }).length;

  // Cấu trúc phân nhóm theo từng Phân hệ ERP chuẩn mực
  interface SidebarItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: "default" | "warning";
    requiresPermission?: () => boolean;
  }

  interface ModuleGroup {
    groupTitle: string;
    items: SidebarItem[];
  }

  const moduleGroups: ModuleGroup[] = [
    {
      groupTitle: "TỔNG QUAN",
      items: [
        {
          title: "Bàn làm việc (Dashboard)",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: "DỰ ÁN & THỊ TRƯỜNG",
      items: [
        {
          title: "Dự án CĐS",
          href: "/gov-projects",
          icon: Compass,
          badgeVariant: "default" as const,
        },
      ],
    },
    {
      groupTitle: "QUẢN LÝ CÔNG VIỆC",
      items: [
        {
          title: "Bảng công việc",
          href: "/tasks",
          icon: KanbanSquare,
          badge: tasks.length ? `${tasks.length}` : undefined,
        },
        {
          title: "Báo cáo ngày",
          href: "/daily-report",
          icon: FileSpreadsheet,
        },
        {
          title: "Duyệt công việc",
          href: "/approvals",
          icon: FileCheck2,
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
          badgeVariant: "warning" as const,
          requiresPermission: () => can(currentUser, "view", "approvals"),
        },
      ],
    },
    {
      groupTitle: "QUẢN LÝ NHÂN SỰ",
      items: [
        {
          title: "Nhân sự & Thành viên",
          href: "/employees",
          icon: Users2,
          badge: `${users.length}`,
        },
        {
          title: "Phân quyền",
          href: "/permissions",
          icon: ShieldCheck,
        },
      ],
    },
    {
      groupTitle: "BÁO CÁO & THỐNG KÊ",
      items: [
        {
          title: "Thống kê & KPI",
          href: "/statistics",
          icon: BarChart3,
        },
      ],
    },
  ];

  const upcomingModules = [
    { title: "Nội dung & Tin tức (CMS)", icon: Layers, tag: "Q2" },
    { title: "Kế toán & Hóa đơn", icon: Building2, tag: "Q3" },
  ];

  return (
    <aside
      className={cn(
        "border-r border-border/80 bg-card/70 backdrop-blur-md flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "h-16 px-4 flex items-center border-b border-border/80 transition-all",
          isCollapsed ? "justify-center" : "gap-3 px-5"
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <Briefcase className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground truncate">
                  ERP Web
                </span>
                <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                Quản trị Doanh nghiệp
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation with ERP Module Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {moduleGroups.map((group, groupIdx) => {
          // Lọc các item có quyền
          const visibleItems = group.items.filter(
            (item) => !item.requiresPermission || item.requiresPermission()
          );
          if (visibleItems.length === 0) return null;

          const isGroupCollapsed = Boolean(collapsedGroups[group.groupTitle]);

          return (
            <div key={group.groupTitle} className="space-y-1">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupTitle)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors group/header cursor-pointer select-none rounded-md hover:bg-muted/40"
                  title={isGroupCollapsed ? `Mở rộng ${group.groupTitle}` : `Thu gọn ${group.groupTitle}`}
                >
                  <span>{group.groupTitle}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-muted-foreground/50 transition-transform duration-200 group-hover/header:text-foreground",
                      isGroupCollapsed ? "-rotate-90" : "rotate-0"
                    )}
                  />
                </button>
              ) : (
                groupIdx > 0 && <div className="my-1.5 h-px bg-border/60 mx-2" />
              )}

              {(!isCollapsed ? !isGroupCollapsed : true) && (
                <nav className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          "flex items-center rounded-xl text-xs font-medium transition-all group relative",
                          isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20 font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                              isActive ? "text-primary-foreground" : "text-muted-foreground"
                            )}
                          />
                          {!isCollapsed && <span className="truncate">{item.title}</span>}
                        </div>

                        {item.badge && (
                          <>
                            {!isCollapsed ? (
                              <Badge
                                suppressHydrationWarning
                                variant={item.badgeVariant || (isActive ? "secondary" : "outline")}
                                className={cn(
                                  "text-[10px] h-4 px-1.5 font-bold shrink-0",
                                  isActive && "bg-white/20 text-white border-0"
                                )}
                              >
                                {item.badge}
                              </Badge>
                            ) : (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-card" />
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
          );
        })}

        {/* Future Modules Preview */}
        {!isCollapsed && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleGroup("UPCOMING")}
              className="w-full flex items-center justify-between px-2.5 py-1 mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors group/header cursor-pointer select-none rounded-md hover:bg-muted/40"
              title={collapsedGroups["UPCOMING"] ? "Mở rộng Lộ trình mở rộng" : "Thu gọn Lộ trình mở rộng"}
            >
              <div className="flex items-center gap-1.5">
                <span>Lộ trình mở rộng</span>
                <Sparkles className="h-3 w-3 text-amber-500" />
              </div>
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground/50 transition-transform duration-200 group-hover/header:text-foreground",
                  collapsedGroups["UPCOMING"] ? "-rotate-90" : "rotate-0"
                )}
              />
            </button>
            {!collapsedGroups["UPCOMING"] && (
              <div className="space-y-0.5 mt-0.5">
                {upcomingModules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.title}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-not-allowed"
                      title="Phân hệ dự kiến ghép vào backend Laravel"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{m.title}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/50 shrink-0">
                        {m.tag}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Button đóng mở Sidebar (Icon only) */}
      <div
        className={cn(
          "p-2.5 border-t border-border/80 bg-muted/20 flex items-center transition-all",
          isCollapsed ? "justify-center" : "justify-end"
        )}
      >
        <button
          onClick={toggleSidebar}
          type="button"
          className="h-8.5 w-8.5 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-background transition-all border border-border/60 bg-background/50 shadow-2xs cursor-pointer active:scale-95 group"
          title={isCollapsed ? "Mở rộng sidebar (Ctrl+B)" : "Thu gọn sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>
    </aside>
  );
}

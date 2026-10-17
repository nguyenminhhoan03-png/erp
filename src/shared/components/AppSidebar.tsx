"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare2,
  FileSpreadsheet,
  KanbanSquare,
  LayoutDashboard,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  CalendarDays,
  Tag,
  Building2,
  UserCog,
  Users,
  FileText,
  ClipboardCheck,
  PenLine,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "../store/useUserStore";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { reportService } from "@/modules/tasks/services/reportService";
import { useSidebarStore } from "../store/useSidebarStore";
import { Badge } from "./ui/badge";

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser } = useUserStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (tasks.length === 0) {
      fetchTasks();
    }
  }, [fetchTasks, tasks.length]);

  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({
    "Dự án CĐS": true,
    "Lịch công tác": true,
    "Báo cáo công việc": true,
  });

  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState(0);

  React.useEffect(() => {
    if (currentUser?.id) {
      reportService
        .getReports()
        .then((reports) => {
          const pending = reports.filter((r) => {
            const isSubmitted = r.status === "SUBMITTED" || r.status === "submitted";
            if (!isSubmitted) return false;
            if (currentUser.role === "ADMIN") return true;
            return r.approverId === currentUser.id;
          }).length;
          setPendingApprovalsCount(pending);
        })
        .catch(() => setPendingApprovalsCount(0));
    }
  }, [currentUser?.id, currentUser?.role]);

  React.useEffect(() => {
    if (pathname.startsWith("/gov-projects")) {
      setExpandedItems((prev) => ({ ...prev, "Dự án CĐS": true }));
    } else if (pathname.startsWith("/gov-calendar")) {
      setExpandedItems((prev) => ({ ...prev, "Lịch công tác": true }));
    } else if (pathname.startsWith("/daily-report")) {
      setExpandedItems((prev) => ({ ...prev, "Báo cáo công việc": true }));
    }
  }, [pathname]);

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const toggleItem = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  interface SubSidebarItem {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: "default" | "warning";
    requiresPermission?: () => boolean;
  }

  interface SidebarItem {
    title: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: "default" | "warning";
    requiresPermission?: () => boolean;
    children?: SubSidebarItem[];
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
          icon: Compass,
          badgeVariant: "default" as const,
          children: [
            {
              title: "Danh mục",
              href: "/gov-projects/categories",
              icon: Tag,
            },
            {
              title: "Danh sách",
              href: "/gov-projects",
              icon: Compass,
            },
          ],
        },
        {
          title: "Lịch công tác",
          href: "/gov-calendar",
          icon: CalendarDays,
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
          title: "Báo cáo công việc",
          icon: FileSpreadsheet,
          children: [
            {
              title: "Nộp báo cáo",
              href: "/daily-report",
              icon: PenLine,
            },
            {
              title: "Lịch sử báo cáo",
              href: "/daily-report?tab=my-history",
              icon: History,
            },
            {
              title: "Duyệt & Quản lý",
              href: "/daily-report?tab=team-reports",
              icon: ClipboardCheck,
              badge: pendingApprovalsCount ? `${pendingApprovalsCount}` : undefined,
              requiresPermission: () => currentUser.role === "ADMIN" || currentUser.role === "MANAGER",
            },
          ],
        },
      ],
    },
    {
      groupTitle: "QUẢN LÝ NHÂN SỰ",
      items: [
        {
          title: "Phòng ban",
          href: "/departments",
          icon: Building2,
        },
        {
          title: "Chức vụ",
          href: "/positions",
          icon: UserCog,
        },
        {
          title: "Nhân viên",
          href: "/employees",
          icon: Users,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "border-r border-border/80 bg-card/70 backdrop-blur-md flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
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

      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {moduleGroups.map((group, groupIdx) => {
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
                    const hasChildren = Boolean(item.children && item.children.length > 0);
                    const isChildActive =
                      hasChildren &&
                      item.children?.some(
                        (c) =>
                          pathname === c.href.split("?")[0] ||
                          pathname.startsWith(c.href.split("?")[0] + "/")
                      );
                    const isActive = !hasChildren && (pathname === item.href || (item.href !== "/dashboard" && item.href && pathname.startsWith(item.href + "/")));
                    const isExpanded = Boolean(expandedItems[item.title]);
                    const Icon = item.icon;

                    if (hasChildren) {
                      return (
                        <div key={item.title} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isCollapsed) {
                                toggleSidebar();
                              }
                              toggleItem(item.title);
                            }}
                            title={isCollapsed ? item.title : undefined}
                            className={cn(
                              "w-full flex items-center rounded-xl text-xs font-medium transition-all group select-none cursor-pointer",
                              isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2",
                              isChildActive && !isExpanded
                                ? "bg-primary/10 text-primary font-semibold"
                                : isChildActive
                                ? "text-primary font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                                  isChildActive ? "text-primary" : "text-muted-foreground"
                                )}
                              />
                              {!isCollapsed && <span className="truncate">{item.title}</span>}
                            </div>

                            {!isCollapsed && (
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 group-hover:text-foreground",
                                  isExpanded ? "rotate-0" : "-rotate-90"
                                )}
                              />
                            )}
                          </button>

                          {!isCollapsed && isExpanded && (
                            <div className="ml-4 pl-3 border-l border-border/70 space-y-0.5 pt-0.5 pb-1">
                              {item.children!
                                .filter((child) => !child.requiresPermission || child.requiresPermission())
                                .map((child) => {
                                  const isSubActive =
                                    typeof window !== "undefined"
                                      ? (child.href.includes("?")
                                          ? window.location.search.includes(child.href.split("?")[1])
                                          : !window.location.search.includes("tab=my-history") &&
                                            !window.location.search.includes("tab=team-reports")) &&
                                        pathname === child.href.split("?")[0]
                                      : pathname === child.href;
                                  const SubIcon = child.icon;
                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      className={cn(
                                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all",
                                        isSubActive
                                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-normal"
                                      )}
                                    >
                                      {SubIcon && (
                                        <SubIcon
                                          className={cn(
                                            "h-3.5 w-3.5 shrink-0",
                                            isSubActive ? "text-primary-foreground" : "text-muted-foreground"
                                          )}
                                        />
                                      )}
                                      <span className="truncate">{child.title}</span>
                                      {child.badge && (
                                        <span
                                          className={cn(
                                            "ml-auto text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                                            isSubActive
                                              ? "bg-white/20 text-white"
                                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/50"
                                          )}
                                        >
                                          {child.badge}
                                        </span>
                                      )}
                                    </Link>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.href || item.title}
                        href={item.href || "#"}
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
      </div>

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

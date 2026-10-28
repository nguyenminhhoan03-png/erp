"use client";

import * as React from "react";
import { PanelLeft, ChevronRight } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useUserStore } from "../store/useUserStore";
import { useSidebarStore } from "../store/useSidebarStore";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  const { currentUser, departments, fetchDepartments, fetchUsers } = useUserStore();
  const { toggleSidebar } = useSidebarStore();

  React.useEffect(() => {
    if (departments.length === 0) {
      fetchDepartments();
    }
    fetchUsers();
  }, [departments.length, fetchDepartments, fetchUsers]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const currentDept = departments.find(
    (d) => String(d.id) === String(currentUser?.departmentId)
  );

  const deptTitle =
    currentUser?.isSuperAdmin || currentUser?.role === "ADMIN"
      ? "Toàn hệ thống"
      : currentDept?.name || currentUser?.departmentName || "Không gian làm việc";

  const deptCode =
    currentUser?.isSuperAdmin || currentUser?.role === "ADMIN"
      ? "ALL"
      : currentDept?.code || (currentUser?.departmentName ? "DEPT" : "IGB");

  const deptColor =
    currentDept?.color || (currentUser?.role === "ADMIN" ? "#6366f1" : "#10b981");

  return (
    <header className="h-16 border-b border-border/70 bg-background/85 backdrop-blur-md sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Sidebar Toggle & Context Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">

        {/* Workspace pill / breadcrumb */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: deptColor }}
          />
          <span className="text-xs font-bold text-foreground tracking-tight hidden sm:inline">
            IGB ERP
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 hidden sm:inline" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-[280px]">
            {deptTitle}
          </span>
          {deptCode && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-medium px-1.5 py-0 h-4 hidden sm:inline-flex bg-background/60"
            >
              {deptCode}
            </Badge>
          )}
        </div>
      </div>

      {/* Right side: Notifications + User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

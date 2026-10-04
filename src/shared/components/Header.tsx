"use client";

import * as React from "react";
import { RoleSwitcher } from "./RoleSwitcher";
import { useUserStore } from "../store/useUserStore";
import { useSidebarStore } from "../store/useSidebarStore";
import { MOCK_DEPARTMENTS } from "../mock/departments";
import { Badge } from "./ui/badge";

export function Header() {
  const { currentUser } = useUserStore();
  const { toggleSidebar } = useSidebarStore();
  const currentDept = MOCK_DEPARTMENTS.find((d) => d.id === currentUser.departmentId);

  // Lắng nghe phím tắt Ctrl+B để đóng mở sidebar
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

  return (
    <header className="h-16 border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: currentDept?.color || "#3b82f6" }}
          />
          <h1 className="text-sm font-semibold text-foreground tracking-tight truncate max-w-[200px] sm:max-w-none">
            {currentUser.role === "ADMIN" ? "Toàn công ty" : currentDept?.name}
          </h1>
          <Badge variant="outline" className="text-[11px] font-mono font-medium hidden sm:inline-flex">
            {currentUser.role === "ADMIN" ? "ALL" : currentDept?.code}
          </Badge>
        </div>

        <div className="h-4 w-px bg-border/80 mx-1 hidden sm:block" />

        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống ERP Demo • Frontend Mock</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <RoleSwitcher />
      </div>
    </header>
  );
}

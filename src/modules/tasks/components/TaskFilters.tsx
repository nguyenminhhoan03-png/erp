"use client";

import * as React from "react";
import {
  Search,
  Filter,
  RotateCcw,
  LayoutGrid,
  List,
  Plus,
  UserCheck,
  Briefcase,
} from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, AVAILABLE_PROJECTS } from "../constants";
import { TaskPriority, TaskStatus } from "../types";
import { DepartmentId } from "@/shared/types";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/lib/utils";

export function TaskFilters() {
  const { filters, setFilters, resetFilters, viewMode, setViewMode, openCreate } =
    useTaskStore();
  const { currentUser, users } = useUserStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleToggleMyTasks = () => {
    const nextVal = !filters.isMyTasksOnly;
    setFilters({
      isMyTasksOnly: nextVal,
      assigneeId: nextVal ? currentUser.id : "ALL",
    });
  };

  const isFiltered =
    Boolean(filters.search) ||
    (filters.projectId && filters.projectId !== "ALL") ||
    filters.departmentId !== "ALL" ||
    filters.assigneeId !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.status !== "ALL" ||
    filters.isMyTasksOnly;

  return (
    <div className="flex flex-col gap-3.5 mb-6">
      {/* Top Bar: Search, View Mode, New Task Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã (ERP-...), tiêu đề..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="pl-9 h-10 bg-card/60 rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* My Tasks quick filter button */}
          <Button
            variant={filters.isMyTasksOnly ? "default" : "outline"}
            size="sm"
            onClick={handleToggleMyTasks}
            className="h-9 rounded-xl gap-1.5"
          >
            <UserCheck className="h-4 w-4" />
            <span>Task của tôi</span>
          </Button>

          {/* Kanban / Table Switcher */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/80">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer",
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Xem dạng Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer",
                viewMode === "list"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Xem dạng Danh sách"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
          </div>

          {/* Create Task Button */}
          <Button
            onClick={openCreate}
            size="sm"
            className="h-9 rounded-xl gap-1.5 shadow-sm shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo công việc</span>
          </Button>
        </div>
      </div>

      {/* Filter Selectors Bar */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        {/* Project Filter (Chuẩn Enterprise Multi-Project) */}
        <div className="w-[210px]">
          <Select
            value={filters.projectId || "ALL"}
            onValueChange={(val) => setFilters({ projectId: val })}
          >
            <SelectTrigger className="h-8.5 rounded-lg bg-card/60 text-xs border-primary/30 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue placeholder="Dự án">
                  {!filters.projectId || filters.projectId === "ALL"
                    ? "Tất cả dự án"
                    : AVAILABLE_PROJECTS.find((p) => p.id === filters.projectId)?.name}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span>🌐 Tất cả dự án</span>
                </div>
              </SelectItem>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
                Dự án Nội bộ
              </div>
              {AVAILABLE_PROJECTS.filter((p) => p.category === "INTERNAL").map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      [{proj.key}]
                    </span>
                    <span>{proj.name}</span>
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
                Dự án CĐS Tỉnh (Bước 6)
              </div>
              {AVAILABLE_PROJECTS.filter((p) => p.category === "GOV_SOLUTION").map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
                      [{proj.key}]
                    </span>
                    <span>{proj.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter */}
        <div className="w-[170px]">
          <Select
            value={filters.departmentId || "ALL"}
            onValueChange={(val) =>
              setFilters({ departmentId: val as DepartmentId | "ALL" })
            }
          >
            <SelectTrigger className="h-8.5 rounded-lg bg-card/60 text-xs">
              <SelectValue placeholder="Phòng ban">
                {!filters.departmentId || filters.departmentId === "ALL"
                  ? "Tất cả phòng ban"
                  : MOCK_DEPARTMENTS.find((d) => d.id === filters.departmentId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
              {MOCK_DEPARTMENTS.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.code} - {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Filter */}
        <div className="w-[170px]">
          <Select
            value={filters.assigneeId || "ALL"}
            onValueChange={(val) => setFilters({ assigneeId: val })}
          >
            <SelectTrigger className="h-8.5 rounded-lg bg-card/60 text-xs">
              <SelectValue placeholder="Người thực hiện">
                {!filters.assigneeId || filters.assigneeId === "ALL"
                  ? "Tất cả người nhận"
                  : users.find((u) => u.id === filters.assigneeId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả người nhận</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.title})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-[175px]">
          <Select
            value={filters.status || "ALL"}
            onValueChange={(val) =>
              setFilters({ status: val as TaskStatus | "ALL" })
            }
          >
            <SelectTrigger className="h-8.5 rounded-lg bg-card/60 text-xs">
              <SelectValue placeholder="Trạng thái">
                {!filters.status || filters.status === "ALL"
                  ? "Tất cả trạng thái"
                  : TASK_STATUS_CONFIG[filters.status as TaskStatus]?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {Object.values(TASK_STATUS_CONFIG).map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", st.dotColor)} />
                    <span>{st.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="w-[140px]">
          <Select
            value={filters.priority || "ALL"}
            onValueChange={(val) =>
              setFilters({ priority: val as TaskPriority | "ALL" })
            }
          >
            <SelectTrigger className="h-8.5 rounded-lg bg-card/60 text-xs">
              <SelectValue placeholder="Độ ưu tiên">
                {!filters.priority || filters.priority === "ALL"
                  ? "Tất cả mức độ"
                  : TASK_PRIORITY_CONFIG[filters.priority]?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả mức độ</SelectItem>
              {Object.values(TASK_PRIORITY_CONFIG).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8.5 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Đặt lại bộ lọc</span>
          </Button>
        )}
      </div>
    </div>
  );
}

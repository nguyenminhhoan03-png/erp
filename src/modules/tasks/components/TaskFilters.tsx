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
  Workflow,
} from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "../constants";
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
  const {
    filters,
    setFilters,
    resetFilters,
    viewMode,
    setViewMode,
    openCreate,
    openWorkflowConfig,
    projects,
    statuses,
    fetchProjects,
  } = useTaskStore();
  const { currentUser, users, departments, fetchUsers, fetchDepartments } = useUserStore();

  React.useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchProjects();
  }, [fetchUsers, fetchDepartments, fetchProjects]);

  const [searchTerm, setSearchTerm] = React.useState(filters.search || "");

  React.useEffect(() => {
    setSearchTerm(filters.search || "");
  }, [filters.search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        setFilters({ search: searchTerm });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, setFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleMyTasks = () => {
    const nextVal = !filters.isMyTasksOnly;
    setFilters({
      isMyTasksOnly: nextVal,
      assigneeId: nextVal ? currentUser.id : "ALL",
    });
  };

  const isDefaultProject =
    viewMode === "kanban"
      ? !filters.projectId || filters.projectId === projects[0]?.id
      : !filters.projectId || filters.projectId === "ALL";

  const isFiltered =
    Boolean(filters.search) ||
    !isDefaultProject ||
    filters.departmentId !== "ALL" ||
    filters.assigneeId !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.status !== "ALL" ||
    filters.isMyTasksOnly;

  return (
    <div className="flex flex-col gap-3.5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã (ERP-...), tiêu đề..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 h-10 bg-card/60 rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filters.isMyTasksOnly ? "default" : "outline"}
            size="sm"
            onClick={handleToggleMyTasks}
            className="h-9 rounded-xl gap-1.5"
          >
            <UserCheck className="h-4 w-4" />
            <span>Task của tôi</span>
          </Button>

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

          {viewMode === "kanban" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openWorkflowConfig(filters.projectId !== "ALL" ? filters.projectId : undefined)}
              className="h-9 rounded-xl gap-1.5 border-border/80 hover:bg-muted/60"
              title="Cấu hình quy trình & cột Kanban chuẩn Jira"
            >
              <Workflow className="h-4 w-4 text-primary" />
              <span className="hidden lg:inline">Cấu hình Cột</span>
            </Button>
          )}

          <Button
            onClick={() => openCreate("TODO", filters.projectId !== "ALL" ? filters.projectId : undefined)}
            size="sm"
            className="h-9 rounded-xl gap-1.5 shadow-sm shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo công việc</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <div className="w-[230px]">
          <Select
            value={
              viewMode === "kanban"
                ? (filters.projectId && filters.projectId !== "ALL" ? filters.projectId : (projects[0]?.id || ""))
                : (filters.projectId || "ALL")
            }
            onValueChange={(val) => setFilters({ projectId: val })}
          >
            <SelectTrigger className="h-8.5 rounded-lg bg-card/60 text-xs border-primary/30 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <SelectValue placeholder="Dự án">
                  {viewMode === "kanban"
                    ? (() => {
                        const p = projects.find((item) => item.id === (filters.projectId || projects[0]?.id));
                        if (!p) return "Chọn dự án";
                        return p.code ? `[${p.code}] ${p.name}` : p.name;
                      })()
                    : (!filters.projectId || filters.projectId === "ALL"
                      ? "Tất cả dự án"
                      : (() => {
                          const p = projects.find((item) => item.id === filters.projectId);
                          if (!p) return "Chọn dự án";
                          return p.code ? `[${p.code}] ${p.name}` : p.name;
                        })())}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {viewMode !== "kanban" && (
                <SelectItem value="ALL">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>Tất cả dự án</span>
                  </div>
                </SelectItem>
              )}
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
                Dự án Nội bộ
              </div>
              {projects.filter((p) => p.category === "INTERNAL").map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 w-14 shrink-0 text-left">
                      {proj.code ? `[${proj.code}]` : ''}
                    </span>
                    <span className="truncate">{proj.name}</span>
                  </div>
                </SelectItem>
              ))}
              {projects.filter((p) => p.category === "GOV_SOLUTION").length > 0 && (
                <div className="px-2 py-1 mt-1.5 mb-0.5 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-sm">
                  Dự án Giải pháp CĐS Tỉnh (GOV)
                </div>
              )}
              {Object.entries(
                projects.filter((p) => p.category === "GOV_SOLUTION").reduce((acc, proj) => {
                  const group = proj.groupName || 'Chưa phân nhóm';
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(proj);
                  return acc;
                }, {} as Record<string, typeof projects>)
              ).map(([groupName, groupProjects]) => (
                <React.Fragment key={groupName}>
                  <div className="px-3 py-1 ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-l-2 border-primary/30">
                    ↳ {groupName}
                  </div>
                  {groupProjects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id} className="pl-7">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400 w-14 shrink-0 text-left">
                          {proj.code ? `[${proj.code}]` : ''}
                        </span>
                        <span className="truncate">{proj.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                  : departments.find((d) => d.id === filters.departmentId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.code ? `${dept.code} - ` : ''}{dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                  : (statuses?.find((s) => s.key === filters.status)?.name ||
                     TASK_STATUS_CONFIG[filters.status as TaskStatus]?.label ||
                     filters.status)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {(statuses && statuses.length > 0
                ? statuses.map((s) => ({
                    id: s.key,
                    label: s.name,
                    color: s.color,
                  }))
                : Object.values(TASK_STATUS_CONFIG).map((s) => ({
                    id: s.id,
                    label: s.label,
                    color: s.color,
                  }))
              ).map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: st.color || "#2563eb" }}
                    />
                    <span>{st.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

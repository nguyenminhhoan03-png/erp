"use client";

import * as React from "react";
import {
  Search,
  Filter,
  Calendar,
  FileText,
  CheckSquare,
  ArrowUpRight,
  MapPin,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  X,
  Plus,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Check,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { GovProject, DltmProject, GovStage, DltmStage, Region } from "../types";
import { GOV_STAGES, DLTM_STAGES, REGIONS, IGB_TEAM_MEMBERS } from "../constants";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GovAddProvinceModal } from "./GovAddProvinceModal";
import { ProjectAssigneeSelect } from "./ProjectAssigneeSelect";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function GovTableView() {
  const {
    projects,
    filters,
    setFilters,
    resetFilters,
    setSelectedProject,
    updateProjectAssignee,
    initAllTargetProvinces,
    activeSolutionId,
    teamMembers,
  } = useGovStore();

  const [addProvinceOpen, setAddProvinceOpen] = React.useState(false);

  const handleInitAll = async () => {
    if (
      confirm(
        "Bạn có chắc muốn khởi tạo toàn bộ 34 tỉnh thành mục tiêu quốc gia cho dự án này không?"
      )
    ) {
      const res = await initAllTargetProvinces();
      if (res.success) {
        toast.success(`Đã khởi tạo thành công ${res.insertedCount || 34} tỉnh mục tiêu!`);
      } else {
        toast.error("Không thể khởi tạo các tỉnh. Vui lòng thử lại!");
      }
    }
  };

  const activeProjects = React.useMemo(() => {
    return projects.filter((p) => !activeSolutionId || p.solutionId === activeSolutionId);
  }, [projects, activeSolutionId]);

  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      if (activeSolutionId && p.solutionId !== activeSolutionId) return false;

      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchName = p.provinceName.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchLeader = p.leaderContact.fullName.toLowerCase().includes(q);
        const matchDept = p.leaderContact.departmentName?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchLeader && !matchDept && !matchNotes) return false;
      }

      if (filters.region && filters.region !== "ALL") {
        if (p.region !== filters.region) return false;
      }

      if (filters.stage && filters.stage !== "ALL") {
        if (p.stage !== filters.stage) return false;
      }

      return true;
    });
  }, [projects, filters, activeSolutionId]);

  const [pageSize, setPageSize] = React.useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.region, filters.stage, activeSolutionId, pageSize]);

  const totalItems = filteredProjects.length;
  const totalPages =
    pageSize === "ALL" ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProjects = React.useMemo(() => {
    if (pageSize === "ALL") return filteredProjects;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safeCurrentPage, pageSize]);

  const hasActiveFilters =
    Boolean(filters.search) || filters.region !== "ALL" || filters.stage !== "ALL";

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm tỉnh thành, mã tỉnh, người liên hệ..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-9 h-9 text-xs bg-background/60"
            />
          </div>

          <Select
            value={filters.region || "ALL"}
            onValueChange={(val) => setFilters({ region: val as Region | "ALL" })}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background/60">
              <SelectValue placeholder="Vùng miền" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả Vùng miền</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.stage || "ALL"}
            onValueChange={(val) => setFilters({ stage: val as DltmStage | "ALL" })}
          >
            <SelectTrigger className="w-[190px] h-9 text-xs bg-background/60">
              <SelectValue placeholder="Trạng thái quy trình" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả Trạng thái</SelectItem>
              {Object.entries(DLTM_STAGES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.shortLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Xóa lọc</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="text-xs text-muted-foreground font-medium">
            Hiển thị <strong className="text-foreground">{filteredProjects.length}</strong> /{" "}
            {activeProjects.length} tỉnh thành
          </div>

          {activeProjects.length < 34 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitAll}
              className="h-8 px-2.5 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-all font-medium"
              title="Khởi tạo nhanh cả 34 tỉnh mục tiêu quốc gia"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khởi tạo 34 tỉnh</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setAddProvinceOpen(true)}
            className="h-8 px-3 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm tỉnh tiếp cận</span>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4 min-w-[200px]">Tỉnh / Thành phố</th>
                <th className="py-3.5 px-4 min-w-[170px]">Giai đoạn Tiếp cận</th>
                <th className="py-3.5 px-4 min-w-[130px]">Tiến độ</th>
                <th className="py-3.5 px-4 min-w-[200px]">Ghi chú</th>
                <th className="py-3.5 px-4 min-w-[220px]">Lịch hẹn làm việc gần nhất</th>
                <th className="py-3.5 px-4 min-w-[110px] text-center">Tài liệu & Task</th>
                <th className="py-3.5 px-4 min-w-[150px]">Đầu mối IGB</th>
                <th className="py-3.5 px-4 min-w-[120px]">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-2xl bg-muted/80 mx-auto flex items-center justify-center text-muted-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        {hasActiveFilters
                          ? "Không tìm thấy tỉnh thành nào phù hợp với bộ lọc."
                          : "Dự án chưa có địa phương nào được tiếp cận."}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {hasActiveFilters
                          ? "Thử thay đổi từ khóa tìm kiếm hoặc xóa các điều kiện lọc."
                          : "Bắt đầu mở rộng quy trình tiếp cận hoặc khởi tạo nhanh 34 tỉnh mục tiêu."}
                      </p>
                      {!hasActiveFilters && (
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => setAddProvinceOpen(true)}
                            className="h-8 text-xs gap-1 font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm tỉnh tiếp cận
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleInitAll}
                            className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Khởi tạo 34 tỉnh
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project, idx) => {
                  const stageConfig = DLTM_STAGES[project.stage];

                  return (
                    <tr
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {pageSize === "ALL"
                          ? idx + 1
                          : (safeCurrentPage - 1) * pageSize + idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {project.provinceName}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="bg-muted px-1.5 py-0.2 rounded text-[10px] font-medium">
                              {project.region}
                            </span>
                            {project.leaderContact.fullName && (
                              <span className="truncate max-w-[140px] flex items-center gap-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                {project.leaderContact.fullName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] font-medium border py-0.5", stageConfig.badgeClass)}
                        >
                          {stageConfig.shortLabel}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-[100px]">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-muted-foreground">Bước {stageConfig.stepNumber}/7</span>
                            <span className="font-semibold text-foreground">{project.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${project.progressPercent}%`,
                                backgroundColor: stageConfig.colorHex,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {project.notes ? (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-[240px]" title={project.notes}>
                            {project.notes}
                          </p>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[11px]">Chưa có ghi chú</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {project.nextMeetingDate ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-primary font-medium text-xs">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="font-mono">{project.nextMeetingDate}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {project.nextMeetingContent || "Chưa có nội dung"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[11px]">
                            Chưa có lịch hẹn mới
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-muted-foreground text-xs font-mono">
                          <span
                            title="Số tài liệu đính kèm"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            <span>{project.documentsCount || 0}</span>
                          </span>
                          <span
                            title="Số lượng task nội bộ"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{project.tasksCount || 0}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <ProjectAssigneeSelect project={project} />
                      </td>

                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-lg"
                        >
                          <span>Workspace</span>
                          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh điều khiển phân trang */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20 text-xs">
          {/* Thông tin số lượng hiển thị */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              {totalItems === 0 ? (
                "Không có dữ liệu"
              ) : pageSize === "ALL" ? (
                <>
                  Hiển thị tất cả{" "}
                  <strong className="text-foreground font-semibold font-mono">
                    {totalItems}
                  </strong>{" "}
                  tỉnh thành
                </>
              ) : (
                <>
                  Hiển thị{" "}
                  <strong className="text-foreground font-semibold font-mono">
                    {(safeCurrentPage - 1) * pageSize + 1}
                  </strong>
                  –
                  <strong className="text-foreground font-semibold font-mono">
                    {Math.min(safeCurrentPage * pageSize, totalItems)}
                  </strong>{" "}
                  trên tổng số{" "}
                  <strong className="text-foreground font-semibold font-mono">
                    {totalItems}
                  </strong>{" "}
                  tỉnh thành
                </>
              )}
            </span>
          </div>

          {/* Điều khiển phân trang & Tùy chọn số dòng mỗi trang */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[11px]">Số dòng:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) =>
                  setPageSize(val === "ALL" ? "ALL" : Number(val))
                }
              >
                <SelectTrigger className="h-7 w-[105px] text-xs bg-background/80 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="25">25 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pageSize !== "ALL" && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-xs bg-background/80 border-border/60 cursor-pointer disabled:opacity-40"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  title="Trang đầu"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-xs bg-background/80 border-border/60 cursor-pointer disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  title="Trang trước"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                {/* Các nút số trang */}
                <div className="flex items-center gap-1 px-1">
                  {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-muted-foreground/60 select-none text-[11px]"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${p}`}
                        variant={safeCurrentPage === p ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-7 min-w-7 px-2 text-xs font-mono transition-all cursor-pointer",
                          safeCurrentPage === p
                            ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                            : "bg-background/80 hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setCurrentPage(Number(p))}
                      >
                        {p}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-xs bg-background/80 border-border/60 cursor-pointer disabled:opacity-40"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  title="Trang sau"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-xs bg-background/80 border-border/60 cursor-pointer disabled:opacity-40"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  title="Trang cuối"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <GovAddProvinceModal
        open={addProvinceOpen}
        onOpenChange={setAddProvinceOpen}
        onOpenInitAll={handleInitAll}
      />
    </div>
  );
}

export const DltmTableView = GovTableView;

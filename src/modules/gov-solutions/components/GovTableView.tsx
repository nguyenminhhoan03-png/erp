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
  MoreVertical,
  X,
  Plus,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { GovProject, DltmProject, GovStage, DltmStage, Region } from "../types";
import { GOV_STAGES, DLTM_STAGES, REGIONS } from "../constants";
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
import { cn } from "@/lib/utils";

export function GovTableView() {
  const { projects, filters, setFilters, resetFilters, setSelectedProject, activeSolutionId } = useGovStore();

  // Lọc danh sách tỉnh thành theo bộ lọc
  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      // 0. Active Solution
      if ((p.solutionId || "dltm") !== activeSolutionId) return false;

      // 1. Search
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchName = p.provinceName.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchLeader = p.leaderContact.fullName.toLowerCase().includes(q);
        const matchDept = p.leaderContact.departmentName?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchLeader && !matchDept && !matchNotes) return false;
      }

      // 2. Region
      if (filters.region && filters.region !== "ALL") {
        if (p.region !== filters.region) return false;
      }

      // 3. Stage
      if (filters.stage && filters.stage !== "ALL") {
        if (p.stage !== filters.stage) return false;
      }

      return true;
    });
  }, [projects, filters]);

  const hasActiveFilters =
    Boolean(filters.search) || filters.region !== "ALL" || filters.stage !== "ALL";

  return (
    <div className="space-y-3.5">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Ô tìm kiếm */}
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

          {/* Lọc theo Vùng miền */}
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

          {/* Lọc theo Trạng thái (Stage) */}
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

        <div className="text-xs text-muted-foreground font-medium shrink-0">
          Hiển thị <strong className="text-foreground">{filteredProjects.length}</strong> /{" "}
          {projects.filter((p) => (p.solutionId || "dltm") === activeSolutionId).length} tỉnh thành
        </div>
      </div>

      {/* Main Table */}
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
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy tỉnh thành nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project, idx) => {
                  const stageConfig = DLTM_STAGES[project.stage];

                  return (
                    <tr
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      {/* STT */}
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>

                      {/* Tên tỉnh thành */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center font-mono text-xs shrink-0 group-hover:scale-105 transition-transform">
                            {project.code}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {project.provinceName}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span className="bg-muted px-1.5 py-0.2 rounded text-[10px] font-medium">
                                {project.region}
                              </span>
                              <span className="truncate max-w-[140px]">
                                {project.leaderContact.fullName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Giai đoạn / Trạng thái */}
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] font-medium border py-0.5", stageConfig.badgeClass)}
                        >
                          {stageConfig.shortLabel}
                        </Badge>
                      </td>

                      {/* Tiến độ % */}
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

                      {/* Ghi chú */}
                      <td className="py-3 px-4">
                        {project.notes ? (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-[240px]" title={project.notes}>
                            {project.notes}
                          </p>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[11px]">Chưa có ghi chú</span>
                        )}
                      </td>

                      {/* Lịch làm việc gần nhất */}
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

                      {/* Tài liệu & Task */}
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

                      {/* Đầu mối IGB */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={project.igbAssignee.avatar}
                            alt={project.igbAssignee.name}
                            className="h-6 w-6 rounded-full object-cover shrink-0"
                          />
                          <span className="text-xs text-foreground font-medium truncate max-w-[120px]">
                            {project.igbAssignee.name}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
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
      </div>
    </div>
  );
}

export const DltmTableView = GovTableView;


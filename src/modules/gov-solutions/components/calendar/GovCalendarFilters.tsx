"use client";

import * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Search, RotateCcw, Filter, MapPin, User, Layers, Calendar, Video } from "lucide-react";
import { DLTM_STAGES, REGIONS, STAGE_OPTIONS } from "../../constants";
import { DltmProject } from "../../types";
import { useGovStore } from "../../store/govStore";

export interface CalendarFilterState {
  search: string;
  projectId: string;
  region: string;
  stageId: string;
  hostName: string;
  meetingType: string;
  status: string;
  timeRange: string;
}

interface GovCalendarFiltersProps {
  filters: CalendarFilterState;
  onChange: (key: keyof CalendarFilterState, value: string) => void;
  onReset: () => void;
  projects: DltmProject[];
  totalMatches: number;
}

export function GovCalendarFilters({
  filters,
  onChange,
  onReset,
  projects,
  totalMatches,
}: GovCalendarFiltersProps) {
  const { teamMembers } = useGovStore();
  const isFiltered =
    Boolean(filters.search) ||
    filters.projectId !== "ALL" ||
    filters.region !== "ALL" ||
    filters.stageId !== "ALL" ||
    filters.hostName !== "ALL" ||
    filters.meetingType !== "ALL" ||
    filters.status !== "UPCOMING" ||
    filters.timeRange !== "ALL";

  return (
    <div className="p-4 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm space-y-3 shadow-2xs">
      {/* Hàng 1: Tìm kiếm & Lọc nhanh thời gian */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
            placeholder="Tìm theo tỉnh thành, nội dung công tác, địa điểm, đầu mối..."
            className="pl-9 h-9 text-xs rounded-xl bg-background/80"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick time range pills */}
          <div className="flex items-center p-0.5 bg-muted/60 rounded-xl border border-border/60 text-xs">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "TODAY", label: "Hôm nay" },
              { id: "THIS_WEEK", label: "Tuần này" },
              { id: "THIS_MONTH", label: "Tháng này" },
              { id: "UPCOMING", label: "Sắp tới" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange("timeRange", t.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filters.timeRange === t.id
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs text-muted-foreground hover:text-rose-600 gap-1 rounded-xl cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Xóa lọc</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hàng 2: Bộ lọc chi tiết chuẩn CRM Sếp */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-border/50 text-xs">
        {/* Tỉnh thành */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            <span>Địa phương</span>
          </label>
          <Select value={filters.projectId} onValueChange={(val) => onChange("projectId", val)}>
            <SelectTrigger className="text-xs h-8.5 rounded-xl bg-background/70">
              <SelectValue placeholder="Tất cả tỉnh" />
            </SelectTrigger>
            <SelectContent className="max-h-[220px]">
              <SelectItem value="ALL" className="text-xs">Tất cả tỉnh thành ({projects.length})</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.provinceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vùng miền */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            <span>Vùng miền</span>
          </label>
          <Select value={filters.region} onValueChange={(val) => onChange("region", val)}>
            <SelectTrigger className="text-xs h-8.5 rounded-xl bg-background/70">
              <SelectValue placeholder="Tất cả miền" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Tất cả miền</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r} className="text-xs">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Giai đoạn vòng đời */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3 text-primary" />
            <span>Giai đoạn (7 Bước)</span>
          </label>
          <Select value={filters.stageId} onValueChange={(val) => onChange("stageId", val)}>
            <SelectTrigger className="text-xs h-8.5 rounded-xl bg-background/70">
              <SelectValue placeholder="Tất cả bước" />
            </SelectTrigger>
            <SelectContent className="max-h-[220px]">
              <SelectItem value="ALL" className="text-xs">Tất cả các bước</SelectItem>
              {STAGE_OPTIONS.map((st) => (
                <SelectItem key={st.id} value={String(st.id)} className="text-xs">
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sếp chủ trì IGB */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3 text-primary" />
            <span>Lãnh đạo IGB</span>
          </label>
          <Select value={filters.hostName} onValueChange={(val) => onChange("hostName", val)}>
            <SelectTrigger className="text-xs h-8.5 rounded-xl bg-background/70">
              <SelectValue placeholder="Tất cả sếp" />
            </SelectTrigger>
            <SelectContent className="max-h-[220px]">
              <SelectItem value="ALL" className="text-xs">Tất cả nhân sự chủ trì</SelectItem>
              {(teamMembers || []).filter((m: any) => m.id !== "unassigned").map((m: any) => (
                <SelectItem key={m.id} value={m.name} className="text-xs">
                  {m.name} ({m.role ? m.role.split(" - ")[0] : "Thành viên"})
                </SelectItem>
              ))}

            </SelectContent>
          </Select>
        </div>

        {/* Hình thức làm việc */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Video className="h-3 w-3 text-primary" />
            <span>Hình thức</span>
          </label>
          <Select value={filters.meetingType} onValueChange={(val) => onChange("meetingType", val)}>
            <SelectTrigger className="text-xs h-8.5 rounded-xl bg-background/70">
              <SelectValue placeholder="Tất cả hình thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Tất cả hình thức</SelectItem>
              <SelectItem value="TRUC_TIEP" className="text-xs">🚗 Trực tiếp tại địa phương</SelectItem>
              <SelectItem value="ONLINE" className="text-xs">💻 Họp trực tuyến (Online)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trạng thái */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            <span>Trạng thái</span>
          </label>
          <Select value={filters.status} onValueChange={(val) => onChange("status", val)}>
            <SelectTrigger className="text-xs h-8.5 rounded-xl bg-background/70">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Tất cả trạng thái</SelectItem>
              <SelectItem value="UPCOMING" className="text-xs">⏳ Sắp tới</SelectItem>
              <SelectItem value="DONE" className="text-xs">✅ Đã hoàn thành</SelectItem>
              <SelectItem value="CANCELLED" className="text-xs">🚫 Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span>
          Đang hiển thị: <strong className="text-foreground">{totalMatches}</strong> lịch công tác
        </span>
        <span className="italic">
          * Cập nhật tự động theo cơ chế Master Schedule & CRM B2G
        </span>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Search, RotateCcw, Filter, Calendar, Video, Building2, X } from "lucide-react";
import { DltmProject } from "../../types";
import { useGovStore } from "../../store/govStore";

export interface CalendarFilterState {
  search: string;
  solutionId: string;
  meetingType: string;
  status: string;
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilterState = {
  search: "",
  solutionId: "ALL",
  meetingType: "ALL",
  status: "ALL",
};

interface GovCalendarFiltersProps {
  filters: CalendarFilterState;
  onChange: (key: keyof CalendarFilterState, value: string) => void;
  onReset: () => void;
  onClose?: () => void;
  projects?: DltmProject[];
  totalMatches: number;
}

export function GovCalendarFilters({
  filters,
  onChange,
  onReset,
  onClose,
  totalMatches,
}: GovCalendarFiltersProps) {
  const { solutions } = useGovStore();
  const isFiltered =
    Boolean(filters.search) ||
    filters.solutionId !== "ALL" ||
    filters.meetingType !== "ALL" ||
    filters.status !== "ALL";

  return (
    <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-card/90 backdrop-blur-md space-y-2.5 shadow-sm animate-in fade-in-50 slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between pb-1.5 border-b border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-foreground">Bộ lọc lịch công tác</span>
          <span className="text-[11px] text-muted-foreground">
            (Tìm thấy: <strong className="text-foreground">{totalMatches}</strong> lịch công tác)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600 gap-1 rounded-lg cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Xóa lọc</span>
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              title="Đóng bộ lọc"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 text-xs">
        {/* 1. Tìm kiếm từ khóa */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Search className="h-3 w-3 text-primary" />
            <span>Tìm kiếm</span>
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
              placeholder="Từ khóa, địa điểm..."
              className="pl-8 h-8 text-xs rounded-lg bg-background/70"
            />
          </div>
        </div>

        {/* 2. Dự án CĐS */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3 text-primary" />
            <span>Dự án CĐS</span>
          </label>
          <Select
            value={filters.solutionId}
            onValueChange={(val) => onChange("solutionId", val)}
          >
            <SelectTrigger className="text-xs h-8 rounded-lg bg-background/70">
              <SelectValue placeholder="Tất cả dự án" />
            </SelectTrigger>
            <SelectContent className="max-h-[220px]">
              <SelectItem value="ALL" className="text-xs">
                Tất cả dự án ({solutions.length})
              </SelectItem>
              {solutions.map((sol) => (
                <SelectItem key={sol.id} value={sol.id} className="text-xs">
                  {sol.name} ({sol.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Hình thức */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Video className="h-3 w-3 text-primary" />
            <span>Hình thức</span>
          </label>
          <Select value={filters.meetingType} onValueChange={(val) => onChange("meetingType", val)}>
            <SelectTrigger className="text-xs h-8 rounded-lg bg-background/70">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Tất cả</SelectItem>
              <SelectItem value="TRUC_TIEP" className="text-xs">Trực tiếp</SelectItem>
              <SelectItem value="ONLINE" className="text-xs">Trực tuyến</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Trạng thái */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            <span>Trạng thái</span>
          </label>
          <Select value={filters.status} onValueChange={(val) => onChange("status", val)}>
            <SelectTrigger className="text-xs h-8 rounded-lg bg-background/70">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Tất cả</SelectItem>
              <SelectItem value="UPCOMING" className="text-xs">Sắp tới</SelectItem>
              <SelectItem value="DONE" className="text-xs">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED" className="text-xs">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

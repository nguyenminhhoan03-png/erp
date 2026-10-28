"use client";

import * as React from "react";
import {
  Building2,
  Send,
  Users2,
  Rocket,
  Award,
} from "lucide-react";
import { useGovStore } from "../store/govStore";

export interface GovStatsHeaderProps {
  onOpenCreateMeeting: () => void;
}
export type DltmStatsHeaderProps = GovStatsHeaderProps;

export function GovStatsHeader({ onOpenCreateMeeting }: GovStatsHeaderProps) {
  const { projects, activeSolutionId } = useGovStore();

  const activeProjects = React.useMemo(() => {
    return projects.filter((p) => !activeSolutionId || p.solutionId === activeSolutionId || p.projectId === activeSolutionId);
  }, [projects, activeSolutionId]);

  const totalProvinces = activeProjects.length;
  const dispatchedCvCount = activeProjects.filter((p) => p.stage !== "NOT_STARTED").length;
  const completedCount = activeProjects.filter((p) => p.stage === "COMPLETED").length;
  const deployingCount = activeProjects.filter((p) => p.stage === "DEPLOYING").length;

  const namesByStage = (stage: string) => {
    const names = activeProjects
      .filter((p) => p.stage === stage)
      .map((p) => p.provinceName.replace(/^(Tỉnh|Thành phố)\s+/i, ""));
    if (names.length === 0) return "Chưa có địa phương";
    return names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "");
  };
  
  const workedWithCount = activeProjects.filter(
    (p) => ["MOU_SIGNED", "SPONSOR_AGREED", "DATA_COLLECT", "DEPLOYING", "COMPLETED"].includes(p.stage)
  ).length;  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-2xs relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Số tỉnh thành
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {totalProvinces}
            </span>
            <span className="text-xs text-muted-foreground font-medium">địa phương</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            Chỉ tiêu kế hoạch tài trợ toàn quốc
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đã gửi công văn
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {dispatchedCvCount}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{Math.round((dispatchedCvCount / (totalProvinces || 1)) * 100)}% chỉ tiêu</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            Hoàn tất phát hành công văn IGB
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-2xs relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đã làm việc
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {workedWithCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">/ {totalProvinces} tỉnh</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            Đã họp, ký MOU hoặc lấy yêu cầu
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-2xs relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đang triển khai
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Rocket className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {deployingCount}
            </span>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Tích cực</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {namesByStage("DEPLOYING")}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-rose-500 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-2xs relative overflow-hidden group hover:border-emerald-500/40 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đã tài trợ (Xong)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {completedCount}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Thành công</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {namesByStage("COMPLETED")}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
        </div>
      </div>
    </div>
  );
}

export const DltmStatsHeader = GovStatsHeader;

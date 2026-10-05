"use client";

import * as React from "react";
import {
  Building2,
  Send,
  Users2,
  Rocket,
  Award,
  Calendar,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

export interface GovStatsHeaderProps {
  onOpenCreateMeeting: () => void;
}
export type DltmStatsHeaderProps = GovStatsHeaderProps;

export function GovStatsHeader({ onOpenCreateMeeting }: GovStatsHeaderProps) {
  const { projects, meetings, updateMeetingStatus, setSelectedProject, activeSolutionId, getActiveSolution } = useGovStore();

  const activeSolution = getActiveSolution();
  const activeProjects = React.useMemo(() => {
    return projects.filter((p) => (p.solutionId || "dltm") === activeSolutionId);
  }, [projects, activeSolutionId]);

  // Tính toán số liệu thống kê chuẩn theo giải pháp đang chọn
  const totalProvinces = activeProjects.length || 34; // 34
  const dispatchedCvCount = activeProjects.length; // Mọi tỉnh đều đã được IGB gửi công văn đề nghị tài trợ
  const completedCount = activeProjects.filter((p) => p.stage === "COMPLETED").length;
  const deployingCount = activeProjects.filter((p) => p.stage === "DEPLOYING").length;

  const namesByStage = (stage: string) => {
    const names = activeProjects
      .filter((p) => p.stage === stage)
      .map((p) => p.provinceName.replace(/^(Tỉnh|Thành phố)\s+/i, ""));
    if (names.length === 0) return "Chưa có địa phương";
    return names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "");
  };
  
  // Đã làm việc: các tỉnh đã qua bước phản hồi, ký MOU, tiếp nhận tài trợ, thu thập dữ liệu (hoặc đã xong)
  const workedWithCount = activeProjects.filter(
    (p) => ["MOU_SIGNED", "SPONSOR_AGREED", "DATA_COLLECT", "DEPLOYING", "COMPLETED"].includes(p.stage)
  ).length;

  const upcomingMeetings = meetings
    .filter((m) => m.status === "UPCOMING")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Tổng tỉnh thành */}
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

        {/* 2. Đã gửi công văn */}
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
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">100% chỉ tiêu</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            Hoàn tất phát hành công văn IGB
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500 opacity-60" />
        </div>

        {/* 3. Đã làm việc */}
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

        {/* 4. Đang triển khai */}
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

        {/* 5. Đã tài trợ */}
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

      {/* Widget: Lịch hẹn làm việc trong tuần (Theo đúng yêu cầu ghi chú) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-card/95 via-card/80 to-card/95 border border-border/80 backdrop-blur-md shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Lịch hẹn làm việc & Họp với các Tỉnh thành
                </h3>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  {upcomingMeetings.length} lịch sắp tới
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Theo dõi lịch làm việc thực tế với Sở Du lịch, Sở VHTTDL các địa phương
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onOpenCreateMeeting}
            className="h-8 text-xs font-semibold gap-1.5 rounded-lg shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Đặt lịch làm việc mới</span>
          </Button>
        </div>

        {/* Danh sách lịch hẹn */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {upcomingMeetings.map((meet) => {
            const project = projects.find((p) => p.id === meet.projectId);
            const dateObj = new Date(meet.scheduledAt);
            const formattedTime = dateObj.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const formattedDate = dateObj.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
            });

            return (
              <div
                key={meet.id}
                className="p-3 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all flex flex-col justify-between space-y-2.5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {meet.provinceName}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0 bg-background text-primary border-primary/30">
                      {formattedTime} • {formattedDate}
                    </Badge>
                  </div>

                  <p className="text-xs text-foreground/80 font-medium line-clamp-2 mt-1">
                    {meet.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span className="truncate max-w-[130px]">{meet.contactPerson}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (project) setSelectedProject(project);
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Chi tiết</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const DltmStatsHeader = GovStatsHeader;


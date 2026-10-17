"use client";

import * as React from "react";
import { GovProject, GovStage } from "../../types";
import { StageConfig, DLTM_STAGES } from "../../constants";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectAssigneeSelect } from "../ProjectAssigneeSelect";

const STAGE_STEPS: GovStage[] = [
  "DISPATCHED",
  "FEEDBACK",
  "MOU_SIGNED",
  "SPONSOR_AGREED",
  "DATA_COLLECT",
  "DEPLOYING",
  "COMPLETED",
];

interface ProjectDetailHeaderProps {
  project: GovProject;
  currentStageConfig: StageConfig;
  currentStepIdx: number;
  onSetPendingStage: (stage: GovStage) => void;
  onUpdateAssignee: (
    projectId: string,
    userId: number | string | null,
    name?: string,
    avatar?: string,
    role?: string
  ) => Promise<boolean | void> | void;
}

export function ProjectDetailHeader({
  project,
  currentStageConfig,
  currentStepIdx,
  onSetPendingStage,
  onUpdateAssignee,
}: ProjectDetailHeaderProps) {
  return (
    <div className="p-5 border-b border-border/80 bg-gradient-to-r from-card via-muted/30 to-card shrink-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center font-mono text-xs">
              {project.code}
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {project.name || `Dự án CĐS: ${project.provinceName}`}
            </h2>
            <Badge variant="outline" className="text-xs bg-background">
              {project.region}
            </Badge>
            {project.isMergedProvince && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              >
                Sáp nhập
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>
              Đối tác:{" "}
              <strong className="text-foreground">
                {project.leaderContact.departmentName || "Sở chuyên ngành"}
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              Phụ trách IGB:
              <ProjectAssigneeSelect
                project={project}
                onUpdateAssignee={onUpdateAssignee}
                customTrigger={
                  <button
                    type="button"
                    className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer outline-none"
                  >
                    {project.igbAssignee.avatar && (
                      <img
                        src={project.igbAssignee.avatar}
                        alt={project.igbAssignee.name}
                        className="h-4 w-4 rounded-full object-cover ring-1 ring-border"
                      />
                    )}
                    <strong className="underline underline-offset-2 decoration-border hover:decoration-primary">
                      {project.igbAssignee.name}
                    </strong>
                  </button>
                }
              />
            </span>
            <span>•</span>
            <span>
              Ngày gửi công văn:{" "}
              <strong className="text-foreground font-mono">
                {project.dispatchedDate || "2026-03-01"}
              </strong>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 pr-8">
          <Badge
            variant="outline"
            className={cn("text-xs font-semibold py-1 px-3 border", currentStageConfig.badgeClass)}
          >
            {currentStageConfig.label}
          </Badge>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider">
            Tiến trình Vòng đời Dự án
          </span>
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-primary">
              {project.progressPercent}% Hoàn tất
            </span>
            {currentStepIdx < STAGE_STEPS.length - 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetPendingStage(STAGE_STEPS[currentStepIdx + 1])}
                className="h-6.5 text-[11px] font-medium gap-1.5 px-2.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/15 cursor-pointer transition-colors shadow-2xs"
                title={`Bấm để chuyển tiếp sang bước: ${DLTM_STAGES[STAGE_STEPS[currentStepIdx + 1]]?.label}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Xong bước này & Chuyển tiếp ➔</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {STAGE_STEPS.map((stageKey, idx) => {
            const cfg = DLTM_STAGES[stageKey];
            const isCurrent = project.stage === stageKey;
            const isPassed = currentStepIdx >= 0 && idx < currentStepIdx;

            return (
              <button
                key={stageKey}
                type="button"
                onClick={() => {
                  if (isCurrent) return;
                  onSetPendingStage(stageKey);
                }}
                title={isCurrent ? `Giai đoạn hiện tại: ${cfg.label}` : `Bấm để yêu cầu chuyển sang: ${cfg.label}`}
                className={cn(
                  "h-8 rounded-lg text-[10px] font-medium px-1 flex flex-col items-center justify-center transition-all border text-center truncate cursor-pointer",
                  isCurrent && "bg-primary text-primary-foreground border-primary font-bold shadow-xs ring-2 ring-primary/30",
                  isPassed && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 font-semibold hover:border-emerald-500",
                  !isCurrent && !isPassed && "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:border-primary/40"
                )}
              >
                <span className="truncate w-full flex items-center justify-center gap-0.5">
                  {isPassed && <Check className="h-2.5 w-2.5 shrink-0" />}
                  <span>{idx + 1}. {cfg.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

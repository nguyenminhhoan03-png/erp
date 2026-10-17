"use client";

import * as React from "react";
import { GovProject, GovStage } from "../../types";
import { DLTM_STAGES } from "../../constants";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  CheckCircle2,
  History,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_STEPS: GovStage[] = [
  "DISPATCHED",
  "FEEDBACK",
  "MOU_SIGNED",
  "SPONSOR_AGREED",
  "DATA_COLLECT",
  "DEPLOYING",
  "COMPLETED",
];

const stageProgressMap: Record<string, number> = {
  NOT_STARTED: 0,
  DISPATCHED: 15,
  FEEDBACK: 30,
  MOU_SIGNED: 45,
  SPONSOR_AGREED: 60,
  DATA_COLLECT: 75,
  DEPLOYING: 90,
  COMPLETED: 100,
  PAUSED: 15,
};

interface ProjectStageConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  project: GovProject;
  currentStepIdx: number;
  pendingStage: GovStage | null;
  onConfirm: (targetStage: GovStage, autoLog: boolean) => Promise<void>;
}

export function ProjectStageConfirmDialog({
  open,
  onClose,
  project,
  currentStepIdx,
  pendingStage,
  onConfirm,
}: ProjectStageConfirmDialogProps) {
  const [autoLog, setAutoLog] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const currentStageConfig = DLTM_STAGES[project.stage];
  const currentStageNum = currentStepIdx >= 0 ? currentStepIdx + 1 : 0;
  const currentStageLabel = currentStageConfig ? currentStageConfig.label.replace(/^\d+\.\s*/, "") : "";

  const pendingStageConfig = pendingStage ? DLTM_STAGES[pendingStage] : null;
  const targetStepIdx = pendingStage ? STAGE_STEPS.indexOf(pendingStage) : -1;
  const targetStageNum = targetStepIdx >= 0 ? targetStepIdx + 1 : 0;
  const targetStageLabel = pendingStageConfig ? pendingStageConfig.label.replace(/^\d+\.\s*/, "") : "";
  const isAdvancing = targetStepIdx > currentStepIdx;

  const currentPercent = project.progressPercent;
  const targetPercent = pendingStage ? (stageProgressMap[pendingStage] ?? currentPercent) : currentPercent;

  const handleConfirm = async () => {
    if (!pendingStage) return;
    setIsSubmitting(true);
    try {
      await onConfirm(pendingStage, autoLog);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-border/80 shadow-2xl rounded-2xl gap-0">
        <div className="p-4 sm:p-5 border-b border-border/70 bg-gradient-to-r from-card via-muted/30 to-card flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ring-1",
              isAdvancing
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20"
            )}
          >
            {isAdvancing ? (
              <CheckCircle2 className="h-4.5 w-4.5" />
            ) : (
              <History className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <DialogTitle className="text-sm font-bold text-foreground leading-snug">
              {isAdvancing
                ? `Hoàn thành Bước ${currentStageNum} & Chuyển sang Bước ${targetStageNum}`
                : `Quay lại Bước ${targetStageNum}: ${pendingStageConfig?.shortLabel}`}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {project.name || `Dự án CĐS: ${project.provinceName}`} • Mã: <span className="font-mono">{project.code}</span>
            </p>
          </div>
        </div>

        {pendingStage && pendingStageConfig && (
          <div className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>Tiến trình dự án</span>
                <span className="font-mono font-bold text-primary">
                  {currentPercent}% ➔ {targetPercent}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-foreground flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-background border border-border text-muted-foreground shadow-2xs">
                  {currentStageNum}. {currentStageConfig?.shortLabel || currentStageLabel}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-lg border font-bold shadow-2xs",
                    isAdvancing
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-amber-500 text-white border-amber-600"
                  )}
                >
                  {targetStageNum}. {pendingStageConfig.shortLabel}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                {isAdvancing
                  ? `Xác nhận các thủ tục ở [Bước ${currentStageNum}: ${currentStageLabel}] đã hoàn tất. Dự án sẽ chuyển sang [Bước ${targetStageNum}: ${targetStageLabel}].`
                  : `Điều chỉnh lùi giai đoạn dự án từ [Bước ${currentStageNum}: ${currentStageLabel}] về [Bước ${targetStageNum}: ${targetStageLabel}].`}
              </p>
            </div>

            <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border/60 bg-card/60 cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={autoLog}
                onChange={(e) => setAutoLog(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground select-none">
                Tự động lưu vào <strong>Lịch sử làm việc</strong> của dự án
              </span>
            </label>
          </div>
        )}

        <div className="p-3.5 bg-muted/20 border-t border-border/70 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs h-8.5 px-3.5 cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={cn(
              "text-xs h-8.5 px-4 font-semibold gap-1.5 shadow-2xs cursor-pointer",
              isAdvancing
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            )}
          >
            {isAdvancing ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Xác nhận chuyển sang Bước {targetStageNum}</span>
              </>
            ) : (
              <>
                <History className="h-3.5 w-3.5" />
                <span>Xác nhận quay lại Bước {targetStageNum}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

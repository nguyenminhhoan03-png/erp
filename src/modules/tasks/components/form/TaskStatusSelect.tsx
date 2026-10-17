"use client";

import * as React from "react";
import { KanbanSquare, Workflow, AlertCircle, Sparkles } from "lucide-react";
import { CustomTaskStatus } from "../../types";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface TaskStatusSelectProps {
  statuses: CustomTaskStatus[];
  value: string;
  onChange: (value: string) => void;
  projectId: string;
  onOpenWorkflowConfig: (projectId: string) => void;
  onQuickInitStatuses?: () => Promise<void>;
  isInitializing?: boolean;
}

export function TaskStatusSelect({
  statuses,
  value,
  onChange,
  projectId,
  onOpenWorkflowConfig,
  onQuickInitStatuses,
  isInitializing,
}: TaskStatusSelectProps) {
  return (
    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <KanbanSquare className="h-3.5 w-3.5 text-primary" />
          <span>
            Cột trạng thái công việc (Cột Kanban) <span className="text-rose-500">*</span>
          </span>
        </label>
        <button
          type="button"
          onClick={() => onOpenWorkflowConfig(projectId)}
          className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-1"
          title="Cấu hình thêm hoặc sửa cột cho dự án này"
        >
          <Workflow className="h-3 w-3" />
          <span>Cấu hình cột dự án</span>
        </button>
      </div>

      {statuses.length === 0 ? (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold block">
                Dự án chưa được cấu hình cột trạng thái (Kanban)!
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Dự án này chưa có cột quy trình nào trong hệ thống. Vui lòng thiết lập cột để có thể xếp việc vào bảng Kanban.
              </span>
            </div>
          </div>
          {onQuickInitStatuses && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isInitializing}
                onClick={onQuickInitStatuses}
                className="h-7 text-xs font-semibold bg-background hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40 gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>
                  {isInitializing
                    ? "Đang thiết lập..."
                    : "Khởi tạo nhanh 3 cột (Cần làm, Đang làm, Hoàn thành)"}
                </span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Select value={value || statuses[0]?.key} onValueChange={onChange}>
          <SelectTrigger className="h-9 bg-card">
            <SelectValue placeholder="Chọn cột trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((st) => (
              <SelectItem key={st.key} value={st.key}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: st.color || "#64748b" }}
                  />
                  <span className="font-medium">{st.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    (
                    {st.category === "DONE"
                      ? "Nhóm Hoàn thành"
                      : st.category === "IN_PROGRESS"
                      ? "Nhóm Đang làm"
                      : "Nhóm Cần làm"}
                    )
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <p className="text-[11px] text-muted-foreground">
        Công việc mới sẽ được xếp vào cột này trên bảng Kanban của dự án.
      </p>
    </div>
  );
}

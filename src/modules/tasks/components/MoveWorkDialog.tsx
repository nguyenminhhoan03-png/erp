"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export interface MoveWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceStatus: { id: string; key: string; name: string } | null;
  availableStatuses: { id: string; key: string; name: string }[];
  onConfirm: (sourceId: string, targetKey: string) => Promise<void>;
}

export function MoveWorkDialog({
  open,
  onOpenChange,
  sourceStatus,
  availableStatuses,
  onConfirm,
}: MoveWorkDialogProps) {
  const [selectedTargetKey, setSelectedTargetKey] = React.useState<string>("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const destinationOptions = React.useMemo(() => {
    if (!sourceStatus) return availableStatuses;
    return availableStatuses.filter(
      (s) => s.id !== sourceStatus.id && s.key !== sourceStatus.key
    );
  }, [availableStatuses, sourceStatus]);

  React.useEffect(() => {
    if (open && destinationOptions.length > 0) {
      const defaultOption =
        destinationOptions.find((o) => o.key === "TODO") || destinationOptions[0];
      setSelectedTargetKey(defaultOption?.key || "");
    }
  }, [open, destinationOptions]);

  const handleDelete = async () => {
    if (!sourceStatus || !selectedTargetKey) return;
    setIsDeleting(true);
    try {
      await onConfirm(sourceStatus.id, selectedTargetKey);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!sourceStatus) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md p-6 gap-5 rounded-2xl border-border/80 shadow-2xl bg-card">
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900 shrink-0">
            <AlertCircle className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground leading-tight">
              Chuyển công việc khỏi cột &ldquo;{sourceStatus.name}&rdquo;
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Chọn cột đích mới để di chuyển toàn bộ các công việc đang thuộc cột &ldquo;{sourceStatus.name}&rdquo;, bao gồm cả công việc trong danh sách chờ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 px-1">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Cột này sẽ bị xóa
            </span>
            <div className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {sourceStatus.name}
            </div>
          </div>

          <div className="pt-5 flex justify-center text-muted-foreground/70">
            <ArrowRight className="h-4 w-4" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Công việc sẽ được chuyển tới
            </span>
            <Select
              value={selectedTargetKey}
              onValueChange={setSelectedTargetKey}
              disabled={isDeleting || destinationOptions.length === 0}
            >
              <SelectTrigger className="h-9 text-xs rounded-lg bg-background border-border font-medium">
                <SelectValue placeholder="Chọn cột đích" />
              </SelectTrigger>
              <SelectContent>
                {destinationOptions.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key} className="text-xs">
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs h-9 px-4 rounded-xl"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || !selectedTargetKey}
            className="text-xs h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 cursor-pointer"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Xóa cột & Chuyển việc</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Send, Save, Clock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { DailyReportStatus } from "@/modules/tasks/types";

interface DailyReportStatusBadgeProps {
  status?: DailyReportStatus | string | null;
  className?: string;
}

export function DailyReportStatusBadge({ status, className }: DailyReportStatusBadgeProps) {
  const normalized = status?.toLowerCase();

  switch (normalized) {
    case "approved":
      return (
        <Badge variant="success" className={`text-xs px-2.5 py-1 gap-1 ${className || ""}`}>
          <CheckCircle2 className="h-3 w-3" />
          <span>Đã duyệt</span>
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className={`text-xs px-2.5 py-1 gap-1 ${className || ""}`}>
          <XCircle className="h-3 w-3" />
          <span>Cần sửa / Từ chối</span>
        </Badge>
      );
    case "submitted":
      return (
        <Badge className={`bg-sky-500 hover:bg-sky-600 text-white text-xs px-2.5 py-1 gap-1 ${className || ""}`}>
          <Send className="h-3 w-3" />
          <span>Đã nộp</span>
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="secondary" className={`text-xs px-2.5 py-1 gap-1 ${className || ""}`}>
          <Save className="h-3 w-3" />
          <span>Bản nháp</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`text-xs px-2.5 py-1 text-muted-foreground gap-1 border-dashed ${className || ""}`}>
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>Chưa nộp</span>
        </Badge>
      );
  }
}

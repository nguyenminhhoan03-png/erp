"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Handshake,
  Calendar,
  Clock,
  DollarSign,
  User,
  CheckCircle2,
  ListTodo,
  Plus,
  FileText,
  CalendarDays,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Tag,
  AlertCircle,
  ExternalLink,
  Link2,
  Trash2,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { TaskListView } from "@/modules/tasks/components/TaskListView";
import { GovDocumentDialog } from "./GovDocumentDialog";
import { DOCUMENT_TYPE_LABELS } from "../constants";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface ProjectWorkspaceNonGovProps {
  onOpenCreateMeeting?: () => void;
}

export function ProjectWorkspaceNonGov({ onOpenCreateMeeting }: ProjectWorkspaceNonGovProps) {
  const { getActiveSolution, meetings, documents, deleteDocument } = useGovStore();
  const { tasks, isCreateOpen, openWorkflowConfig, openDetail } = useTaskStore();
  const { users } = useUserStore();

  const [activeTab, setActiveTab] = useState<"tasks" | "meetings" | "docs">("tasks");
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);

  const solution = getActiveSolution();
  const isInternal = solution.category === "INTERNAL";
  const isOutsource = solution.category === "OUTSOURCE";

  const manager = useMemo(() => {
    if (!solution.managerId) return null;
    return users.find((u) => String(u.id) === String(solution.managerId)) || null;
  }, [users, solution.managerId]);

  const projectTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.projectId && (String(t.projectId) === String(solution.id) || String(t.projectId) === solution.code)) {
        return true;
      }
      return false;
    });
  }, [tasks, solution.id, solution.code]);

  const displayTasks = projectTasks.length > 0 ? projectTasks : tasks.slice(0, 10);

  const completedTasks = displayTasks.filter(
    (t) => t.status === "DONE" || t.status === "RESOLVED" || t.status === "CLOSED"
  );
  const progressPercent = displayTasks.length > 0 ? Math.round((completedTasks.length / displayTasks.length) * 100) : 0;

  const projectMeetings = useMemo(() => {
    return meetings.filter((m) => String(m.projectId) === String(solution.id));
  }, [meetings, solution.id]);

  const projectDocs = useMemo(() => {
    return documents.filter((d) => {
      if (d.solutionId && String(d.solutionId) === String(solution.id)) return true;
      if (d.projectId && (String(d.projectId) === String(solution.id) || String(d.projectId) === solution.code)) return true;
      return false;
    });
  }, [documents, solution.id, solution.code]);

  const formatCurrency = (val?: number | null) => {
    if (!val || isNaN(val)) return "Chưa thiết lập";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 gap-1.5 shadow-2xs",
                  isInternal
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                )}
                variant="outline"
              >
                {isInternal ? <Building2 className="w-3.5 h-3.5" /> : <Handshake className="w-3.5 h-3.5" />}
                <span>{isInternal ? "Dự án Nội bộ công ty" : "Dự án Outsource Đối tác"}</span>
              </Badge>

              <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border/70">
                Mã: {solution.code}
              </Badge>

              <Badge
                variant="secondary"
                className={cn(
                  "text-[11px] capitalize",
                  solution.status === "completed"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : solution.status === "in_progress"
                      ? "bg-blue-500/15 text-blue-700"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {solution.status === "completed"
                  ? "Hoàn thành"
                  : solution.status === "in_progress"
                    ? "Đang triển khai"
                    : "Chờ thực hiện"}
              </Badge>
            </div>

            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>{solution.name}</span>
            </h2>

            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
              {solution.description || "Chưa có mô tả mục tiêu cho dự án này."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCreateMeeting && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCreateMeeting}
                className="h-8.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
              >
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                <span>Đặt lịch họp</span>
              </Button>
            )}

          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              {isInternal ? <Building2 className="w-3.5 h-3.5 text-amber-600" /> : <Handshake className="w-3.5 h-3.5 text-emerald-600" />}
              {isInternal ? "Phòng ban chủ trì" : "Đối tác / Khách hàng"}
            </span>
            <p className="text-xs font-bold text-foreground truncate">
              {isInternal ? (solution.departmentName || "Phòng Công nghệ & R&D") : (solution.partnerName || "Đối tác B2B")}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              Người quản lý / PO
            </span>
            <div className="flex items-center gap-2">
              {manager ? (
                <>
                  <UserAvatar user={manager} size="sm" />
                  <span className="text-xs font-bold text-foreground truncate">{manager.name}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">Chưa chỉ định</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Thời gian thực hiện
            </span>
            <p className="text-xs font-bold text-foreground">
              {solution.startDate ? formatDate(solution.startDate) : "Chưa đặt"} →{" "}
              {solution.endDate ? formatDate(solution.endDate) : "Chưa đặt"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Ngân sách dự kiến
            </span>
            <p className="text-xs font-bold text-foreground">
              {formatCurrency(solution.budget)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-medium">Tiến độ công việc:</span>
            <div className="w-36 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <strong className="text-foreground font-bold">{progressPercent}%</strong>
            <span className="text-[11px] text-muted-foreground">
              ({completedTasks.length}/{displayTasks.length} việc hoàn thành)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Lịch họp: <strong className="text-foreground">{projectMeetings.length}</strong></span>
            <span>Tài liệu: <strong className="text-foreground">{projectDocs.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Tasks | Meetings | Docs */}
      <div className="flex items-center gap-1 border-b border-border/70 pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer",
            activeTab === "tasks"
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <ListTodo className="w-4 h-4" />
          <span>Danh sách công việc (Tasks)</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
            {displayTasks.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("meetings")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer",
            activeTab === "meetings"
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Lịch họp & Sự kiện</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
            {projectMeetings.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer",
            activeTab === "docs"
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Tài liệu & Hợp đồng</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
            {projectDocs.length}
          </Badge>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Quản lý các hạng mục công việc, sprint và phân công nhân sự thuộc dự án.
            </p>
          </div>
          <TaskListView
            tasks={displayTasks}
            onTaskClick={openDetail}
          />
        </div>
      )}

      {activeTab === "meetings" && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>Lịch họp dự án</span>
            </h3>
            {onOpenCreateMeeting && (
              <Button size="sm" onClick={onOpenCreateMeeting} className="h-8 text-xs gap-1.5 font-semibold">
                <Plus className="w-3.5 h-3.5" />
                <span>Đặt lịch họp mới</span>
              </Button>
            )}
          </div>

          {projectMeetings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
              <Calendar className="w-8 h-8 text-muted-foreground/60 mx-auto" />
              <p>Chưa có lịch họp nào cho dự án này.</p>
              {onOpenCreateMeeting && (
                <Button variant="outline" size="sm" onClick={onOpenCreateMeeting} className="text-xs">
                  Tạo lịch họp đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {projectMeetings.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{m.title || m.content}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.scheduledAt ? formatDate(m.scheduledAt) : "Chưa có ngày"} {m.location ? `• ${m.location}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{m.status || "Chờ diễn ra"}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "docs" && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Tài liệu & Hợp đồng dự án</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quản lý các tệp hợp đồng, hồ sơ kỹ thuật, tài liệu yêu cầu và biên bản nghiệm thu.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsDocDialogOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tải lên tài liệu</span>
            </Button>
          </div>

          <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Tên tài liệu</th>
                  <th className="py-2.5 px-3">Phân loại</th>
                  <th className="py-2.5 px-3">Tệp / Link</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                  <th className="py-2.5 px-3">Người tải</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {projectDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <FileText className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="mb-2">Chưa có tài liệu hoặc hợp đồng nào được tải lên cho dự án này.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDocDialogOpen(true)}
                        className="text-xs gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tải lên tài liệu đầu tiên</span>
                      </Button>
                    </td>
                  </tr>
                ) : (
                  projectDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {doc.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <a
                          href={doc.fileUrlOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[160px]">{doc.fileName || doc.fileUrlOrLink}</span>
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate">
                        {doc.note || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                        {doc.uploadedBy || "Thành viên IGB"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
                              await deleteDocument(doc.id);
                              toast.info("Đã xóa tài liệu khỏi dự án");
                            }
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GovDocumentDialog
        open={isDocDialogOpen}
        onOpenChange={setIsDocDialogOpen}
        projectId={String(solution.id)}
        provinceName={solution.name}
        category={solution.category}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { useGovStore } from "../store/govStore";
import { GOV_STAGES, DLTM_STAGES, DOCUMENT_TYPE_LABELS } from "../constants";
import { GovStage, DltmStage, GovProjectTask, DltmProjectTask, GovDocument, GovWorkLog } from "../types";
import { GovDocumentDialog } from "./GovDocumentDialog";
import { GovLogDialog } from "./GovLogDialog";
import { GovMeetingDialog } from "./GovMeetingDialog";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  CheckSquare,
  BookOpen,
  Send,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Link2,
  KanbanSquare,
} from "lucide-react";
import { toast } from "sonner";
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

export function GovProjectDetailModal() {
  const {
    selectedProject,
    setSelectedProject,
    documents,
    workLogs,
    tasks,
    updateProjectStage,
    updateProjectNotes,
    deleteDocument,
    addTask,
    updateTaskStatus,
  } = useGovStore();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [notes, setNotes] = React.useState("");
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);

  // Sub-dialogs
  const [openDocDialog, setOpenDocDialog] = React.useState(false);
  const [openLogDialog, setOpenLogDialog] = React.useState(false);
  const [openMeetingDialog, setOpenMeetingDialog] = React.useState(false);

  // Quick Task Creation Form in Tab Tasks
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState<GovProjectTask["priority"]>("HIGH");
  const [newTaskDueDate, setNewTaskDueDate] = React.useState("");

  React.useEffect(() => {
    if (selectedProject) {
      setNotes(selectedProject.notes || "");
      setIsEditingNotes(false);
    }
  }, [selectedProject]);

  if (!selectedProject) return null;

  const currentStageConfig = GOV_STAGES[selectedProject.stage];
  const projectDocs: GovDocument[] = documents.filter((d: GovDocument) => d.projectId === selectedProject.id);
  const projectLogs: GovWorkLog[] = workLogs.filter((l: GovWorkLog) => l.projectId === selectedProject.id);
  const projectTasks: GovProjectTask[] = tasks.filter((t: GovProjectTask) => t.projectId === selectedProject.id);

  const handleSaveNotes = () => {
    updateProjectNotes(selectedProject.id, notes);
    setIsEditingNotes(false);
    toast.success("Đã lưu ghi chú dự án!");
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      projectId: selectedProject.id,
      title: newTaskTitle.trim(),
      assignedTo: selectedProject.igbAssignee.name,
      status: "TODO",
      priority: newTaskPriority,
      dueDate: newTaskDueDate || new Date().toISOString().split("T")[0],
      category: "DATA_COLLECTION",
    });

    setNewTaskTitle("");
    toast.success("Đã thêm công việc mới cho tỉnh này!");
  };

  const currentStepIdx = STAGE_STEPS.indexOf(selectedProject.stage);

  return (
    <>
      <Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header Banner */}
          <div className="p-5 border-b border-border/80 bg-gradient-to-r from-card via-muted/30 to-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center font-mono text-xs">
                    {selectedProject.code}
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedProject.name || `Dự án CĐS: ${selectedProject.provinceName}`}
                  </h2>
                  <Badge variant="outline" className="text-xs bg-background">
                    {selectedProject.region}
                  </Badge>
                  {selectedProject.isMergedProvince && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                      Sáp nhập
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Đối tác: <strong className="text-foreground">{selectedProject.leaderContact.departmentName || "Sở chuyên ngành"}</strong></span>
                  <span>•</span>
                  <span>Phụ trách IGB: <strong className="text-foreground">{selectedProject.igbAssignee.name}</strong></span>
                  <span>•</span>
                  <span>Ngày gửi công văn: <strong className="text-foreground font-mono">{selectedProject.dispatchedDate || "2026-03-01"}</strong></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold py-1 px-3 border", currentStageConfig.badgeClass)}
                >
                  {currentStageConfig.label}
                </Badge>
              </div>
            </div>

            {/* Quy trình Pipeline 7 Bước tương tác */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                  Tiến trình Vòng đời Dự án
                </span>
                <span className="font-mono font-bold text-primary">
                  {selectedProject.progressPercent}% Hoàn tất
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {STAGE_STEPS.map((stageKey, idx) => {
                  const cfg = DLTM_STAGES[stageKey];
                  const isCurrent = selectedProject.stage === stageKey;
                  const isPassed = currentStepIdx >= 0 && idx < currentStepIdx;

                  return (
                    <button
                      key={stageKey}
                      type="button"
                      onClick={() => {
                        updateProjectStage(selectedProject.id, stageKey);
                        toast.info(`Đã chuyển giai đoạn sang: ${cfg.shortLabel}`);
                      }}
                      title={`Bấm để chuyển sang: ${cfg.label}`}
                      className={cn(
                        "h-8 rounded-lg text-[10px] font-medium px-1 flex flex-col items-center justify-center transition-all border text-center truncate",
                        isCurrent && "bg-primary text-primary-foreground border-primary font-bold shadow-xs",
                        isPassed && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 font-semibold",
                        !isCurrent && !isPassed && "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      <span className="truncate w-full">{idx + 1}. {cfg.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-5 border-b border-border/80 bg-muted/20">
              <TabsList className="bg-transparent h-10 p-0 space-x-4">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold"
                >
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Tổng quan & Lịch hẹn</span>
                </TabsTrigger>

                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold"
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  <span>Bảng Task của Tỉnh ({projectTasks.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  <span>Lịch sử làm việc ({projectLogs.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="docs"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  <span>Kho Tài liệu Dự án ({projectDocs.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: TỔNG QUAN */}
            <TabsContent value="overview" className="flex-1 overflow-y-auto p-5 space-y-4 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thông tin đầu mối địa phương */}
                <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Đầu mối Lãnh đạo Địa phương</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Đơn vị:</span>{" "}
                      <strong className="text-foreground">{selectedProject.leaderContact.departmentName || "Sở chuyên ngành"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Họ tên:</span>{" "}
                      <strong className="text-foreground">{selectedProject.leaderContact.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chức vụ:</span>{" "}
                      <span className="text-foreground font-medium">{selectedProject.leaderContact.position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-mono text-foreground">{selectedProject.leaderContact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-mono text-foreground">{selectedProject.leaderContact.email}</span>
                    </div>
                  </div>
                </div>

                {/* Lịch hẹn làm việc gần nhất */}
                <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>Lịch hẹn làm việc tiếp theo</span>
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenMeetingDialog(true)}
                        className="h-7 text-[11px] gap-1 px-2"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Đặt lịch</span>
                      </Button>
                    </div>

                    {selectedProject.nextMeetingDate ? (
                      <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-mono">{selectedProject.nextMeetingDate}</span>
                        </div>
                        <p className="text-xs text-foreground font-medium">
                          {selectedProject.nextMeetingContent}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-2">
                        Chưa có lịch hẹn làm việc mới với tỉnh này.
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    * Các buổi hẹn sẽ tự động đồng bộ lên widget lịch trên Dashboard.
                  </p>
                </div>
              </div>

              {/* Ghi chú dự án */}
              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ghi chú chi tiết & Định hướng triển khai
                  </h4>
                  {!isEditingNotes ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNotes(true)}
                      className="h-7 text-xs text-primary"
                    >
                      Sửa ghi chú
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      className="h-7 text-xs font-semibold"
                    >
                      Lưu
                    </Button>
                  )}
                </div>

                {isEditingNotes ? (
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs min-h-[90px] resize-none"
                    placeholder="Nhập ghi chú quan trọng về tiến độ tiếp cận, yêu cầu đặc thù của địa phương..."
                  />
                ) : (
                  <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                    {selectedProject.notes || "Chưa có ghi chú nào."}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: BẢNG TASK NỘI BỘ CỦA TỈNH */}
            <TabsContent value="tasks" className="flex-1 overflow-y-auto p-5 space-y-4 m-0">
              <div className="flex items-center justify-between pb-2 border-b border-border/60 gap-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Công việc triển khai cho {selectedProject.provinceName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Các đầu việc phân bổ cho nhân sự IT, Content, Design thực hiện riêng cho tỉnh này
                  </p>
                </div>

                <Link
                  href={`/tasks?projectId=DLTM_${selectedProject.code}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shrink-0"
                >
                  <KanbanSquare className="h-3.5 w-3.5" />
                  <span>Mở trên Jira Board ↗</span>
                </Link>
              </div>

              {/* Quick Task Creation */}
              <form onSubmit={handleQuickAddTask} className="flex gap-2">
                <Input
                  placeholder="+ Thêm nhanh công việc mới cho tỉnh này..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="text-xs h-9 flex-1"
                />
                <Button type="submit" size="sm" className="h-9 text-xs font-semibold shrink-0">
                  Thêm Task
                </Button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2">
                {projectTasks.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-xs border border-dashed border-border/80 rounded-xl">
                    Chưa có công việc nào được gán cho tỉnh này.
                  </div>
                ) : (
                  projectTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = t.status === "DONE" ? "TODO" : "DONE";
                            updateTaskStatus(t.id, nextStatus);
                          }}
                          className={cn(
                            "h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                            t.status === "DONE" ? "bg-emerald-500 border-emerald-500 text-white" : "border-border hover:border-primary"
                          )}
                        >
                          {t.status === "DONE" && <CheckSquare className="h-3.5 w-3.5" />}
                        </button>
                        <span
                          className={cn(
                            "text-xs font-medium text-foreground truncate",
                            t.status === "DONE" && "line-through text-muted-foreground"
                          )}
                        >
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {t.assignedTo}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            t.priority === "URGENT" && "border-rose-500/40 text-rose-600 bg-rose-500/10",
                            t.priority === "HIGH" && "border-amber-500/40 text-amber-600 bg-amber-500/10",
                            t.priority === "MEDIUM" && "border-blue-500/40 text-blue-600 bg-blue-500/10"
                          )}
                        >
                          {t.priority}
                        </Badge>
                        <span className="text-[11px] font-mono text-muted-foreground">{t.dueDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 3: TIẾN ĐỘ & LỊCH SỬ LÀM VIỆC */}
            <TabsContent value="logs" className="flex-1 overflow-y-auto p-5 space-y-4 m-0">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Nhật ký & Lịch sử các buổi làm việc
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Bảng lưu vết chi tiết từng lần trao đổi, họp trực tiếp hoặc trực tuyến với tỉnh
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setOpenLogDialog(true)}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ghi nhận nhật ký</span>
                </Button>
              </div>

              <div className="space-y-3">
                {projectLogs.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-xs border border-dashed border-border/80 rounded-xl">
                    Chưa có nhật ký làm việc nào được ghi nhận cho tỉnh này.
                  </div>
                ) : (
                  projectLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-border/80 bg-card space-y-2 relative"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px] font-mono bg-primary/5 text-primary border-primary/20">
                            {log.meetingDate}
                          </Badge>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {log.meetingType === "TRUC_TIEP" ? "🏢 Trực tiếp" : log.meetingType === "ONLINE" ? "💻 Online" : "📞 Điện thoại"}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Ghi chú bởi: <strong>{log.recordedBy}</strong>
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">
                          <strong className="text-foreground">Thành phần:</strong> {log.participants}
                        </p>
                        <p className="text-foreground font-medium leading-relaxed">
                          {log.content}
                        </p>
                        {log.agreements && (
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] mt-1.5">
                            <strong>Kết quả / Thỏa thuận:</strong> {log.agreements}
                          </div>
                        )}
                        {log.nextSteps && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            <strong>Bước tiếp theo:</strong> {log.nextSteps}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 4: KHO TÀI LIỆU DỰ ÁN */}
            <TabsContent value="docs" className="flex-1 overflow-y-auto p-5 space-y-4 m-0">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Hồ sơ & Tài liệu Dự án
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Bảng riêng lưu trữ file công văn, biên bản ghi nhớ MOU, logo và dữ liệu địa điểm du lịch
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setOpenDocDialog(true)}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tải lên tài liệu</span>
                </Button>
              </div>

              {/* Bảng tài liệu riêng theo đúng yêu cầu */}
              <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3">Tên tài liệu</th>
                      <th className="py-2.5 px-3">Phân loại</th>
                      <th className="py-2.5 px-3">Tệp / Link</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {projectDocs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          Chưa có tài liệu nào trong hồ sơ tỉnh này. Bấm "+ Tải lên tài liệu" để thêm.
                        </td>
                      </tr>
                    ) : (
                      projectDocs.map((doc: GovDocument) => (
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
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[150px]">{doc.fileName || doc.fileUrlOrLink}</span>
                            </a>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate">
                            {doc.note || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                deleteDocument(doc.id);
                                toast.info("Đã xóa tài liệu khỏi hồ sơ");
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sub Dialogs */}
      <GovDocumentDialog
        open={openDocDialog}
        onOpenChange={setOpenDocDialog}
        projectId={selectedProject.id}
        provinceName={selectedProject.provinceName}
      />

      <GovLogDialog
        open={openLogDialog}
        onOpenChange={setOpenLogDialog}
        projectId={selectedProject.id}
        provinceName={selectedProject.provinceName}
      />

      <GovMeetingDialog
        open={openMeetingDialog}
        onOpenChange={setOpenMeetingDialog}
        defaultProjectId={selectedProject.id}
      />
    </>
  );
}

export const DltmProjectDetailModal = GovProjectDetailModal;


"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckSquare,
  BookOpen,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { toast } from "sonner";
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { taskService } from "@/modules/tasks/services/taskService";
import { GovStage, GovWorkLog } from "@/modules/gov-solutions/types";
import { Task } from "@/modules/tasks/types";
import { DLTM_STAGES } from "@/modules/gov-solutions/constants";
import { ProjectDetailHeader } from "@/modules/gov-solutions/components/detail/ProjectDetailHeader";
import { ProjectOverviewTab } from "@/modules/gov-solutions/components/detail/ProjectOverviewTab";
import { ProjectTasksTab } from "@/modules/gov-solutions/components/detail/ProjectTasksTab";
import { ProjectLogsTab } from "@/modules/gov-solutions/components/detail/ProjectLogsTab";
import { ProjectDocsTab } from "@/modules/gov-solutions/components/detail/ProjectDocsTab";
import { ProjectStageConfirmDialog } from "@/modules/gov-solutions/components/detail/ProjectStageConfirmDialog";
import { GovDocumentDialog } from "@/modules/gov-solutions/components/GovDocumentDialog";
import { GovLogDialog } from "@/modules/gov-solutions/components/GovLogDialog";
import { GovMeetingDialog } from "@/modules/gov-solutions/components/GovMeetingDialog";
import { TaskDialog } from "@/modules/tasks/components/TaskDialog";
import { TaskFormDialog } from "@/modules/tasks/components/TaskFormDialog";

const STAGE_STEPS: GovStage[] = [
  "DISPATCHED",
  "FEEDBACK",
  "MOU_SIGNED",
  "SPONSOR_AGREED",
  "DATA_COLLECT",
  "DEPLOYING",
  "COMPLETED",
];

export default function GovProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const {
    projects,
    fetchInitial,
    updateProjectStage,
    updateProjectNotes,
    updateProjectAssignee,
    documents,
    workLogs,
    meetings,
    deleteDocument,
    updateMeetingStatus,
    deleteMeeting,
    fetchProvinceWorkLogs,
    fetchProvinceDocuments,
    addWorkLog,
  } = useGovStore();

  const { currentUser } = useUserStore();
  const { isCreateOpen } = useTaskStore();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [notes, setNotes] = React.useState("");
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);

  const [openDocDialog, setOpenDocDialog] = React.useState(false);
  const [openLogDialog, setOpenLogDialog] = React.useState(false);
  const [editingLog, setEditingLog] = React.useState<GovWorkLog | null>(null);
  const [openMeetingDialog, setOpenMeetingDialog] = React.useState(false);
  const [pendingStage, setPendingStage] = React.useState<GovStage | null>(null);

  const [provinceTasks, setProvinceTasks] = React.useState<Task[]>([]);
  const [isLoadingProvinceTasks, setIsLoadingProvinceTasks] = React.useState(false);
  const prevCreateOpenRef = React.useRef(isCreateOpen);

  React.useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const project = projects.find((p) => p.id === projectId || p.code === projectId);

  const loadProvinceTasks = React.useCallback(async (govId: string) => {
    setIsLoadingProvinceTasks(true);
    try {
      const res = await taskService.getTasks({
        projectId: `gov_${govId}`,
        perPage: 50,
      });
      setProvinceTasks(res.tasks || []);
    } catch (e) {
      console.warn("Failed to load province tasks:", e);
      setProvinceTasks([]);
    } finally {
      setIsLoadingProvinceTasks(false);
    }
  }, []);

  React.useEffect(() => {
    if (prevCreateOpenRef.current && !isCreateOpen && project) {
      loadProvinceTasks(project.id);
    }
    prevCreateOpenRef.current = isCreateOpen;
  }, [isCreateOpen, project, loadProvinceTasks]);

  React.useEffect(() => {
    if (project) {
      setNotes(project.notes || "");
      setIsEditingNotes(false);
      loadProvinceTasks(project.id);
      if (project.provinceId) {
        fetchProvinceWorkLogs(project.id, project.provinceId);
        fetchProvinceDocuments(project.id, project.provinceId);
      }
    }
  }, [project, fetchProvinceWorkLogs, fetchProvinceDocuments, loadProvinceTasks]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">Không tìm thấy dự án</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Dự án chuyển đổi số này không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/projects")}
          className="rounded-xl text-xs gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách dự án</span>
        </Button>
      </div>
    );
  }

  const currentStageConfig = DLTM_STAGES[project.stage];
  const projectDocs = documents.filter((d) => d.projectId === project.id);
  const projectLogs = workLogs.filter((l) => l.projectId === project.id);
  const projectMeetings = meetings.filter((m) => String(m.projectId) === String(project.id));
  const currentStepIdx = STAGE_STEPS.indexOf(project.stage);

  const handleSaveNotes = () => {
    updateProjectNotes(project.id, notes);
    setIsEditingNotes(false);
    toast.success("Đã cập nhật ghi chú dự án");
  };

  const handleQuickAddTask = async (title: string, priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM") => {
    try {
      const assigneeIds =
        project.igbAssignee?.id && project.igbAssignee.id !== "unassigned"
          ? [String(project.igbAssignee.id)]
          : [];

      const newTask = await taskService.createTask({
        title,
        description: `Công việc triển khai cho ${project.provinceName}`,
        projectId: `gov_${project.id}`,
        projectKey: project.code || "GOV",
        projectName: `Dự án CĐS ${project.provinceName}`,
        priority,
        status: "TODO",
        dueDate: new Date().toISOString(),
        assigneeIds,
        creatorId: currentUser?.id || "1",
        checklist: [],
        commentsCount: 0,
        tags: ["CĐS", project.provinceName],
        departmentId: "",
      });

      setProvinceTasks((prev) => [newTask, ...prev]);
      toast.success("Đã tạo công việc thành công vào hệ thống!");
    } catch (e) {
      console.error("Failed to quick add task:", e);
      toast.error("Không thể tạo công việc");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task["status"]) => {
    try {
      await taskService.updateTask(taskId, { status });
      setProvinceTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    } catch (e) {
      console.error("Failed to update task status:", e);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleConfirmStage = async (targetStage: GovStage, autoLog: boolean) => {
    const nextLabel = DLTM_STAGES[targetStage]?.label;
    const isAdvancing = STAGE_STEPS.indexOf(targetStage) > currentStepIdx;

    await updateProjectStage(project.id, targetStage);
    setPendingStage(null);

    if (autoLog && addWorkLog) {
      const currentClean = currentStageConfig.label.replace(/^\d+\.\s*/, "");
      const targetClean = DLTM_STAGES[targetStage]?.label.replace(/^\d+\.\s*/, "");
      addWorkLog({
        projectId: project.id,
        solutionId: project.solutionId,
        stageId: STAGE_STEPS.indexOf(targetStage) + 1,
        logType: "STAGE_CHANGE",
        title: `Chuyển giai đoạn: ${targetClean}`,
        meetingDate: new Date().toISOString().replace("T", " ").substring(0, 19),
        meetingType: "ONLINE",
        participants: project.leaderContact.fullName || project.provinceName,
        recordedBy:
          project.igbAssignee.name !== "Chưa phân công"
            ? project.igbAssignee.name
            : "Ban dự án IGB",
        content: isAdvancing
          ? `Đã hoàn thành bước [${currentClean}] và chuyển dự án sang bước [${targetClean}].`
          : `Đã điều chỉnh lùi giai đoạn từ [${currentClean}] về [${targetClean}].`,
      });
    }

    toast.success(`Đã chuyển sang giai đoạn: ${nextLabel}`);
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/projects" className="hover:text-primary transition-colors">
              Quản lý dự án
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{project.provinceName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="h-8 w-8 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Quay lại danh sách dự án"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {project.name || `Dự án CĐS: ${project.provinceName}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenMeetingDialog(true)}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <span>+ Lên lịch hẹn</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setOpenLogDialog(true)}
            className="rounded-xl text-xs gap-1.5 h-9 bg-primary"
          >
            <span>+ Ghi nhật ký</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {/* Project Pipeline Header */}
        <ProjectDetailHeader
          project={project}
          currentStageConfig={currentStageConfig}
          currentStepIdx={currentStepIdx}
          onSetPendingStage={setPendingStage}
          onUpdateAssignee={updateProjectAssignee}
        />

        {/* Tabbed Workspace */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-5 border-b border-border/80 bg-muted/20">
            <TabsList className="bg-transparent h-11 p-0 space-x-6">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer h-11"
              >
                <Building2 className="h-4 w-4 mr-1.5" />
                <span>Tổng quan & Lịch hẹn ({projectMeetings.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer h-11"
              >
                <CheckSquare className="h-4 w-4 mr-1.5 text-emerald-500" />
                <span>Task dự án ({provinceTasks.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer h-11"
              >
                <BookOpen className="h-4 w-4 mr-1.5 text-amber-500" />
                <span>Lịch sử làm việc ({projectLogs.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="docs"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer h-11"
              >
                <FileText className="h-4 w-4 mr-1.5 text-blue-500" />
                <span>Kho Tài liệu Dự án ({projectDocs.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="m-0 focus-visible:outline-none">
              <ProjectOverviewTab
                project={project}
                meetings={projectMeetings}
                notes={notes}
                setNotes={setNotes}
                isEditingNotes={isEditingNotes}
                setIsEditingNotes={setIsEditingNotes}
                onSaveNotes={handleSaveNotes}
                onOpenMeetingDialog={() => setOpenMeetingDialog(true)}
                onUpdateMeetingStatus={updateMeetingStatus}
                onDeleteMeeting={deleteMeeting}
              />
            </TabsContent>

            <TabsContent value="tasks" className="m-0 focus-visible:outline-none">
              <ProjectTasksTab
                project={project}
                tasks={provinceTasks}
                isLoading={isLoadingProvinceTasks}
                onQuickAddTask={handleQuickAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onTaskDeleted={(taskId) =>
                  setProvinceTasks((prev) => prev.filter((t) => t.id !== taskId))
                }
              />
            </TabsContent>

            <TabsContent value="logs" className="m-0 focus-visible:outline-none">
              <ProjectLogsTab
                logs={projectLogs}
                onOpenLogDialog={() => {
                  setEditingLog(null);
                  setOpenLogDialog(true);
                }}
                onEditLog={(log) => {
                  setEditingLog(log);
                  setOpenLogDialog(true);
                }}
              />
            </TabsContent>

            <TabsContent value="docs" className="m-0 focus-visible:outline-none">
              <ProjectDocsTab
                docs={projectDocs}
                onOpenDocDialog={() => setOpenDocDialog(true)}
                onDeleteDoc={deleteDocument}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Floating Action Modals */}
      <GovDocumentDialog
        open={openDocDialog}
        onOpenChange={setOpenDocDialog}
        projectId={project.id}
        provinceName={project.provinceName}
      />

      <GovLogDialog
        open={openLogDialog}
        onOpenChange={(open) => {
          setOpenLogDialog(open);
          if (!open) setEditingLog(null);
        }}
        projectId={project.id}
        provinceName={project.provinceName}
        editingLog={editingLog}
      />

      <GovMeetingDialog
        open={openMeetingDialog}
        onOpenChange={setOpenMeetingDialog}
        defaultProjectId={project.id}
      />

      <ProjectStageConfirmDialog
        open={Boolean(pendingStage)}
        onClose={() => setPendingStage(null)}
        project={project}
        currentStepIdx={currentStepIdx}
        pendingStage={pendingStage}
        onConfirm={handleConfirmStage}
      />

      <TaskDialog />
      <TaskFormDialog />
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { useGovStore } from "../store/govStore";
import { DLTM_STAGES } from "../constants";
import { GovStage, GovProjectTask, GovWorkLog } from "../types";
import { GovDocumentDialog } from "./GovDocumentDialog";
import { GovLogDialog } from "./GovLogDialog";
import { GovMeetingDialog } from "./GovMeetingDialog";
import { ProjectDetailHeader } from "./detail/ProjectDetailHeader";
import { ProjectOverviewTab } from "./detail/ProjectOverviewTab";
import { ProjectTasksTab } from "./detail/ProjectTasksTab";
import { ProjectLogsTab } from "./detail/ProjectLogsTab";
import { ProjectDocsTab } from "./detail/ProjectDocsTab";
import { ProjectStageConfirmDialog } from "./detail/ProjectStageConfirmDialog";
import {
  Building2,
  CheckSquare,
  BookOpen,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

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
    updateProjectStage,
    updateProjectNotes,
    updateProjectAssignee,
    documents,
    workLogs,
    meetings,
    tasks,
    updateTaskStatus,
    addTask,
    deleteDocument,
    updateMeetingStatus,
    deleteMeeting,
    fetchProvinceWorkLogs,
    fetchProvinceDocuments,
    addWorkLog,
  } = useGovStore();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [notes, setNotes] = React.useState("");
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);

  const [openDocDialog, setOpenDocDialog] = React.useState(false);
  const [openLogDialog, setOpenLogDialog] = React.useState(false);
  const [editingLog, setEditingLog] = React.useState<GovWorkLog | null>(null);
  const [openMeetingDialog, setOpenMeetingDialog] = React.useState(false);
  const [pendingStage, setPendingStage] = React.useState<GovStage | null>(null);

  React.useEffect(() => {
    if (selectedProject) {
      setNotes(selectedProject.notes || "");
      setIsEditingNotes(false);
      if (selectedProject.provinceId) {
        fetchProvinceWorkLogs(selectedProject.id, selectedProject.provinceId);
        fetchProvinceDocuments(selectedProject.id, selectedProject.provinceId);
      }
    }
  }, [selectedProject, fetchProvinceWorkLogs, fetchProvinceDocuments]);

  if (!selectedProject) return null;

  const currentStageConfig = DLTM_STAGES[selectedProject.stage];
  const projectDocs = documents.filter((d) => d.projectId === selectedProject.id);
  const projectLogs = workLogs.filter((l) => l.projectId === selectedProject.id);
  const projectTasks = tasks.filter((t) => t.projectId === selectedProject.id);
  const projectMeetings = meetings.filter((m) => String(m.projectId) === String(selectedProject.id));
  const currentStepIdx = STAGE_STEPS.indexOf(selectedProject.stage);

  const handleSaveNotes = () => {
    updateProjectNotes(selectedProject.id, notes);
    setIsEditingNotes(false);
    toast.success("Đã cập nhật ghi chú dự án");
  };

  const handleQuickAddTask = (title: string, priority: GovProjectTask["priority"] = "HIGH") => {
    addTask({
      projectId: selectedProject.id,
      title,
      assignedTo: selectedProject.igbAssignee.name,
      status: "TODO",
      priority,
      dueDate: new Date().toISOString().split("T")[0],
      category: "DATA_COLLECTION",
    });
    toast.success("Đã tạo công việc mới cho tỉnh này");
  };

  const handleConfirmStage = async (targetStage: GovStage, autoLog: boolean) => {
    const nextLabel = DLTM_STAGES[targetStage]?.label;
    const isAdvancing = STAGE_STEPS.indexOf(targetStage) > currentStepIdx;

    await updateProjectStage(selectedProject.id, targetStage);

    if (autoLog) {
      const currentClean = currentStageConfig.label.replace(/^\d+\.\s*/, "");
      const targetClean = DLTM_STAGES[targetStage]?.label.replace(/^\d+\.\s*/, "");
      addWorkLog({
        projectId: selectedProject.id,
        solutionId: selectedProject.solutionId,
        stageId: STAGE_STEPS.indexOf(targetStage) + 1,
        logType: "STAGE_CHANGE",
        title: `Chuyển giai đoạn: ${targetClean}`,
        meetingDate: new Date().toISOString().replace("T", " ").substring(0, 19),
        meetingType: "ONLINE",
        participants: selectedProject.leaderContact.fullName || selectedProject.provinceName,
        recordedBy: selectedProject.igbAssignee.name !== "Chưa phân công" ? selectedProject.igbAssignee.name : "Ban dự án IGB",
        content: isAdvancing
          ? `Đã hoàn thành bước [${currentClean}] và chuyển dự án sang bước [${targetClean}].`
          : `Đã điều chỉnh lùi giai đoạn từ [${currentClean}] về [${targetClean}].`,
      });
    }

    toast.success(`Đã chuyển sang giai đoạn: ${nextLabel}`);
  };

  return (
    <>
      <Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-4xl h-[88vh] max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header Thông tin dự án & Stepper */}
          <ProjectDetailHeader
            project={selectedProject}
            currentStageConfig={currentStageConfig}
            currentStepIdx={currentStepIdx}
            onSetPendingStage={setPendingStage}
            onUpdateAssignee={updateProjectAssignee}
          />

          {/* Nội dung các Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <div className="px-5 border-b border-border/80 bg-muted/20 shrink-0">
              <TabsList className="bg-transparent h-10 p-0 space-x-4">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer"
                >
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Tổng quan & Lịch hẹn ({projectMeetings.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  <span>Task dự án ({projectTasks.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  <span>Lịch sử làm việc ({projectLogs.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="docs"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-1 text-xs font-semibold cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  <span>Kho Tài liệu Dự án ({projectDocs.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="overview"
              className="flex-1 min-h-0 overflow-y-auto m-0 p-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ProjectOverviewTab
                project={selectedProject}
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

            <TabsContent
              value="tasks"
              className="flex-1 min-h-0 overflow-y-auto m-0 p-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ProjectTasksTab
                project={selectedProject}
                tasks={projectTasks}
                onQuickAddTask={handleQuickAddTask}
                onUpdateTaskStatus={updateTaskStatus}
              />
            </TabsContent>

            <TabsContent
              value="logs"
              className="flex-1 min-h-0 overflow-y-auto m-0 p-0 focus-visible:outline-none focus-visible:ring-0"
            >
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

            <TabsContent
              value="docs"
              className="flex-1 min-h-0 overflow-y-auto m-0 p-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ProjectDocsTab
                docs={projectDocs}
                onOpenDocDialog={() => setOpenDocDialog(true)}
                onDeleteDoc={deleteDocument}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog con chức năng */}
      <GovDocumentDialog
        open={openDocDialog}
        onOpenChange={setOpenDocDialog}
        projectId={selectedProject.id}
        provinceName={selectedProject.provinceName}
      />

      <GovLogDialog
        open={openLogDialog}
        onOpenChange={(open) => {
          setOpenLogDialog(open);
          if (!open) setEditingLog(null);
        }}
        projectId={selectedProject.id}
        provinceName={selectedProject.provinceName}
        editingLog={editingLog}
      />

      <GovMeetingDialog
        open={openMeetingDialog}
        onOpenChange={setOpenMeetingDialog}
        defaultProjectId={selectedProject.id}
      />

      <ProjectStageConfirmDialog
        open={Boolean(pendingStage)}
        onClose={() => setPendingStage(null)}
        project={selectedProject}
        currentStepIdx={currentStepIdx}
        pendingStage={pendingStage}
        onConfirm={handleConfirmStage}
      />
    </>
  );
}

export const DltmProjectDetailModal = GovProjectDetailModal;

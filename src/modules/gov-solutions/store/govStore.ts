import { create } from "zustand";
import {
  DltmProject,
  DltmDocument,
  DltmWorkLog,
  DltmMeetingSchedule,
  DltmProjectTask,
  DltmStage,
  DltmFilterParams,
  DigitalSolution,
  DltmCalendarSummary,
} from "../types";
import { DEFAULT_DIGITAL_SOLUTIONS, IGB_TEAM_MEMBERS } from "../constants";
import { govService } from "../services/govService";

interface DltmState {
  solutions: DigitalSolution[];
  activeSolutionId: string;
  activeMainTab: "solution_workspace" | "coverage_matrix";

  projects: DltmProject[];
  documents: DltmDocument[];
  workLogs: DltmWorkLog[];
  meetings: DltmMeetingSchedule[];
  tasks: DltmProjectTask[];
  calendarSummary: DltmCalendarSummary | null;
  selectedProject: DltmProject | null;
  filters: DltmFilterParams;
  viewMode: "table" | "kanban";

  fetchInitial: (forceProjectId?: string) => Promise<void>;
  setActiveSolutionId: (id: string) => void;
  setActiveMainTab: (tab: "solution_workspace" | "coverage_matrix") => void;
  addDigitalSolution: (solution: Omit<DigitalSolution, "id" | "activeCount">) => Promise<DigitalSolution>;
  updateDigitalSolution: (id: string, solution: Partial<DigitalSolution>) => Promise<boolean>;
  deleteDigitalSolution: (id: string) => Promise<boolean>;
  getActiveSolution: () => DigitalSolution;

  addProvinceToProject: (provinceId: number, stageId?: number, targetSolutionId?: string) => Promise<boolean>;
  initAllTargetProvinces: (targetSolutionId?: string) => Promise<{ success: boolean; insertedCount?: number }>;
  fetchAvailableProvinces: (targetSolutionId?: string) => Promise<{ id: number; name: string; region: string }[]>;

  setSelectedProject: (project: DltmProject | null) => void;
  setViewMode: (mode: "table" | "kanban") => void;
  setFilters: (filters: Partial<DltmFilterParams>) => void;
  resetFilters: () => void;

  updateProjectStage: (projectId: string, newStage: DltmStage) => Promise<void>;
  updateProjectNotes: (projectId: string, notes: string) => void;
  teamMembers: any[];
  updateProjectAssignee: (
    projectId: string,
    userId: number | string | null,
    assigneeName?: string,
    avatar?: string,
    role?: string
  ) => Promise<boolean>;
  updateLeaderContact: (projectId: string, contact: {
    fullName: string;
    position?: string;
    departmentName?: string;
    phone?: string;
    email?: string;
  }) => Promise<boolean>;

  addDocument: (doc: Omit<DltmDocument, "id" | "uploadedAt"> | FormData) => Promise<boolean>;
  deleteDocument: (docId: string) => Promise<boolean>;
  fetchProvinceDocuments: (projectId: string, provinceId?: number) => Promise<void>;
  fetchProjectDocuments: (projectId: string) => Promise<void>;

  addWorkLog: (log: Omit<DltmWorkLog, "id" | "createdAt">) => Promise<boolean>;
  updateWorkLog: (logId: string, updates: any) => Promise<boolean>;
  deleteWorkLog: (logId: string) => Promise<boolean>;
  fetchProvinceWorkLogs: (projectId: string, provinceId?: number) => Promise<void>;

  addMeeting: (meeting: Omit<DltmMeetingSchedule, "id">) => Promise<any>;
  updateMeeting: (meetingId: string, updates: any, projectId?: string) => Promise<boolean>;
  deleteMeeting: (meetingId: string, projectId?: string) => Promise<boolean>;
  updateMeetingStatus: (meetingId: string, status: "UPCOMING" | "IN_PROGRESS" | "DONE" | "CANCELLED", projectId?: string) => Promise<boolean>;
  fetchMasterCalendarSummary: (filters?: Record<string, any>) => Promise<DltmCalendarSummary | null>;
  fetchMasterCalendar: (filters?: Record<string, any>) => Promise<{
    total: number;
    conflict_count: number;
    summary?: DltmCalendarSummary;
    meetings: DltmMeetingSchedule[];
  }>;

  addTask: (task: Omit<DltmProjectTask, "id">) => void;
  updateTaskStatus: (taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

const DEFAULT_FILTERS: DltmFilterParams = {
  search: "",
  region: "ALL",
  stage: "ALL",
  assigneeId: "ALL",
};

export type GovState = DltmState;

export const useGovStore = create<GovState>((set, get) => ({
  solutions: DEFAULT_DIGITAL_SOLUTIONS,
  activeSolutionId: "",
  activeMainTab: "solution_workspace",

  projects: [],
  documents: [],
  workLogs: [],
  meetings: [],
  tasks: [],
  calendarSummary: null,
  teamMembers: IGB_TEAM_MEMBERS,
  selectedProject: null,
  filters: DEFAULT_FILTERS,
  viewMode: "table",

  fetchInitial: async (forceProjectId?: string) => {
    const targetSolId = forceProjectId || get().activeSolutionId;
    const res = await govService.bootstrap(targetSolId);

    set((state) => {
      const solutions = res.solutions.length ? res.solutions : state.solutions;
      let activeSolutionId = state.activeSolutionId;

      if (forceProjectId && solutions.some((s) => s.id === forceProjectId)) {
        activeSolutionId = forceProjectId;
      } else if (res.activeProjectId) {
        activeSolutionId = String(res.activeProjectId);
      } else if (!activeSolutionId || !solutions.some((s) => s.id === activeSolutionId)) {
        activeSolutionId = solutions[0]?.id || "";
      }

      const activeSol = solutions.find((s) => s.id === activeSolutionId);
      const isGovProject = !activeSol || !activeSol.category || activeSol.category === "GOV";

      return {
        solutions,
        activeSolutionId,
        projects: isGovProject ? res.provinces : [],
        meetings: res.upcomingMeetings,
        documents: res.documents,
      };
    });
  },

  setActiveSolutionId: (id: string) => {
    set({ activeSolutionId: id, selectedProject: null });
    get().fetchInitial(id);
  },

  setActiveMainTab: (tab: "solution_workspace" | "coverage_matrix") => {
    set({ activeMainTab: tab });
  },

  getActiveSolution: (): DigitalSolution => {
    const { solutions, activeSolutionId } = get();
    return solutions.find((s) => s.id === activeSolutionId) || solutions[0] || {
      id: "gov-default",
      name: "Chuyển đổi số Chính quyền",
      shortName: "Gov Solutions",
      code: "GOV",
      iconName: "Landmark",
      colorHex: "#3b82f6",
      badgeClass: "bg-blue-500/10 text-blue-600",
      targetGovDepartment: "Sở TTTT",
      dataAssetDescription: "",
      description: "",
      activeCount: 0,
      category: "GOV",
    };
  },

  addDigitalSolution: async (solutionData) => {
    const newSolution = await govService.createSolution(solutionData);
    set((state) => ({
      solutions: [...state.solutions, newSolution],
      activeSolutionId: newSolution.id,
    }));
    await get().fetchInitial(newSolution.id);
    return newSolution;
  },

  updateDigitalSolution: async (id, updates) => {
    const updated = await govService.updateSolution(id, updates);
    set((state) => ({
      solutions: state.solutions.map((s) => (s.id === id ? updated : s)),
    }));
    return true;
  },

  deleteDigitalSolution: async (id) => {
    const ok = await govService.deleteSolution(id);
    if (ok) {
      set((state) => {
        const remaining = state.solutions.filter((s) => s.id !== id);
        const nextActiveId = state.activeSolutionId === id ? remaining[0]?.id || "" : state.activeSolutionId;
        return {
          solutions: remaining,
          activeSolutionId: nextActiveId,
        };
      });
      return true;
    }
    return false;
  },

  fetchAvailableProvinces: async (targetSolutionId) => {
    const solId = targetSolutionId || get().activeSolutionId;
    return govService.getAvailableProvinces(solId);
  },

  addProvinceToProject: async (provinceId, stageId, targetSolutionId) => {
    const solId = targetSolutionId || get().activeSolutionId;
    try {
      const newProj = await govService.addProvince(solId, {
        province_id: provinceId,
        stage_id: stageId || 1,
      });
      if (!newProj.solutionId && solId) newProj.solutionId = String(solId);
      if (!newProj.projectId && solId) newProj.projectId = String(solId);
      set((state) => ({
        projects: [
          ...state.projects.filter(
            (p) => !(p.provinceId === newProj.provinceId && (p.solutionId === String(solId) || p.projectId === String(solId)))
          ),
          newProj,
        ],
      }));
      return true;
    } catch {
      return false;
    }
  },

  initAllTargetProvinces: async (targetSolutionId) => {
    const solId = targetSolutionId || get().activeSolutionId;
    const count = await govService.initProvinces(solId);
    if (count > 0) {
      await get().fetchInitial(solId);
      return { success: true, insertedCount: count };
    }
    return { success: false };
  },

  setSelectedProject: (project) => {
    set({ selectedProject: project });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
  },

  updateProjectStage: async (projectId, newStage) => {
    const targetProject = get().projects.find((p) => p.id === projectId);
    const targetProjId = targetProject?.projectId || get().activeSolutionId;

    if (targetProject?.provinceId && targetProjId && !isNaN(Number(targetProjId))) {
      await govService.updateProvince(targetProjId, targetProject.provinceId, { stage: newStage });
    } else {
      await govService.updateGovProjectDirect(projectId, { stage: newStage });
    }

    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, stage: newStage } : p)),
      selectedProject: state.selectedProject?.id === projectId ? { ...state.selectedProject, stage: newStage } : state.selectedProject,
    }));
  },

  updateProjectNotes: (projectId, notes) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, notes } : p)),
    }));
  },

  updateProjectAssignee: async (projectId, userId, assigneeName, avatar, role) => {
    const targetProject = get().projects.find((p) => p.id === projectId);
    const targetProjId = targetProject?.projectId || get().activeSolutionId;
    const isDirectProject = !targetProject?.provinceId;

    const payload = isDirectProject
      ? { manager_id: userId || null }
      : { igb_assignee_id: userId ? Number(userId) : null };

    if (isDirectProject) {
      await govService.updateSolution(projectId, payload);
    } else if (targetProject?.provinceId && targetProjId && !isNaN(Number(targetProjId))) {
      await govService.updateProvince(targetProjId, targetProject.provinceId, payload);
    } else {
      await govService.updateGovProjectDirect(projectId, payload);
    }

    const igbAssignee = {
      id: String(userId || "unassigned"),
      name: assigneeName || (userId ? "Thành viên IGB" : "Chưa phân công"),
      avatar: avatar || "",
      role: role || (userId ? "Phụ trách dự án" : "Chưa phân công"),
    };

    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, igbAssignee } : p)),
      selectedProject: state.selectedProject?.id === projectId ? { ...state.selectedProject, igbAssignee } : state.selectedProject,
    }));
    return true;
  },

  updateLeaderContact: async (projectId, contact) => {
    const targetProject = get().projects.find((p) => p.id === projectId);
    const targetProjId = targetProject?.projectId || get().activeSolutionId;

    const payload = {
      leader_contact: {
        full_name: contact.fullName,
        position: contact.position,
        department_name: contact.departmentName,
        phone: contact.phone,
        email: contact.email,
      },
    };

    if (targetProject?.provinceId && targetProjId && !isNaN(Number(targetProjId))) {
      await govService.updateProvince(targetProjId, targetProject.provinceId, payload);
    } else {
      await govService.updateGovProjectDirect(projectId, payload);
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              leaderContact: {
                fullName: contact.fullName,
                position: contact.position || "Lãnh đạo",
                departmentName: contact.departmentName,
                phone: contact.phone || "",
                email: contact.email || "",
              },
            }
          : p
      ),
    }));
    return true;
  },

  fetchProvinceDocuments: async (projectId, provinceId) => {
    const targetProject = get().projects.find((p) => p.id === projectId);
    const provId = provinceId || targetProject?.provinceId;
    const targetProjId = targetProject?.projectId || get().activeSolutionId;

    if (provId && targetProjId) {
      const docs = await govService.fetchProvinceDocs(targetProjId, provId);
      set({ documents: docs });
    }
  },

  fetchProjectDocuments: async (projectId: string) => {
    if (!projectId) return;
    const docs = await govService.fetchProjectDocs(projectId);
    set((state) => {
      const otherDocs = state.documents.filter(
        (d) => String(d.solutionId) !== String(projectId) && String(d.projectId) !== String(projectId)
      );
      return { documents: [...docs, ...otherDocs] };
    });
  },

  addDocument: async (docData) => {
    let newDoc: DltmDocument;

    if (docData instanceof FormData) {
      newDoc = await govService.uploadDocument(docData);
    } else {
      const solId = docData.solutionId || get().activeSolutionId;
      newDoc = await govService.storeDocumentJson(solId, docData);
    }

    set((state) => ({
      documents: [newDoc, ...state.documents],
      projects: state.projects.map((p) =>
        p.id === newDoc.projectId
          ? { ...p, documentsCount: p.documentsCount + 1 }
          : p
      ),
    }));
    return true;
  },

  deleteDocument: async (docId) => {
    const ok = await govService.deleteDocument(docId);
    if (ok) {
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== docId),
      }));
      return true;
    }
    return false;
  },

  fetchProvinceWorkLogs: async (projectId, provinceId) => {
    const targetProject = get().projects.find((p) => p.id === projectId);
    const provId = provinceId || targetProject?.provinceId;
    const targetProjId = targetProject?.projectId || get().activeSolutionId;

    if (provId && targetProjId) {
      const logs = await govService.fetchProvinceLogs(targetProjId, provId);
      set({ workLogs: logs });
    }
  },

  addWorkLog: async (logData) => {
    const solId = logData.solutionId || get().activeSolutionId;
    const newLog = await govService.storeWorkLog(solId, logData);

    set((state) => ({
      workLogs: [newLog, ...state.workLogs],
      projects: state.projects.map((p) =>
        p.id === newLog.projectId
          ? { ...p, workLogsCount: p.workLogsCount + 1 }
          : p
      ),
    }));
    return true;
  },

  updateWorkLog: async (logId, updates) => {
    await govService.updateWorkLog(logId, updates);
    set((state) => ({
      workLogs: state.workLogs.map((l) => (l.id === logId ? { ...l, ...updates } : l)),
    }));
    return true;
  },

  deleteWorkLog: async (logId) => {
    const ok = await govService.deleteWorkLog(logId);
    if (ok) {
      set((state) => ({
        workLogs: state.workLogs.filter((l) => l.id !== logId),
      }));
      return true;
    }
    return false;
  },

  addMeeting: async (meetingData) => {
    const targetSolutionId =
      meetingData.solutionId && meetingData.solutionId !== "none"
        ? meetingData.solutionId
        : undefined;
    const newMeeting = await govService.storeMeeting(targetSolutionId, meetingData);
    set((state) => ({
      meetings: [newMeeting, ...state.meetings],
    }));
    return newMeeting;
  },

  updateMeeting: async (meetingId, updates, projectId) => {
    const updated = await govService.updateMeeting(meetingId, updates, projectId);
    set((state) => ({
      meetings: state.meetings.map((m) => (m.id === meetingId ? updated : m)),
    }));
    return true;
  },

  deleteMeeting: async (meetingId, projectId) => {
    const ok = await govService.deleteMeeting(meetingId, projectId);
    if (ok) {
      set((state) => ({
        meetings: state.meetings.filter((m) => m.id !== meetingId),
      }));
      return true;
    }
    return false;
  },

  updateMeetingStatus: async (meetingId, status, projectId) => {
    return get().updateMeeting(meetingId, { status }, projectId);
  },

  fetchMasterCalendarSummary: async (filters) => {
    const summary = await govService.fetchMasterCalendarSummary(filters?.month);
    set({ calendarSummary: summary });
    return summary;
  },

  fetchMasterCalendar: async (filters) => {
    const res = await govService.fetchMasterCalendar(filters?.month, filters?.assignee_id);
    const summary = await govService.fetchMasterCalendarSummary(filters?.month);
    set({
      meetings: res.meetings,
      calendarSummary: summary,
    });
    return {
      total: res.meetings.length,
      conflict_count: res.meetings.filter((m) => m.hasConflict).length,
      summary: summary || undefined,
      meetings: res.meetings,
    };
  },

  addTask: (taskData) => {
    const newTask: DltmProjectTask = {
      ...taskData,
      id: `task-${Date.now()}`,
    };
    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  },
}));

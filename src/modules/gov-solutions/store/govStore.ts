import { create } from "zustand";
import { apiRequest } from "@/lib/api-client";
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

const STORAGE_KEY_SOLUTIONS = "erp_gov_solutions_v8";
const STORAGE_KEY_PROJECTS = "erp_gov_projects_v8";
const STORAGE_KEY_DOCS = "erp_gov_docs_v8";
const STORAGE_KEY_LOGS = "erp_gov_logs_v8";
const STORAGE_KEY_MEETINGS = "erp_gov_meetings_v8";
const STORAGE_KEY_TASKS = "erp_gov_tasks_v8";
const STORAGE_KEY_ACTIVE_SOL = "erp_gov_active_sol_v8";

function loadFromStorage<T>(key: string, defaultVal: T): T {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch { }
  }
  return defaultVal;
}

function saveToStorage<T>(key: string, val: T): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch { }
  }
}

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
  addDigitalSolution: (solution: Omit<DigitalSolution, "id" | "activeCount">) => void;
  deleteDigitalSolution: (id: string) => Promise<boolean>;
  getActiveSolution: () => DigitalSolution;

  addProvinceToProject: (provinceId: number, stageId?: number) => Promise<boolean>;
  initAllTargetProvinces: () => Promise<{ success: boolean; insertedCount?: number }>;
  fetchAvailableProvinces: () => Promise<{ id: number; name: string; region: string }[]>;

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

  addWorkLog: (log: Omit<DltmWorkLog, "id" | "createdAt"> & { createNextMeeting?: boolean; nextMeetingDate?: string; nextMeetingTitle?: string; nextMeetingType?: string; nextMeetingLocation?: string }) => Promise<boolean>;
  updateWorkLog: (logId: string, updates: any) => Promise<boolean>;
  deleteWorkLog: (logId: string) => Promise<boolean>;
  fetchProvinceWorkLogs: (projectId: string, provinceId?: number) => Promise<void>;

  addMeeting: (meeting: Omit<DltmMeetingSchedule, "id">) => Promise<boolean>;
  updateMeeting: (meetingId: string, updates: any, projectId?: string) => Promise<boolean>;
  deleteMeeting: (meetingId: string, projectId?: string) => Promise<boolean>;
  updateMeetingStatus: (meetingId: string, status: "UPCOMING" | "DONE" | "CANCELLED", projectId?: string) => Promise<boolean>;
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
    let savedSol = loadFromStorage(STORAGE_KEY_ACTIVE_SOL, "");
    if (savedSol === "dltm") {
      savedSol = "";
      saveToStorage(STORAGE_KEY_ACTIVE_SOL, "");
    }
    const targetSolId = forceProjectId || savedSol || get().activeSolutionId;
    const queryParam = targetSolId && !isNaN(Number(targetSolId)) ? `?project_id=${targetSolId}` : "";

    const res = await apiRequest<{
      success: boolean;
      data: {
        solutions: any[];
        active_project_id: number | null;
        active_solution_id?: string;
        provinces: any[];
        upcoming_meetings: any[];
        documents?: any[];
      };
    }>(`/erp/gov-projects/bootstrap${queryParam}`).catch((e) => {
      console.warn("Failed to bootstrap gov-projects:", e);
      return null;
    });

    if (!res?.data) {
      return;
    }

    const { solutions: rawSolutions, active_project_id, provinces: rawProvinces, upcoming_meetings, documents: rawDocs, team_members } = res.data as any;

    if (team_members && Array.isArray(team_members) && team_members.length > 0) {
      set({
        teamMembers: [
          {
            id: "unassigned",
            name: "Chưa phân công",
            role: "Bỏ gán người phụ trách",
            avatar: "",
            initials: "--",
          },
          ...team_members,
        ],
      });
    }

    const solutions = (rawSolutions || []).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      shortName: p.name.substring(0, 20) + (p.name.length > 20 ? "..." : ""),
      code: `SOL-${p.id}`,
      iconName: "Compass",
      colorHex: p.id === 1 ? "#2563eb" : "#ef4444",
      badgeClass: "bg-blue-100 text-blue-700",
      targetGovDepartment: "Cơ quan chuyên môn địa phương",
      dataAssetDescription: "Dữ liệu...",
      description: p.description || p.name,
      activeCount: 34,
      totalTargetProvinces: 34,
    }));

    const currentSolId = active_project_id ? String(active_project_id) : (solutions[0]?.id || "");
    saveToStorage(STORAGE_KEY_ACTIVE_SOL, currentSolId);

    const mapStageName = (name: string): DltmStage => {
      if (!name) return "NOT_STARTED";
      if (name.includes("Chưa bắt đầu")) return "NOT_STARTED";
      if (name.includes("Đã gửi")) return "DISPATCHED";
      if (name.includes("phản hồi")) return "FEEDBACK";
      if (name.includes("MOU")) return "MOU_SIGNED";
      if (name.includes("Đồng ý")) return "SPONSOR_AGREED";
      if (name.includes("Thu thập")) return "DATA_COLLECT";
      if (name.includes("triển khai")) return "DEPLOYING";
      if (name.includes("hoàn tất")) return "COMPLETED";
      return "NOT_STARTED";
    };

    const mapRegion = (region: any): any => {
      if (region === "Bắc Bộ" || region === 1 || region === "1") return "Bắc Bộ";
      if (region === "Nam Bộ" || region === 3 || region === "3") return "Nam Bộ";
      if (region === "Tây Nguyên" || region === 4 || region === "4") return "Tây Nguyên";
      return "Trung Bộ";
    };

    const projects: DltmProject[] = (rawProvinces || []).map((p: any) => ({
      id: String(p.id),
      provinceId: p.province_id,
      name: `Dự án CĐS ${p.name || ""}`,
      provinceName: p.name || "",
      code: p.code || "00",
      region: mapRegion(p.region),
      solutionId: currentSolId,
      projectId: currentSolId,
      category: "INTERNAL",
      stage: mapStageName(p.stage_name),
      progressPercent: Number(p.completion_percentage) || 0,
      notes: p.latest_log || "",
      leaderContact: {
        fullName: p.leader_contact_detail?.fullName || p.leader_contact_detail?.name || p.leader_contact || "",
        position: p.leader_contact_detail?.position || "Giám đốc / Lãnh đạo Sở",
        departmentName: p.leader_contact_detail?.departmentName || `UBND ${p.name || ""}`,
        phone: p.leader_contact_detail?.phone || "",
        email: p.leader_contact_detail?.email || "",
      },
      igbAssignee: {
        id: p.igb_assignee?.id || (p.assigned_user_id ? String(p.assigned_user_id) : "unassigned"),
        name: p.igb_assignee?.name || (p.assignees && p.assignees.length > 0 ? p.assignees[0] : "Chưa phân công"),
        avatar: p.igb_assignee?.avatar || "",
        role: p.igb_assignee?.role || "Quản lý dự án",
      },
      documentsCount: p.documents_count || 0,
      workLogsCount: p.work_logs_count || 0,
      tasksCount: 0,
      completedTasksCount: 0,
      nextMeetingDate: p.next_meeting_date || undefined,
      nextMeetingContent: p.next_meeting_content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const currentSelected = get().selectedProject;
    const updatedSelected = currentSelected
      ? projects.find((p) => String(p.id) === String(currentSelected.id)) || currentSelected
      : null;

    set({
      solutions,
      activeSolutionId: currentSolId,
      projects,
      meetings: upcoming_meetings || [],
      documents: rawDocs || get().documents || [],
      selectedProject: updatedSelected,
    });
  },

  setActiveSolutionId: (id: string) => {
    set({ activeSolutionId: id });
    saveToStorage(STORAGE_KEY_ACTIVE_SOL, id);
    get().fetchInitial(id);
  },

  setActiveMainTab: (tab) => set({ activeMainTab: tab }),

  getActiveSolution: () => {
    const { solutions, activeSolutionId } = get();
    return (
      solutions.find((s) => s.id === activeSolutionId) ||
      solutions[0] || {
        id: "",
        name: "",
        shortName: "",
        code: "",
        iconName: "Compass",
        colorHex: "#3b82f6",
        badgeClass: "",
        targetGovDepartment: "",
        dataAssetDescription: "",
        description: "",
        activeCount: 0,
        totalTargetProvinces: 0,
      }
    );
  },

  addDigitalSolution: async (solData) => {
    try {
      const res = await apiRequest<{ data: any }>("/erp/projects", {
        method: "POST",
        body: {
          name: solData.name,
          description: solData.description
        }
      });

      const p = res.data;
      const newSolution: DigitalSolution = {
        ...solData,
        id: String(p.id),
        name: p.name,
        shortName: p.name.substring(0, 20) + (p.name.length > 20 ? "..." : ""),
        code: `SOL-${p.id}`,
        iconName: "Compass",
        colorHex: p.id === 1 ? "#2563eb" : "#ef4444",
        badgeClass: "bg-blue-100 text-blue-700",
        targetGovDepartment: "Cơ quan chuyên môn địa phương",
        dataAssetDescription: "Dữ liệu...",
        description: p.description || p.name,
        activeCount: 34,
        totalTargetProvinces: 34
      };

      const updatedSolutions = [...get().solutions, newSolution];
      set({
        solutions: updatedSolutions,
        activeSolutionId: newSolution.id,
      });

      saveToStorage(STORAGE_KEY_SOLUTIONS, updatedSolutions);
      saveToStorage(STORAGE_KEY_ACTIVE_SOL, newSolution.id);

      get().fetchInitial();
    } catch (e) {
      console.error("Failed to create project", e);
    }
  },

  deleteDigitalSolution: async (id: string) => {
    try {
      if (!isNaN(Number(id))) {
        await apiRequest(`/erp/projects/${id}`, {
          method: "DELETE",
        });
      }
    } catch (e) {
      console.error("Failed to delete project on backend:", e);
      return false;
    }

    const updatedSolutions = get().solutions.filter((s) => s.id !== id);
    const updatedProjects = get().projects.filter((p) => p.solutionId !== id);
    const fallbackActive = get().activeSolutionId === id
      ? (updatedSolutions[0]?.id || "")
      : get().activeSolutionId;

    set({
      solutions: updatedSolutions,
      projects: updatedProjects,
      activeSolutionId: fallbackActive,
    });

    saveToStorage(STORAGE_KEY_SOLUTIONS, updatedSolutions);
    saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
    saveToStorage(STORAGE_KEY_ACTIVE_SOL, fallbackActive);

    await get().fetchInitial();
    return true;
  },

  fetchAvailableProvinces: async () => {
    const { activeSolutionId } = get();
    try {
      const res = await apiRequest<{ data: { id: number; name: string; region: string }[] }>(
        `/erp/gov-projects/projects/${activeSolutionId}/available-provinces`
      );
      return res.data || [];
    } catch (e) {
      console.error("Failed to fetch available provinces:", e);
      return [];
    }
  },

  addProvinceToProject: async (provinceId: number, stageId = 1) => {
    const { activeSolutionId } = get();
    try {
      await apiRequest(
        `/erp/gov-projects/projects/${activeSolutionId}/provinces`,
        {
          method: "POST",
          body: {
            province_id: provinceId,
            stage_id: stageId,
          },
        }
      );
      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to add province to project:", e);
      return false;
    }
  },

  initAllTargetProvinces: async () => {
    const { activeSolutionId } = get();
    try {
      const res = await apiRequest<{ success: boolean; data?: { inserted_count: number } }>(
        `/erp/gov-projects/projects/${activeSolutionId}/init-provinces`,
        {
          method: "POST",
        }
      );
      await get().fetchInitial();
      return {
        success: true,
        insertedCount: res.data?.inserted_count ?? 0,
      };
    } catch (e) {
      console.error("Failed to init provinces:", e);
      return { success: false };
    }
  },

  setSelectedProject: (project) => {
    set({ selectedProject: project });
    if (project?.provinceId) {
      get().fetchProvinceWorkLogs(project.id, project.provinceId);
      get().fetchProvinceDocuments(project.id, project.provinceId);
    }
  },

  fetchProvinceWorkLogs: async (projectId: string, provinceId?: number) => {
    const { activeSolutionId } = get();
    if (!provinceId) return;
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>(
        `/erp/gov-projects/projects/${activeSolutionId}/provinces/${provinceId}/work-logs`
      );
      if (res?.data && Array.isArray(res.data)) {
        const fetchedLogs = res.data.map((l: any) => ({
          ...l,
          projectId: String(l.projectId || projectId),
        }));
        set((state) => {
          const otherLogs = state.workLogs.filter((l) => String(l.projectId) !== String(projectId));
          return { workLogs: [...fetchedLogs, ...otherLogs] };
        });
      }
    } catch (e) {
      console.error("Failed to fetch province work logs:", e);
    }
  },

  fetchProvinceDocuments: async (projectId: string, provinceId?: number) => {
    const { activeSolutionId } = get();
    if (!provinceId) return;
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>(
        `/erp/gov-projects/projects/${activeSolutionId}/provinces/${provinceId}/documents`
      );
      if (res?.data && Array.isArray(res.data)) {
        const fetchedDocs = res.data.map((d: any) => ({
          ...d,
          projectId: String(d.projectId || projectId),
        }));
        set((state) => {
          const otherDocs = state.documents.filter((d) => String(d.projectId) !== String(projectId));
          return { documents: [...fetchedDocs, ...otherDocs] };
        });
      }
    } catch (e) {
      console.error("Failed to fetch province documents:", e);
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  updateProjectStage: async (projectId, newStage) => {
    const stageProgressMap: Record<DltmStage, number> = {
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

    const targetProject = get().projects.find((p) => p.id === projectId);
    if (targetProject) {
      try {
        const stageConfigs: Record<string, number> = {
          NOT_STARTED: 0,
          DISPATCHED: 1,
          FEEDBACK: 2,
          MOU_SIGNED: 3,
          SPONSOR_AGREED: 4,
          DATA_COLLECT: 5,
          DEPLOYING: 6,
          COMPLETED: 7,
          PAUSED: 8,
        };
        const stageId = stageConfigs[newStage] || 1;
        const targetProjId = targetProject.solutionId || get().activeSolutionId;

        await apiRequest(`/erp/gov-projects/projects/${targetProjId}/provinces/${targetProject.provinceId}`, {
          method: "PUT",
          body: { stage_id: stageId }
        });
      } catch (e) {
        console.error("Failed to update project stage in backend", e);
      }
    }

    const updated = get().projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          stage: newStage,
          progressPercent: stageProgressMap[newStage] ?? p.progressPercent,
          updatedAt: new Date().toISOString().split("T")[0],
        };
      }
      return p;
    });

    set({ projects: updated });
    saveToStorage(STORAGE_KEY_PROJECTS, updated);

    if (get().selectedProject?.id === projectId) {
      set({
        selectedProject: updated.find((p) => p.id === projectId) || null,
      });
    }
  },

  updateProjectNotes: (projectId, notes) => {
    const updated = get().projects.map((p) => (p.id === projectId ? { ...p, notes } : p));
    set({ projects: updated });
    saveToStorage(STORAGE_KEY_PROJECTS, updated);

    if (get().selectedProject?.id === projectId) {
      set({
        selectedProject: updated.find((p) => p.id === projectId) || null,
      });
    }
  },

  updateProjectAssignee: async (projectId, userId, assigneeName, avatar, role) => {
    const isUnassigned = !userId || userId === "unassigned" || assigneeName === "Chưa phân công";
    const numId = !isUnassigned && !isNaN(Number(userId)) ? Number(userId) : null;
    const targetProject = get().projects.find((p) => p.id === projectId);

    const resolvedName = isUnassigned ? "Chưa phân công" : (assigneeName || "Thành viên IGB");
    const resolvedAvatar = isUnassigned ? "" : (avatar !== undefined ? avatar : "");
    const resolvedRole = isUnassigned ? "" : (role || "Quản lý dự án");

    const updated = get().projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          igbAssignee: {
            id: numId ? String(numId) : "unassigned",
            name: resolvedName,
            avatar: resolvedAvatar,
            role: resolvedRole,
          }
        };
      }
      return p;
    });
    set({ projects: updated });
    saveToStorage(STORAGE_KEY_PROJECTS, updated);

    if (get().selectedProject?.id === projectId) {
      set({
        selectedProject: updated.find((p) => p.id === projectId) || null,
      });
    }

    if (targetProject) {
      try {
        const targetSolId = targetProject.solutionId || get().activeSolutionId;
        const assigneePayload = isUnassigned
          ? {
            assigned_user_id: null,
            assignee_id: null,
            igb_assignee: null,
            assignee_name: "Chưa phân công",
          }
          : {
            assigned_user_id: numId,
            assignee_id: numId,
            assignee_name: resolvedName,
            assignee_avatar: resolvedAvatar,
            assignee_role: resolvedRole,
            igb_assignee: {
              id: numId ? String(numId) : null,
              name: resolvedName,
              avatar: resolvedAvatar,
              role: resolvedRole,
            },
          };

        if (targetProject.provinceId) {
          await apiRequest(
            `/erp/gov-projects/projects/${targetSolId}/provinces/${targetProject.provinceId}`,
            {
              method: "PUT",
              body: assigneePayload,
            }
          );
        } else {
          await apiRequest(`/erp/gov-projects/${projectId}`, {
            method: "PUT",
            body: assigneePayload,
          });
        }
        return true;
      } catch (err) {
        console.error("Lỗi khi cập nhật đầu mối IGB trên server:", err);
        return false;
      }
    }
    return true;
  },

  updateLeaderContact: async (projectId, contact) => {
    const targetProject = get().projects.find((p) => p.id === projectId);

    const updated = get().projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          leaderContact: {
            ...p.leaderContact,
            ...contact,
          },
        };
      }
      return p;
    });
    set({ projects: updated });
    saveToStorage(STORAGE_KEY_PROJECTS, updated);

    if (get().selectedProject?.id === projectId) {
      set({
        selectedProject: updated.find((p) => p.id === projectId) || null,
      });
    }

    if (targetProject) {
      try {
        const targetSolId = targetProject.solutionId || get().activeSolutionId;
        const payload = {
          leader_contact: {
            name: contact.fullName,
            fullName: contact.fullName,
            position: contact.position || "",
            departmentName: contact.departmentName || "",
            phone: contact.phone || "",
            email: contact.email || "",
          },
        };

        if (targetProject.provinceId) {
          await apiRequest(
            `/erp/gov-projects/projects/${targetSolId}/provinces/${targetProject.provinceId}`,
            {
              method: "PUT",
              body: payload,
            }
          );
        } else {
          await apiRequest(`/erp/gov-projects/${projectId}`, {
            method: "PUT",
            body: payload,
          });
        }
        return true;
      } catch (err) {
        console.error("Lỗi khi cập nhật đầu mối địa phương trên server:", err);
        return false;
      }
    }
    return true;
  },

  addDocument: async (docData) => {
    const { activeSolutionId } = get();
    try {
      const res = await apiRequest<{ success: boolean; data: DltmDocument }>(
        `/erp/gov-projects/projects/${activeSolutionId}/documents`,
        {
          method: "POST",
          body: docData,
        }
      );

      if (res?.data) {
        const newDoc = res.data;
        const updatedDocs = [newDoc, ...get().documents.filter((d) => d.id !== newDoc.id)];
        set({ documents: updatedDocs });
        saveToStorage(STORAGE_KEY_DOCS, updatedDocs);

        const updatedProjects = get().projects.map((p) => {
          if (p.id === newDoc.projectId) {
            return { ...p, documentsCount: (p.documentsCount || 0) + 1 };
          }
          return p;
        });
        set({ projects: updatedProjects });
        saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
      }
      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to add document:", e);
      return false;
    }
  },

  deleteDocument: async (docId: string) => {
    try {
      await apiRequest(`/erp/gov-projects/documents/${docId}`, {
        method: "DELETE",
      });
      const target = get().documents.find((d) => d.id === docId);
      const updatedDocs = get().documents.filter((d) => d.id !== docId);
      set({ documents: updatedDocs });
      saveToStorage(STORAGE_KEY_DOCS, updatedDocs);

      if (target) {
        const updatedProjects = get().projects.map((p) => {
          if (p.id === target.projectId) {
            return { ...p, documentsCount: Math.max(0, (p.documentsCount || 1) - 1) };
          }
          return p;
        });
        set({ projects: updatedProjects });
        saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
      }
      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to delete document:", e);
      return false;
    }
  },

  addWorkLog: async (logData) => {
    const { activeSolutionId } = get();
    try {
      const targetProject = get().projects.find((p) => p.id === logData.projectId);
      const res = await apiRequest<{
        success: boolean;
        data: any;
        sync_meeting?: any;
      }>(
        `/erp/gov-projects/projects/${activeSolutionId}/work-logs`,
        {
          method: "POST",
          body: {
            gov_project_id: Number(logData.projectId),
            projectId: logData.projectId,
            province_id: targetProject?.provinceId,
            stage_id: logData.stageId,
            log_type: logData.logType || "MEETING",
            title: logData.title,
            meeting_date: logData.meetingDate,
            meeting_type: logData.meetingType,
            location: logData.location,
            participants: logData.participants,
            content: logData.content,
            agreements: logData.agreements,
            next_steps: logData.nextSteps,
            attachments: logData.attachments,
            metadata: {
              attachments: logData.attachments,
              location: logData.location,
            },
            create_next_meeting: logData.createNextMeeting,
            next_meeting_date: logData.nextMeetingDate,
            next_meeting_title: logData.nextMeetingTitle,
            next_meeting_type: logData.nextMeetingType,
            next_meeting_location: logData.nextMeetingLocation,
            is_sync_calendar: logData.createNextMeeting || logData.isSyncCalendar || logData.isMasterCalendar,
            host_user_id: logData.hostUserId,
            participant_ids: logData.participantIds,
            duration_minutes: logData.durationMinutes,
          },
        }
      );

      const returnedLog: DltmWorkLog = res?.data
        ? {
          id: String(res.data.id),
          projectId: String(res.data.projectId || logData.projectId),
          stageId: res.data.stageId,
          stageName: res.data.stageName,
          logType: res.data.logType,
          title: res.data.title,
          meetingDate: res.data.meetingDate || logData.meetingDate,
          meetingType: res.data.meetingType || logData.meetingType,
          participants: res.data.participants || logData.participants,
          location: res.data.location || logData.location,
          content: res.data.content || logData.content,
          agreements: res.data.agreements || logData.agreements,
          nextSteps: res.data.nextSteps || logData.nextSteps,
          attachments: res.data.attachments || logData.attachments || [],
          recordedBy: res.data.recordedBy || logData.recordedBy,
          createdAt: res.data.createdAt || new Date().toISOString(),
        }
        : {
          ...logData,
          id: `log-${Date.now()}`,
          createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        };

      const updatedLogs = [returnedLog, ...get().workLogs];
      set({ workLogs: updatedLogs });
      saveToStorage(STORAGE_KEY_LOGS, updatedLogs);

      const updatedProjects = get().projects.map((p) => {
        if (p.id === logData.projectId) {
          return {
            ...p,
            workLogsCount: (p.workLogsCount || 0) + 1,
            notes: returnedLog.content || p.notes,
          };
        }
        return p;
      });
      set({ projects: updatedProjects });
      saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);

      if (res?.sync_meeting) {
        set((state) => ({ meetings: [res.sync_meeting, ...state.meetings] }));
      }

      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to add work log:", e);
      return false;
    }
  },

  updateWorkLog: async (logId: string, updates: any) => {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(
        `/erp/gov-projects/work-logs/${logId}`,
        {
          method: "PUT",
          body: updates,
        }
      );
      if (res?.data) {
        const updatedLogs = get().workLogs.map((l) => (l.id === logId ? { ...l, ...res.data } : l));
        set({ workLogs: updatedLogs });
        saveToStorage(STORAGE_KEY_LOGS, updatedLogs);
      }
      return true;
    } catch (e) {
      console.error("Failed to update work log:", e);
      return false;
    }
  },

  deleteWorkLog: async (logId: string) => {
    try {
      const target = get().workLogs.find((l) => l.id === logId);
      await apiRequest(`/erp/gov-projects/work-logs/${logId}`, {
        method: "DELETE",
      });
      const updatedLogs = get().workLogs.filter((l) => l.id !== logId);
      set({ workLogs: updatedLogs });
      saveToStorage(STORAGE_KEY_LOGS, updatedLogs);

      if (target) {
        const updatedProjects = get().projects.map((p) => {
          if (p.id === target.projectId) {
            return { ...p, workLogsCount: Math.max(0, (p.workLogsCount || 1) - 1) };
          }
          return p;
        });
        set({ projects: updatedProjects });
        saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
      }
      return true;
    } catch (e) {
      console.error("Failed to delete work log:", e);
      return false;
    }
  },

  addMeeting: async (meetingData) => {
    const { activeSolutionId } = get();
    try {
      const res = await apiRequest<{ success: boolean; data: DltmMeetingSchedule }>(
        `/erp/gov-projects/projects/${activeSolutionId}/meetings`,
        {
          method: "POST",
          body: {
            gov_project_id: Number(meetingData.projectId),
            stage_id: meetingData.stageId ? Number(meetingData.stageId) : undefined,
            stageId: meetingData.stageId ? Number(meetingData.stageId) : undefined,
            scheduledAt: meetingData.scheduledAt,
            content: meetingData.content,
            location: meetingData.location,
            contactPerson: meetingData.contactPerson,
            hostName: meetingData.hostName,
            participantIds: meetingData.participantIds,
          },
        }
      );
      if (res?.data) {
        set((state) => ({ meetings: [res.data, ...state.meetings] }));
      }
      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to add meeting:", e);
      return false;
    }
  },

  deleteMeeting: async (meetingId: string, projectId?: string) => {
    const targetProjectId = projectId || get().activeSolutionId;
    const url = targetProjectId
      ? `/erp/gov-projects/projects/${targetProjectId}/meetings/${meetingId}`
      : `/erp/gov-projects/meetings/${meetingId}`;
    try {
      await apiRequest(url, { method: "DELETE" });
      set((state) => ({ meetings: state.meetings.filter((m) => m.id !== meetingId) }));
      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to delete meeting:", e);
      return false;
    }
  },

  updateMeeting: async (meetingId: string, updates: any, projectId?: string) => {
    const targetProjectId = projectId || get().activeSolutionId;
    const url = targetProjectId
      ? `/erp/gov-projects/projects/${targetProjectId}/meetings/${meetingId}`
      : `/erp/gov-projects/meetings/${meetingId}`;
    try {
      await apiRequest(url, {
        method: "PUT",
        body: updates,
      });
      // Cập nhật state nếu cần thiết (hoặc gọi fetchInitial)
      set((state) => ({
        meetings: state.meetings.map((m) => {
          if (m.id === meetingId) {
            return {
              ...m,
              ...updates,
              scheduledAt: updates.start_time || m.scheduledAt,
              title: updates.title || m.title,
              content: updates.content || m.content,
              location: updates.location || m.location,
              participantIds: updates.participant_ids || m.participantIds,
            };
          }
          return m;
        }),
      }));
      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to update meeting:", e);
      return false;
    }
  },

  updateMeetingStatus: async (meetingId, status, projectId?: string) => {
    const targetProjectId = projectId || get().activeSolutionId;
    const url = targetProjectId
      ? `/erp/gov-projects/projects/${targetProjectId}/meetings/${meetingId}`
      : `/erp/gov-projects/meetings/${meetingId}`;
    try {
      if (status === "CANCELLED") {
        await apiRequest(url, { method: "DELETE" });
      } else {
        await apiRequest(url, {
          method: "PUT",
          body: { status },
        });
      }
      set((state) => ({
        meetings: state.meetings.map((m) => (m.id === meetingId ? { ...m, status } : m)),
      }));
      await get().fetchInitial();
      return true;
    } catch (e) {
      console.error("Failed to update meeting status:", e);
      return false;
    }
  },

  fetchMasterCalendarSummary: async (filters?: Record<string, any>) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "" && v !== "ALL") {
            queryParams.append(k, String(v));
          }
        });
      }
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const res = await apiRequest<{
        success: boolean;
        data: DltmCalendarSummary;
      }>(`/erp/gov-projects/master-calendar/summary${qs}`);

      if (res?.data) {
        set({ calendarSummary: res.data });
        return res.data;
      }
      return null;
    } catch (e) {
      console.error("Failed to fetch master calendar summary:", e);
      return null;
    }
  },

  fetchMasterCalendar: async (filters?: Record<string, any>) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "" && v !== "ALL") {
            queryParams.append(k, String(v));
          }
        });
      }
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const res = await apiRequest<{
        success: boolean;
        data: {
          total: number;
          conflict_count: number;
          summary?: DltmCalendarSummary;
          meetings: DltmMeetingSchedule[];
        };
      }>(`/erp/gov-projects/master-calendar${qs}`);

      if (res?.data?.meetings) {
        set({
          meetings: res.data.meetings,
          calendarSummary: res.data.summary || get().calendarSummary,
        });
        return res.data;
      }
      return { total: 0, conflict_count: 0, meetings: [] };
    } catch (e) {
      console.error("Failed to fetch master calendar:", e);
      return { total: 0, conflict_count: 0, meetings: [] };
    }
  },

  addTask: (taskData) => {
    const newTask: DltmProjectTask = {
      ...taskData,
      id: `ptask-${Date.now()}`,
    };
    const updatedTasks = [...get().tasks, newTask];
    set({ tasks: updatedTasks });
    saveToStorage(STORAGE_KEY_TASKS, updatedTasks);

    const updatedProjects = get().projects.map((p) => {
      if (p.id === taskData.projectId) {
        return { ...p, tasksCount: (p.tasksCount || 0) + 1 };
      }
      return p;
    });
    set({ projects: updatedProjects });
    saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
  },

  updateTaskStatus: (taskId, status) => {
    const updatedTasks = get().tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    set({ tasks: updatedTasks });
    saveToStorage(STORAGE_KEY_TASKS, updatedTasks);

    const target = updatedTasks.find((t) => t.id === taskId);
    if (target) {
      const projTasks = updatedTasks.filter((t) => t.projectId === target.projectId);
      const completedCount = projTasks.filter((t) => t.status === "DONE").length;

      const updatedProjects = get().projects.map((p) => {
        if (p.id === target.projectId) {
          return { ...p, completedTasksCount: completedCount };
        }
        return p;
      });
      set({ projects: updatedProjects });
      saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
    }
  },
}));

export const useDltmStore = useGovStore;

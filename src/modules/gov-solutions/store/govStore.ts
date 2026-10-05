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
} from "../types";
import {
  INITIAL_ALL_PROJECTS,
  MOCK_MEETING_SCHEDULES,
  MOCK_DLTM_DOCUMENTS,
  MOCK_DLTM_WORK_LOGS,
  MOCK_DLTM_TASKS,
} from "../mock-data";
import { DEFAULT_DIGITAL_SOLUTIONS } from "../constants";

const STORAGE_KEY_SOLUTIONS = "erp_gov_solutions_v7";
const STORAGE_KEY_PROJECTS = "erp_gov_projects_v7";
const STORAGE_KEY_DOCS = "erp_gov_docs_v7";
const STORAGE_KEY_LOGS = "erp_gov_logs_v7";
const STORAGE_KEY_MEETINGS = "erp_gov_meetings_v7";
const STORAGE_KEY_TASKS = "erp_gov_tasks_v7";
const STORAGE_KEY_ACTIVE_SOL = "erp_gov_active_sol_v7";

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
  selectedProject: DltmProject | null;
  filters: DltmFilterParams;
  viewMode: "table" | "kanban";

  // Actions
  fetchInitial: () => void;
  setActiveSolutionId: (id: string) => void;
  setActiveMainTab: (tab: "solution_workspace" | "coverage_matrix") => void;
  addDigitalSolution: (solution: Omit<DigitalSolution, "id" | "activeCount">) => void;
  deleteDigitalSolution: (id: string) => void;
  getActiveSolution: () => DigitalSolution;

  setSelectedProject: (project: DltmProject | null) => void;
  setViewMode: (mode: "table" | "kanban") => void;
  setFilters: (filters: Partial<DltmFilterParams>) => void;
  resetFilters: () => void;

  updateProjectStage: (projectId: string, newStage: DltmStage) => void;
  updateProjectNotes: (projectId: string, notes: string) => void;

  addDocument: (doc: Omit<DltmDocument, "id" | "uploadedAt">) => void;
  deleteDocument: (docId: string) => void;

  addWorkLog: (log: Omit<DltmWorkLog, "id" | "createdAt">) => void;

  addMeeting: (meeting: Omit<DltmMeetingSchedule, "id">) => void;
  updateMeetingStatus: (meetingId: string, status: "UPCOMING" | "DONE" | "CANCELLED") => void;

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
  activeSolutionId: "dltm",
  activeMainTab: "solution_workspace",

  projects: INITIAL_ALL_PROJECTS,
  documents: MOCK_DLTM_DOCUMENTS,
  workLogs: MOCK_DLTM_WORK_LOGS,
  meetings: MOCK_MEETING_SCHEDULES,
  tasks: MOCK_DLTM_TASKS,
  selectedProject: null,
  filters: DEFAULT_FILTERS,
  viewMode: "table",

  fetchInitial: () => {
    set({
      solutions: loadFromStorage(STORAGE_KEY_SOLUTIONS, DEFAULT_DIGITAL_SOLUTIONS),
      activeSolutionId: loadFromStorage(STORAGE_KEY_ACTIVE_SOL, "dltm"),
      projects: loadFromStorage(STORAGE_KEY_PROJECTS, INITIAL_ALL_PROJECTS),
      documents: loadFromStorage(STORAGE_KEY_DOCS, MOCK_DLTM_DOCUMENTS),
      workLogs: loadFromStorage(STORAGE_KEY_LOGS, MOCK_DLTM_WORK_LOGS),
      meetings: loadFromStorage(STORAGE_KEY_MEETINGS, MOCK_MEETING_SCHEDULES),
      tasks: loadFromStorage(STORAGE_KEY_TASKS, MOCK_DLTM_TASKS),
    });
  },

  setActiveSolutionId: (id: string) => {
    set({ activeSolutionId: id });
    saveToStorage(STORAGE_KEY_ACTIVE_SOL, id);
  },

  setActiveMainTab: (tab) => set({ activeMainTab: tab }),

  getActiveSolution: () => {
    const { solutions, activeSolutionId } = get();
    return (
      solutions.find((s) => s.id === activeSolutionId) ||
      solutions[0] ||
      DEFAULT_DIGITAL_SOLUTIONS[0]
    );
  },

  addDigitalSolution: (solData) => {
    const id = `sol_${Date.now()}`;
    const newSolution: DigitalSolution = {
      ...solData,
      id,
      activeCount: 34,
      totalTargetProvinces: 34,
    };

    // Auto-provision 34 province tracking records for this new solution
    const baseProvinces = get().projects.filter((p) => (p.solutionId || "dltm") === "dltm");
    const newProjects: DltmProject[] = baseProvinces.map((bp) => ({
      ...bp,
      id: `${id}-${bp.code.toLowerCase()}`,
      name: `${solData.shortName} ${bp.provinceName}`,
      solutionId: id,
      category: "INTERNAL",
      stage: "DISPATCHED",
      progressPercent: 15,
      notes: `Đã khởi tạo đề án tài trợ ${solData.name} tới ${solData.targetGovDepartment} ${bp.provinceName}.`,
      leaderContact: {
        ...bp.leaderContact,
        departmentName: `${solData.targetGovDepartment} ${bp.provinceName}`,
      },
      documentsCount: 0,
      workLogsCount: 0,
      tasksCount: 0,
      completedTasksCount: 0,
    }));

    const updatedSolutions = [...get().solutions, newSolution];
    const updatedProjects = [...get().projects, ...newProjects];

    set({
      solutions: updatedSolutions,
      projects: updatedProjects,
      activeSolutionId: id,
    });

    saveToStorage(STORAGE_KEY_SOLUTIONS, updatedSolutions);
    saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
    saveToStorage(STORAGE_KEY_ACTIVE_SOL, id);
  },

  deleteDigitalSolution: (id: string) => {
    if (id === "dltm") return; // Giữ lại giải pháp cốt lõi DLTM
    const updatedSolutions = get().solutions.filter((s) => s.id !== id);
    const updatedProjects = get().projects.filter((p) => (p.solutionId || "dltm") !== id);
    const fallbackActive = get().activeSolutionId === id ? "dltm" : get().activeSolutionId;

    set({
      solutions: updatedSolutions,
      projects: updatedProjects,
      activeSolutionId: fallbackActive,
    });

    saveToStorage(STORAGE_KEY_SOLUTIONS, updatedSolutions);
    saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
    saveToStorage(STORAGE_KEY_ACTIVE_SOL, fallbackActive);
  },

  setSelectedProject: (project) => set({ selectedProject: project }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  updateProjectStage: (projectId, newStage) => {
    const stageProgressMap: Record<DltmStage, number> = {
      DISPATCHED: 15,
      FEEDBACK: 30,
      MOU_SIGNED: 45,
      SPONSOR_AGREED: 60,
      DATA_COLLECT: 75,
      DEPLOYING: 90,
      COMPLETED: 100,
      PAUSED: 15,
    };

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

    // Update selectedProject if currently viewing
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
  },

  addDocument: (docData) => {
    const newDoc: DltmDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    const updatedDocs = [newDoc, ...get().documents];
    set({ documents: updatedDocs });
    saveToStorage(STORAGE_KEY_DOCS, updatedDocs);

    // Update document count on project
    const updatedProjects = get().projects.map((p) => {
      if (p.id === docData.projectId) {
        return { ...p, documentsCount: (p.documentsCount || 0) + 1 };
      }
      return p;
    });
    set({ projects: updatedProjects });
    saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
  },

  deleteDocument: (docId) => {
    const target = get().documents.find((d) => d.id === docId);
    const updatedDocs = get().documents.filter((d) => d.id !== docId);
    set({ documents: updatedDocs });
    saveToStorage(STORAGE_KEY_DOCS, updatedDocs);

    if (target) {
      const updatedProjects = get().projects.map((p) => {
        if (p.id === target.projectId) {
          return { ...p, documentsCount: Math.max(0, (p.documentsCount || 0) - 1) };
        }
        return p;
      });
      set({ projects: updatedProjects });
      saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
    }
  },

  addWorkLog: (logData) => {
    const newLog: DltmWorkLog = {
      ...logData,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    const updatedLogs = [newLog, ...get().workLogs];
    set({ workLogs: updatedLogs });
    saveToStorage(STORAGE_KEY_LOGS, updatedLogs);

    // Update log count on project
    const updatedProjects = get().projects.map((p) => {
      if (p.id === logData.projectId) {
        return { ...p, workLogsCount: (p.workLogsCount || 0) + 1 };
      }
      return p;
    });
    set({ projects: updatedProjects });
    saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
  },

  addMeeting: (meetingData) => {
    const newMeeting: DltmMeetingSchedule = {
      ...meetingData,
      id: `meet-${Date.now()}`,
    };
    const updatedMeetings = [newMeeting, ...get().meetings];
    set({ meetings: updatedMeetings });
    saveToStorage(STORAGE_KEY_MEETINGS, updatedMeetings);

    // Update next meeting info on project
    const updatedProjects = get().projects.map((p) => {
      if (p.id === meetingData.projectId) {
        return {
          ...p,
          nextMeetingDate: meetingData.scheduledAt,
          nextMeetingContent: meetingData.content,
        };
      }
      return p;
    });
    set({ projects: updatedProjects });
    saveToStorage(STORAGE_KEY_PROJECTS, updatedProjects);
  },

  updateMeetingStatus: (meetingId, status) => {
    const updated = get().meetings.map((m) => (m.id === meetingId ? { ...m, status } : m));
    set({ meetings: updated });
    saveToStorage(STORAGE_KEY_MEETINGS, updated);
  },

  addTask: (taskData) => {
    const newTask: DltmProjectTask = {
      ...taskData,
      id: `ptask-${Date.now()}`,
    };
    const updatedTasks = [...get().tasks, newTask];
    set({ tasks: updatedTasks });
    saveToStorage(STORAGE_KEY_TASKS, updatedTasks);

    // Update task count on project
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

// Backward-compatibility alias
export const useDltmStore = useGovStore;


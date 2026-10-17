import { create } from "zustand";
import { CustomTaskStatus, Task, TaskFilterParams, TaskResolution, TaskStatus } from "../types";
import { taskService } from "../services/taskService";
import { reportService } from "../services/reportService";
import { taskStatusService } from "../services/taskStatusService";
import { User } from "@/shared/types";
import { checkTaskTransitionPermission } from "@/shared/permissions/can";

const isTaskDone = (st: Task, statuses: CustomTaskStatus[]) => {
  const sDef = statuses.find((s) => s.key === st.status);
  if (sDef) {
    return sDef.category === "DONE";
  }
  return st.status === "DONE" || st.status === "CANCELLED" || Boolean(st.closedAt);
};

const hydrateTaskSubtasks = (task: Task, allTasks: Task[], statuses: CustomTaskStatus[]): Task => {
  const directSubtasks = task.subTasks || [];
  const directIds = new Set(directSubtasks.map((st) => String(st.id)));
  const storeSubtasks = allTasks.filter((t) => String(t.parentId) === String(task.id));
  const mergedSubtasks = [
    ...directSubtasks.map((st) => allTasks.find((t) => String(t.id) === String(st.id)) || st),
    ...storeSubtasks.filter((st) => !directIds.has(String(st.id))),
  ];
  return {
    ...task,
    subTasks: mergedSubtasks,
    subtasksCount: mergedSubtasks.length,
    completedSubtasksCount: mergedSubtasks.filter((st) => isTaskDone(st, statuses)).length,
  };
};

const syncTaskInCollection = (
  tasks: Task[],
  updatedTask: Task,
  statuses: CustomTaskStatus[]
): Task[] => {
  const parentId = updatedTask.parentId || updatedTask.parent?.id;

  return tasks.map((t) => {
    if (t.id === updatedTask.id) {
      return {
        ...t,
        ...updatedTask,
      };
    }

    if (parentId && String(t.id) === String(parentId)) {
      const currentSubtasks = t.subTasks || [];
      const hasSubtask = currentSubtasks.some((st) => String(st.id) === String(updatedTask.id));
      const nextSubtasks = hasSubtask
        ? currentSubtasks.map((st) => (String(st.id) === String(updatedTask.id) ? { ...st, ...updatedTask } : st))
        : [...currentSubtasks, updatedTask];
      return {
        ...t,
        subTasks: nextSubtasks,
        subtasksCount: nextSubtasks.length,
        completedSubtasksCount: nextSubtasks.filter((st) => isTaskDone(st, statuses)).length,
      };
    }

    if (t.subTasks && t.subTasks.some((st) => String(st.id) === String(updatedTask.id))) {
      const nextSubtasks = t.subTasks.map((st) =>
        String(st.id) === String(updatedTask.id) ? { ...st, ...updatedTask } : st
      );
      return {
        ...t,
        subTasks: nextSubtasks,
        subtasksCount: nextSubtasks.length,
        completedSubtasksCount: nextSubtasks.filter((st) => isTaskDone(st, statuses)).length,
      };
    }

    return t;
  });
};

const syncActiveTask = (
  activeTask: Task | null,
  updatedTask: Task,
  statuses: CustomTaskStatus[]
): Task | null => {
  if (!activeTask) return null;

  if (activeTask.id === updatedTask.id) {
    return {
      ...activeTask,
      ...updatedTask,
    };
  }

  const parentId = updatedTask.parentId || updatedTask.parent?.id;
  const isParent =
    (parentId && String(activeTask.id) === String(parentId)) ||
    Boolean(activeTask.subTasks && activeTask.subTasks.some((st) => String(st.id) === String(updatedTask.id)));

  if (isParent) {
    const currentSubtasks = activeTask.subTasks || [];
    const hasSubtask = currentSubtasks.some((st) => String(st.id) === String(updatedTask.id));
    const nextSubtasks = hasSubtask
      ? currentSubtasks.map((st) => (String(st.id) === String(updatedTask.id) ? { ...st, ...updatedTask } : st))
      : [...currentSubtasks, updatedTask];
    return {
      ...activeTask,
      subTasks: nextSubtasks,
      subtasksCount: nextSubtasks.length,
      completedSubtasksCount: nextSubtasks.filter((st) => isTaskDone(st, statuses)).length,
    };
  }

  return activeTask;
};

const removeTaskFromCollection = (
  tasks: Task[],
  deletedId: string,
  statuses: CustomTaskStatus[]
): Task[] => {
  return tasks
    .filter((t) => String(t.id) !== String(deletedId))
    .map((t) => {
      if (t.subTasks && t.subTasks.some((st) => String(st.id) === String(deletedId))) {
        const nextSubtasks = t.subTasks.filter((st) => String(st.id) !== String(deletedId));
        return {
          ...t,
          subTasks: nextSubtasks,
          subtasksCount: nextSubtasks.length,
          completedSubtasksCount: nextSubtasks.filter((st) => isTaskDone(st, statuses)).length,
        };
      }
      return t;
    });
};

const removeTaskFromActive = (
  activeTask: Task | null,
  deletedId: string,
  statuses: CustomTaskStatus[]
): Task | null => {
  if (!activeTask) return null;
  if (String(activeTask.id) === String(deletedId)) return null;
  if (activeTask.subTasks && activeTask.subTasks.some((st) => String(st.id) === String(deletedId))) {
    const nextSubtasks = activeTask.subTasks.filter((st) => String(st.id) !== String(deletedId));
    return {
      ...activeTask,
      subTasks: nextSubtasks,
      subtasksCount: nextSubtasks.length,
      completedSubtasksCount: nextSubtasks.filter((st) => isTaskDone(st, statuses)).length,
    };
  }
  return activeTask;
};

interface TaskState {
  tasks: Task[];
  projects: import("../types").TaskProject[];
  statuses: CustomTaskStatus[];
  isWorkflowConfigOpen: boolean;
  workflowConfigProjectId?: string;
  createInitialStatus?: string;
  createInitialProjectId?: string;
  isLoading: boolean;
  isFetchingMore: Record<string, boolean>;
  hasMore: Record<string, boolean>;
  cursors: Record<string, string | null>;
  error: string | null;
  filters: TaskFilterParams;
  viewMode: "kanban" | "list";
  activeTask: Task | null;
  isDetailOpen: boolean;
  isCreateOpen: boolean;

  fetchTasks: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchStatuses: (projectId?: string, departmentId?: string, systemOnly?: boolean) => Promise<void>;
  openWorkflowConfig: (projectId?: string) => void;
  closeWorkflowConfig: () => void;
  addStatus: (data: {
    name: string;
    category: "TODO" | "IN_PROGRESS" | "DONE";
    color?: string;
    projectId?: string;
    departmentId?: string;
  }) => Promise<CustomTaskStatus>;
  updateStatus: (id: string, updates: Partial<CustomTaskStatus>) => Promise<CustomTaskStatus>;
  deleteStatus: (id: string, targetKey?: string, projectId?: string) => Promise<boolean>;
  syncStatuses: (data: {
    projectId?: string;
    departmentId?: string;
    statuses: {
      name: string;
      category: "TODO" | "IN_PROGRESS" | "DONE";
      color?: string;
      key?: string;
    }[];
    migrateMap?: Record<string, string>;
  }) => Promise<CustomTaskStatus[]>;
  reorderStatuses: (items: { id: number | string; order_index: number }[]) => Promise<boolean>;
  fetchMoreTasks: (status?: TaskStatus) => Promise<void>;
  setFilters: (newFilters: Partial<TaskFilterParams>) => void;
  resetFilters: () => void;
  setViewMode: (mode: "kanban" | "list") => void;
  openDetail: (task: Task) => void;
  closeDetail: () => void;
  openCreate: (initialStatus?: string | unknown, initialProjectId?: string) => void;
  closeCreate: () => void;

  moveTask: (
    taskId: string,
    targetStatus: TaskStatus,
    currentUser: User
  ) => Promise<{ success: boolean; reason?: string }>;
  closeTask: (
    taskId: string,
    resolution: TaskResolution,
    note?: string,
    currentUser?: User
  ) => Promise<{ success: boolean; reason?: string }>;
  reopenTask: (
    taskId: string,
    currentUser: User
  ) => Promise<{ success: boolean; reason?: string }>;
  createTask: (newTaskData: Parameters<typeof taskService.createTask>[0]) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;
  createSubtask: (parentId: string, data: import("../types").CreateSubtaskInput) => Promise<Task>;
  uploadAttachment: (taskId: string, file: File) => Promise<import("../types").TaskAttachment>;
  uploadAttachments: (taskId: string, files: File[]) => Promise<import("../types").TaskAttachment[]>;
  deleteAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  addComment: (taskId: string, authorId: string, content: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  projects: [],
  statuses: [],
  isWorkflowConfigOpen: false,
  workflowConfigProjectId: undefined,
  createInitialStatus: undefined,
  createInitialProjectId: undefined,
  isLoading: false,
  isFetchingMore: {},
  hasMore: {},
  cursors: {},
  error: null,
  filters: {
    search: "",
    projectId: "ALL",
    departmentId: "ALL",
    assigneeId: "ALL",
    priority: "ALL",
    status: "ALL",
    isMyTasksOnly: false,
    dueDateRange: "all",
  },
  viewMode: "kanban",
  activeTask: null,
  isDetailOpen: false,
  isCreateOpen: false,

  openWorkflowConfig: (projectId?: string) =>
    set({ isWorkflowConfigOpen: true, workflowConfigProjectId: projectId }),
  closeWorkflowConfig: () =>
    set({ isWorkflowConfigOpen: false, workflowConfigProjectId: undefined }),

  fetchStatuses: async (projectId?: string, departmentId?: string, systemOnly?: boolean) => {
    try {
      const pId = projectId !== "ALL" ? projectId : undefined;
      const dId = departmentId !== "ALL" ? departmentId : undefined;
      const statuses = await taskStatusService.getStatuses(pId, dId, systemOnly);
      set({ statuses });
    } catch (err) {
      console.warn("Lỗi khi tải statuses:", err);
    }
  },

  addStatus: async (data) => {
    const newStatus = await taskStatusService.createStatus(data);
    set((state) => ({ statuses: [...state.statuses, newStatus] }));
    return newStatus;
  },

  updateStatus: async (id, updates) => {
    const updated = await taskStatusService.updateStatus(id, updates);
    set((state) => ({
      statuses: state.statuses.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    }));
    return updated;
  },

  deleteStatus: async (id, targetKey, projectId) => {
    const pId = projectId || get().filters.projectId;
    const success = await taskStatusService.deleteStatus(id, targetKey, pId);
    if (success) {
      await get().fetchStatuses(pId, get().filters.departmentId);
      await get().fetchTasks();
      return true;
    }
    return false;
  },

  syncStatuses: async (data) => {
    const updated = await taskStatusService.syncStatuses(data);
    const targetProj = data.projectId !== undefined ? data.projectId : get().filters.projectId;
    const activeDept = get().filters.departmentId;
    await get().fetchStatuses(
      targetProj !== "ALL" ? targetProj : undefined,
      activeDept !== "ALL" ? activeDept : undefined
    );
    await get().fetchTasks();
    return updated;
  },

  reorderStatuses: async (items) => {
    const success = await taskStatusService.reorderStatuses(items);
    if (success) {
      set((state) => {
        const orderMap = new Map(items.map((it) => [String(it.id), it.order_index]));
        const reordered = [...state.statuses].sort((a, b) => {
          const ordA = orderMap.get(String(a.id)) ?? a.orderIndex;
          const ordB = orderMap.get(String(b.id)) ?? b.orderIndex;
          return ordA - ordB;
        });
        return { statuses: reordered };
      });
    }
    return success;
  },

  fetchProjects: async () => {
    if (get().projects.length > 0) return;
    try {
      const { apiRequest } = await import("@/lib/api-client");
      const res = await apiRequest<{ success: boolean; data: { internal: any[]; gov_solutions: any[] } }>("/erp/projects");
      if (res && res.success && res.data) {
        const { internal = [], gov_solutions = [] } = res.data;

        const internalProjects: import("../types").TaskProject[] = internal.map((p) => ({
          id: String(p.id),
          key: (p as any).code || String(p.id),
          code: (p as any).code,
          name: p.name,
          category: "INTERNAL" as const,
        }));

        const govProjects: import("../types").TaskProject[] = gov_solutions.map((gp) => {
          const uniqueId = `gov_${gp.id}`;
          return {
            id: uniqueId,
            key: gp.master_project?.code || `GOV-${gp.id}`,
            code: gp.master_project?.code,
            name: `${gp.province?.name || "Không rõ"}`,
            category: "GOV_SOLUTION" as const,
            groupName: gp.master_project?.name || "DỰ ÁN CĐS TỈNH",
          };
        });

        const seenIds = new Set<string>();
        const uniqueProjects: import("../types").TaskProject[] = [];

        for (const p of [...internalProjects, ...govProjects]) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            uniqueProjects.push(p);
          }
        }

        const updates: Partial<TaskState> = { projects: uniqueProjects };
        if (get().viewMode === "kanban" && (!get().filters.projectId || get().filters.projectId === "ALL") && uniqueProjects.length > 0) {
          updates.filters = { ...get().filters, projectId: uniqueProjects[0].id };
        }
        set(updates);
        return;
      }
    } catch (err) {
      console.warn("Failed to fetch projects", err);
    }
  },

  fetchTasks: async () => {
    const currentState = get();
    if (currentState.isLoading) return;

    set({ isLoading: true, error: null });

    if (currentState.projects.length === 0) {
      await get().fetchProjects();
    }

    let activeProjectId = get().filters.projectId;
    if (get().viewMode === "kanban" && (!activeProjectId || activeProjectId === "ALL") && get().projects.length > 0) {
      activeProjectId = get().projects[0].id;
      set({ filters: { ...get().filters, projectId: activeProjectId } });
    }

    await get().fetchStatuses(
      activeProjectId && activeProjectId !== "ALL" ? activeProjectId : undefined,
      get().filters.departmentId && get().filters.departmentId !== "ALL" ? get().filters.departmentId : undefined
    );

    try {
      const state = get();
      const baseFilters = state.filters;

      if (state.viewMode === "kanban") {
        const { tasks, cursors, hasMore } = await taskService.getKanbanTasks({
          ...baseFilters,
          perPage: 10,
        });

        const currentActive = get().activeTask;
        let refreshedActive = currentActive;
        if (currentActive) {
          const found = tasks.find((t) => t.id === currentActive.id);
          if (found) {
            refreshedActive = hydrateTaskSubtasks(found, tasks, get().statuses);
          }
        }

        set({ tasks, cursors, hasMore, activeTask: refreshedActive, isLoading: false });
      } else {
        const { tasks, meta } = await taskService.getTasks({ ...baseFilters, perPage: 10 });
        const currentActive = get().activeTask;
        let refreshedActive = currentActive;
        if (currentActive) {
          const found = tasks.find((t) => t.id === currentActive.id);
          if (found) {
            refreshedActive = hydrateTaskSubtasks(found, tasks, get().statuses);
          }
        }

        set({
          tasks,
          activeTask: refreshedActive,
          cursors: { ALL: meta?.next_cursor || null },
          hasMore: { ALL: meta?.has_more ?? false },
          isLoading: false
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu công việc";
      set({ error: message, isLoading: false });
    }
  },

  fetchMoreTasks: async (statusColumn?: TaskStatus) => {
    const state = get();
    const cursorKey = statusColumn || "ALL";

    if (state.isFetchingMore[cursorKey] || state.hasMore[cursorKey] === false || !state.cursors[cursorKey]) return;

    set({ isFetchingMore: { ...state.isFetchingMore, [cursorKey]: true }, error: null });
    try {
      const filtersToApply = { ...state.filters };
      if (statusColumn) {
        filtersToApply.status = statusColumn;
        filtersToApply.perPage = 10;
      } else {
        filtersToApply.perPage = 10;
      }

      const { tasks, meta } = await taskService.getTasks({
        ...filtersToApply,
        cursor: state.cursors[cursorKey],
      });

      const newTasks = tasks.filter(t => !state.tasks.find(existing => existing.id === t.id));

      set((prev) => ({
        tasks: [...prev.tasks, ...newTasks],
        isFetchingMore: { ...prev.isFetchingMore, [cursorKey]: false },
        cursors: { ...prev.cursors, [cursorKey]: meta?.next_cursor || null },
        hasMore: { ...prev.hasMore, [cursorKey]: meta?.has_more ?? false },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi tải thêm dữ liệu";
      set((prev) => ({
        error: message,
        isFetchingMore: { ...prev.isFetchingMore, [cursorKey]: false }
      }));
    }
  },

  setFilters: async (newFilters) => {
    const prev = get().filters;
    const updated = { ...prev, ...newFilters };

    if (get().viewMode === "kanban" && (!updated.projectId || updated.projectId === "ALL") && get().projects.length > 0) {
      updated.projectId = get().projects[0].id;
    }

    set({ filters: updated });
    if (newFilters.projectId !== undefined || newFilters.departmentId !== undefined) {
      await get().fetchStatuses(
        updated.projectId && updated.projectId !== "ALL" ? updated.projectId : undefined,
        updated.departmentId && updated.departmentId !== "ALL" ? updated.departmentId : undefined
      );
    }
    await get().fetchTasks();
  },

  resetFilters: async () => {
    const isKanban = get().viewMode === "kanban";
    const defaultProjectId = isKanban && get().projects.length > 0 ? get().projects[0].id : "ALL";

    set({
      filters: {
        search: "",
        projectId: defaultProjectId,
        departmentId: "ALL",
        assigneeId: "ALL",
        priority: "ALL",
        status: "ALL",
        isMyTasksOnly: false,
        dueDateRange: "all",
      },
    });
    await get().fetchStatuses(defaultProjectId !== "ALL" ? defaultProjectId : undefined, undefined);
    await get().fetchTasks();
  },

  setViewMode: async (mode) => {
    set({ viewMode: mode });
    const currentFilters = get().filters;
    if (mode === "kanban" && (!currentFilters.projectId || currentFilters.projectId === "ALL") && get().projects.length > 0) {
      const defaultProjId = get().projects[0].id;
      set({ filters: { ...currentFilters, projectId: defaultProjId } });
      await get().fetchStatuses(defaultProjId, currentFilters.departmentId && currentFilters.departmentId !== "ALL" ? currentFilters.departmentId : undefined);
      await get().fetchTasks();
    } else {
      await get().fetchTasks();
    }
  },

  openDetail: (task) => {
    const currentTasks = get().tasks;
    const freshTask = currentTasks.find((t) => t.id === task.id) || task;
    const hydratedTask = hydrateTaskSubtasks(freshTask, currentTasks, get().statuses);
    set({ activeTask: hydratedTask, isDetailOpen: true });
  },
  closeDetail: () => set({ isDetailOpen: false }),

  openCreate: (initialStatus?: string | unknown, initialProjectId?: string) =>
    set({
      isCreateOpen: true,
      createInitialStatus: typeof initialStatus === "string" ? initialStatus : undefined,
      createInitialProjectId: typeof initialProjectId === "string" ? initialProjectId : undefined,
    }),
  closeCreate: () =>
    set({
      isCreateOpen: false,
      createInitialStatus: undefined,
      createInitialProjectId: undefined,
    }),

  moveTask: async (taskId, targetStatus, currentUser) => {
    const currentTasks = get().tasks;
    const taskIndex = currentTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return { success: false, reason: "Không tìm thấy task" };
    }

    const task = currentTasks[taskIndex];
    if (task.status === targetStatus) {
      return { success: true };
    }

    const allStatuses = get().statuses;
    const targetStatusDef = allStatuses.find((s) => s.key === targetStatus);
    const isTargetDone = targetStatusDef?.category === "DONE" || targetStatus === "DONE" || targetStatus === "CANCELLED";

    const permission = checkTaskTransitionPermission(currentUser, task, targetStatus, allStatuses);
    if (!permission.allowed) {
      return { success: false, reason: permission.reason };
    }

    const previousStatus = task.status;
    const previousResolution = task.resolution;
    const previousClosedAt = task.closedAt;

    const targetResolution = isTargetDone
      ? (task.resolution || (targetStatus === "CANCELLED" ? "WONT_FIX" : "DONE"))
      : undefined;

    const nowIso = new Date().toISOString();
    const updatedTaskObj: Task = {
      ...task,
      status: targetStatus,
      resolution: targetResolution,
      closedAt: isTargetDone ? (task.closedAt || nowIso) : undefined,
      updatedAt: nowIso,
    };

    set((state) => ({
      tasks: syncTaskInCollection(state.tasks, updatedTaskObj, state.statuses),
      activeTask: syncActiveTask(state.activeTask, updatedTaskObj, state.statuses),
    }));

    try {
      const serverUpdated = await taskService.updateTaskStatus(taskId, targetStatus, targetResolution);
      if (serverUpdated) {
        set((state) => ({
          tasks: syncTaskInCollection(state.tasks, serverUpdated, state.statuses),
          activeTask: syncActiveTask(state.activeTask, serverUpdated, state.statuses),
        }));
      }
      return { success: true };
    } catch {
      const rolledBackObj: Task = {
        ...task,
        status: previousStatus,
        resolution: previousResolution,
        closedAt: previousClosedAt,
      };
      set((state) => ({
        tasks: syncTaskInCollection(state.tasks, rolledBackObj, state.statuses),
        activeTask: syncActiveTask(state.activeTask, rolledBackObj, state.statuses),
      }));
      return {
        success: false,
        reason: "Lỗi kết nối khi cập nhật trạng thái. Đã khôi phục trạng thái ban đầu.",
      };
    }
  },

  closeTask: async (taskId, resolution, note, currentUser) => {
    const currentTasks = get().tasks;
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, reason: "Không tìm thấy công việc cần đóng" };
    }

    const allStatuses = get().statuses;
    const cancelStatus = allStatuses.find((s) => s.category === "DONE" && (s.key === "CANCELLED" || s.name.toLowerCase().includes("hủy") || s.name.toLowerCase().includes("đóng")))?.key
      || allStatuses.find((s) => s.category === "DONE")?.key
      || "CANCELLED";

    if (currentUser) {
      const permission = checkTaskTransitionPermission(currentUser, task, cancelStatus, allStatuses);
      if (!permission.allowed) {
        return { success: false, reason: permission.reason };
      }
    }

    try {
      const updated = await taskService.closeTask(taskId, resolution, note, currentUser?.id, cancelStatus);
      set((state) => ({
        tasks: syncTaskInCollection(state.tasks, updated, state.statuses),
        activeTask: syncActiveTask(state.activeTask, updated, state.statuses),
      }));
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi khi đóng công việc";
      return { success: false, reason: msg };
    }
  },

  reopenTask: async (taskId, currentUser) => {
    const currentTasks = get().tasks;
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, reason: "Không tìm thấy công việc cần mở lại" };
    }

    const allStatuses = get().statuses;
    const todoStatus = allStatuses.find((s) => s.category === "TODO")?.key || allStatuses[0]?.key || "TODO";

    const permission = checkTaskTransitionPermission(currentUser, task, todoStatus, allStatuses);
    if (!permission.allowed) {
      return { success: false, reason: permission.reason };
    }

    try {
      const updated = await taskService.reopenTask(taskId, todoStatus);
      set((state) => ({
        tasks: syncTaskInCollection(state.tasks, updated, state.statuses),
        activeTask: syncActiveTask(state.activeTask, updated, state.statuses),
      }));
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi khi mở lại công việc";
      return { success: false, reason: msg };
    }
  },

  createTask: async (newTaskData) => {
    const created = await taskService.createTask(newTaskData);
    set((state) => ({
      tasks: [created, ...state.tasks],
    }));
    return created;
  },

  updateTask: async (id, updates) => {
    const updated = await taskService.updateTask(id, updates);
    set((state) => ({
      tasks: syncTaskInCollection(state.tasks, updated, state.statuses),
      activeTask: syncActiveTask(state.activeTask, updated, state.statuses),
    }));
    return updated;
  },

  deleteTask: async (id) => {
    const success = await taskService.deleteTask(id);
    if (success) {
      set((state) => ({
        tasks: removeTaskFromCollection(state.tasks, id, state.statuses),
        activeTask: removeTaskFromActive(state.activeTask, id, state.statuses),
        isDetailOpen: state.activeTask?.id === id ? false : state.isDetailOpen,
      }));
    }
    return success;
  },



  createSubtask: async (parentId, data) => {
    const parentTask =
      get().activeTask?.id === parentId
        ? get().activeTask
        : get().tasks.find((t) => t.id === parentId);

    const created = await taskService.createSubtask(
      parentId,
      data,
      parentTask || undefined
    );

    const newSubtask: Task = {
      ...created,
      parentId: parentId,
      parent: created.parent || (parentTask ? {
        id: parentTask.id,
        code: parentTask.code,
        title: parentTask.title,
      } as any : null),
    };

    set((state) => {
      const tasksWithSub = state.tasks.some((t) => t.id === newSubtask.id)
        ? state.tasks
        : [...state.tasks, newSubtask];

      return {
        tasks: syncTaskInCollection(tasksWithSub, newSubtask, state.statuses),
        activeTask: syncActiveTask(state.activeTask, newSubtask, state.statuses),
      };
    });

    return newSubtask;
  },

  uploadAttachment: async (taskId, file) => {
    const newAttachment = await taskService.uploadAttachment(taskId, file);
    set((state) => {
      const updatedActiveTask =
        state.activeTask?.id === taskId
          ? {
              ...state.activeTask,
              attachments: [...(state.activeTask.attachments || []), newAttachment],
            }
          : state.activeTask;

      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              attachments: [...(t.attachments || []), newAttachment],
            }
          : t
      );

      return {
        activeTask: updatedActiveTask,
        tasks: updatedTasks,
      };
    });
    return newAttachment;
  },

  uploadAttachments: async (taskId, files) => {
    const newAttachments = await taskService.uploadAttachments(taskId, files);
    set((state) => {
      const updatedActiveTask =
        state.activeTask?.id === taskId
          ? {
              ...state.activeTask,
              attachments: [...(state.activeTask.attachments || []), ...newAttachments],
            }
          : state.activeTask;

      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              attachments: [...(t.attachments || []), ...newAttachments],
            }
          : t
      );

      return {
        activeTask: updatedActiveTask,
        tasks: updatedTasks,
      };
    });
    return newAttachments;
  },

  deleteAttachment: async (taskId, attachmentId) => {
    await taskService.deleteAttachment(taskId, attachmentId);
    set((state) => {
      const updatedActiveTask =
        state.activeTask?.id === taskId
          ? {
              ...state.activeTask,
              attachments: (state.activeTask.attachments || []).filter((a) => a.id !== attachmentId),
            }
          : state.activeTask;

      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              attachments: (t.attachments || []).filter((a) => a.id !== attachmentId),
            }
          : t
      );

      return {
        activeTask: updatedActiveTask,
        tasks: updatedTasks,
      };
    });
  },

  toggleChecklistItem: async (taskId, itemId) => {
    const current =
      get().activeTask?.id === taskId
        ? get().activeTask
        : get().tasks.find((t) => t.id === taskId);
    if (!current || !current.checklist) return;

    const newChecklist = current.checklist.map((item) =>
      String(item.id) === String(itemId)
        ? { ...item, isCompleted: !item.isCompleted }
        : item
    );

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, checklist: newChecklist } : t
      ),
      activeTask:
        state.activeTask?.id === taskId
          ? { ...state.activeTask, checklist: newChecklist }
          : state.activeTask,
    }));

    await get().updateTask(taskId, { checklist: newChecklist });
  },

  addComment: async (taskId, authorId, content) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    await get().updateTask(taskId, {
      commentsCount: task.commentsCount + 1,
    });
  },

  resetToDefault: async () => {
    set({ isLoading: true, tasks: [], cursors: {}, hasMore: {} });
    await Promise.all([
      taskService.resetToDefault(),
      reportService.resetToDefault(),
    ]);
    get().fetchTasks();
  },
}));

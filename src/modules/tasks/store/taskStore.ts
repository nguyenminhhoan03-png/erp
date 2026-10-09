import { create } from "zustand";
import { CustomTaskStatus, Task, TaskFilterParams, TaskResolution, TaskStatus } from "../types";
import { taskService } from "../services/taskService";
import { reportService } from "../services/reportService";
import { taskStatusService } from "../services/taskStatusService";
import { INITIAL_MOCK_TASKS } from "../mock-data";
import { User } from "@/shared/types";
import { checkTaskTransitionPermission } from "@/shared/permissions/can";

interface TaskState {
  tasks: Task[];
  projects: import("../types").TaskProject[];
  statuses: CustomTaskStatus[];
  isWorkflowConfigOpen: boolean;
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

  // Actions
  fetchTasks: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchStatuses: (projectId?: string, departmentId?: string) => Promise<void>;
  openWorkflowConfig: () => void;
  closeWorkflowConfig: () => void;
  addStatus: (data: {
    name: string;
    category: "TODO" | "IN_PROGRESS" | "DONE";
    color?: string;
    projectId?: string;
    departmentId?: string;
  }) => Promise<CustomTaskStatus>;
  updateStatus: (id: string, updates: Partial<CustomTaskStatus>) => Promise<CustomTaskStatus>;
  deleteStatus: (id: string, targetKey?: string) => Promise<boolean>;
  reorderStatuses: (items: { id: number | string; order_index: number }[]) => Promise<boolean>;
  fetchMoreTasks: (status?: TaskStatus) => Promise<void>;
  setFilters: (newFilters: Partial<TaskFilterParams>) => void;
  resetFilters: () => void;
  setViewMode: (mode: "kanban" | "list") => void;
  openDetail: (task: Task) => void;
  closeDetail: () => void;
  openCreate: () => void;
  closeCreate: () => void;

  // Task Mutations
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
  approveTask: (taskId: string, approvedBy: User) => Promise<{ success: boolean; reason?: string }>;
  rejectTask: (taskId: string, rejectedBy: User) => Promise<{ success: boolean; reason?: string }>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  addComment: (taskId: string, authorId: string, content: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  projects: [],
  statuses: [],
  isWorkflowConfigOpen: false,
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

  openWorkflowConfig: () => set({ isWorkflowConfigOpen: true }),
  closeWorkflowConfig: () => set({ isWorkflowConfigOpen: false }),

  fetchStatuses: async (projectId?: string, departmentId?: string) => {
    try {
      const pId = projectId !== "ALL" ? projectId : undefined;
      const dId = departmentId !== "ALL" ? departmentId : undefined;
      const statuses = await taskStatusService.getStatuses(pId, dId);
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

  deleteStatus: async (id, targetKey) => {
    const success = await taskStatusService.deleteStatus(id, targetKey);
    if (success) {
      set((state) => ({
        statuses: state.statuses.filter((s) => s.id !== id),
        tasks: state.tasks.map((t) => {
          const deleted = state.statuses.find((s) => s.id === id);
          return deleted && t.status === deleted.key ? { ...t, status: targetKey || "TODO" } : t;
        }),
      }));
    }
    return success;
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

        const internalProjects: import("../types").TaskProject[] = [
          {
            id: "ERP_CORE",
            key: "ERP",
            name: "Hệ thống ERP Doanh nghiệp",
            category: "INTERNAL",
          },
          ...internal.map((p) => ({
            id: String(p.id),
            key: (p as any).code || String(p.id),
            code: (p as any).code,
            name: p.name,
            category: "INTERNAL" as const,
          })),
        ];

        const govProjects: import("../types").TaskProject[] = gov_solutions.map((gp) => {
          return {
            id: `GOV_${gp.id}`,
            key: gp.master_project?.code || String(gp.id),
            code: gp.master_project?.code,
            name: `${gp.province?.name || "Không rõ"}`,
            category: "GOV_SOLUTION" as const,
            groupName: gp.master_project?.name || "DỰ ÁN CĐS TỈNH",
          };
        });

        set({ projects: [...internalProjects, ...govProjects] });
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

    // Đảm bảo fetch projects và statuses nếu chưa có
    if (currentState.projects.length === 0) {
      currentState.fetchProjects();
    }
    if (currentState.statuses.length === 0) {
      await currentState.fetchStatuses(currentState.filters.projectId, currentState.filters.departmentId);
    }

    try {
      const state = get();
      const baseFilters = state.filters;

      if (state.viewMode === "kanban") {
        // Tối ưu Kanban: gọi endpoint kanban tải ~10 task mỗi cột chuẩn xác
        const { tasks, cursors, hasMore } = await taskService.getKanbanTasks({
          ...baseFilters,
          perPage: 10,
        });

        set({ tasks, cursors, hasMore, isLoading: false });
      } else {
        // List View: Fetch 10 task mỗi trang theo chuẩn UX
        const { tasks, meta } = await taskService.getTasks({ ...baseFilters, perPage: 10 });
        set({
          tasks,
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
    // Dùng key là status truyền vào, nếu không truyền thì ngầm hiểu là view dạng List (ALL)
    const cursorKey = statusColumn || "ALL";

    if (state.isFetchingMore[cursorKey] || state.hasMore[cursorKey] === false || !state.cursors[cursorKey]) return;

    set({ isFetchingMore: { ...state.isFetchingMore, [cursorKey]: true }, error: null });
    try {
      const filtersToApply = { ...state.filters };
      if (statusColumn) {
        filtersToApply.status = statusColumn;
        filtersToApply.perPage = 10; // Load thêm 10 task mỗi lần cuộn theo đúng yêu cầu
      } else {
        filtersToApply.perPage = 10;
      }

      const { tasks, meta } = await taskService.getTasks({
        ...filtersToApply,
        cursor: state.cursors[cursorKey],
      });

      // Gộp task mới, đảm bảo không trùng ID
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

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchTasks();
  },

  resetFilters: () => {
    set({
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
    });
    get().fetchTasks();
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  openDetail: (task) => set({ activeTask: task, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),

  openCreate: () => set({ isCreateOpen: true }),
  closeCreate: () => set({ isCreateOpen: false }),

  /**
   * Kéo thả Task (Optimistic update kèm Rollback nếu không hợp lệ)
   */
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

    // 1. Kiểm tra quy tắc chuyển trạng thái
    const permission = checkTaskTransitionPermission(currentUser, task, targetStatus);
    if (!permission.allowed) {
      return { success: false, reason: permission.reason };
    }

    // 2. Optimistic update: cập nhật state ngay lập tức để UI mượt mà
    const previousStatus = task.status;
    const previousResolution = task.resolution;
    const targetResolution =
      targetStatus === "DONE"
        ? "DONE"
        : targetStatus === "CANCELLED"
          ? task.resolution || "WONT_FIX"
          : undefined;

    const updatedTaskObj = {
      ...task,
      status: targetStatus,
      resolution: targetResolution,
    };

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTaskObj;
    set({ tasks: updatedTasks });

    // Cập nhật cả activeTask nếu đang mở dialog
    if (get().activeTask?.id === taskId) {
      set({ activeTask: updatedTaskObj });
    }

    // 3. Gọi service
    try {
      await taskService.updateTaskStatus(taskId, targetStatus, targetResolution);
      return { success: true };
    } catch {
      // Rollback nếu API lỗi
      const rolledBack = [...get().tasks];
      const rIdx = rolledBack.findIndex((t) => t.id === taskId);
      if (rIdx !== -1) {
        rolledBack[rIdx] = {
          ...rolledBack[rIdx],
          status: previousStatus,
          resolution: previousResolution,
        };
        set({ tasks: rolledBack });
      }
      return {
        success: false,
        reason: "Lỗi kết nối khi cập nhật trạng thái. Đã khôi phục trạng thái ban đầu.",
      };
    }
  },

  /**
   * Đóng task với Resolution cụ thể (Won't Fix, Not a Bug, Duplicate, Cannot Reproduce)
   */
  closeTask: async (taskId, resolution, note, currentUser) => {
    const currentTasks = get().tasks;
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, reason: "Không tìm thấy công việc cần đóng" };
    }

    if (currentUser) {
      const permission = checkTaskTransitionPermission(currentUser, task, "CANCELLED");
      if (!permission.allowed) {
        return { success: false, reason: permission.reason };
      }
    }

    try {
      const updated = await taskService.closeTask(taskId, resolution, note, currentUser?.id);
      const updatedTasks = get().tasks.map((t) => (t.id === taskId ? updated : t));
      set({ tasks: updatedTasks });
      if (get().activeTask?.id === taskId) {
        set({ activeTask: updated });
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi khi đóng công việc";
      return { success: false, reason: msg };
    }
  },

  /**
   * Mở lại công việc đã đóng hoặc đã nghiệm thu (Reopen về To Do)
   */
  reopenTask: async (taskId, currentUser) => {
    const currentTasks = get().tasks;
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, reason: "Không tìm thấy công việc cần mở lại" };
    }

    const permission = checkTaskTransitionPermission(currentUser, task, "TODO");
    if (!permission.allowed) {
      return { success: false, reason: permission.reason };
    }

    try {
      const updated = await taskService.reopenTask(taskId);
      const updatedTasks = get().tasks.map((t) => (t.id === taskId ? updated : t));
      set({ tasks: updatedTasks });
      if (get().activeTask?.id === taskId) {
        set({ activeTask: updated });
      }
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
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      activeTask: state.activeTask?.id === id ? updated : state.activeTask,
    }));
    return updated;
  },

  deleteTask: async (id) => {
    const success = await taskService.deleteTask(id);
    if (success) {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        activeTask: state.activeTask?.id === id ? null : state.activeTask,
        isDetailOpen: state.activeTask?.id === id ? false : state.isDetailOpen,
      }));
    }
    return success;
  },

  approveTask: async (taskId, approvedBy) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, reason: "Không tìm thấy task" };

    if (approvedBy.role === "EMPLOYEE") {
      return { success: false, reason: "Nhân viên không có quyền phê duyệt task." };
    }

    await taskService.updateTask(taskId, {
      status: "TODO",
      isApproved: true,
      requiresApproval: false,
      approvedById: approvedBy.id,
    });

    await get().fetchTasks();
    return { success: true };
  },

  rejectTask: async (taskId, rejectedBy) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, reason: "Không tìm thấy task" };

    if (rejectedBy.role === "EMPLOYEE") {
      return { success: false, reason: "Nhân viên không có quyền từ chối task." };
    }

    await taskService.updateTask(taskId, {
      status: "CANCELLED",
      isApproved: false,
    });

    await get().fetchTasks();
    return { success: true };
  },

  toggleChecklistItem: async (taskId, itemId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );

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

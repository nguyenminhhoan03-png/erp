import { create } from "zustand";
import { Task, TaskFilterParams, TaskResolution, TaskStatus } from "../types";
import { taskService } from "../services/taskService";
import { reportService } from "../services/reportService";
import { INITIAL_MOCK_TASKS } from "../mock-data";
import { User } from "@/shared/types";
import { checkTaskTransitionPermission } from "@/shared/permissions/can";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filters: TaskFilterParams;
  viewMode: "kanban" | "list";
  activeTask: Task | null;
  isDetailOpen: boolean;
  isCreateOpen: boolean;

  // Actions
  fetchTasks: () => Promise<void>;
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
  tasks: [...INITIAL_MOCK_TASKS],
  isLoading: false,
  error: null,
  filters: {
    search: "",
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

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await taskService.getTasks(get().filters);
      set({ tasks: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu công việc";
      set({ error: message, isLoading: false });
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
    set({ isLoading: true });
    await Promise.all([
      taskService.resetToDefault(),
      reportService.resetToDefault(),
    ]);
    const data = await taskService.getTasks(get().filters);
    set({ tasks: data, isLoading: false });
  },
}));

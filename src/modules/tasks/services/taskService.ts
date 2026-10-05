import { INITIAL_MOCK_TASKS } from "../mock-data";
import { Task, TaskFilterParams, TaskResolution, TaskStatus } from "../types";

const DELAY_MIN = 250;
const DELAY_MAX = 500;

function fakeDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STORAGE_KEY = "erp_tasks_cache_v3";

// Cache in-memory / localStorage để giữ trạng thái khi demo
function getStoredTasks(): Task[] {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  const defaultTasks = [...INITIAL_MOCK_TASKS];
  saveStoredTasks(defaultTasks);
  return defaultTasks;
}

function saveStoredTasks(tasks: Task[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Ignore
    }
  }
}

let inMemoryTasks: Task[] = getStoredTasks();

export const taskService = {
  /**
   * Lấy danh sách task kèm bộ lọc
   */
  async getTasks(params?: TaskFilterParams): Promise<Task[]> {
    await fakeDelay();
    if (!inMemoryTasks || inMemoryTasks.length === 0) {
      inMemoryTasks = getStoredTasks();
    }
    let result = [...inMemoryTasks];

    if (!params) return result;

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.projectName && t.projectName.toLowerCase().includes(q))
      );
    }

    if (params.projectId && params.projectId !== "ALL") {
      result = result.filter((t) => t.projectId === params.projectId);
    }

    if (params.departmentId && params.departmentId !== "ALL") {
      result = result.filter((t) => t.departmentId === params.departmentId);
    }

    if (params.assigneeId && params.assigneeId !== "ALL") {
      result = result.filter((t) => t.assigneeIds.includes(params.assigneeId!));
    }

    if (params.priority && params.priority !== "ALL") {
      result = result.filter((t) => t.priority === params.priority);
    }

    if (params.status && params.status !== "ALL") {
      result = result.filter((t) => t.status === params.status);
    }

    return result;
  },

  /**
   * Lấy chi tiết một task theo ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    await fakeDelay();
    const task = inMemoryTasks.find((t) => t.id === id);
    return task ? { ...task } : null;
  },

  /**
   * Tạo task mới
   */
  async createTask(data: Omit<Task, "id" | "code" | "createdAt" | "updatedAt">): Promise<Task> {
    await fakeDelay();
    const newId = `task-${Date.now()}`;
    const pKey = data.projectKey || (data.projectId === "ERP_CORE" ? "ERP" : "ERP");
    const newCode = `${pKey}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newTask: Task = {
      ...data,
      id: newId,
      code: newCode,
      createdAt: now,
      updatedAt: now,
    };

    inMemoryTasks = [newTask, ...inMemoryTasks];
    saveStoredTasks(inMemoryTasks);
    return { ...newTask };
  },

  /**
   * Cập nhật thông tin task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await fakeDelay();
    const index = inMemoryTasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy task với ID: ${id}`);
    }

    const updatedTask: Task = {
      ...inMemoryTasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    inMemoryTasks[index] = updatedTask;
    saveStoredTasks(inMemoryTasks);
    return { ...updatedTask };
  },

  /**
   * Cập nhật trạng thái task (khi kéo thả Kanban hoặc duyệt)
   */
  async updateTaskStatus(
    id: string,
    newStatus: TaskStatus,
    resolution?: TaskResolution,
    resolutionNote?: string,
    closedById?: string
  ): Promise<Task> {
    await fakeDelay();
    const index = inMemoryTasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy task với ID: ${id}`);
    }

    const current = inMemoryTasks[index];
    const now = new Date().toISOString();

    let resolvedVal = resolution || current.resolution;
    if (newStatus === "DONE") {
      resolvedVal = "DONE";
    } else if (newStatus === "CANCELLED") {
      resolvedVal = resolution || current.resolution || "WONT_FIX";
    } else {
      // Khi kéo về TODO, IN_PROGRESS, IN_REVIEW thì xóa resolution
      resolvedVal = undefined;
    }

    const updatedTask: Task = {
      ...current,
      status: newStatus,
      isApproved: newStatus !== "PENDING_APPROVAL",
      resolution: resolvedVal,
      resolutionNote: newStatus === "CANCELLED" ? resolutionNote || current.resolutionNote : undefined,
      closedAt: newStatus === "CANCELLED" || newStatus === "DONE" ? current.closedAt || now : undefined,
      closedById: newStatus === "CANCELLED" ? closedById || current.closedById : undefined,
      updatedAt: now,
    };

    inMemoryTasks[index] = updatedTask;
    saveStoredTasks(inMemoryTasks);
    return { ...updatedTask };
  },

  /**
   * Đóng task kèm kết quả xử lý (Jira Resolution)
   */
  async closeTask(
    id: string,
    resolution: TaskResolution,
    note?: string,
    closedById?: string
  ): Promise<Task> {
    return this.updateTaskStatus(id, "CANCELLED", resolution, note, closedById);
  },

  /**
   * Mở lại task đã đóng hoặc đã Done (Reopen Task sang To Do)
   */
  async reopenTask(id: string): Promise<Task> {
    return this.updateTaskStatus(id, "TODO");
  },

  /**
   * Xóa task
   */
  async deleteTask(id: string): Promise<boolean> {
    await fakeDelay();
    const prevLen = inMemoryTasks.length;
    inMemoryTasks = inMemoryTasks.filter((t) => t.id !== id);
    saveStoredTasks(inMemoryTasks);
    return inMemoryTasks.length < prevLen;
  },

  /**
   * Reset dữ liệu mock về ban đầu
   */
  async resetToDefault(): Promise<void> {
    await fakeDelay();
    inMemoryTasks = [...INITIAL_MOCK_TASKS];
    saveStoredTasks(inMemoryTasks);
  },
};

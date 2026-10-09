import { apiRequest } from "@/lib/api-client";
import { INITIAL_MOCK_TASKS } from "../mock-data";
import { Task, TaskFetchResult, TaskFilterParams, TaskPaginationMeta, TaskResolution, TaskStatus } from "../types";

const DELAY_MIN = 150;
const DELAY_MAX = 300;

function fakeDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STORAGE_KEY = "erp_tasks_clean_v1";

// Cache in-memory / localStorage để giữ trạng thái
function getStoredTasks(): Task[] {
  if (typeof window !== "undefined") {
    // Xóa triệt để các cache mock cũ nếu còn sót lại trong trình duyệt
    try {
      localStorage.removeItem("erp_tasks_cache_v3");
      localStorage.removeItem("erp_tasks_cache_v2");
      localStorage.removeItem("erp_tasks_cache_v1");
    } catch {
      // Ignore
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  return [];
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

function applyLocalFilters(tasks: Task[], params?: TaskFilterParams): Task[] {
  if (!params) return tasks;
  let result = [...tasks];

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
}

export const taskService = {
  /**
   * Lấy danh sách task từ backend API (hỗ trợ cursor pagination O(1) từ backend)
   */
  async getTasks(params?: TaskFilterParams): Promise<TaskFetchResult> {
    const query = new URLSearchParams();

    if (params?.search && params.search.trim()) {
      query.set("search", params.search.trim());
    }

    if (params?.projectId && params.projectId !== "ALL") {
      query.set("project_id", params.projectId);
    }

    if (params?.departmentId && params.departmentId !== "ALL") {
      query.set("department_code", params.departmentId);
    }

    if (params?.assigneeId && params.assigneeId !== "ALL") {
      query.set("assignee_id", params.assigneeId);
    }

    if (params?.priority && params.priority !== "ALL") {
      query.set("priority", params.priority);
    }

    if (params?.status && params.status !== "ALL") {
      query.set("status", params.status);
    }

    if (params?.isMyTasksOnly) {
      query.set("my_tasks", "true");
    }

    query.set("per_page", String(params?.perPage || 10));

    if (params?.cursor) {
      query.set("cursor", params.cursor);
    }

    const qs = query.toString() ? `?${query.toString()}` : "";

    try {
      const res = await apiRequest<{
        success: boolean;
        data: Task[];
        meta?: TaskPaginationMeta;
      }>(`/erp/tasks${qs}`);

      if (res && Array.isArray(res.data)) {
        inMemoryTasks = res.data;
        saveStoredTasks(res.data);
        return { tasks: res.data, meta: res.meta || null };
      }
    } catch (error) {
      console.warn("Không thể tải danh sách từ API /erp/tasks, fallback về bộ nhớ local:", error);
      if (!inMemoryTasks || inMemoryTasks.length === 0) {
        inMemoryTasks = getStoredTasks();
      }
      return { tasks: applyLocalFilters(inMemoryTasks, params), meta: null };
    }

    return { tasks: inMemoryTasks, meta: null };
  },

  /**
   * Lấy danh sách công việc tối ưu cho bảng Kanban (~10 task mỗi cột)
   */
  async getKanbanTasks(params?: TaskFilterParams): Promise<{
    tasks: Task[];
    cursors: Record<string, string | null>;
    hasMore: Record<string, boolean>;
  }> {
    const query = new URLSearchParams();

    if (params?.search && params.search.trim()) {
      query.set("search", params.search.trim());
    }
    if (params?.projectId && params.projectId !== "ALL") {
      query.set("project_id", params.projectId);
    }
    if (params?.departmentId && params.departmentId !== "ALL") {
      query.set("department_id", params.departmentId);
    }
    if (params?.assigneeId && params.assigneeId !== "ALL") {
      query.set("assignee_id", params.assigneeId);
    }
    if (params?.priority && params.priority !== "ALL") {
      query.set("priority", params.priority);
    }
    if (params?.status && params.status !== "ALL") {
      query.set("status", params.status);
    }
    if (params?.isMyTasksOnly) {
      query.set("my_tasks", "true");
    }

    query.set("per_page", String(params?.perPage || 10));

    const qs = query.toString() ? `?${query.toString()}` : "";
    try {
      const res = await apiRequest<{
        success: boolean;
        data: Task[];
        meta?: {
          per_page: number;
          cursors: Record<string, string | null>;
          has_more: Record<string, boolean>;
        };
      }>(`/erp/tasks/kanban${qs}`);

      if (res && Array.isArray(res.data)) {
        inMemoryTasks = res.data;
        saveStoredTasks(res.data);
        return {
          tasks: res.data,
          cursors: res.meta?.cursors || {},
          hasMore: res.meta?.has_more || {},
        };
      }
    } catch (error) {
      console.warn("Không thể tải danh sách kanban từ API /erp/tasks/kanban, fallback:", error);
    }

    const fallback = await this.getTasks({ ...params, perPage: 10 });
    return {
      tasks: fallback.tasks,
      cursors: {},
      hasMore: {},
    };
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
    try {
      const res = await apiRequest<{ success: boolean; data: Task }>("/erp/tasks", {
        method: "POST",
        body: {
          title: data.title,
          description: data.description,
          project_id: data.projectId,
          project_key: data.projectKey,
          department_id: data.departmentId,
          priority: data.priority,
          assignee_ids: data.assigneeIds,
          due_date: data.dueDate,
          start_date: data.startDate,
          estimated_hours: data.estimatedHours,
          tags: data.tags,
          requires_approval: data.requiresApproval,
          checklist: data.checklist,
        },
      });

      if (res?.data) {
        inMemoryTasks = [res.data, ...inMemoryTasks];
        saveStoredTasks(inMemoryTasks);
        return res.data;
      }
    } catch (error) {
      console.warn("Lỗi khi gọi API tạo task, fallback local:", error);
    }

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
    try {
      const res = await apiRequest<{ success: boolean; data: Task }>(`/erp/tasks/${id}`, {
        method: "PUT",
        body: updates,
      });

      if (res?.data) {
        const idx = inMemoryTasks.findIndex((t) => t.id === id);
        if (idx !== -1) inMemoryTasks[idx] = res.data;
        saveStoredTasks(inMemoryTasks);
        return res.data;
      }
    } catch (error) {
      console.warn("Lỗi khi gọi API update task, fallback local:", error);
    }

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
    const payload: Partial<Task> = {
      status: newStatus,
      resolution: newStatus === "DONE" ? "DONE" : newStatus === "CANCELLED" ? resolution || "WONT_FIX" : undefined,
      resolutionNote: newStatus === "CANCELLED" ? resolutionNote : undefined,
      closedById: newStatus === "CANCELLED" ? closedById : undefined,
    };

    try {
      const res = await apiRequest<{ success: boolean; data: Task }>(`/erp/tasks/${id}`, {
        method: "PUT",
        body: payload,
      });

      if (res?.data) {
        const idx = inMemoryTasks.findIndex((t) => t.id === id);
        if (idx !== -1) inMemoryTasks[idx] = res.data;
        saveStoredTasks(inMemoryTasks);
        return res.data;
      }
    } catch (error) {
      console.warn("Lỗi khi gọi API updateStatus task, fallback local:", error);
    }

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
    try {
      await apiRequest(`/erp/tasks/${id}`, { method: "DELETE" });
    } catch (error) {
      console.warn("Lỗi khi gọi API xóa task, fallback local:", error);
    }

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

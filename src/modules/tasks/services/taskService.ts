import { apiClient } from "@/lib/api";
import {
  Task,
  TaskAttachment,
  TaskComment,
  TaskFetchResult,
  TaskFilterParams,
  TaskResolution,
  TaskStatus,
  CreateSubtaskInput,
} from "../types";
import { resolveProjectScope } from "../utils/projectScope";
import type { TaskDto, TaskCollectionDto, TaskCommentDto } from "../api/dto";
import { isTaskCollectionDto, isTaskDto, isTaskCommentDto } from "../api/schema";
import {
  mapTask,
  mapTaskCollectionResponse,
  mapComment,
  mapAttachment,
} from "../api/mapper";

function buildTaskQueryParams(params?: TaskFilterParams, defaultPerPage = 10): Record<string, string> {
  const query: Record<string, string> = {};
  if (!params) return query;

  if (params.search?.trim()) {
    query.search = params.search.trim();
  }

  if (params.projectId && params.projectId !== "ALL") {
    query.projectId = params.projectId;
    const scope = resolveProjectScope(params.projectId);
    if (scope.gov_project_id) {
      query.gov_project_id = String(scope.gov_project_id);
    } else if (scope.project_id) {
      query.project_id = String(scope.project_id);
    }
  }

  if (params.departmentId && params.departmentId !== "ALL") {
    query.departmentId = params.departmentId;
  }

  if (params.assigneeId && params.assigneeId !== "ALL") {
    query.assigneeId = params.assigneeId;
  }

  if (params.priority && params.priority !== "ALL") {
    query.priority = params.priority;
  }

  if (params.status && params.status !== "ALL") {
    query.status = params.status;
  }

  if (params.isMyTasksOnly) {
    query.isMyTasksOnly = "true";
  }

  if (params.parentId) {
    query.parentId = params.parentId;
  }

  query.perPage = String(params.perPage || defaultPerPage);

  if (params.cursor) {
    query.cursor = params.cursor;
  }

  return query;
}

export const taskService = {
  async getTasks(params?: TaskFilterParams): Promise<TaskFetchResult> {
    const query = buildTaskQueryParams(params, 10);
    const result = await apiClient.get<TaskCollectionDto>("/erp/tasks", { query });

    if (result.type !== "success" || !isTaskCollectionDto(result.data)) {
      return { tasks: [], meta: null };
    }

    return mapTaskCollectionResponse(result.data);
  },

  async getKanbanTasks(params?: TaskFilterParams): Promise<{
    tasks: Task[];
    cursors: Record<string, string | null>;
    hasMore: Record<string, boolean>;
  }> {
    const query = buildTaskQueryParams(params, 10);
    const result = await apiClient.get<{
      success?: boolean;
      data: TaskDto[];
      meta?: {
        per_page: number;
        cursors: Record<string, string | null>;
        has_more: Record<string, boolean>;
      };
    }>("/erp/tasks/kanban", { query });

    if (result.type === "success" && Array.isArray(result.data?.data)) {
      return {
        tasks: result.data.data.map(mapTask),
        cursors: result.data.meta?.cursors || {},
        hasMore: result.data.meta?.has_more || {},
      };
    }

    const fallback = await this.getTasks({ ...params, perPage: 10 });
    return {
      tasks: fallback.tasks,
      cursors: {},
      hasMore: {},
    };
  },

  async getTaskById(id: string): Promise<Task | null> {
    const result = await apiClient.get<{ success?: boolean; data: TaskDto }>(`/erp/tasks/${id}`);
    if (result.type !== "success" || !isTaskDto(result.data?.data)) {
      return null;
    }
    return mapTask(result.data.data);
  },

  async createTask(data: Omit<Task, "id" | "code" | "createdAt" | "updatedAt">): Promise<Task> {
    const scope = resolveProjectScope(data.projectId);
    const payload = {
      ...data,
      ...(scope.gov_project_id ? { gov_project_id: scope.gov_project_id } : {}),
      ...(scope.project_id ? { project_id: scope.project_id } : {}),
    };

    const result = await apiClient.postJson<{ success?: boolean; data: TaskDto }>("/erp/tasks", payload);
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Không thể tạo công việc.");
    }

    return mapTask(result.data.data);
  },

  async createSubtask(
    parentId: string,
    data: CreateSubtaskInput,
    parentTask?: Partial<Task>
  ): Promise<Task> {
    const scope = parentTask?.projectId ? resolveProjectScope(parentTask.projectId) : {};
    const payload = {
      title: data.title,
      description: data.description || "",
      parent_id: parentId,
      projectId: parentTask?.projectId || "",
      projectName: parentTask?.projectName || "",
      departmentId: parentTask?.departmentId || "",
      priority: data.priority || parentTask?.priority || "MEDIUM",
      status: data.status || parentTask?.status || undefined,
      assigneeIds: data.assigneeIds || [],
      startDate: data.startDate,
      dueDate: data.dueDate || parentTask?.dueDate,
      estimatedHours: data.estimatedHours,
      checklist: [],
      tags: parentTask?.tags || [],
      ...(scope.gov_project_id ? { gov_project_id: scope.gov_project_id } : {}),
      ...(scope.project_id ? { project_id: scope.project_id } : {}),
    };

    const result = await apiClient.postJson<{ success?: boolean; data: TaskDto }>(
      `/erp/tasks/${parentId}/subtasks`,
      payload
    );

    if (result.type === "success" && result.data?.data) {
      return mapTask(result.data.data);
    }

    const fallbackResult = await apiClient.postJson<{ success?: boolean; data: TaskDto }>(
      "/erp/tasks",
      payload
    );

    if (fallbackResult.type === "success" && fallbackResult.data?.data) {
      return mapTask(fallbackResult.data.data);
    }

    throw new Error(result.type !== "success" ? result.error.message : "Không thể tạo công việc con.");
  },

  async getSubtasks(parentId: string): Promise<Task[]> {
    const result = await apiClient.get<{ success?: boolean; data: TaskDto[] }>(`/erp/tasks/${parentId}/subtasks`);
    if (result.type === "success" && Array.isArray(result.data?.data)) {
      return result.data.data.map(mapTask);
    }

    const fallback = await this.getTasks({ parentId });
    return fallback.tasks;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const scope = updates.projectId !== undefined ? resolveProjectScope(updates.projectId) : null;
    const payload = {
      ...updates,
      ...(scope?.gov_project_id ? { gov_project_id: scope.gov_project_id } : {}),
      ...(scope?.project_id ? { project_id: scope.project_id } : {}),
    };

    const result = await apiClient.putJson<{ success?: boolean; data: TaskDto }>(`/erp/tasks/${id}`, payload);
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : `Không thể cập nhật công việc ID: ${id}`);
    }

    return mapTask(result.data.data);
  },

  async updateTaskStatus(
    id: string,
    newStatus: TaskStatus | string,
    resolution?: TaskResolution,
    resolutionNote?: string,
    closedById?: string
  ): Promise<Task> {
    const payload = {
      status: newStatus,
      resolution,
      resolutionNote,
      closedById,
    };

    const result = await apiClient.putJson<{ success?: boolean; data: TaskDto }>(`/erp/tasks/${id}`, payload);
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : `Không thể cập nhật trạng thái công việc ID: ${id}`);
    }

    return mapTask(result.data.data);
  },

  async closeTask(
    id: string,
    resolution: TaskResolution,
    note?: string,
    closedById?: string,
    targetStatus: string = "CANCELLED"
  ): Promise<Task> {
    return this.updateTaskStatus(id, targetStatus, resolution, note, closedById);
  },

  async reopenTask(id: string, targetStatus: string = "TODO"): Promise<Task> {
    return this.updateTaskStatus(id, targetStatus);
  },

  async deleteTask(id: string): Promise<boolean> {
    const result = await apiClient.delete<{ success?: boolean }>(`/erp/tasks/${id}`);
    return result.type === "success";
  },

  async uploadAttachments(taskId: string, files: File[]): Promise<TaskAttachment[]> {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files[]", file);
    });
    if (files.length === 1) {
      formData.append("file", files[0]);
    }

    const result = await apiClient.postForm<{ success?: boolean; data: any }>(
      `/erp/tasks/${taskId}/attachments`,
      formData
    );

    if (result.type === "success" && result.data?.data) {
      const rawList = Array.isArray(result.data.data) ? result.data.data : [result.data.data];
      return rawList.map((item: any) => mapAttachment(item));
    }

    const govResult = await apiClient.postForm<{ success?: boolean; data: any }>(
      "/erp/gov-projects/upload",
      formData
    );

    if (govResult.type === "success" && govResult.data?.data) {
      const rawList = Array.isArray(govResult.data.data) ? govResult.data.data : [govResult.data.data];
      return rawList.map((item: any) => mapAttachment(item));
    }

    return [];
  },

  async uploadAttachment(taskId: string, file: File): Promise<TaskAttachment> {
    const list = await this.uploadAttachments(taskId, [file]);
    if (!list[0]) {
      throw new Error("Không thể tải lên tệp đính kèm.");
    }
    return list[0];
  },

  async deleteAttachment(taskId: string, attachmentId: string): Promise<boolean> {
    const result = await apiClient.delete<{ success?: boolean }>(
      `/erp/tasks/${taskId}/attachments/${attachmentId}`
    );
    return result.type === "success";
  },

  async getComments(taskId: string): Promise<TaskComment[]> {
    const result = await apiClient.get<{ success?: boolean; data: TaskCommentDto[] }>(
      `/erp/tasks/${taskId}/comments`
    );

    if (result.type === "success" && Array.isArray(result.data?.data)) {
      return result.data.data.map(mapComment);
    }

    return [];
  },

  async addComment(taskId: string, content: string): Promise<TaskComment> {
    const result = await apiClient.postJson<{ success?: boolean; data: TaskCommentDto }>(
      `/erp/tasks/${taskId}/comments`,
      { content }
    );

    if (result.type === "success" && result.data?.data && isTaskCommentDto(result.data.data)) {
      return mapComment(result.data.data);
    }

    throw new Error(result.type !== "success" ? result.error.message : "Không thể gửi bình luận.");
  },

  async deleteComment(taskId: string, commentId: string): Promise<boolean> {
    const result = await apiClient.delete<{ success?: boolean }>(
      `/erp/tasks/${taskId}/comments/${commentId}`
    );
    return result.type === "success";
  },

  async resetToDefault(): Promise<void> {
  },
};

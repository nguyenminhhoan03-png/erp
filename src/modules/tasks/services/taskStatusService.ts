import { apiClient } from "@/lib/api";
import { CustomTaskStatus } from "../types";
import { resolveProjectScope } from "../utils/projectScope";

let statusesCache: Record<string, CustomTaskStatus[] | undefined> = {};
let statusesPending: Record<string, Promise<CustomTaskStatus[]> | undefined> = {};

export const taskStatusService = {
  clearCache() {
    statusesCache = {};
    statusesPending = {};
  },

  async getStatuses(projectId?: string, departmentId?: string, systemOnly?: boolean): Promise<CustomTaskStatus[]> {
    const key = `${projectId || "ALL"}_${departmentId || "ALL"}_${systemOnly ? "SYS" : "BOARD"}`;

    const cached = statusesCache[key];
    if (cached) {
      return cached;
    }

    const pending = statusesPending[key];
    if (pending) {
      return pending;
    }

    const pendingPromise = (async () => {
      try {
        const query: Record<string, string> = {};
        const { project_id, gov_project_id } = resolveProjectScope(projectId);
        if (gov_project_id) query.gov_project_id = String(gov_project_id);
        if (project_id) query.project_id = String(project_id);
        if (departmentId && departmentId !== "ALL") query.departmentId = departmentId;
        if (systemOnly) query.systemOnly = "1";

        const result = await apiClient.get<{ success?: boolean; data: CustomTaskStatus[] }>("/erp/statuses", { query });

        if (result.type === "success" && Array.isArray(result.data?.data)) {
          statusesCache[key] = result.data.data;
          return result.data.data;
        }
      } finally {
        delete statusesPending[key];
      }
      return [];
    })();

    statusesPending[key] = pendingPromise;
    return pendingPromise;
  },

  async createStatus(data: {
    name: string;
    category: "TODO" | "IN_PROGRESS" | "DONE";
    color?: string;
    projectId?: string;
    departmentId?: string;
  }): Promise<CustomTaskStatus> {
    const { project_id, gov_project_id } = resolveProjectScope(data.projectId);
    const result = await apiClient.postJson<{ success?: boolean; data: CustomTaskStatus }>("/erp/statuses", {
      name: data.name,
      category: data.category,
      color: data.color || "#2563eb",
      project_id,
      gov_project_id,
      department_id: data.departmentId,
    });

    if (result.type === "success" && result.data?.data) {
      this.clearCache();
      return result.data.data;
    }
    throw new Error(result.type !== "success" ? result.error.message : "Không thể tạo trạng thái mới");
  },

  async updateStatus(id: string, updates: Partial<CustomTaskStatus>): Promise<CustomTaskStatus> {
    const result = await apiClient.putJson<{ success?: boolean; data: CustomTaskStatus }>(`/erp/statuses/${id}`, {
      name: updates.name,
      category: updates.category,
      color: updates.color,
      order_index: updates.orderIndex,
    });

    if (result.type === "success" && result.data?.data) {
      this.clearCache();
      return result.data.data;
    }
    throw new Error(result.type !== "success" ? result.error.message : "Không thể cập nhật trạng thái");
  },

  async reorderStatuses(items: { id: number | string; order_index: number }[]): Promise<boolean> {
    const result = await apiClient.postJson<{ success?: boolean; message: string }>("/erp/statuses/reorder", { items });
    this.clearCache();
    return result.type === "success";
  },

  async syncStatuses(data: {
    projectId?: string;
    departmentId?: string;
    statuses: {
      name: string;
      category: "TODO" | "IN_PROGRESS" | "DONE";
      color?: string;
      key?: string;
    }[];
    migrateMap?: Record<string, string>;
  }): Promise<CustomTaskStatus[]> {
    const { project_id, gov_project_id } = resolveProjectScope(data.projectId);
    const result = await apiClient.postJson<{ success?: boolean; data: CustomTaskStatus[] }>("/erp/statuses/sync", {
      project_id,
      gov_project_id,
      department_id: data.departmentId,
      statuses: data.statuses,
      migrate_map: data.migrateMap,
    });

    this.clearCache();
    if (result.type === "success" && result.data?.data) {
      return result.data.data;
    }
    throw new Error(result.type !== "success" ? result.error.message : "Không thể đồng bộ trạng thái");
  },

  async deleteStatus(id: string, targetKey?: string, projectId?: string): Promise<boolean> {
    const { project_id, gov_project_id } = resolveProjectScope(projectId);
    const result = await apiClient.request<{ success?: boolean; message: string }>(`/erp/statuses/${id}`, {
      method: "DELETE",
      body: {
        target_status_key: targetKey || "TODO",
        project_id,
        gov_project_id,
      },
    });

    this.clearCache();
    return result.type === "success";
  },
};

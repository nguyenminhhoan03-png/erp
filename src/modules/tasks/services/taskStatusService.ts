import { apiRequest } from "@/lib/api-client";
import { CustomTaskStatus } from "../types";

const DEFAULT_STATUSES: CustomTaskStatus[] = [
  {
    id: "1",
    key: "PENDING_APPROVAL",
    name: "Pending Approval",
    category: "TODO",
    color: "#f59e0b",
    orderIndex: 0,
    isDefault: false,
    isSystem: true,
  },
  {
    id: "2",
    key: "TODO",
    name: "To Do",
    category: "TODO",
    color: "#64748b",
    orderIndex: 1,
    isDefault: true,
    isSystem: true,
  },
  {
    id: "3",
    key: "IN_PROGRESS",
    name: "In Progress",
    category: "IN_PROGRESS",
    color: "#2563eb",
    orderIndex: 2,
    isDefault: false,
    isSystem: true,
  },
  {
    id: "4",
    key: "IN_REVIEW",
    name: "In Review",
    category: "IN_PROGRESS",
    color: "#9333ea",
    orderIndex: 3,
    isDefault: false,
    isSystem: true,
  },
  {
    id: "5",
    key: "DONE",
    name: "Done",
    category: "DONE",
    color: "#10b981",
    orderIndex: 4,
    isDefault: false,
    isSystem: true,
  },
  {
    id: "6",
    key: "CANCELLED",
    name: "Cancelled",
    category: "DONE",
    color: "#64748b",
    orderIndex: 5,
    isDefault: false,
    isSystem: true,
  },
];

let statusesCache: Record<string, CustomTaskStatus[] | undefined> = {};
let statusesPending: Record<string, Promise<CustomTaskStatus[]> | undefined> = {};

export const taskStatusService = {
  clearCache() {
    statusesCache = {};
    statusesPending = {};
  },

  async getStatuses(projectId?: string, departmentId?: string): Promise<CustomTaskStatus[]> {
    const key = `${projectId || "ALL"}_${departmentId || "ALL"}`;

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
        const params = new URLSearchParams();
        if (projectId && projectId !== "ALL") params.append("project_id", projectId);
        if (departmentId && departmentId !== "ALL") params.append("department_id", departmentId);

        const qs = params.toString() ? `?${params.toString()}` : "";
        const res = await apiRequest<{ success: boolean; data: CustomTaskStatus[] }>(`/erp/statuses${qs}`);

        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          statusesCache[key] = res.data;
          return res.data;
        }
      } catch (error) {
        console.warn("Không thể tải cấu hình trạng thái từ API, dùng mặc định:", error);
      } finally {
        delete statusesPending[key];
      }
      return DEFAULT_STATUSES;
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
    const res = await apiRequest<{ success: boolean; data: CustomTaskStatus }>("/erp/statuses", {
      method: "POST",
      body: {
        name: data.name,
        category: data.category,
        color: data.color || "#2563eb",
        project_id: data.projectId,
        department_id: data.departmentId,
      },
    });

    if (res?.data) {
      this.clearCache();
      return res.data;
    }
    throw new Error("Không thể tạo trạng thái mới");
  },

  async updateStatus(id: string, updates: Partial<CustomTaskStatus>): Promise<CustomTaskStatus> {
    const res = await apiRequest<{ success: boolean; data: CustomTaskStatus }>(`/erp/statuses/${id}`, {
      method: "PUT",
      body: {
        name: updates.name,
        category: updates.category,
        color: updates.color,
        order_index: updates.orderIndex,
      },
    });

    if (res?.data) {
      this.clearCache();
      return res.data;
    }
    throw new Error("Không thể cập nhật trạng thái");
  },

  async reorderStatuses(items: { id: number | string; order_index: number }[]): Promise<boolean> {
    const res = await apiRequest<{ success: boolean; message: string }>("/erp/statuses/reorder", {
      method: "POST",
      body: { items },
    });
    this.clearCache();
    return Boolean(res?.success);
  },

  async deleteStatus(id: string, targetKey?: string): Promise<boolean> {
    const res = await apiRequest<{ success: boolean; message: string }>(`/erp/statuses/${id}`, {
      method: "DELETE",
      body: { target_status_key: targetKey || "TODO" },
    });
    this.clearCache();
    return Boolean(res?.success);
  },
};

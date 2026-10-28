import { apiRequest } from "@/lib/api-client";
import {
  Department,
  DepartmentListResponse,
  DepartmentDetailResponse,
  DepartmentOptionsResponse,
  DepartmentMutationResponse,
} from "../types";

export const departmentService = {
  async getDepartments(params?: {
    search?: string;
    companyId?: string;
    status?: string;
    perPage?: number;
    cursor?: string;
  }): Promise<DepartmentListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.companyId && params.companyId !== "ALL") query.set("companyId", params.companyId);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.perPage) query.set("perPage", String(params.perPage));
    if (params?.cursor) query.set("cursor", params.cursor);

    const qs = query.toString();
    const endpoint = `/erp/departments${qs ? `?${qs}` : ""}`;

    return apiRequest<DepartmentListResponse>(endpoint);
  },

  async getDepartmentById(id: string): Promise<DepartmentDetailResponse> {
    return apiRequest<DepartmentDetailResponse>(`/erp/departments/${id}`);
  },

  async createDepartment(data: {
    name: string;
    description?: string;
    managerId?: string | null;
    status?: string;
    subCompanyId?: string | null;
    employeeIds?: string[];
  }): Promise<DepartmentMutationResponse> {
    return apiRequest<DepartmentMutationResponse>("/erp/departments", {
      method: "POST",
      body: data,
    });
  },

  async updateDepartment(
    id: string,
    updates: {
      name?: string;
      description?: string;
      managerId?: string | null;
      status?: string;
      subCompanyId?: string | null;
      employeeIds?: string[];
    }
  ): Promise<DepartmentMutationResponse> {
    return apiRequest<DepartmentMutationResponse>(`/erp/departments/${id}`, {
      method: "PUT",
      body: updates,
    });
  },

  async deleteDepartment(id: string): Promise<DepartmentMutationResponse> {
    return apiRequest<DepartmentMutationResponse>(`/erp/departments/${id}`, {
      method: "DELETE",
    });
  },

  async toggleStatus(id: string): Promise<DepartmentMutationResponse> {
    return apiRequest<DepartmentMutationResponse>(`/erp/departments/${id}/status`, {
      method: "PATCH",
    });
  },

  async getOptions(departmentId?: string): Promise<DepartmentOptionsResponse> {
    const endpoint = departmentId
      ? `/erp/departments/options?departmentId=${departmentId}`
      : "/erp/departments/options";

    return apiRequest<DepartmentOptionsResponse>(endpoint);
  },
};

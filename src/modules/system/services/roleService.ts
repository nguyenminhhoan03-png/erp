import { apiRequest } from "@/lib/api-client";

export interface RoleApiItem {
  id: number | string;
  role_name: string;
  total_user: number;
  total_permission: number;
}

export interface RolesApiResponse {
  result: boolean;
  message?: string;
  data: {
    items: RoleApiItem[];
    total: number;
  };
}

export interface RoleMutationResponse {
  result: boolean;
  message?: string;
  data?: any;
}

export const roleService = {
  async getRoles(search?: string): Promise<RolesApiResponse> {
    const query = new URLSearchParams();
    if (search?.trim()) {
      query.set("search", search.trim());
    }
    const qs = query.toString();
    const endpoint = `/erp/roles${qs ? `?${qs}` : ""}`;
    return apiRequest<RolesApiResponse>(endpoint);
  },

  async createRole(data: { role_name: string; permissions?: (number | string)[] }): Promise<RoleMutationResponse> {
    return apiRequest<RoleMutationResponse>("/erp/roles", {
      method: "POST",
      body: data,
    });
  },

  async updateRole(
    id: number | string,
    data: { role_name: string; permissions?: (number | string)[] }
  ): Promise<RoleMutationResponse> {
    return apiRequest<RoleMutationResponse>(`/erp/roles/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  async deleteRole(id: number | string): Promise<RoleMutationResponse> {
    return apiRequest<RoleMutationResponse>(`/erp/roles/${id}`, {
      method: "DELETE",
    });
  },
};

import { apiRequest } from "@/lib/api-client";

export interface PermissionRoleDto {
  id: number | string;
  name: string;
}

export interface PermissionDto {
  id: number;
  code: string;
  name: string;
}

export interface PermissionMatrixResponse {
  result: boolean;
  message?: string;
  data: {
    roles: PermissionRoleDto[];
    permissions: PermissionDto[];
    role_permissions: Record<string, number[]>;
  };
}

export interface SyncMatrixResponse {
  result: boolean;
  message?: string;
}

export const permissionService = {
  async getMatrix(): Promise<PermissionMatrixResponse> {
    return apiRequest<PermissionMatrixResponse>("/erp/permissions/matrix");
  },

  async syncMatrix(rolePermissions: Record<string, number[]>): Promise<SyncMatrixResponse> {
    return apiRequest<SyncMatrixResponse>("/erp/permissions/sync-matrix", {
      method: "POST",
      body: { role_permissions: rolePermissions },
    });
  },
};

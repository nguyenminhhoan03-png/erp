import { apiClient } from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-token";
import { DepartmentId, User } from "@/shared/types";
import { AuthUser, LoginPayload, RegisterPayload } from "../types";

interface LoginResponse {
  data: { access_token: string; user: AuthUser };
}

interface MessageResponse {
  message: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const result = await apiClient.postJson<LoginResponse>("/erp/auth/login", payload, { auth: false });
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Đăng nhập thất bại");
    }
    setToken(result.data.data.access_token);
    return result.data.data.user;
  },

  async register(payload: RegisterPayload): Promise<string> {
    const result = await apiClient.postJson<MessageResponse>("/erp/auth/register", payload, { auth: false });
    if (result.type !== "success" || !result.data?.message) {
      throw new Error(result.type !== "success" ? result.error.message : "Đăng ký thất bại");
    }
    return result.data.message;
  },

  async me(): Promise<AuthUser> {
    const result = await apiClient.get<{ data: AuthUser }>("/erp/auth/me");
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Không thể lấy thông tin người dùng");
    }
    return result.data.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.postJson("/erp/auth/logout", {});
    } finally {
      clearToken();
    }
  },
};

export function toStoreUser(user: AuthUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    roleName: user.roleName ?? undefined,
    departmentId: (user.departmentId || "") as DepartmentId,
    departmentName: user.departmentName ?? undefined,
    title: user.title || user.roleName || "Thành viên",
    phone: user.phone ?? undefined,
    isSuperAdmin: user.isSuperAdmin,
  };
}

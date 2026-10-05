import { apiRequest } from "@/lib/api-client";
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
    const { data } = await apiRequest<LoginResponse>("/erp/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    });
    setToken(data.access_token);
    return data.user;
  },

  async register(payload: RegisterPayload): Promise<string> {
    const { message } = await apiRequest<MessageResponse>("/erp/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    });
    return message;
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiRequest<{ data: AuthUser }>("/erp/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest("/erp/auth/logout", { method: "POST" });
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
    // Module task còn dùng 5 phòng ban mock; id phòng ban thật sẽ được thay khi module này nối API
    departmentId: user.departmentId as DepartmentId,
    title: user.title,
    phone: user.phone ?? undefined,
  };
}

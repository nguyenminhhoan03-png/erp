import { User } from "@/shared/types";

export interface AuthUser extends Omit<User, "phone" | "departmentId"> {
  departmentId: string;
  phone: string | null;
  roleName: string | null;
  departmentName: string | null;
  isSuperAdmin: boolean;
  isDepartmentManager: boolean;
  permissions: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone_number?: string;
  password: string;
  password_confirmation: string;
}

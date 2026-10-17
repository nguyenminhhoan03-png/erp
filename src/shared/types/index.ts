export type DepartmentId = "it" | "marketing" | "hr" | "sales" | "accounting" | (string & {});

export interface Department {
  id: DepartmentId;
  name: string;
  code: string;
  color: string;
  description: string;
  managerId?: string;
}

export type SystemRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type Role = SystemRole | (string & {});

export interface RoleConfig {
  id: string;
  name: string;
  code: string;
  description: string;
  color: "rose" | "blue" | "emerald" | "purple" | "amber" | "indigo" | "cyan";
  dataScope: "GLOBAL" | "DEPARTMENT" | "OWN";
  isSystem?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  roleName?: string | null;
  departmentId: DepartmentId;
  departmentName?: string | null;
  title: string;
  phone?: string | null;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "reject"
  | "assign"
  | "review"
  | "submit_report";

export type Resource =
  | "task"
  | "task_self"
  | "daily_report";

import { User, Action, Resource, DepartmentId, Role } from "../types";
import { Task, TaskStatus } from "@/modules/tasks/types";
import { PermissionKey, ROLE_PERMISSIONS, DataScope, PERMISSION_ALIAS_MAP } from "./permissions";

export interface PermissionContext {
  task?: Task;
  targetDepartmentId?: DepartmentId;
  targetUserId?: string;
  toStatus?: TaskStatus;
}

export function hasPermission(
  user: User | null | undefined,
  permission: PermissionKey | string
): boolean {
  if (!user) return false;

  // 1. Quản trị viên / Lãnh đạo có toàn quyền
  if (user.role === "ADMIN" || user.isSuperAdmin || (user as any).is_super_admin === 1) {
    return true;
  }

  // 2. Kiểm tra permissions trả về từ backend API
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    if (user.permissions.includes(permission)) {
      return true;
    }
    const aliases = PERMISSION_ALIAS_MAP[permission];
    if (aliases && aliases.some((a) => user.permissions!.includes(a))) {
      return true;
    }
  }

  // 3. Fallback theo role mặc định (khi chưa load kịp permissions từ server)
  const roleConfig = ROLE_PERMISSIONS[user.role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission as PermissionKey);
}

export function getUserDataScope(user: User | null | undefined): DataScope {
  if (!user) return "OWN";
  return ROLE_PERMISSIONS[user.role]?.dataScope || "OWN";
}

export function can(
  user: User | null | undefined,
  actionOrPermission: Action | PermissionKey | string,
  resource?: Resource,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  // Bảng công việc (Task): Mở full quyền cho tất cả người dùng
  if (
    resource === "task" ||
    resource === "task_self" ||
    (typeof actionOrPermission === "string" && (
      actionOrPermission.startsWith("tasks:") ||
      actionOrPermission.startsWith("task_")
    ))
  ) {
    return true;
  }

  if (user.role === "ADMIN" || user.isSuperAdmin || (user as any).is_super_admin === 1) {
    return true;
  }

  if (typeof actionOrPermission === "string" && (actionOrPermission.includes(":") || actionOrPermission.includes("_"))) {
    const permitted = hasPermission(user, actionOrPermission);
    if (!permitted) return false;

    const scope = getUserDataScope(user);
    if (scope === "GLOBAL") return true;

    if (scope === "DEPARTMENT") {
      if (context?.targetDepartmentId) {
        return context.targetDepartmentId === user.departmentId;
      }
      return true;
    }

    if (scope === "OWN") {
      if (context?.targetUserId) {
        return context.targetUserId === user.id;
      }
    }

    return true;
  }

  const action = actionOrPermission as Action;

  if (resource === "daily_report") {
    switch (action) {
      case "view":
        if (user.role === "MANAGER") {
          return !context?.targetDepartmentId || context.targetDepartmentId === user.departmentId;
        }
        return !context?.targetUserId || context.targetUserId === user.id;

      case "submit_report":
      case "create":
      case "edit":
        return !context?.targetUserId || context.targetUserId === user.id;

      default:
        return false;
    }
  }

  return false;
}

export function checkTaskTransitionPermission(
  user: User,
  task: Task,
  toStatus: TaskStatus | string,
  customStatuses?: { key: string; category?: string }[]
): { allowed: boolean; reason?: string } {
  // Bảng công việc: Cho phép chuyển trạng thái Kanban tự do, không chặn quyền
  return { allowed: true };
}


import { User, Action, Resource, DepartmentId, Role } from "../types";
import { Task, TaskStatus } from "@/modules/tasks/types";
import { PermissionKey, ROLE_PERMISSIONS, DataScope } from "./permissions";

export interface PermissionContext {
  task?: Task;
  targetDepartmentId?: DepartmentId;
  targetUserId?: string;
  toStatus?: TaskStatus;
}

export function hasPermission(
  user: User | null | undefined,
  permission: PermissionKey
): boolean {
  if (!user) return false;

  if (typeof window !== "undefined") {
    try {
      const overridesRaw = localStorage.getItem("erp_user_permission_overrides_v1");
      if (overridesRaw) {
        const overrides: Record<string, PermissionKey[]> = JSON.parse(overridesRaw);
        if (overrides[user.id]?.includes(permission)) {
          return true;
        }
      }
    } catch {}
  }

  if (typeof window !== "undefined") {
    try {
      const customRolePermsRaw = localStorage.getItem("erp_custom_role_permissions_v1");
      if (customRolePermsRaw) {
        const customRolePerms: Record<string, PermissionKey[]> = JSON.parse(customRolePermsRaw);
        if (customRolePerms[user.role]) {
          return customRolePerms[user.role].includes(permission);
        }
      }
    } catch {}
  }

  const roleConfig = ROLE_PERMISSIONS[user.role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

export function getUserDataScope(user: User | null | undefined): DataScope {
  if (!user) return "OWN";

  if (typeof window !== "undefined") {
    try {
      const rolesRaw = localStorage.getItem("erp_custom_roles_v2");
      if (rolesRaw) {
        const customRoles: Array<{ id: string; dataScope: DataScope }> = JSON.parse(rolesRaw);
        const match = customRoles.find((r) => r.id === user.role);
        if (match) return match.dataScope;
      }
    } catch {}
  }

  return ROLE_PERMISSIONS[user.role]?.dataScope || "OWN";
}

export function can(
  user: User | null | undefined,
  actionOrPermission: Action | PermissionKey,
  resource?: Resource,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  if (user.role === "ADMIN") {
    return true;
  }

  if (actionOrPermission.includes(":")) {
    const permKey = actionOrPermission as PermissionKey;
    const permitted = hasPermission(user, permKey);
    if (!permitted) return false;

    const scope = getUserDataScope(user);
    if (scope === "GLOBAL") return true;

    if (scope === "DEPARTMENT") {
      if (context?.targetDepartmentId) {
        return context.targetDepartmentId === user.departmentId;
      }
      if (context?.task) {
        return context.task.departmentId === user.departmentId;
      }
      return true;
    }

    if (scope === "OWN") {
      if (context?.targetUserId) {
        return context.targetUserId === user.id;
      }
      if (context?.task) {
        return (
          context.task.creatorId === user.id ||
          (context.task.assigneeIds || []).includes(user.id)
        );
      }
    }

    return true;
  }

  const action = actionOrPermission as Action;

  if (resource === "task") {
    switch (action) {
      case "view":
        if (context?.task) {
          return (
            context.task.departmentId === user.departmentId ||
            (context.task.assigneeIds || []).includes(user.id) ||
            context.task.creatorId === user.id
          );
        }
        return true;

      case "create":
        return hasPermission(user, "tasks:create");

      case "assign":
        if (user.role === "MANAGER") {
          return !context?.targetDepartmentId || context.targetDepartmentId === user.departmentId;
        }
        return context?.targetUserId === user.id;

      case "edit":
      case "delete":
        if (!context?.task) return false;
        if (user.role === "MANAGER") {
          return context.task.departmentId === user.departmentId;
        }
        return context.task.creatorId === user.id && context.task.status !== "DONE";

      case "approve":
      case "reject":
        if (user.role === "MANAGER") {
          return !context?.task || context.task.departmentId === user.departmentId;
        }
        return false;

      default:
        return false;
    }
  }

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
  if (task.status === toStatus) {
    return { allowed: true };
  }

  if (user.role === "ADMIN") {
    return { allowed: true };
  }

  const isAssignee = (task.assigneeIds || []).includes(user.id);
  const isCreator = task.creatorId === user.id;
  const isManagerOfDept = user.role === "MANAGER" && user.departmentId === task.departmentId;

  const toStatusCategory =
    customStatuses?.find((s) => s.key === toStatus)?.category ||
    (toStatus === "DONE" || toStatus === "CANCELLED" ? "DONE" : toStatus === "TODO" ? "TODO" : "IN_PROGRESS");

  const currentStatusCategory =
    customStatuses?.find((s) => s.key === task.status)?.category ||
    (Boolean(task.closedAt) || task.status === "DONE" || task.status === "CANCELLED" ? "DONE" : task.status === "TODO" ? "TODO" : "IN_PROGRESS");

  if (currentStatusCategory === "DONE" && toStatusCategory !== "DONE") {
    if (isManagerOfDept || isCreator || user.role === "ADMIN") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Chỉ Quản lý hoặc người tạo task mới có quyền mở lại task đã kết thúc.",
    };
  }

  if (toStatusCategory === "DONE") {
    if (user.role === "EMPLOYEE" && !isCreator && !isAssignee) {
      return {
        allowed: false,
        reason: "Bạn không có quyền hoàn thành hoặc đóng công việc này.",
      };
    }
    return { allowed: true };
  }

  if (isAssignee || isCreator || isManagerOfDept) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Bạn không có quyền thay đổi trạng thái của task này.",
  };
}

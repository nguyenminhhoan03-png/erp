import { User, Action, Resource, DepartmentId, Role } from "../types";
import { Task, TaskStatus } from "@/modules/tasks/types";
import { PermissionKey, ROLE_PERMISSIONS, DataScope } from "./permissions";

export interface PermissionContext {
  task?: Task;
  targetDepartmentId?: DepartmentId;
  targetUserId?: string;
  toStatus?: TaskStatus;
}

/**
 * Kiểm tra xem user có PermissionKey cụ thể không (Fine-grained RBAC)
 */
export function hasPermission(
  user: User | null | undefined,
  permission: PermissionKey
): boolean {
  if (!user) return false;

  // 1. Kiểm tra ngoại lệ cấp quyền trực tiếp theo nhân sự (User direct overrides)
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

  // 2. Kiểm tra quyền của Vai trò trong LocalStorage (Dynamic Role-Permissions)
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

  // 3. Fallback cấu hình mặc định
  const roleConfig = ROLE_PERMISSIONS[user.role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

/**
 * Lấy phạm vi dữ liệu của User (ABAC Scope)
 */
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

/**
 * Kiểm tra quyền hạn chung của User (Action + Resource hoặc PermissionKey)
 */
export function can(
  user: User | null | undefined,
  actionOrPermission: Action | PermissionKey,
  resource?: Resource,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  // 1. ADMIN luôn có toàn quyền (Super-admin bypass)
  if (user.role === "ADMIN") {
    return true;
  }

  // 2. Nếu truyền vào theo chuẩn Fine-grained PermissionKey (ví dụ: 'tasks:create', 'tasks:approve')
  if (actionOrPermission.includes(":")) {
    const permKey = actionOrPermission as PermissionKey;
    const permitted = hasPermission(user, permKey);
    if (!permitted) return false;

    // Kiểm tra Data Scope
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
          context.task.assigneeIds.includes(user.id)
        );
      }
    }

    return true;
  }

  // 3. Xử lý Action + Resource cổ điển (Backward compatibility)
  const action = actionOrPermission as Action;

  if (resource === "task") {
    switch (action) {
      case "view":
        if (context?.task) {
          return (
            context.task.departmentId === user.departmentId ||
            context.task.assigneeIds.includes(user.id) ||
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

  if (resource === "statistics") {
    return true;
  }

  if (resource === "approvals") {
    return user.role === "MANAGER";
  }

  return false;
}

/**
 * Kiểm tra quy tắc chuyển trạng thái Task (State Transition Matrix)
 */
export function checkTaskTransitionPermission(
  user: User,
  task: Task,
  toStatus: TaskStatus
): { allowed: boolean; reason?: string } {
  if (task.status === toStatus) {
    return { allowed: true };
  }

  // Admin có toàn quyền
  if (user.role === "ADMIN") {
    return { allowed: true };
  }

  const isAssignee = task.assigneeIds.includes(user.id);
  const isCreator = task.creatorId === user.id;
  const isManagerOfDept = user.role === "MANAGER" && user.departmentId === task.departmentId;

  // 1. Task đang ở trạng thái PENDING_APPROVAL
  if (task.status === "PENDING_APPROVAL") {
    if (toStatus === "TODO" || toStatus === "CANCELLED") {
      if (isManagerOfDept) return { allowed: true };
      return {
        allowed: false,
        reason: "Chỉ Trưởng phòng hoặc Admin mới có quyền phê duyệt task tự đề xuất.",
      };
    }
    return {
      allowed: false,
      reason: "Task chờ duyệt cần được phê duyệt sang 'To Do' trước khi thực hiện.",
    };
  }

  // 2. Kéo sang Done (Nghiệm thu)
  if (toStatus === "DONE") {
    if (user.role === "EMPLOYEE") {
      if (isCreator && isAssignee && !task.requiresApproval) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Bạn không thể tự đóng task do cấp trên giao. Vui lòng kéo sang 'In Review' để Trưởng phòng nghiệm thu!",
      };
    }
    if (isManagerOfDept) return { allowed: true };
  }

  // 3. Kéo sang In Review
  if (toStatus === "IN_REVIEW") {
    if (isAssignee || isManagerOfDept) return { allowed: true };
    return {
      allowed: false,
      reason: "Chỉ người nhận task hoặc quản lý phòng mới có thể gửi yêu cầu review.",
    };
  }

  // 4. Trả lại từ In Review về In Progress
  if (task.status === "IN_REVIEW" && toStatus === "IN_PROGRESS") {
    if (isManagerOfDept || isAssignee) return { allowed: true };
  }

  // 5. Chuyển giữa To Do và In Progress
  if (
    (task.status === "TODO" && toStatus === "IN_PROGRESS") ||
    (task.status === "IN_PROGRESS" && toStatus === "TODO")
  ) {
    if (isAssignee || isManagerOfDept) return { allowed: true };
    return {
      allowed: false,
      reason: "Chỉ người được giao việc mới có thể bắt đầu hoặc tạm dừng công việc này.",
    };
  }

  // 6. Mở lại task đã Done
  if (task.status === "DONE") {
    if (isManagerOfDept) return { allowed: true };
    return {
      allowed: false,
      reason: "Chỉ Trưởng phòng mới có quyền mở lại task đã nghiệm thu hoàn thành.",
    };
  }

  // 7. Chuyển sang Cancelled / Closed (Đóng task: Won't Fix, Not a Bug, Duplicate...)
  if (toStatus === "CANCELLED") {
    if (isManagerOfDept || isCreator || isAssignee) return { allowed: true };
    return {
      allowed: false,
      reason: "Chỉ người tạo, người được giao hoặc Trưởng phòng mới có quyền đóng task này.",
    };
  }

  // 8. Mở lại task đã Cancelled / Closed (Reopen Task)
  if (task.status === "CANCELLED") {
    if (isManagerOfDept || isCreator) return { allowed: true };
    return {
      allowed: false,
      reason: "Chỉ người tạo hoặc Trưởng phòng mới có quyền mở lại task đã đóng.",
    };
  }

  if (isManagerOfDept) return { allowed: true };

  return {
    allowed: false,
    reason: "Bạn không có quyền thay đổi trạng thái của task này.",
  };
}

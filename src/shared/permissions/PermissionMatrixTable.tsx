"use client";

import * as React from "react";
import {
  Check,
  ShieldCheck,
  Lock,
  Globe,
  Building2,
  User as UserIcon,
  Settings2,
  RotateCcw,
  Sparkles,
  UserCheck,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  PERMISSION_DEFINITIONS,
  ROLE_PERMISSIONS,
  DEFAULT_ROLE_CONFIGS,
  PermissionKey,
  PermissionDefinition,
  DataScope,
} from "./permissions";
import { Role, RoleConfig, User } from "@/shared/types";
import { useUserStore } from "@/shared/store/useUserStore";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { UserAvatar } from "@/shared/components/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STORAGE_ROLES_KEY = "erp_custom_roles_v2";
const STORAGE_ROLE_PERMS_KEY = "erp_custom_role_permissions_v1";
const STORAGE_USER_OVERRIDES_KEY = "erp_user_permission_overrides_v1";

const COLOR_CONFIGS: Record<
  string,
  { label: string; text: string; bg: string; border: string }
> = {
  rose: {
    label: "Đỏ hồng (Admin / Giám đốc)",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-200 dark:border-rose-900/60",
  },
  blue: {
    label: "Xanh dương (Trưởng phòng)",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-200 dark:border-blue-900/60",
  },
  purple: {
    label: "Tím (Tech Lead / Chủ nhiệm)",
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/15",
    border: "border-purple-200 dark:border-purple-900/60",
  },
  amber: {
    label: "Vàng kim (Chủ tịch / Cấp cao)",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-200 dark:border-amber-900/60",
  },
  emerald: {
    label: "Xanh lục (Nhân viên / Thực thi)",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-200 dark:border-emerald-900/60",
  },
  indigo: {
    label: "Xanh chàm (Kiểm toán / QA)",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/15",
    border: "border-indigo-200 dark:border-indigo-900/60",
  },
  cyan: {
    label: "Xanh ngọc (Cộng tác viên / Khách)",
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-200 dark:border-cyan-900/60",
  },
};

// Hàm chuẩn hóa thứ tự các vai trò:
// 1. ADMIN (Ban Giám Đốc)
// 2. MANAGER (Trưởng phòng)
// 3. EMPLOYEE (Nhân viên - Mặc định hệ thống)
// 4+. Các vai trò thêm mới (Custom Roles như Trưởng nhóm Lead, Phó phòng, Chủ tịch...)
export function sortRoles(roles: RoleConfig[]): RoleConfig[] {
  const corePriority: Record<string, number> = {
    ADMIN: 1,
    MANAGER: 2,
    EMPLOYEE: 3,
  };

  return [...roles].sort((a, b) => {
    const pA = corePriority[a.id] ?? 99;
    const pB = corePriority[b.id] ?? 99;
    if (pA !== pB) return pA - pB;
    return a.name.localeCompare(b.name, "vi");
  });
}

export function PermissionMatrixTable() {
  const { users, updateUser } = useUserStore();
  const [activeTab, setActiveTab] = React.useState<"roles" | "users">("roles");
  const [selectedModule, setSelectedModule] = React.useState<string>("ALL");
  const [isEditMode, setIsEditMode] = React.useState(false);

  // Danh sách các Vai trò (Hỗ trợ CRUD Dynamic Roles)
  const [rolesList, setRolesList] = React.useState<RoleConfig[]>(() => {
    let list = DEFAULT_ROLE_CONFIGS;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_ROLES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        }
      } catch {}
    }
    const sorted = sortRoles(list);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(sorted));
      } catch {}
    }
    return sorted;
  });

  // Cấu hình quyền theo role có thể tùy biến trực tiếp
  const [rolePermissions, setRolePermissions] = React.useState<
    Record<string, PermissionKey[]>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_ROLE_PERMS_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    const initial: Record<string, PermissionKey[]> = {};
    DEFAULT_ROLE_CONFIGS.forEach((r) => {
      initial[r.id] = ROLE_PERMISSIONS[r.id]?.permissions
        ? [...ROLE_PERMISSIONS[r.id].permissions]
        : [];
    });
    return initial;
  });

  // State cho Modal CRUD Vai trò (Role Dialog)
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<RoleConfig | null>(null);
  const [roleFormName, setRoleFormName] = React.useState("");
  const [roleFormCode, setRoleFormCode] = React.useState("");
  const [roleFormDesc, setRoleFormDesc] = React.useState("");
  const [roleFormScope, setRoleFormScope] = React.useState<DataScope>("DEPARTMENT");
  const [roleFormColor, setRoleFormColor] = React.useState<RoleConfig["color"]>("purple");
  const [roleFormCloneFrom, setRoleFormCloneFrom] = React.useState<string>("EMPLOYEE");

  // Ngoại lệ phân quyền theo từng nhân viên (User-level overrides - chuẩn Spatie model_has_permissions)
  const [selectedUserId, setSelectedUserId] = React.useState<string>(
    users[2]?.id || "user-it-dev1"
  );
  const [userOverrides, setUserOverrides] = React.useState<
    Record<string, PermissionKey[]>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_USER_OVERRIDES_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      "user-it-dev1": ["tasks:approve"],
    };
  });

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const moduleNames: Record<string, string> = {
    TASKS: "1. Phân hệ Quản lý Công việc (Task Management)",
    REPORTS: "2. Phân hệ Báo cáo ngày (Daily Report)",
    HRM: "3. Phân hệ Nhân sự & Thành viên (HRM)",
    ANALYTICS: "4. Phân hệ Thống kê & Hiệu suất (Analytics & KPI)",
    SYSTEM: "5. Cấu hình Hệ thống & Quy trình (System Settings)",
  };

  const modules = Object.keys(moduleNames);

  // Quản lý trạng thái thu gọn / mở rộng từng phân hệ
  const [collapsedModules, setCollapsedModules] = React.useState<Record<string, boolean>>({});

  const toggleModuleCollapse = (modKey: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
  };

  const handleToggleAllModules = () => {
    const allCollapsed = modules.every((m) => collapsedModules[m]);
    if (allCollapsed) {
      setCollapsedModules({});
    } else {
      const nextState: Record<string, boolean> = {};
      modules.forEach((m) => {
        nextState[m] = true;
      });
      setCollapsedModules(nextState);
    }
  };

  // Toggle quyền cho Role trong chế độ cấu hình
  const handleToggleRolePermission = (roleId: string, permKey: PermissionKey) => {
    if (!isEditMode) return;

    if (roleId === "ADMIN" && permKey === "settings:manage") {
      toast.error("Không thể tước quyền quản trị tối cao của Ban Giám Đốc!");
      return;
    }

    setRolePermissions((prev) => {
      const currentList = prev[roleId] || [];
      const has = currentList.includes(permKey);
      const updatedList = has
        ? currentList.filter((k) => k !== permKey)
        : [...currentList, permKey];

      const updated = {
        ...prev,
        [roleId]: updatedList,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ROLE_PERMS_KEY, JSON.stringify(updated));
      }

      toast.success(
        `${has ? "Đã tắt" : "Đã cấp"} quyền "${permKey}" cho vai trò ${roleId}`
      );
      return updated;
    });
  };

  // Mở Dialog thêm vai trò mới
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleFormName("");
    setRoleFormCode("");
    setRoleFormDesc("");
    setRoleFormScope("DEPARTMENT");
    setRoleFormColor("purple");
    setRoleFormCloneFrom("EMPLOYEE");
    setIsRoleModalOpen(true);
  };

  // Mở Dialog sửa vai trò
  const handleOpenEditRole = (role: RoleConfig) => {
    setEditingRole(role);
    setRoleFormName(role.name);
    setRoleFormCode(role.code);
    setRoleFormDesc(role.description || "");
    setRoleFormScope(role.dataScope);
    setRoleFormColor(role.color as RoleConfig["color"]);
    setRoleFormCloneFrom("NONE");
    setIsRoleModalOpen(true);
  };

  // Lưu vai trò mới hoặc cập nhật vai trò hiện có
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = roleFormName.trim();
    const cleanCode = roleFormCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");

    if (!cleanName) {
      toast.error("Vui lòng nhập tên vai trò!");
      return;
    }

    if (!cleanCode) {
      toast.error("Vui lòng nhập mã định danh vai trò!");
      return;
    }

    if (editingRole) {
      // Cập nhật vai trò hiện tại
      const updatedRoles = rolesList.map((r) =>
        r.id === editingRole.id
          ? {
              ...r,
              name: cleanName,
              description: roleFormDesc.trim(),
              dataScope: roleFormScope,
              color: roleFormColor,
            }
          : r
      );
      setRolesList(updatedRoles);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updatedRoles));
      }
      toast.success(`Đã cập nhật vai trò "${cleanName}"!`);
      setIsRoleModalOpen(false);
    } else {
      // Kiểm tra trùng mã code
      if (rolesList.some((r) => r.id === cleanCode || r.code === cleanCode)) {
        toast.error(`Mã vai trò "${cleanCode}" đã tồn tại! Vui lòng chọn mã khác.`);
        return;
      }

      const newRole: RoleConfig = {
        id: cleanCode,
        name: cleanName,
        code: cleanCode,
        description: roleFormDesc.trim() || `Vai trò ${cleanName} trong hệ thống`,
        dataScope: roleFormScope,
        color: roleFormColor,
        isSystem: false,
      };

      const updatedRoles = sortRoles([...rolesList, newRole]);
      setRolesList(updatedRoles);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updatedRoles));
      }

      // Sao chép danh sách quyền từ vai trò nguồn
      const clonedPerms =
        roleFormCloneFrom !== "NONE" && rolePermissions[roleFormCloneFrom]
          ? [...rolePermissions[roleFormCloneFrom]]
          : [];

      const updatedRolePerms = {
        ...rolePermissions,
        [cleanCode]: clonedPerms,
      };
      setRolePermissions(updatedRolePerms);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ROLE_PERMS_KEY, JSON.stringify(updatedRolePerms));
      }

      toast.success(
        `Đã tạo vai trò mới "${cleanName}" (${cleanCode})! Đã tự động sinh cột trên ma trận.`
      );
      setIsRoleModalOpen(false);
    }
  };

  // Xóa vai trò tùy biến
  const handleDeleteRole = (role: RoleConfig) => {
    if (role.isSystem) {
      toast.error(`"${role.name}" là vai trò hệ thống cốt lõi, không thể xóa!`);
      return;
    }

    const assignedUsers = users.filter((u) => u.role === role.id);
    if (assignedUsers.length > 0) {
      if (
        !confirm(
          `Hiện đang có ${assignedUsers.length} nhân viên giữ vai trò "${role.name}". Nếu xóa, họ sẽ tự động được chuyển về vai trò "EMPLOYEE". Bạn có chắc muốn xóa?`
        )
      ) {
        return;
      }
      assignedUsers.forEach((u) => {
        updateUser(u.id, { role: "EMPLOYEE" });
      });
    } else {
      if (!confirm(`Bạn có chắc muốn xóa vai trò "${role.name}" (${role.code}) khỏi hệ thống?`)) {
        return;
      }
    }

    const updatedRoles = rolesList.filter((r) => r.id !== role.id);
    setRolesList(updatedRoles);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updatedRoles));
    }

    const updatedRolePerms = { ...rolePermissions };
    delete updatedRolePerms[role.id];
    setRolePermissions(updatedRolePerms);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ROLE_PERMS_KEY, JSON.stringify(updatedRolePerms));
    }

    toast.success(`Đã xóa vai trò "${role.name}" khỏi ma trận phân quyền!`);
  };

  // Toggle quyền ngoại lệ cho từng nhân viên cụ thể
  const handleToggleUserOverride = (permKey: PermissionKey) => {
    setUserOverrides((prev) => {
      const userList = prev[selectedUserId] || [];
      const has = userList.includes(permKey);
      const updatedList = has
        ? userList.filter((k) => k !== permKey)
        : [...userList, permKey];

      const updated = {
        ...prev,
        [selectedUserId]: updatedList,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_USER_OVERRIDES_KEY, JSON.stringify(updated));
      }

      toast.success(
        `${has ? "Đã thu hồi" : "Đã đặc cách cấp"} quyền "${permKey}" cho ${selectedUser.name}`
      );
      return updated;
    });
  };

  // Khôi phục ma trận về mặc định
  const handleResetDefaults = () => {
    if (confirm("Khôi phục toàn bộ danh sách vai trò và ma trận phân quyền về chuẩn mặc định ban đầu?")) {
      setRolesList(sortRoles(DEFAULT_ROLE_CONFIGS));
      const defaults: Record<string, PermissionKey[]> = {};
      DEFAULT_ROLE_CONFIGS.forEach((r) => {
        defaults[r.id] = ROLE_PERMISSIONS[r.id]?.permissions
          ? [...ROLE_PERMISSIONS[r.id].permissions]
          : [];
      });
      setRolePermissions(defaults);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_ROLES_KEY);
        localStorage.removeItem(STORAGE_ROLE_PERMS_KEY);
      }
      toast.success("Đã khôi phục ma trận phân quyền và danh sách vai trò về mặc định!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro info box */}
      <div className="p-4.5 rounded-2xl border border-blue-500/25 bg-blue-50/30 dark:bg-blue-950/20 text-xs text-muted-foreground flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 font-bold text-foreground text-sm">
            <ShieldCheck className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            <span>Ma trận Phân quyền Chuẩn Doanh nghiệp: RBAC kết hợp ABAC Data Scope</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Định nghĩa rõ ràng <strong>Ai (Who)</strong> được thực hiện <strong>Hành động gì (Action)</strong> ở <strong>Phạm vi dữ liệu nào (Data Scope)</strong>. Tích hợp trực tiếp với cơ chế <em>Policy & Gate</em> của Backend Laravel.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap text-[11px] p-2 rounded-xl bg-card border border-border/80">
          <span className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300">
            <Globe className="h-3.5 w-3.5" /> Toàn công ty (Global)
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
            <Building2 className="h-3.5 w-3.5" /> Phòng ban (Department)
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
            <UserIcon className="h-3.5 w-3.5" /> Cá nhân (Own)
          </span>
        </div>
      </div>

      {/* Tabs navigation & Action controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60">
          <button
            onClick={() => setActiveTab("roles")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "roles"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>1. Phân quyền theo Vai trò (Role-Based)</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "users"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>2. Gán quyền theo Nhân viên</span>
          </button>
        </div>

        {activeTab === "roles" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenCreateRole}
              className="h-8.5 rounded-xl gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Thêm Vai Trò Mới</span>
            </Button>

            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="h-8.5 rounded-xl gap-1.5 text-xs font-medium cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{isEditMode ? "Xong cấu hình quyền" : "Cấu hình quyền (Bật/Tắt)"}</span>
            </Button>

            {isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetDefaults}
                className="h-8.5 rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title="Khôi phục thiết lập vai trò & quyền mặc định"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Khôi phục mặc định</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: ROLE MATRIX TABLE */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          {/* Module Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium mr-1 text-[11px]">
              Lọc phân hệ:
            </span>
            <button
              onClick={() => setSelectedModule("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                selectedModule === "ALL"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Tất cả phân hệ ({PERMISSION_DEFINITIONS.length})
            </button>
            {modules.map((mKey) => (
              <button
                key={mKey}
                onClick={() => setSelectedModule(mKey)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                  selectedModule === mKey
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {mKey}
              </button>
            ))}

            <div className="ml-auto">
              <button
                onClick={handleToggleAllModules}
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/70 hover:bg-muted/60 cursor-pointer transition-colors"
                title="Bấm để thu gọn hoặc mở rộng toàn bộ các phân hệ"
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    modules.every((m) => collapsedModules[m]) && "-rotate-90"
                  )}
                />
                <span>
                  {modules.every((m) => collapsedModules[m])
                    ? "Mở rộng tất cả"
                    : "Thu gọn tất cả"}
                </span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 font-bold uppercase text-muted-foreground">
                  <th className="py-3 px-4 w-[280px]">Hành vi / Quyền hạn (Permission)</th>
                  <th className="py-3 px-4 min-w-[220px]">Mô tả nghiệp vụ</th>
                  {rolesList.map((role) => {
                    const colorConf = COLOR_CONFIGS[role.color] || COLOR_CONFIGS.blue;
                    return (
                      <th
                        key={role.id}
                        className={cn(
                          "py-3 px-3 min-w-[135px] text-center border-l border-border/50 group/th",
                          colorConf.text
                        )}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center justify-center gap-1.5 w-full">
                            <span className="font-bold text-xs">{role.name}</span>
                            {!role.isSystem && (
                              <div className="flex items-center gap-0.5 opacity-80 group-hover/th:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditRole(role);
                                  }}
                                  className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  title={`Chỉnh sửa vai trò ${role.name}`}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRole(role);
                                  }}
                                  className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                                  title={`Xóa vai trò ${role.name}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                            ({role.code})
                          </span>
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.2 rounded-full font-medium border",
                              role.dataScope === "GLOBAL"
                                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                : role.dataScope === "DEPARTMENT"
                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            )}
                          >
                            {role.dataScope === "GLOBAL"
                              ? "Toàn cty"
                              : role.dataScope === "DEPARTMENT"
                              ? "Phòng ban"
                              : "Cá nhân"}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {modules
                  .filter((mKey) => selectedModule === "ALL" || selectedModule === mKey)
                  .map((modKey) => {
                    const items = PERMISSION_DEFINITIONS.filter(
                      (p) => p.module === modKey
                    );

                    return (
                      <React.Fragment key={modKey}>
                        {/* Module Group Header with Collapsible ChevronDown */}
                        <tr
                          onClick={() => toggleModuleCollapse(modKey)}
                          className={cn(
                            "font-bold text-foreground cursor-pointer transition-all select-none group",
                            collapsedModules[modKey]
                              ? "bg-muted/40 hover:bg-muted/70"
                              : "bg-muted/70 hover:bg-muted/90"
                          )}
                        >
                          <td colSpan={2 + rolesList.length} className="py-2.5 px-4 text-xs tracking-wide">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleModuleCollapse(modKey);
                                  }}
                                  className={cn(
                                    "p-1.5 rounded-lg border transition-all shadow-2xs flex items-center justify-center cursor-pointer",
                                    collapsedModules[modKey]
                                      ? "bg-background border-border/80 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                      : "bg-primary/10 border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                  )}
                                  title={collapsedModules[modKey] ? "Bấm để mở rộng danh sách quyền" : "Bấm để thu gọn danh sách quyền"}
                                  aria-expanded={!collapsedModules[modKey]}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "h-3.5 w-3.5 stroke-[2.5] transition-transform duration-200",
                                      collapsedModules[modKey] ? "-rotate-90" : "rotate-0"
                                    )}
                                  />
                                </button>
                                <span className="font-bold text-foreground text-[13px]">
                                  {moduleNames[modKey]}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">
                                  {collapsedModules[modKey] ? "Bấm để mở rộng" : "Bấm để thu gọn"}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors",
                                    collapsedModules[modKey]
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-primary/10 text-primary border-primary/20"
                                  )}
                                >
                                  {items.length} quyền
                                </Badge>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Permission Rows */}
                        {!collapsedModules[modKey] &&
                          items.map((perm) => {
                          return (
                            <tr
                              key={perm.key}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <td className="py-2.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground">
                                    {perm.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {perm.key}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-muted-foreground leading-relaxed">
                                {perm.description}
                              </td>

                              {/* Dynamic Role Cells */}
                              {rolesList.map((role) => {
                                const has = (rolePermissions[role.id] || []).includes(perm.key);
                                const colorConf = COLOR_CONFIGS[role.color] || COLOR_CONFIGS.blue;

                                return (
                                  <td
                                    key={role.id}
                                    className={cn(
                                      "py-2.5 px-3 text-center select-none border-l border-border/50",
                                      isEditMode && "cursor-pointer hover:bg-muted/50"
                                    )}
                                    onClick={() =>
                                      handleToggleRolePermission(role.id, perm.key)
                                    }
                                  >
                                    {has ? (
                                      <div className="flex flex-col items-center justify-center gap-0.5">
                                        <span
                                          className={cn(
                                            "h-5 w-5 rounded-full flex items-center justify-center font-bold",
                                            colorConf.bg,
                                            colorConf.text
                                          )}
                                        >
                                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                        </span>
                                        <span
                                          className={cn(
                                            "text-[9px] font-semibold",
                                            colorConf.text
                                          )}
                                        >
                                          {role.dataScope === "GLOBAL"
                                            ? "Toàn công ty"
                                            : role.dataScope === "DEPARTMENT"
                                            ? "Phòng ban"
                                            : "Cá nhân"}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground/30 font-mono">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: USER OVERRIDES (Gán quyền đặc cách theo từng nhân sự) */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar user={selectedUser} size="lg" className="ring-2 ring-primary/20" />
              <div>
                <h4 className="text-sm font-bold text-foreground">{selectedUser.name}</h4>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
                  <span>Chức vụ: <strong>{selectedUser.title}</strong></span>
                  <span className="text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1.5">
                    <span>Vai trò hệ thống:</span>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        updateUser(selectedUser.id, { role: newRole as Role });
                        toast.success(
                          `Đã cập nhật vai trò của ${selectedUser.name} thành "${newRole}"!`
                        );
                      }}
                      className="h-6.5 px-2 text-[11px] font-bold rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {rolesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dropdown chọn nhân viên */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Chọn nhân sự:</span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-border/80 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs text-muted-foreground">
            💡 <strong>Quy tắc Senior:</strong> Nhân viên tự động thừa hưởng mọi quyền của vai trò gốc (<code>{selectedUser.role}</code>). Bạn có thể tick chọn bên dưới để <strong>gán thêm quyền đặc cách (Direct Permission)</strong> mà không cần nâng role lên Manager.
          </div>

          {/* Grouped by Module with Collapsible ChevronDown */}
          <div className="space-y-3">
            {modules.map((modKey) => {
              const modItems = PERMISSION_DEFINITIONS.filter((p) => p.module === modKey);
              const isCollapsed = collapsedModules[`user_${modKey}`];

              return (
                <div
                  key={modKey}
                  className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs transition-all"
                >
                  {/* Module Header */}
                  <div
                    onClick={() =>
                      setCollapsedModules((prev) => ({
                        ...prev,
                        [`user_${modKey}`]: !prev[`user_${modKey}`],
                      }))
                    }
                    className={cn(
                      "p-3 flex items-center justify-between cursor-pointer transition-all select-none group",
                      isCollapsed ? "bg-muted/40 hover:bg-muted/70" : "bg-muted/60 hover:bg-muted/80"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollapsedModules((prev) => ({
                            ...prev,
                            [`user_${modKey}`]: !prev[`user_${modKey}`],
                          }));
                        }}
                        className={cn(
                          "p-1.5 rounded-lg border transition-all shadow-2xs flex items-center justify-center cursor-pointer",
                          isCollapsed
                            ? "bg-background border-border/80 text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                            : "bg-primary/10 border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        )}
                        aria-expanded={!isCollapsed}
                      >
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 stroke-[2.5] transition-transform duration-200",
                            isCollapsed ? "-rotate-90" : "rotate-0"
                          )}
                        />
                      </button>
                      <h5 className="font-bold text-xs text-foreground">
                        {moduleNames[modKey]}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">
                        {isCollapsed ? "Bấm để mở rộng" : "Bấm để thu gọn"}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5 rounded-full">
                        {modItems.length} quyền
                      </Badge>
                    </div>
                  </div>

                  {/* Grid quyền hạn cho phân hệ này */}
                  {!isCollapsed && (
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 border-t border-border/60 bg-muted/10">
                      {modItems.map((perm) => {
                        const inheritedFromRole = rolePermissions[selectedUser.role]?.includes(perm.key);
                        const customGranted = (userOverrides[selectedUserId] || []).includes(perm.key);

                        return (
                          <div
                            key={perm.key}
                            onClick={() => !inheritedFromRole && handleToggleUserOverride(perm.key)}
                            className={cn(
                              "flex items-start justify-between p-3 rounded-xl border transition-all select-none",
                              inheritedFromRole
                                ? "bg-muted/30 border-border/60 opacity-80 cursor-default"
                                : "bg-card border-border/80 hover:border-primary/50 cursor-pointer shadow-2xs"
                            )}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {perm.name}
                                </span>
                                {inheritedFromRole ? (
                                  <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                                    Theo Role {selectedUser.role}
                                  </span>
                                ) : customGranted ? (
                                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                                    Đặc cách cá nhân
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {perm.description}
                              </p>
                              <span className="font-mono text-[9px] text-muted-foreground/60 block">
                                {perm.key}
                              </span>
                            </div>

                            <div className="shrink-0 ml-3">
                              {inheritedFromRole ? (
                                <span
                                  className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"
                                  title="Quyền thừa kế từ Role"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={cn(
                                    "h-6 w-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer",
                                    customGranted
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "border-border/80 bg-background hover:border-primary/60 text-transparent"
                                  )}
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DIALOG: THÊM / CHỈNH SỬA VAI TRÒ (DYNAMIC ROLE CRUD) */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-6 rounded-2xl border-border/80 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              {editingRole
                ? `Chỉnh sửa Vai trò: ${editingRole.name}`
                : "Thêm Vai Trò Mới (Custom Dynamic Role)"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingRole
                ? "Cập nhật tên gọi, phạm vi dữ liệu và màu sắc nhận diện cho vai trò."
                : "Tạo vai trò phân quyền mới (như Chủ tịch, Tech Lead, Kiểm toán). Hệ thống sẽ tự động thêm cột tương ứng vào bảng ma trận."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRole} className="space-y-4 pt-2">
            {/* Tên vai trò */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tên vai trò / Nhóm quyền <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roleFormName}
                onChange={(e) => setRoleFormName(e.target.value)}
                placeholder="VD: Chủ tịch HĐQT, Trưởng nhóm Kỹ thuật, Kiểm toán viên..."
                required
                className="w-full h-9 px-3 text-xs rounded-xl border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Mã vai trò */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mã định danh (Role Key) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roleFormCode}
                onChange={(e) => setRoleFormCode(e.target.value.toUpperCase())}
                placeholder="VD: CHAIRMAN, LEAD, AUDITOR..."
                disabled={!!editingRole}
                required
                className={cn(
                  "w-full h-9 px-3 text-xs font-mono uppercase rounded-xl border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
                  editingRole && "bg-muted cursor-not-allowed opacity-70"
                )}
              />
              <p className="text-[10px] text-muted-foreground">
                {editingRole
                  ? "Mã vai trò không thể thay đổi sau khi tạo để đảm bảo tính toàn vẹn dữ liệu."
                  : "Chữ in hoa viết liền hoặc gạch dưới (VD: LEAD, CHAIRMAN). Dùng để map với Policy của backend."}
              </p>
            </div>

            {/* Phạm vi dữ liệu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Phạm vi dữ liệu mặc định (Data Scope)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "GLOBAL", label: "Toàn công ty", desc: "Xem mọi phòng ban" },
                  { id: "DEPARTMENT", label: "Phòng ban", desc: "Trong cùng bộ phận" },
                  { id: "OWN", label: "Cá nhân", desc: "Chỉ việc cá nhân" },
                ].map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setRoleFormScope(scope.id as DataScope)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                      roleFormScope === scope.id
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30 font-semibold shadow-2xs"
                        : "border-border/80 bg-background hover:bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <span className="text-xs font-bold text-foreground">{scope.label}</span>
                    <span className="text-[10px] text-muted-foreground">{scope.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kế thừa quyền ban đầu khi tạo mới */}
            {!editingRole && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Sao chép bộ quyền ban đầu từ vai trò có sẵn
                </label>
                <select
                  value={roleFormCloneFrom}
                  onChange={(e) => setRoleFormCloneFrom(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="NONE">Trống (Chưa có quyền nào, tự tick sau)</option>
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      Kế thừa từ: {r.name} ({r.code}) - {rolePermissions[r.id]?.length || 0} quyền
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Màu sắc nhận diện */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Màu sắc nhận diện trên bảng
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(COLOR_CONFIGS).map(([colKey, colVal]) => (
                  <button
                    key={colKey}
                    type="button"
                    onClick={() => setRoleFormColor(colKey as RoleConfig["color"])}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                      colVal.border,
                      colVal.bg,
                      colVal.text,
                      roleFormColor === colKey
                        ? "ring-2 ring-primary font-bold shadow-2xs scale-105"
                        : "opacity-75 hover:opacity-100"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    <span>{colKey.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mô tả nhiệm vụ */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mô tả vai trò</label>
              <textarea
                rows={2}
                value={roleFormDesc}
                onChange={(e) => setRoleFormDesc(e.target.value)}
                placeholder="Mô tả quyền hạn hoặc trách nhiệm chính của vai trò này..."
                className="w-full p-2.5 text-xs rounded-xl border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleModalOpen(false)}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
              >
                {editingRole ? "Lưu thay đổi" : "Tạo vai trò & Sinh cột"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

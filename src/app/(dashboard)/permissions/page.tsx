"use client";

import * as React from "react";
import {
  Shield,
  Search,
  Save,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  permissionService,
  PermissionDto,
  PermissionRoleDto,
} from "@/modules/system/services/permissionService";
import { toast } from "sonner";

function getModuleFromCode(code: string): string {
  if (code.startsWith("daily_report_")) return "Báo cáo công việc (Daily Reports)";
  if (code.startsWith("work_schedule_")) return "Lịch trình công việc (Work Schedules)";
  if (code.startsWith("task_")) return "Quản lý công việc (Tasks)";
  if (code.startsWith("project_")) return "Quản lý dự án (Projects)";
  if (code.startsWith("partner_") || code.startsWith("customer_care_")) return "Khách hàng & Đối tác (CRM)";
  if (code.startsWith("attendance_")) return "Chấm công & Điểm danh (Attendance)";
  if (
    code.startsWith("recruitment_") ||
    code.startsWith("candidate_") ||
    code.startsWith("english_level_") ||
    code.startsWith("working_experience_")
  ) {
    return "Tuyển dụng & Ứng viên (Recruitment)";
  }
  if (code.startsWith("department_")) return "Phòng ban (Departments)";
  if (code.startsWith("user_") || ["HR", "employee", "leader"].includes(code)) {
    return "Nhân sự & Người dùng (HRM)";
  }
  if (
    code.startsWith("revenue_report_") ||
    code.startsWith("form_") ||
    ["accountant", "accountant_approve_form", "leader_approve_form"].includes(code)
  ) {
    return "Tài chính & Đề xuất (Finance & Forms)";
  }
  if (code.startsWith("equipment_")) return "Tài sản & Thiết bị (Equipment)";
  if (
    code.startsWith("sub_company_") ||
    code.startsWith("category_") ||
    code.startsWith("settings_") ||
    code.startsWith("analytics_")
  ) {
    return "Hệ thống & Cài đặt (System)";
  }
  return "Chức năng khác (Other)";
}

export default function PermissionsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const [roles, setRoles] = React.useState<PermissionRoleDto[]>([]);
  const [permissions, setPermissions] = React.useState<PermissionDto[]>([]);
  const [rolePermissions, setRolePermissions] = React.useState<Record<string, number[]>>({});
  const [initialRolePermissions, setInitialRolePermissions] = React.useState<Record<string, number[]>>({});

  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(new Set());

  const fetchMatrix = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await permissionService.getMatrix();
      if (res.result && res.data) {
        setRoles(res.data.roles || []);
        setPermissions(res.data.permissions || []);
        const rp = res.data.role_permissions || {};
        setRolePermissions(rp);
        setInitialRolePermissions(rp);
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải ma trận phân quyền");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const togglePermission = (roleId: number | string, permId: number) => {
    const key = String(roleId);
    setRolePermissions((prev) => {
      const current = prev[key] || [];
      const next = current.includes(permId)
        ? current.filter((id) => id !== permId)
        : [...current, permId];
      return { ...prev, [key]: next };
    });
  };

  const allPermissionIds = React.useMemo(() => permissions.map((p) => p.id), [permissions]);

  const toggleAllForRole = (roleId: number | string) => {
    const key = String(roleId);
    setRolePermissions((prev) => {
      const current = prev[key] || [];
      const isAllChecked =
        allPermissionIds.length > 0 && allPermissionIds.every((id) => current.includes(id));
      return {
        ...prev,
        [key]: isAllChecked ? [] : [...allPermissionIds],
      };
    });
  };

  const toggleAllInModule = (roleId: number | string, modulePermIds: number[]) => {
    const key = String(roleId);
    setRolePermissions((prev) => {
      const current = prev[key] || [];
      const isAllInModuleChecked =
        modulePermIds.length > 0 && modulePermIds.every((id) => current.includes(id));
      let next: number[];
      if (isAllInModuleChecked) {
        next = current.filter((id) => !modulePermIds.includes(id));
      } else {
        const toAdd = modulePermIds.filter((id) => !current.includes(id));
        next = [...current, ...toAdd];
      }
      return {
        ...prev,
        [key]: next,
      };
    });
  };

  const handleReset = () => {
    setRolePermissions(JSON.parse(JSON.stringify(initialRolePermissions)));
    toast.info("Đã hoàn tác các thay đổi chưa lưu!");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionService.syncMatrix(rolePermissions);
      setInitialRolePermissions(JSON.parse(JSON.stringify(rolePermissions)));
      toast.success("Đã lưu ma trận phân quyền thành công!");
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi lưu phân quyền");
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, PermissionDto[]> = {};
    const q = search.toLowerCase().trim();

    permissions.forEach((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) {
        return;
      }
      const moduleName = getModuleFromCode(p.code);
      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }
      groups[moduleName].push(p);
    });

    return groups;
  }, [permissions, search]);

  const moduleNames = React.useMemo(() => Object.keys(groupedPermissions), [groupedPermissions]);

  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedModules(new Set(moduleNames));
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  const isAllExpanded = moduleNames.length > 0 && moduleNames.every((m) => expandedModules.has(m));

  return (
    <div className="space-y-5 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Trang chủ</span>
            <span>/</span>
            <span>Hệ thống</span>
            <span>/</span>
            <span className="text-foreground font-medium">Quyền hạn</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Ma trận phân quyền
              </h1>
              <p className="text-xs text-muted-foreground">
                Phân nhóm chức năng, thu gọn/mở rộng tiện lợi để quản lý quyền cho từng vai trò
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={isAllExpanded ? collapseAll : expandAll}
            className="h-9 px-3 rounded-xl text-xs gap-1.5"
          >
            {isAllExpanded ? (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Thu gọn tất cả</span>
              </>
            ) : (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Mở rộng tất cả</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={saving || loading}
            onClick={handleReset}
            className="h-9 px-3 rounded-xl text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Hoàn tác</span>
          </Button>

          <Button
            size="sm"
            disabled={saving || loading}
            onClick={handleSave}
            className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs gap-1.5 shadow-xs hover:bg-primary/95"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? "Đang lưu..." : "Lưu phân quyền"}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên quyền, mã permission..."
            className="pl-9 h-9 rounded-xl bg-card text-xs border-border/80"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Đang cấu hình <span className="font-semibold text-foreground">{permissions.length}</span> quyền chia thành{" "}
          <span className="font-semibold text-foreground">{moduleNames.length}</span> nhóm cho{" "}
          <span className="font-semibold text-foreground">{roles.length}</span> vai trò
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <div className="inline-flex items-center gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Đang tải ma trận phân quyền...</span>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4 min-w-[280px]">Nhóm chức năng & Mã quyền</th>
                  {roles.map((role) => {
                    const currentRolePerms = rolePermissions[String(role.id)] || [];
                    const isAllRoleChecked =
                      allPermissionIds.length > 0 &&
                      allPermissionIds.every((id) => currentRolePerms.includes(id));

                    return (
                      <th key={role.id} className="py-3 px-4 text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="font-semibold text-foreground">{role.name}</div>
                          <span className="font-mono text-[10px] text-muted-foreground">#{role.id}</span>
                          <label
                            className="inline-flex items-center gap-1.5 mt-0.5 cursor-pointer text-[11px] font-medium text-foreground hover:text-primary transition-colors bg-background/80 hover:bg-background px-2 py-0.5 rounded-md border border-border/60"
                            onClick={(e) => e.stopPropagation()}
                            title={`Cấp full toàn bộ quyền cho vai trò ${role.name}`}
                          >
                            <Checkbox
                              checked={isAllRoleChecked}
                              onCheckedChange={() => toggleAllForRole(role.id)}
                              className="h-3.5 w-3.5 rounded"
                            />
                          </label>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {moduleNames.length === 0 ? (
                  <tr>
                    <td colSpan={roles.length + 1} className="py-12 text-center text-muted-foreground">
                      Không tìm thấy quyền hạn nào
                    </td>
                  </tr>
                ) : (
                  moduleNames.map((moduleName) => {
                    const modulePerms = groupedPermissions[moduleName] || [];
                    const isExpanded = search.trim() !== "" || expandedModules.has(moduleName);

                    return (
                      <React.Fragment key={moduleName}>
                        <tr className="bg-muted/40 hover:bg-muted/60 transition-colors border-y border-border/70 select-none">
                          <td
                            className="py-2.5 px-4 cursor-pointer"
                            onClick={() => toggleModule(moduleName)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-5 rounded-md bg-background flex items-center justify-center text-muted-foreground shadow-2xs">
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </span>
                              <span className="font-semibold text-foreground text-xs uppercase tracking-wide">
                                {moduleName}
                              </span>
                              <Badge variant="secondary" className="text-[10px] font-normal h-4.5 px-1.5">
                                {modulePerms.length} quyền
                              </Badge>
                            </div>
                          </td>
                          {roles.map((role) => {
                            const currentRolePerms = rolePermissions[String(role.id)] || [];
                            const modulePermIds = modulePerms.map((p) => p.id);
                            const isAllModuleChecked =
                              modulePermIds.length > 0 &&
                              modulePermIds.every((id) => currentRolePerms.includes(id));

                            return (
                              <td
                                key={role.id}
                                className="py-2.5 px-4 text-center align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={isAllModuleChecked}
                                    onCheckedChange={() => toggleAllInModule(role.id, modulePermIds)}
                                    className="h-4 w-4 rounded cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    title={`Chọn tất cả quyền trong nhóm ${moduleName} cho vai trò ${role.name}`}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {isExpanded &&
                          modulePerms.map((perm) => (
                            <tr key={perm.id} className="hover:bg-muted/20 transition-colors bg-card">
                              <td className="py-2.5 px-4 pl-10">
                                <div className="font-medium text-foreground">{perm.name}</div>
                                <span className="font-mono text-[10px] text-muted-foreground">{perm.code}</span>
                              </td>
                              {roles.map((role) => {
                                const isChecked = Boolean(
                                  rolePermissions[String(role.id)]?.includes(perm.id)
                                );

                                return (
                                  <td key={role.id} className="py-2.5 px-4 text-center align-middle">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => togglePermission(role.id, perm.id)}
                                        className="h-4 w-4 rounded cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

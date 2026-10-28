"use client";

import * as React from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  KeyRound,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { roleService } from "@/modules/system/services/roleService";
import { toast } from "sonner";

interface RoleItem {
  id: string | number;
  name: string;
  code: string;
  usersCount: number;
  permissionsCount: number;
}

export default function RolesPage() {
  const [roles, setRoles] = React.useState<RoleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<RoleItem | null>(null);

  const [formName, setFormName] = React.useState("");

  const fetchRoles = React.useCallback(async (keyword = "") => {
    try {
      setLoading(true);
      const res = await roleService.getRoles(keyword);
      if (res.result && res.data?.items) {
        const mapped: RoleItem[] = res.data.items.map((item) => ({
          id: item.id,
          name: item.role_name,
          code: `ROLE_${item.id}`,
          usersCount: item.total_user ?? 0,
          permissionsCount: item.total_permission ?? 0,
        }));
        setRoles(mapped);
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoles(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchRoles]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormName("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: RoleItem) => {
    setEditingRole(role);
    setFormName(role.name);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }

    try {
      setSubmitting(true);
      if (editingRole) {
        await roleService.updateRole(editingRole.id, {
          role_name: formName.trim(),
        });
        toast.success("Cập nhật vai trò thành công!");
      } else {
        await roleService.createRole({
          role_name: formName.trim(),
        });
        toast.success("Tạo vai trò mới thành công!");
      }
      setIsDialogOpen(false);
      fetchRoles(search);
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi lưu vai trò");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    const target = roles.find((r) => r.id === id);
    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${target?.name || id}"?`)) {
      return;
    }

    try {
      await roleService.deleteRole(id);
      toast.success("Đã xóa vai trò thành công!");
      fetchRoles(search);
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa vai trò này");
    }
  };

  return (
    <div className="space-y-5 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Trang chủ</span>
            <span>/</span>
            <span>Hệ thống</span>
            <span>/</span>
            <span className="text-foreground font-medium">Vai trò</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Quản lý vai trò (Roles)
              </h1>
              <p className="text-xs text-muted-foreground">
                Thiết lập danh mục các vai trò, nhóm quyền hạn và thẩm quyền vận hành hệ thống
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-xs gap-2 shadow-xs hover:bg-primary/95"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm vai trò mới</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên vai trò..."
            className="pl-9 h-9 rounded-xl bg-card text-xs border-border/80"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Tổng cộng <span className="font-semibold text-foreground">{roles.length}</span> vai trò
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4 w-28">ID</th>
                <th className="py-3 px-4">Tên vai trò</th>
                <th className="py-3 px-4 w-40">Thành viên</th>
                <th className="py-3 px-4 w-40">Số quyền hạn</th>
                <th className="py-3 px-4 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Đang tải danh sách vai trò...</span>
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy vai trò nào
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-muted/70 text-foreground border border-border/80">
                        #{role.id}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="font-semibold text-foreground text-sm">
                        {role.name}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{role.usersCount} nhân sự</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        <span>{role.permissionsCount} quyền</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 text-xs">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(role)}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Chỉnh sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(role.id)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa vai trò</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border-border/80">
          <DialogHeader className="p-4 border-b border-border/70 bg-muted/20">
            <DialogTitle className="text-sm font-semibold">
              {editingRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave}>
            <div className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Tên vai trò *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Trưởng nhóm Kỹ thuật"
                  className="h-9 rounded-lg text-xs bg-background"
                  required
                />
              </div>
            </div>

            <DialogFooter className="p-3 border-t border-border/70 bg-muted/10 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setIsDialogOpen(false)}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-xs shadow-xs hover:bg-primary/95 gap-1.5"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{editingRole ? "Lưu thay đổi" : "Tạo vai trò"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

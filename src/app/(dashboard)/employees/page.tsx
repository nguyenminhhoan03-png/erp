"use client";

import * as React from "react";
import {
  Users2,
  UserPlus,
  Search,
  Mail,
  Phone,
  Building,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useUserStore } from "@/shared/store/useUserStore";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { DepartmentId, Role, User } from "@/shared/types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { UserFormDialog } from "@/shared/components/UserFormDialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { EmptyState } from "@/shared/components/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { PermissionMatrixTable } from "@/shared/permissions/PermissionMatrixTable";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EmployeesPage() {
  const { users, currentUser, deleteUser } = useUserStore();
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedDept, setSelectedDept] = React.useState<DepartmentId | "ALL">("ALL");
  const [selectedRole, setSelectedRole] = React.useState<Role | "ALL">("ALL");

  // Lọc danh sách nhân sự
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchTitle = u.title.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchEmail) return false;
      }

      if (selectedDept !== "ALL" && u.departmentId !== selectedDept) {
        return false;
      }

      if (selectedRole !== "ALL" && u.role !== selectedRole) {
        return false;
      }

      return true;
    });
  }, [users, search, selectedDept, selectedRole]);

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      toast.error("Không thể xóa tài khoản bạn đang đăng nhập giả lập!");
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa nhân sự "${user.name}" không?`)) {
      deleteUser(user.id);
      toast.success(`Đã xóa nhân sự: ${user.name}`);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive" className="text-[10px]">Ban Giám Đốc</Badge>;
      case "MANAGER":
        return <Badge variant="default" className="text-[10px]">Trưởng phòng</Badge>;
      case "EMPLOYEE":
        return <Badge variant="secondary" className="text-[10px]">Nhân viên</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users2 className="h-6 w-6 text-primary" />
            <span>Phân hệ Nhân sự & Phân quyền (HRM)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Tổng cộng: <strong className="text-foreground">{users.length} nhân sự</strong> phân bổ tại 5 phòng ban và thiết lập ma trận phân quyền RBAC/ABAC.
          </p>
        </div>

        {/* Nút Thêm nhân sự mới */}
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 shadow-sm shadow-primary/20 rounded-xl"
        >
          <UserPlus className="h-4 w-4" />
          <span>Thêm nhân sự mới</span>
        </Button>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="employees" className="rounded-lg text-xs font-semibold px-4 gap-1.5">
            <Users2 className="h-3.5 w-3.5" />
            <span>Danh sách nhân sự ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="rounded-lg text-xs font-semibold px-4 gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Ma trận Phân quyền (RBAC Matrix)</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, chức danh, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 rounded-xl bg-card"
              />
            </div>

        <div className="w-[190px]">
          <Select
            value={selectedDept}
            onValueChange={(val) => setSelectedDept(val as DepartmentId | "ALL")}
          >
            <SelectTrigger className="h-9 rounded-xl bg-card">
              <SelectValue placeholder="Phòng ban">
                {selectedDept === "ALL"
                  ? "Tất cả phòng ban"
                  : MOCK_DEPARTMENTS.find((d) => d.id === selectedDept)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
              {MOCK_DEPARTMENTS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[170px]">
          <Select
            value={selectedRole}
            onValueChange={(val) => setSelectedRole(val as Role | "ALL")}
          >
            <SelectTrigger className="h-9 rounded-xl bg-card">
              <SelectValue placeholder="Vai trò">
                {selectedRole === "ALL"
                  ? "Tất cả vai trò"
                  : selectedRole === "ADMIN"
                  ? "Ban Giám Đốc"
                  : selectedRole === "MANAGER"
                  ? "Trưởng phòng"
                  : "Nhân viên"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              <SelectItem value="ADMIN">Ban Giám Đốc</SelectItem>
              <SelectItem value="MANAGER">Trưởng phòng</SelectItem>
              <SelectItem value="EMPLOYEE">Nhân viên</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employees Grid */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhân sự phù hợp"
          description="Thử tìm kiếm với từ khóa khác hoặc bấm nút Thêm nhân sự mới."
          actionLabel="Thêm nhân sự"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isCurrent = user.id === currentUser.id;
            const dept = MOCK_DEPARTMENTS.find((d) => d.id === user.departmentId);

            return (
              <div
                key={user.id}
                className={cn(
                  "group flex flex-col justify-between p-4.5 rounded-2xl border bg-card transition-all duration-200 shadow-2xs hover:shadow-md",
                  isCurrent
                    ? "border-primary ring-2 ring-primary/20 bg-primary/2"
                    : "border-border/80 hover:border-primary/40"
                )}
              >
                <div>
                  {/* Top: Avatar, Name, Role badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="lg" className="ring-2 ring-primary/10" />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-foreground">{user.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                              Đang đăng nhập
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getRoleBadge(user.role)}
                      {user.id !== "user-admin" && !isCurrent && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user)}
                          className="h-6 w-6 text-muted-foreground/50 hover:text-rose-500 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa nhân sự"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Info: Department, Email, Phone */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-2.5 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                      <span className="font-medium text-foreground">{dept?.name}</span>
                      <span className="text-[10px] text-muted-foreground">({dept?.code})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                      <span className="font-mono text-muted-foreground truncate">{user.email}</span>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </TabsContent>

        {/* TAB 2: MA TRẬN PHÂN QUYỀN RBAC/ABAC */}
        <TabsContent value="matrix">
          <PermissionMatrixTable />
        </TabsContent>
      </Tabs>

      {/* Modal Thêm nhân sự */}
      <UserFormDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { useEmployeeStore } from "@/modules/employees/store/employeeStore";

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  description: string;
  managerName: string;
  managerAvatar?: string;
  managerPosition: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  {
    id: "it",
    code: "PB-CNTT",
    name: "Công nghệ thông tin",
    description: "Nghiên cứu phát triển phần mềm, quản trị hạ tầng mạng & hệ thống CNTT",
    managerName: "Nguyễn Minh Hoàn",
    managerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    managerPosition: "Trưởng phòng Kỹ thuật",
    status: "Active",
    createdAt: "2023-01-15",
  },
  {
    id: "hr",
    code: "PB-NS",
    name: "Nhân sự & Tuyển dụng",
    description: "Quản trị nguồn nhân lực, hoạch định chính sách phúc lợi & văn hóa doanh nghiệp",
    managerName: "Trần Thị Mai",
    managerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    managerPosition: "Trưởng phòng Nhân sự",
    status: "Active",
    createdAt: "2023-02-01",
  },
  {
    id: "marketing",
    code: "PB-MKT",
    name: "Marketing & Truyền thông",
    description: "Xây dựng thương hiệu, chiến dịch truyền thông đa kênh & phát triển thị trường",
    managerName: "Phạm Thu Hương",
    managerAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    managerPosition: "Trưởng nhóm Marketing",
    status: "Active",
    createdAt: "2023-03-10",
  },
  {
    id: "sales",
    code: "PB-KD",
    name: "Kinh doanh & Phát triển",
    description: "Tìm kiếm khách hàng, phát triển đối tác dự án & mở rộng thị phần kinh doanh",
    managerName: "Đặng Quốc Huy",
    managerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    managerPosition: "Phó phòng Kinh doanh",
    status: "Active",
    createdAt: "2023-04-05",
  },
  {
    id: "accounting",
    code: "PB-KT",
    name: "Kế toán & Tài chính",
    description: "Quản lý dòng tiền, báo cáo tài chính, quyết toán thuế & kiểm soát chi phí",
    managerName: "Vũ Bảo Ngọc",
    managerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    managerPosition: "Kế toán trưởng",
    status: "Active",
    createdAt: "2023-05-12",
  },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = React.useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "Active" | "Inactive">("ALL");

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<DepartmentItem | null>(null);

  const [viewingMembersDept, setViewingMembersDept] = React.useState<DepartmentItem | null>(null);

  const [formName, setFormName] = React.useState("");
  const [formCode, setFormCode] = React.useState("");
  const [formDesc, setFormDesc] = React.useState("");
  const [formManager, setFormManager] = React.useState("");
  const [formStatus, setFormStatus] = React.useState<"Active" | "Inactive">("Active");

  const employees = useEmployeeStore((s) => s.employees);

  const getMemberCount = (deptId: string) => {
    return employees.filter((e) => e.departmentId === deptId).length;
  };

  const getDeptEmployees = (deptId: string) => {
    return employees.filter((e) => e.departmentId === deptId);
  };

  const totalMembers = employees.length;
  const totalManagersCount = departments.filter((d) => d.managerName && d.managerName !== "Chưa bổ nhiệm").length;
  const activeCount = departments.filter((d) => d.status === "Active").length;

  const filteredDepts = departments.filter((d) => {
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.managerName.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormName("");
    setFormCode("");
    setFormDesc("");
    setFormManager("");
    setFormStatus("Active");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormDesc(dept.description);
    setFormManager(dept.managerName);
    setFormStatus(dept.status);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? {
                ...d,
                name: formName.trim(),
                code: formCode.trim() || d.code,
                description: formDesc.trim(),
                managerName: formManager.trim() || d.managerName,
                status: formStatus,
              }
            : d
        )
      );
    } else {
      const newId = `dept-${Date.now()}`;
      const newDept: DepartmentItem = {
        id: newId,
        code: formCode.trim() || `PB-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        description: formDesc.trim(),
        managerName: formManager.trim() || "Chưa bổ nhiệm",
        managerPosition: "Trưởng phòng",
        status: formStatus,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setDepartments((prev) => [newDept, ...prev]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa phòng ban này?")) {
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      if (viewingMembersDept?.id === id) {
        setViewingMembersDept(null);
      }
    }
  };

  return (
    <div className="space-y-5 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Trang chủ</span>
            <span>/</span>
            <span>Quản lý nhân sự</span>
            <span>/</span>
            <span className="text-foreground font-medium">Phòng ban</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Cơ cấu phòng ban
              </h1>
              <p className="text-xs text-muted-foreground">
                Danh sách phòng ban, chức năng chuyên môn, trưởng bộ phận và quy mô nhân sự
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-xs gap-2 shadow-xs hover:bg-primary/95"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo phòng ban mới</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng phòng ban</span>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{departments.length}</span>
            <span className="text-xs text-muted-foreground">khối chuyên môn</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng nhân sự</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{totalMembers}</span>
            <span className="text-xs text-muted-foreground">nhân viên trực thuộc</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Trưởng bộ phận</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{totalManagersCount}</span>
            <span className="text-xs text-muted-foreground">/{departments.length} đã bổ nhiệm</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Trạng thái</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{activeCount}</span>
            <span className="text-xs text-muted-foreground">đang hoạt động</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-1 items-center gap-2.5 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã phòng ban, tên hoặc trưởng bộ phận..."
              className="pl-9 h-9 rounded-xl bg-card text-xs border-border/80"
            />
          </div>

          <div className="w-40 shrink-0">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "ALL" | "Active" | "Inactive")}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs bg-card border-border/80">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="Active">Đang hoạt động</SelectItem>
                <SelectItem value="Inactive">Tạm ngưng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{filteredDepts.length}</span> / {departments.length} phòng ban
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4 w-28">Mã PB</th>
                <th className="py-3 px-4">Tên phòng ban & Chức năng</th>
                <th className="py-3 px-4 w-60">Trưởng bộ phận</th>
                <th className="py-3 px-4 w-44">Quy mô nhân sự</th>
                <th className="py-3 px-4 w-32">Trạng thái</th>
                <th className="py-3 px-4 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy phòng ban nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredDepts.map((dept) => {
                  const count = getMemberCount(dept.id);
                  const deptEmployees = getDeptEmployees(dept.id);

                  return (
                    <tr
                      key={dept.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3 px-4 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-muted/70 text-foreground border border-border/80">
                          {dept.code}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <div>
                          <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                            <span>{dept.name}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 max-w-xl">
                            {dept.description || "Chưa có mô tả chức năng nhiệm vụ."}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        {dept.managerName && dept.managerName !== "Chưa bổ nhiệm" ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-border/80 shrink-0">
                              <AvatarImage src={dept.managerAvatar} alt={dept.managerName} />
                              <AvatarFallback className="bg-muted text-foreground text-[10px] font-semibold">
                                {dept.managerName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground text-xs truncate">
                                {dept.managerName}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {dept.managerPosition || "Trưởng bộ phận"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-[11px] text-muted-foreground italic">
                            Chưa bổ nhiệm
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingMembersDept(dept)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{count} nhân sự</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              (chi tiết)
                            </span>
                          </button>

                          {deptEmployees.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {deptEmployees.slice(0, 4).map((emp) => (
                                <Avatar
                                  key={emp.id}
                                  className="h-5 w-5 border border-background shadow-2xs"
                                  title={`${emp.name} - ${emp.position}`}
                                >
                                  <AvatarImage src={emp.avatar} alt={emp.name} />
                                  <AvatarFallback className="text-[8px]">
                                    {emp.name.slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {count > 4 && (
                                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                  +{count - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            dept.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              dept.status === "Active" ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                          />
                          <span>{dept.status === "Active" ? "Hoạt động" : "Tạm ngưng"}</span>
                        </span>
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
                          <DropdownMenuContent align="end" className="w-44 text-xs">
                            <DropdownMenuItem
                              onClick={() => setViewingMembersDept(dept)}
                              className="gap-2 cursor-pointer"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Xem nhân sự ({count})</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(dept)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Chỉnh sửa thông tin</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(dept.id)}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Xóa phòng ban</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border-border/80">
          <DialogHeader className="p-4 border-b border-border/70 bg-muted/20">
            <DialogTitle className="text-sm font-semibold">
              {editingDept ? "Chỉnh sửa phòng ban" : "Tạo phòng ban mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave}>
            <div className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Tên phòng ban *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Phòng Nghiên cứu & Phát triển"
                  className="h-9 rounded-lg text-xs bg-background"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Mã phòng ban</label>
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: PB-RND"
                    className="h-9 rounded-lg text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Trạng thái</label>
                  <Select
                    value={formStatus}
                    onValueChange={(val) => setFormStatus(val as "Active" | "Inactive")}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Đang hoạt động</SelectItem>
                      <SelectItem value="Inactive">Tạm ngưng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Trưởng bộ phận</label>
                <Input
                  value={formManager}
                  onChange={(e) => setFormManager(e.target.value)}
                  placeholder="Nhập tên trưởng bộ phận phụ trách..."
                  className="h-9 rounded-lg text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Mô tả chức năng & nhiệm vụ</label>
                <Textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả chức năng, phạm vi phụ trách của phòng ban..."
                  className="h-20 rounded-lg text-xs bg-background resize-none"
                />
              </div>
            </div>

            <DialogFooter className="p-3 border-t border-border/70 bg-muted/10 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-xs shadow-xs hover:bg-primary/95"
              >
                {editingDept ? "Lưu thay đổi" : "Tạo phòng ban"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingMembersDept}
        onOpenChange={(open) => {
          if (!open) setViewingMembersDept(null);
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-xl border-border/80">
          <DialogHeader className="p-4 border-b border-border/70 bg-muted/20">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-semibold text-foreground">
                    Nhân sự: {viewingMembersDept?.name}
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Mã {viewingMembersDept?.code} • {viewingMembersDept ? getMemberCount(viewingMembersDept.id) : 0} thành viên
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 max-h-[380px] overflow-y-auto space-y-2">
            {viewingMembersDept && getDeptEmployees(viewingMembersDept.id).length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Chưa có nhân sự nào được phân bổ vào phòng ban này.
              </div>
            ) : (
              viewingMembersDept &&
              getDeptEmployees(viewingMembersDept.id).map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 border border-border/70 shrink-0">
                      <AvatarImage src={emp.avatar} alt={emp.name} />
                      <AvatarFallback className="text-[10px] font-bold">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {emp.name}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {emp.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {emp.position}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" />
                          {emp.email}
                        </span>
                        {emp.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {emp.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${
                      emp.userType === "nhan_vien_chinh_thuc"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                        : emp.userType === "thu_viec"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {emp.userType === "nhan_vien_chinh_thuc"
                      ? "Chính thức"
                      : emp.userType === "thu_viec"
                      ? "Thử việc"
                      : emp.userType === "thuc_tap_sinh"
                      ? "Thực tập"
                      : "Cộng tác"}
                  </span>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="p-3 border-t border-border/70 bg-muted/10 flex items-center justify-between sm:justify-between">
            <Link href="/employees">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-primary hover:text-primary gap-1.5"
              >
                <span>Quản lý hồ sơ nhân sự</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewingMembersDept(null)}
              className="h-8 px-3 rounded-lg text-xs"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

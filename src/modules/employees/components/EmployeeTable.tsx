import * as React from "react";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Power,
  Building2,
  Calendar,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useEmployeeStore } from "../store/employeeStore";
import { Employee, UserType } from "../types";

const USER_TYPE_LABELS: Record<UserType, { label: string; className: string }> = {
  nhan_vien_chinh_thuc: {
    label: "Chính thức",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/40",
  },
  thu_viec: {
    label: "Thử việc",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40",
  },
  thuc_tap_sinh: {
    label: "Thực tập sinh",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300/40",
  },
  cong_tac_vien: {
    label: "Cộng tác viên",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300/40",
  },
};

const DEPARTMENT_BADGE_COLORS: Record<string, string> = {
  it: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/40",
  hr: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-300/40",
  marketing: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-300/40",
  sales: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-300/40",
  accounting: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300/40",
};

export function EmployeeTable() {
  const {
    employees,
    filter,
    openDetail,
    openEdit,
    deleteEmployee,
    toggleStatus,
  } = useEmployeeStore();

  const filtered = React.useMemo(() => {
    return employees.filter((e) => {
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        const matchName = e.name.toLowerCase().includes(q);
        const matchCode = e.code.toLowerCase().includes(q);
        const matchEmail = e.email.toLowerCase().includes(q);
        const matchPhone = e.phone.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchPhone) return false;
      }
      if (filter.departmentId !== "ALL" && e.departmentId !== filter.departmentId) {
        return false;
      }
      if (filter.userType !== "ALL" && e.userType !== filter.userType) {
        return false;
      }
      if (filter.status !== "ALL" && e.status !== filter.status) {
        return false;
      }
      return true;
    });
  }, [employees, filter]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/40 text-center">
        <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
          <User className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-foreground">
          Không tìm thấy nhân viên nào
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ các bộ lọc để xem đầy đủ danh sách.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
              <th className="py-3 px-4">Nhân viên</th>
              <th className="py-3 px-4">Phòng ban & Chức vụ</th>
              <th className="py-3 px-4">Liên hệ</th>
              <th className="py-3 px-4">Loại hình</th>
              <th className="py-3 px-4">Ngày gia nhập</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.map((emp) => {
              const typeCfg =
                USER_TYPE_LABELS[emp.userType] || USER_TYPE_LABELS.nhan_vien_chinh_thuc;
              const deptColor =
                DEPARTMENT_BADGE_COLORS[emp.departmentId] ||
                "bg-muted text-muted-foreground border-border";

              return (
                <tr
                  key={emp.id}
                  className="group hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => openDetail(emp)}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/70 shadow-xs shrink-0">
                        <AvatarImage src={emp.avatar} alt={emp.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm truncate hover:underline">
                            {emp.name}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted border border-border/80 text-muted-foreground shrink-0">
                            {emp.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {emp.role === "ADMIN" && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                              <ShieldCheck className="h-3 w-3" />
                              Quản trị viên
                            </span>
                          )}
                          {emp.role === "MANAGER" && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              Quản lý
                            </span>
                          )}
                          {emp.role === "EMPLOYEE" && (
                            <span className="text-[10px] text-muted-foreground">
                              Thành viên
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${deptColor}`}
                      >
                        <Building2 className="h-3 w-3" />
                        {emp.departmentName || emp.departmentId}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium truncate max-w-xs xl:max-w-md">
                        {emp.position}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1 text-xs">
                      <a
                        href={`mailto:${emp.email}`}
                        className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors truncate max-w-xs xl:max-w-md"
                      >
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </a>
                      <a
                        href={`tel:${emp.phone}`}
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{emp.phone}</span>
                      </a>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${typeCfg.className}`}
                    >
                      {typeCfg.label}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{emp.joinedDate}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          emp.status === "Active"
                            ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                            : "bg-muted-foreground/50 ring-4 ring-muted/40"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          emp.status === "Active"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {emp.status === "Active" ? "Đang làm việc" : "Đã tạm dừng"}
                      </span>
                    </div>
                  </td>

                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                          onClick={() => openDetail(emp)}
                          className="gap-2 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span>Xem hồ sơ chi tiết</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEdit(emp)}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5 text-amber-500" />
                          <span>Chỉnh sửa thông tin</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatus(emp.id)}
                          className="gap-2 cursor-pointer"
                        >
                          <Power className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            {emp.status === "Active"
                              ? "Tạm dừng hoạt động"
                              : "Kích hoạt lại"}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm(`Bạn chắc chắn muốn xóa nhân viên ${emp.name}?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Xóa nhân viên</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="py-2.5 px-4 border-t border-border/70 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <span>Hiển thị {filtered.length} nhân sự</span>
        <span>Phân hệ Quản lý Nhân sự ERP</span>
      </div>
    </div>
  );
}

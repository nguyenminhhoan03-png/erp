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

export function EmployeeCardGrid() {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {filtered.map((emp) => {
        const typeCfg =
          USER_TYPE_LABELS[emp.userType] || USER_TYPE_LABELS.nhan_vien_chinh_thuc;

        return (
          <div
            key={emp.id}
            className="group relative rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm p-4 hover:shadow-md hover:border-border transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-border/70 shadow-xs">
                      <AvatarImage src={emp.avatar} alt={emp.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                        emp.status === "Active" ? "bg-emerald-500" : "bg-muted-foreground/50"
                      }`}
                    />
                  </div>
                  <div>
                    <h5
                      onClick={() => openDetail(emp)}
                      className="text-sm font-semibold text-foreground hover:underline cursor-pointer truncate max-w-[150px]"
                    >
                      {emp.name}
                    </h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted border border-border/70 text-muted-foreground">
                        {emp.code}
                      </span>
                      {emp.role === "ADMIN" && (
                        <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
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
                        {emp.status === "Active" ? "Tạm dừng hoạt động" : "Kích hoạt lại"}
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
              </div>

              <div className="mt-3.5 space-y-1.5 pt-3 border-t border-border/50 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{emp.departmentName || emp.departmentId}</span>
                </div>
                <div className="font-medium text-foreground text-xs truncate">
                  {emp.position}
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeCfg.className}`}
                >
                  {typeCfg.label}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className="text-[11px]">{emp.joinedDate}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDetail(emp)}
                className="h-7 px-2.5 rounded-lg text-xs font-medium gap-1 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Eye className="h-3 w-3" />
                <span>Xem hồ sơ</span>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

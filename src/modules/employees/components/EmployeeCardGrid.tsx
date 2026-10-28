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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useEmployeeStore } from "../store/employeeStore";
import { UserType } from "../types";

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
  const router = useRouter();
  const {
    employees,
    isLoading,
    pagination,
    setPerPage,
    nextPage,
    prevPage,
    goToFirstPage,
    deleteEmployee,
    toggleStatus,
  } = useEmployeeStore();

  if (!isLoading && employees.length === 0) {
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
    <div className="space-y-4">
      {isLoading && (
        <div className="py-6 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border/80 shadow-xs">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((emp) => {
          const typeCfg =
            USER_TYPE_LABELS[emp.userType] || USER_TYPE_LABELS.nhan_vien_chinh_thuc;

          return (
            <div
              key={emp.id}
              className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm p-4 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border/70 shadow-xs">
                      <AvatarImage src={emp.avatar} alt={emp.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4
                        onClick={() => router.push(`/employees/${emp.id}`)}
                        className="font-semibold text-foreground text-sm hover:text-primary transition-colors cursor-pointer truncate"
                      >
                        {emp.name}
                      </h4>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {emp.code}
                      </p>
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
                        onClick={() => router.push(`/employees/${emp.id}`)}
                        className="gap-2 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                        <span>Xem hồ sơ</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/employees/${emp.id}/edit`)}
                        className="gap-2 cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5 text-amber-500" />
                        <span>Chỉnh sửa</span>
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
                  onClick={() => router.push(`/employees/${emp.id}`)}
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

      <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
          <span>
            Hiển thị <span className="font-semibold text-foreground">{employees.length}</span> / tổng số{" "}
            <span className="font-semibold text-foreground">{pagination.total}</span> nhân sự
          </span>
          <span className="hidden sm:inline-block text-border">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Số lượng:</span>
            <div className="w-20">
              <Select
                value={String(pagination.perPage)}
                onValueChange={(val) => setPerPage(Number(val))}
              >
                <SelectTrigger className="h-7 text-xs rounded-lg bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                  <SelectItem value="20" className="text-xs">20</SelectItem>
                  <SelectItem value="50" className="text-xs">50</SelectItem>
                  <SelectItem value="100" className="text-xs">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">
            Trang <span className="text-foreground font-semibold">{pagination.page}</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={pagination.page <= 1 || isLoading}
            className="h-8 px-2.5 rounded-xl text-xs gap-1 hover:bg-muted"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Trang đầu</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={pagination.page <= 1 || isLoading}
            className="h-8 px-3 rounded-xl text-xs gap-1 hover:bg-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Trước</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={!pagination.hasMore || isLoading}
            className="h-8 px-3 rounded-xl text-xs gap-1 hover:bg-muted"
          >
            <span>Sau</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

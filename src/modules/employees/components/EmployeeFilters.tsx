import * as React from "react";
import { Search, UserPlus, Filter, RotateCcw, LayoutGrid, List } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useEmployeeStore } from "../store/employeeStore";
import { useUserStore } from "@/shared/store/useUserStore";

interface EmployeeFiltersProps {
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
}

export function EmployeeFilters({
  viewMode,
  onViewModeChange,
}: EmployeeFiltersProps) {
  const { filter, setFilter, resetFilter, openCreate } = useEmployeeStore();
  const departments = useUserStore((s) => s.departments);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/50 backdrop-blur-sm p-4 shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            placeholder="Tìm theo tên, mã NV, email, số điện thoại..."
            className="pl-10 h-10 bg-background/80 rounded-xl border-border/80 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border/60">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("table")}
              className={`h-8 px-2.5 rounded-lg text-xs gap-1.5 ${
                viewMode === "table" ? "shadow-xs font-semibold" : "text-muted-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Bảng</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={`h-8 px-2.5 rounded-lg text-xs gap-1.5 ${
                viewMode === "grid" ? "shadow-xs font-semibold" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Thẻ</span>
            </Button>
          </div>

          <Button
            onClick={openCreate}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm gap-2 shadow-sm transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm nhân viên</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Bộ lọc:</span>
        </div>

        <div className="w-[180px]">
          <Select
            value={filter.departmentId}
            onValueChange={(val) => setFilter({ departmentId: val })}
          >
            <SelectTrigger className="h-8.5 rounded-lg text-xs bg-background/80 border-border/70">
              <SelectValue placeholder="Tất cả phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
              <SelectItem value="it">Công nghệ thông tin</SelectItem>
              <SelectItem value="hr">Nhân sự & Tuyển dụng</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Kinh doanh</SelectItem>
              <SelectItem value="accounting">Kế toán & Tài chính</SelectItem>
              {departments
                .filter(
                  (d) =>
                    !["it", "hr", "marketing", "sales", "accounting"].includes(
                      d.id
                    )
                )
                .map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[160px]">
          <Select
            value={filter.userType}
            onValueChange={(val) => setFilter({ userType: val })}
          >
            <SelectTrigger className="h-8.5 rounded-lg text-xs bg-background/80 border-border/70">
              <SelectValue placeholder="Loại nhân viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại hình</SelectItem>
              <SelectItem value="nhan_vien_chinh_thuc">Chính thức</SelectItem>
              <SelectItem value="thu_viec">Thử việc</SelectItem>
              <SelectItem value="thuc_tap_sinh">Thực tập sinh</SelectItem>
              <SelectItem value="cong_tac_vien">Cộng tác viên</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select
            value={filter.status}
            onValueChange={(val) => setFilter({ status: val })}
          >
            <SelectTrigger className="h-8.5 rounded-lg text-xs bg-background/80 border-border/70">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="Active">Đang làm việc</SelectItem>
              <SelectItem value="Inactive">Đã tạm ngưng / nghỉ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filter.search ||
          filter.departmentId !== "ALL" ||
          filter.userType !== "ALL" ||
          filter.status !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilter}
            className="h-8.5 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1 ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Đặt lại</span>
          </Button>
        )}
      </div>
    </div>
  );
}

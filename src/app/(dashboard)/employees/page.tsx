"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { EmployeeFilters } from "@/modules/employees/components/EmployeeFilters";
import { EmployeeTable } from "@/modules/employees/components/EmployeeTable";
import { EmployeeCardGrid } from "@/modules/employees/components/EmployeeCardGrid";
import { useEmployeeStore } from "@/modules/employees/store/employeeStore";
import { usePermission } from "@/shared/permissions/PermissionGuard";
import { AccessDenied } from "@/shared/components/AccessDenied";

export default function EmployeesPage() {
  const canView = usePermission("user_list");

  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");
  const { employees, loadEmployees, loadOptions, isLoading } = useEmployeeStore();

  React.useEffect(() => {
    if (canView) {
      loadEmployees();
      loadOptions();
    }
  }, [loadEmployees, loadOptions, canView]);

  if (!canView) {
    return <AccessDenied moduleName="nhân sự" />;
  }

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Mã NV,Họ và tên,Email,Số điện thoại,Phòng ban,Chức vụ,Loại hình,Trạng thái"]
        .concat(
          employees.map(
            (e) =>
              `"${e.code}","${e.name}","${e.email}","${e.phone}","${
                e.departmentName || e.departmentId
              }","${e.position}","${e.userType}","${e.status}"`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh_sach_nhan_su_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Trang chủ</span>
            <span>/</span>
            <span>Quản lý tổ chức</span>
            <span>/</span>
            <span className="text-foreground font-medium">Nhân sự</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Danh sách nhân sự
              </h1>
              <p className="text-xs text-muted-foreground">
                Quản lý thông tin hồ sơ, phòng ban, chức vụ và loại hình hợp đồng nhân sự
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3.5 rounded-xl text-xs gap-1.5 border-border/80 shadow-xs hover:bg-muted/70"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất file Excel/CSV</span>
          </Button>
        </div>
      </div>

      <EmployeeFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === "table" ? <EmployeeTable /> : <EmployeeCardGrid />}
    </div>
  );
}

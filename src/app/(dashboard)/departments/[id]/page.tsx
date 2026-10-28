"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ArrowLeft,
  ChevronRight,
  Edit,
  Building,
  UserCheck,
  Mail,
  Phone,
  Search,
  ExternalLink,
  Briefcase,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Department } from "@/modules/departments/types";
import { departmentService } from "@/modules/departments/services/departmentService";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deptId = params?.id as string;

  const [department, setDepartment] = React.useState<Department | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchEmployee, setSearchEmployee] = React.useState("");

  React.useEffect(() => {
    departmentService
      .getDepartmentById(deptId)
      .then((res) => {
        if (res?.data) {
          setDepartment(res.data);
        }
      })
      .catch(() => {
        toast.error("Không thể tải thông tin phòng ban");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [deptId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin phòng ban...</p>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Không tìm thấy phòng ban</p>
        <Button size="sm" onClick={() => router.push("/departments")} className="rounded-xl text-xs">
          Quay lại danh sách phòng ban
        </Button>
      </div>
    );
  }

  const employees = department.employees || [];
  const filteredEmployees = employees.filter((emp) => {
    const q = searchEmployee.toLowerCase().trim();
    if (!q) return true;
    return emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q) || emp.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/employees" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>Quản lý tổ chức</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <Link href="/departments" className="hover:text-foreground transition-colors">
              <span>Phòng ban</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-medium">{department.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/departments"
              className="h-8 w-8 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{department.name}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/departments/${department.id}/edit`)}
            className="rounded-xl text-xs gap-1.5 h-9 bg-card shadow-2xs hover:bg-muted"
          >
            <Edit className="h-3.5 w-3.5 text-amber-500" />
            <span>Chỉnh sửa phòng ban</span>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{department.name}</h2>
                <Badge variant="outline" className="font-mono text-xs bg-muted/60">
                  {department.code}
                </Badge>
                <Badge
                  variant={department.status === "Active" ? "default" : "secondary"}
                  className="text-[11px]"
                >
                  {department.status === "Active" ? "Đang hoạt động" : "Tạm dừng"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {department.subCompanyName && (
                  <span className="flex items-center gap-1 font-medium text-foreground/90">
                    <Building className="h-3.5 w-3.5 text-primary" />
                    <span>{department.subCompanyName}</span>
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{department.employeesCount} nhân sự</span>
                </span>
                {department.createdAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Ngày thành lập: {department.createdAt}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {department.description && (
          <div className="pt-2 border-t border-border/60">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {department.description}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span>Trưởng phòng phụ trách</span>
            </h3>

            {department.managerName ? (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-border/80 shrink-0">
                    <AvatarImage src={department.managerAvatar} alt={department.managerName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {department.managerName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm">{department.managerName}</p>
                    <p className="text-xs text-primary font-medium">{department.managerPosition || "Trưởng phòng"}</p>
                  </div>
                </div>

                {department.managerEmail && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t border-border/50">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{department.managerEmail}</span>
                  </div>
                )}

                {department.managerId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/employees/${department.managerId}`)}
                    className="w-full rounded-xl text-xs gap-1.5 h-8 bg-card shadow-2xs mt-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Xem hồ sơ Trưởng phòng</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground rounded-xl bg-muted/20 border border-border/60">
                Phòng ban hiện chưa có Trưởng phòng phụ trách.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span>Công ty trực thuộc</span>
            </h3>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
              <p className="font-semibold text-foreground text-xs">
                {department.subCompanyName || "Chưa trực thuộc công ty cụ thể"}
              </p>
              {department.subCompanyId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/companies/${department.subCompanyId}`)}
                  className="w-full rounded-xl text-xs gap-1.5 h-8 bg-card shadow-2xs mt-3"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Xem thông tin công ty</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Danh sách nhân sự ({employees.length})</span>
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  placeholder="Tìm nhân sự..."
                  className="pl-8 rounded-xl h-8 text-xs"
                />
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground rounded-xl bg-muted/20 border border-border/60">
                {searchEmployee ? "Không tìm thấy nhân sự phù hợp." : "Chưa có nhân sự nào được phân bổ vào phòng ban này."}
              </div>
            ) : (
              <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/employees/${emp.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 border border-border/80 shrink-0">
                        <AvatarImage src={emp.avatar} alt={emp.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-xs group-hover:underline truncate">
                            {emp.name}
                          </p>
                          <span className="font-mono text-[10px] px-1 py-0.2 bg-muted rounded border border-border text-muted-foreground">
                            {emp.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{emp.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-foreground">{emp.position || "Chuyên viên"}</p>
                      <span className="text-[10px] text-muted-foreground">{emp.phone || "---"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

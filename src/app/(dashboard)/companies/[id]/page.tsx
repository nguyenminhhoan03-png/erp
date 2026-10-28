"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building,
  Building2,
  Users,
  ArrowLeft,
  ChevronRight,
  Edit,
  UserCheck,
  Mail,
  Phone,
  Search,
  ExternalLink,
  Briefcase,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Company } from "@/modules/companies/types";
import { companyService } from "@/modules/companies/services/companyService";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [company, setCompany] = React.useState<Company | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchDept, setSearchDept] = React.useState("");

  React.useEffect(() => {
    companyService
      .getCompanyById(companyId)
      .then((res) => {
        if (res?.data) {
          setCompany(res.data);
        }
      })
      .catch(() => {
        toast.error("Không thể tải thông tin công ty");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [companyId]);

  const handleDelete = async () => {
    if (!company) return;
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa công ty "${company.name}"? Dữ liệu liên kết phòng ban sẽ được giải phóng.`
      )
    ) {
      return;
    }

    try {
      const res = await companyService.deleteCompany(company.id);
      toast.success(res.message || "Đã xóa công ty thành công");
      router.push("/companies");
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa công ty");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin công ty...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Không tìm thấy công ty</p>
        <Button size="sm" onClick={() => router.push("/companies")} className="rounded-xl text-xs">
          Quay lại danh sách công ty
        </Button>
      </div>
    );
  }

  const departments = company.departments || [];
  const filteredDepartments = departments.filter((dept) => {
    const q = searchDept.toLowerCase().trim();
    if (!q) return true;
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.code.toLowerCase().includes(q) ||
      (dept.managerName && dept.managerName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/departments" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              <span>Quản lý tổ chức</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <Link href="/companies" className="hover:text-foreground transition-colors">
              <span>Công ty</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-medium">{company.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/companies"
              className="h-8 w-8 rounded-xl border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  {company.name}
                </h1>
                <Badge variant="outline" className="text-xs font-mono font-medium">
                  {company.code}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/companies/${company.id}/edit`)}
            className="rounded-xl text-xs gap-1.5 h-9 bg-card hover:bg-muted"
          >
            <Edit className="h-3.5 w-3.5 text-blue-500" />
            <span>Chỉnh sửa thông tin</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="rounded-xl text-xs gap-1.5 h-9 bg-card hover:bg-rose-50 text-rose-600 border-rose-200 dark:border-rose-900/50"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>Xóa</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-primary" />
              <span>Người đại diện / Giám đốc</span>
            </h2>

            {company.headUserName ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-2xl border border-border/80 shadow-2xs">
                    <AvatarImage src={company.headUserAvatar || undefined} />
                    <AvatarFallback className="text-sm bg-primary/10 text-primary font-bold">
                      {company.headUserName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {company.headUserName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.headUserPosition || "Đại diện pháp luật"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                  {company.headUserEmail && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{company.headUserEmail}</span>
                    </div>
                  )}
                  {company.headUserId && (
                    <div className="pt-2">
                      <Link
                        href={`/employees/${company.headUserId}/edit`}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Xem hồ sơ nhân sự</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="h-10 w-10 rounded-xl bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Chưa bổ nhiệm người đại diện</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/companies/${company.id}/edit`)}
                  className="rounded-xl text-xs h-8"
                >
                  Bổ nhiệm ngay
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3 text-xs">
            <h2 className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>Thông tin đơn vị</span>
            </h2>

            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Mã định danh</span>
                <span className="font-mono font-medium text-foreground">{company.code}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Số phòng ban trực thuộc</span>
                <span className="font-semibold text-foreground">{company.departmentsCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Ngày khởi tạo</span>
                <span className="text-foreground">
                  {company.createdAt ? company.createdAt.substring(0, 10) : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>Danh sách phòng ban trực thuộc ({departments.length})</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Các phòng ban thuộc cơ cấu quản lý của công ty.
                </p>
              </div>

              <div className="w-full sm:w-60">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchDept}
                    onChange={(e) => setSearchDept(e.target.value)}
                    placeholder="Tìm theo tên phòng, mã..."
                    className="pl-8 rounded-xl h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {departments.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="h-10 w-10 rounded-xl bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Chưa liên kết phòng ban nào</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hãy chỉnh sửa công ty để gán các phòng ban trực thuộc.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/companies/${company.id}/edit`)}
                  className="rounded-xl text-xs h-8 bg-primary text-primary-foreground"
                >
                  Gán phòng ban ngay
                </Button>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Không tìm thấy phòng ban nào khớp với từ khóa tìm kiếm.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-medium">
                      <th className="py-2.5 px-3 w-16">Mã</th>
                      <th className="py-2.5 px-3">Tên phòng ban</th>
                      <th className="py-2.5 px-3">Trưởng phòng</th>
                      <th className="py-2.5 px-3 text-center">Nhân sự</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 w-12 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredDepartments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium">{dept.code}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          <Link
                            href={`/departments/${dept.id}`}
                            className="hover:text-primary transition-colors hover:underline"
                          >
                            {dept.name}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {dept.managerName || (
                            <span className="italic text-[11px]">Chưa bổ nhiệm</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          {dept.employeesCount}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={dept.status === "Active" ? "outline" : "secondary"}
                            className={`text-[9px] px-1.5 py-0 rounded ${
                              dept.status === "Active"
                                ? "border-emerald-500/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                                : "text-muted-foreground"
                            }`}
                          >
                            {dept.status === "Active" ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/departments/${dept.id}`}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

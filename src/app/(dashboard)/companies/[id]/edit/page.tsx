"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building,
  Building2,
  ArrowLeft,
  Save,
  AlertCircle,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { companyService } from "@/modules/companies/services/companyService";
import { CompanyOptionsData, Company } from "@/modules/companies/types";

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [company, setCompany] = React.useState<Company | null>(null);
  const [options, setOptions] = React.useState<CompanyOptionsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [name, setName] = React.useState("");
  const [headUserId, setHeadUserId] = React.useState<string>("NONE");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = React.useState<string[]>([]);
  const [departmentSearch, setDepartmentSearch] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    Promise.all([
      companyService.getCompanyById(companyId),
      companyService.getOptions(),
    ])
      .then(([companyRes, optionsRes]) => {
        if (companyRes?.data) {
          const comp = companyRes.data;
          setCompany(comp);
          setName(comp.name || "");
          setHeadUserId(comp.headUserId ? String(comp.headUserId) : "NONE");
          setSelectedDepartmentIds(comp.departments ? comp.departments.map((d) => d.id) : []);
        }
        if (optionsRes?.data) {
          setOptions(optionsRes.data);
        }
      })
      .catch(() => {
        toast.error("Không thể tải thông tin công ty");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [companyId]);

  const handleToggleDepartment = (deptId: string) => {
    setSelectedDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSelectAllDepartments = () => {
    if (!options?.departments) return;
    if (selectedDepartmentIds.length === options.departments.length) {
      setSelectedDepartmentIds([]);
    } else {
      setSelectedDepartmentIds(options.departments.map((d) => d.id));
    }
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!name.trim()) {
      err.name = "Tên công ty không được để trống";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        headUserId: headUserId !== "NONE" ? headUserId : null,
        departmentIds: selectedDepartmentIds,
      };

      const res = await companyService.updateCompany(companyId, payload);
      toast.success(res.message || "Cập nhật công ty thành công");
      router.push(`/companies/${companyId}`);
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật công ty");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin chỉnh sửa...</p>
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

  const filteredDepartments = (options?.departments || []).filter((d) => {
    const q = departmentSearch.toLowerCase().trim();
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || (d.managerName && d.managerName.toLowerCase().includes(q));
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
            <span>/</span>
            <Link href="/companies" className="hover:text-foreground transition-colors">
              Công ty
            </Link>
            <span>/</span>
            <Link href={`/companies/${company.id}`} className="hover:text-foreground transition-colors">
              {company.name}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Chỉnh sửa</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/companies/${company.id}`}
              className="h-8 w-8 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              <span>Chỉnh sửa công ty</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/companies/${company.id}`)}
            className="rounded-xl text-xs gap-1.5 h-9 bg-card hover:bg-muted"
          >
            <span>Hủy bỏ</span>
          </Button>

          <Button
            type="submit"
            form="edit-company-form"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 shadow-sm"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSubmitting ? "Đang lưu..." : "Cập nhật công ty"}</span>
          </Button>
        </div>
      </div>

      <form id="edit-company-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span>1. Thông tin pháp nhân công ty</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cập nhật tên pháp nhân và người đại diện quản lý công ty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Tên công ty</span>
                <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                placeholder="Ví dụ: Công ty Cổ phần Công nghệ IGB..."
                className={`rounded-xl h-10 text-xs ${
                  errors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Người đại diện / Giám đốc phụ trách</span>
              </label>
              <Select value={headUserId} onValueChange={setHeadUserId}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Chọn người đại diện công ty..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="NONE" className="text-xs text-muted-foreground">
                    -- Chưa bổ nhiệm --
                  </SelectItem>
                  {options?.headUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 rounded-md">
                          <AvatarImage src={u.avatar || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {u.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                        {u.position && (
                          <span className="text-[10px] text-muted-foreground">({u.position})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>2. Phòng ban trực thuộc công ty</span>
                </h2>
                <Badge variant="secondary" className="text-[11px] px-2 py-0.5 rounded-lg">
                  Đã chọn {selectedDepartmentIds.length} / {options?.departments?.length || 0}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gán hoặc thay đổi các phòng ban thuộc cơ cấu quản lý của công ty này.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={departmentSearch}
                  onChange={(e) => setDepartmentSearch(e.target.value)}
                  placeholder="Tìm kiếm phòng ban..."
                  className="pl-8 h-8 rounded-xl text-xs bg-background"
                />
              </div>

              {options?.departments && options.departments.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllDepartments}
                  className="text-xs h-8 px-3 rounded-xl hover:bg-muted shrink-0"
                >
                  {selectedDepartmentIds.length === options.departments.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
              )}
            </div>
          </div>

          {!options?.departments || options.departments.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground">Chưa có phòng ban nào trong hệ thống.</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Không tìm thấy phòng ban nào khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredDepartments.map((dept) => {
                const isSelected = selectedDepartmentIds.includes(dept.id);
                return (
                  <label
                    key={dept.id}
                    onClick={() => handleToggleDepartment(dept.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-2xs ring-1 ring-primary/20"
                        : "border-border/70 hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleDepartment(dept.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {dept.name}
                        </span>
                        <Badge
                          variant={dept.status === "Active" ? "outline" : "secondary"}
                          className={`text-[9px] px-1.5 py-0 rounded shrink-0 ${
                            dept.status === "Active"
                              ? "border-emerald-500/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                              : "text-muted-foreground"
                          }`}
                        >
                          {dept.status === "Active" ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                      {dept.managerName && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          Trưởng phòng: {dept.managerName}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/companies/${company.id}`)}
            className="rounded-xl text-xs h-10 px-5 bg-card hover:bg-muted"
          >
            Hủy bỏ
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl text-xs h-10 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSubmitting ? "Đang lưu..." : "Cập nhật công ty"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

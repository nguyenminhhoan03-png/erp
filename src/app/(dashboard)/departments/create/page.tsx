"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ArrowLeft,
  ChevronRight,
  Plus,
  Building,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { departmentService } from "@/modules/departments/services/departmentService";
import { DepartmentOptionsData } from "@/modules/departments/types";

export default function CreateDepartmentPage() {
  const router = useRouter();

  const [options, setOptions] = React.useState<DepartmentOptionsData | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [subCompanyId, setSubCompanyId] = React.useState<string>("none");
  const [managerId, setManagerId] = React.useState<string>("none");
  const [status, setStatus] = React.useState<string>("Active");

  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = React.useState("");

  React.useEffect(() => {
    departmentService
      .getOptions()
      .then((res) => {
        if (res?.data) {
          setOptions(res.data);
        }
      })
      .catch(() => {
        toast.error("Không thể tải danh mục tùy chọn");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, []);

  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAllEmployees = () => {
    if (!options?.availableEmployees) return;
    if (selectedEmployees.length === options.availableEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(options.availableEmployees.map((e) => e.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên phòng ban");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await departmentService.createDepartment({
        name: name.trim(),
        description: description.trim() || undefined,
        subCompanyId: subCompanyId !== "none" ? subCompanyId : null,
        managerId: managerId !== "none" ? managerId : null,
        status,
        employeeIds: selectedEmployees.length > 0 ? selectedEmployees : undefined,
      });

      toast.success(res.message || "Tạo phòng ban thành công!");
      router.push("/departments");
    } catch (err: any) {
      setError(err?.message || "Không thể tạo phòng ban. Vui lòng kiểm tra lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = options?.availableEmployees?.filter((emp) => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return true;
    return emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
  }) ?? [];

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
            <span className="text-foreground font-medium">Thêm mới</span>
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
              <Building2 className="h-6 w-6 text-primary" />
              <span>Thêm phòng ban mới</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/departments")}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <span>Hủy bỏ</span>
          </Button>
          <Button
            type="submit"
            form="create-department-form"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu phòng ban"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form id="create-department-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>1. Thông tin chung về phòng ban</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Tên phòng ban <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="VD: Phòng Công nghệ Thông tin & Chuyển đổi số"
                className="rounded-xl h-10 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Công ty trực thuộc</label>
              <Select value={subCompanyId} onValueChange={setSubCompanyId}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Chọn công ty trực thuộc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Chưa thuộc công ty cụ thể</SelectItem>
                  {options?.subCompanies?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Trạng thái hoạt động</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active" className="text-xs">Kích hoạt (Active)</SelectItem>
                  <SelectItem value="Inactive" className="text-xs">Tạm dừng (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">Mô tả chức năng & nhiệm vụ</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chức năng, nhiệm vụ và phạm vi hoạt động của phòng ban..."
                className="rounded-xl text-xs min-h-[90px] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>2. Bổ nhiệm Trưởng phòng</span>
          </h3>

          <div className="space-y-3">
            <div className="max-w-md">
              <label className="text-xs font-semibold text-foreground">Chọn nhân sự phụ trách làm Trưởng phòng</label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger className="rounded-xl h-10 text-xs mt-1.5">
                  <SelectValue placeholder="Chọn nhân sự làm Trưởng phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Chưa bổ nhiệm (Để trống)</SelectItem>
                  {options?.availableManagers?.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name} {m.position ? `(${m.position})` : ""} - {m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {managerId !== "none" && options?.availableManagers && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 max-w-md flex items-center gap-3">
                {(() => {
                  const m = options.availableManagers.find((x) => x.id === managerId);
                  if (!m) return null;
                  return (
                    <>
                      <Avatar className="h-10 w-10 border border-border/80 shrink-0">
                        <AvatarImage src={m.avatar} alt={m.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {m.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.position || "Nhân sự"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>3. Phân bổ nhân sự vào phòng ban ({selectedEmployees.length} nhân sự đã chọn)</span>
            </h3>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Tìm nhân sự..."
                  className="pl-8 rounded-xl h-8 text-xs"
                />
              </div>

              {options?.availableEmployees && options.availableEmployees.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllEmployees}
                  className="rounded-xl text-xs h-8"
                >
                  {selectedEmployees.length === options.availableEmployees.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </Button>
              )}
            </div>
          </div>

          <div className="border border-border/70 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            {isLoadingOptions ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Đang tải danh sách nhân sự...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Không có nhân sự khả dụng để gán vào phòng ban.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredEmployees.map((emp) => {
                  const isChecked = selectedEmployees.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleEmployee(emp.id)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary pointer-events-none"
                        />
                        <Avatar className="h-8 w-8 border border-border/80 shrink-0">
                          <AvatarImage src={emp.avatar} alt={emp.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs">{emp.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{emp.email}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {emp.position || "Chuyên viên"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/departments")}
            className="rounded-xl text-xs h-9 px-4"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl text-xs h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
          >
            {isSubmitting ? "Đang lưu..." : "Hoàn tất & Lưu phòng ban"}
          </Button>
        </div>
      </form>
    </div>
  );
}

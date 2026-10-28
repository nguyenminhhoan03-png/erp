"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  ChevronRight,
  Edit,
  Building2,
  Briefcase,
  Shield,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
  Calendar,
  Cpu,
  BadgeCheck,
  Lock,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useEmployeeStore } from "@/modules/employees/store/employeeStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserType, EmployeeStatus, Employee } from "@/modules/employees/types";
import { employeeService } from "@/modules/employees/services/employeeService";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const empId = params?.id as string;

  const { employees, updateEmployee, options, loadOptions } = useEmployeeStore();
  const departments = useUserStore((s) => s.departments);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cccd, setCccd] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [provinceId, setProvinceId] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [departmentId, setDepartmentId] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [roleId, setRoleId] = React.useState("");
  const [userType, setUserType] = React.useState<UserType>("nhan_vien_chinh_thuc");
  const [status, setStatus] = React.useState<EmployeeStatus>("Active");
  const [attendanceMachineId, setAttendanceMachineId] = React.useState("");
  const [hasSubmittedDocuments, setHasSubmittedDocuments] = React.useState(false);
  const [contractSignedDate, setContractSignedDate] = React.useState("");
  const [contractEndDate, setContractEndDate] = React.useState("");

  const [salary, setSalary] = React.useState("");
  const [bankId, setBankId] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [bankAccount, setBankAccount] = React.useState("");
  const [holderName, setHolderName] = React.useState("");
  const [branch, setBranch] = React.useState("");

  const deptList: Array<{ id: string; name: string }> =
    options?.departments && options.departments.length > 0
      ? options.departments.map((d) => ({ id: String(d.id), name: d.name }))
      : departments;

  React.useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  React.useEffect(() => {
    let active = true;

    const populate = (emp: Employee) => {
      setAvatarUrl(emp.avatar || "");
      setName(emp.name || "");
      setEmail(emp.email || "");
      setPhone(emp.phone || "");
      setCccd(emp.cccd || "");
      setBirthday(emp.birthday || "");
      setAddress(emp.address || "");
      setProvinceId(emp.provinceId || "");

      setDepartmentId(emp.departmentId || "");
      setPosition(emp.position || "");
      setRoleId((emp as any).roleId || "");
      setUserType((emp.userType as UserType) || "nhan_vien_chinh_thuc");
      setStatus(emp.status || "Active");
      setAttendanceMachineId(emp.attendanceMachineId || "");
      setHasSubmittedDocuments(Boolean(emp.hasSubmittedDocuments));
      setContractSignedDate(emp.contractSignedDate || "");
      setContractEndDate(emp.contractEndDate || "");

      setSalary(emp.salary ? String(emp.salary) : "");
      setBankId(emp.bankAccount?.bankId || "");
      setBankName(emp.bankAccount?.bankName || "");
      setBankAccount(emp.bankAccount?.accountNumber || "");
      setHolderName(emp.bankAccount?.holderName || emp.name || "");
      setBranch(emp.bankAccount?.branch || "");

      setIsLoading(false);
    };

    const localFound = employees.find((e) => String(e.id) === String(empId) || e.code === empId);
    if (localFound) {
      populate(localFound);
    }

    employeeService
      .getEmployeeById(empId)
      .then((res) => {
        if (active && res?.data) {
          populate(res.data);
        } else if (active && !localFound) {
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active && !localFound) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [empId, employees]);

  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP)!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh đại diện không được vượt quá 5MB!");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleCancelNewAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên nhân sự");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await updateEmployee(empId, {
        avatarFile: avatarFile || undefined,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cccd: cccd.trim() || undefined,
        birthday: birthday || undefined,
        address: address.trim() || undefined,
        provinceId: provinceId || undefined,
        departmentId,
        position: position.trim(),
        roleId: roleId || undefined,
        userType,
        status,
        attendanceMachineId: attendanceMachineId.trim() || undefined,
        hasSubmittedDocuments,
        contractSignedDate: contractSignedDate || undefined,
        contractEndDate: contractEndDate || undefined,
        salary: salary ? Number(salary) : undefined,
        password: password.trim() || undefined,
        bankAccount: bankAccount
          ? {
              bankId: bankId || undefined,
              bankName: bankName.trim(),
              accountNumber: bankAccount.trim(),
              holderName: holderName.trim() || name.trim().toUpperCase(),
              branch: branch.trim() || undefined,
            }
          : undefined,
      });

      toast.success(`Đã cập nhật thông tin nhân sự ${name} thành công!`);
      router.push(`/employees/${empId}`);
    } catch (err: any) {
      setError(err?.message || "Không thể cập nhật nhân sự. Vui lòng thử lại!");
      toast.error("Không thể cập nhật nhân sự. Vui lòng kiểm tra lại thông tin!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Đang tải dữ liệu hồ sơ nhân sự...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/employees" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>Quản lý tổ chức</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <Link href={`/employees/${empId}`} className="hover:text-foreground transition-colors">
              <span>{name || "Hồ sơ"}</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-medium">Chỉnh sửa</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/employees/${empId}`}
              className="h-8 w-8 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Quay lại chi tiết"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Edit className="h-6 w-6 text-amber-500" />
              <span>Chỉnh sửa hồ sơ nhân sự</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/employees/${empId}`)}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <span>Hủy bỏ</span>
          </Button>
          <Button
            type="submit"
            form="edit-employee-form"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4"
          >
            {isSubmitting ? "Đang lưu..." : "Cập nhật hồ sơ"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span>1. Thông tin cá nhân cơ bản</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-muted/30 border border-border/60">
            <div className="relative group shrink-0">
              <Avatar className="h-24 w-24 rounded-2xl border-2 border-border/80 shadow-xs overflow-hidden">
                <AvatarImage
                  src={avatarPreview || avatarUrl}
                  alt={name || "Avatar"}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-xl font-bold">
                  {(name || "NV").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium gap-1 cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="h-5 w-5" />
                <span>Đổi ảnh</span>
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Ảnh đại diện nhân sự</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Định dạng JPG, PNG hoặc WEBP. Dung lượng tối đa 5MB.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl text-xs gap-1.5 h-8 bg-card shadow-2xs hover:bg-muted"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{avatarPreview ? "Chọn ảnh khác" : "Tải ảnh mới"}</span>
                </Button>

                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelNewAvatar}
                    className="rounded-xl text-xs gap-1.5 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hủy chọn ảnh</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Họ và tên <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="pl-9 rounded-xl h-10 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Địa chỉ Email <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: user@company.com"
                  className="pl-9 rounded-xl h-10 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0987654321"
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Số CCCD / CMND</label>
              <Input
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
                placeholder="VD: 001094012345"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ngày sinh</label>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tỉnh / Thành phố</label>
              <Select value={provinceId} onValueChange={setProvinceId}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Chọn Tỉnh / Thành" />
                </SelectTrigger>
                <SelectContent>
                  {options?.provinces?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
              <label className="text-xs font-semibold text-foreground">Địa chỉ chi tiết</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: Số 12, Ngõ 34, Cầu Giấy, Hà Nội"
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mật khẩu mới (Để trống nếu giữ nguyên)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span>2. Thông tin công việc & Hợp đồng</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phòng ban</label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  {deptList.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Chức danh / Vị trí</label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Chuyên viên kỹ thuật"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phân loại nhân sự</label>
              <Select value={userType} onValueChange={(val: UserType) => setUserType(val)}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nhan_vien_chinh_thuc" className="text-xs">Nhân viên chính thức</SelectItem>
                  <SelectItem value="thu_viec" className="text-xs">Thử việc</SelectItem>
                  <SelectItem value="thuc_tap_sinh" className="text-xs">Thực tập sinh</SelectItem>
                  <SelectItem value="cong_tac_vien" className="text-xs">Cộng tác viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">ID Máy chấm công</label>
              <div className="relative">
                <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={attendanceMachineId}
                  onChange={(e) => setAttendanceMachineId(e.target.value)}
                  placeholder="Mã máy chấm công"
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ngày ký hợp đồng</label>
              <Input
                type="date"
                value={contractSignedDate}
                onChange={(e) => setContractSignedDate(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ngày kết thúc hợp đồng</label>
              <Input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-3 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="doc-status"
                checked={hasSubmittedDocuments}
                onChange={(e) => setHasSubmittedDocuments(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="doc-status" className="text-xs font-medium text-foreground cursor-pointer select-none">
                Đã nộp đầy đủ hồ sơ giấy tờ (Hồ sơ gốc / Bản công chứng)
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>3. Thông tin thanh toán lương & Tài khoản ngân hàng</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mức lương (VNĐ)</label>
              <Input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="VD: 15000000"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ngân hàng</label>
              {options?.banks && options.banks.length > 0 ? (
                <Select
                  value={bankId}
                  onValueChange={(val) => {
                    setBankId(val);
                    const b = options.banks.find((x) => String(x.id) === val);
                    if (b) setBankName(b.name);
                  }}
                >
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Chọn ngân hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.banks.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="VD: Vietcombank"
                  className="rounded-xl h-10 text-xs"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Số tài khoản</label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="VD: 0011004567890"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tên chủ tài khoản</label>
              <Input
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="VD: NGUYEN VAN A"
                className="rounded-xl h-10 text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
              <label className="text-xs font-semibold text-foreground">Chi nhánh ngân hàng</label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="VD: Chi nhánh Thăng Long, Hà Nội"
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>4. Cài đặt tài khoản & Phân quyền</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Quyền hạn / Vai trò</label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {options?.roles?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Trạng thái tài khoản</label>
              <Select value={status} onValueChange={(val: EmployeeStatus) => setStatus(val)}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active" className="text-xs">Kích hoạt (Active)</SelectItem>
                  <SelectItem value="Inactive" className="text-xs">Tạm dừng (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

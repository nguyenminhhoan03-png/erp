"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  MapPin,
  ShieldCheck,
  Briefcase,
  Edit,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Cpu,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useEmployeeStore } from "@/modules/employees/store/employeeStore";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const empId = params?.id as string;

  const { employees, loadEmployees } = useEmployeeStore();
  const [singleEmp, setSingleEmp] = React.useState<any>(null);
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    if (employees.length === 0) {
      loadEmployees();
    }
  }, [employees.length, loadEmployees]);

  React.useEffect(() => {
    let active = true;
    const found = employees.find((e) => String(e.id) === String(empId) || e.code === empId);
    if (found) {
      setSingleEmp(found);
    } else {
      setIsFetching(true);
    }

    import("@/modules/employees/services/employeeService")
      .then(({ employeeService }) => employeeService.getEmployeeById(empId))
      .then((res) => {
        if (active && res?.data) {
          setSingleEmp(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load employee detail:", err);
      })
      .finally(() => {
        if (active) setIsFetching(false);
      });

    return () => {
      active = false;
    };
  }, [empId, employees]);

  const employee = singleEmp || employees.find((e) => e.id === empId || e.code === empId);

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin nhân sự...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">Không tìm thấy nhân sự</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Nhân sự với mã hoặc ID này không tồn tại hoặc đã bị xóa.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/employees")}
          className="rounded-xl text-xs gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </Button>
      </div>
    );
  }

  const emp = employee;

  const fullAddress = [
    emp.address,
    emp.wardName,
    emp.districtName,
    emp.provinceName,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/employees" className="hover:text-primary transition-colors">
              Quản lý tổ chức
            </Link>
            <span>/</span>
            <Link href="/employees" className="hover:text-primary transition-colors">
              Nhân sự
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{emp.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/employees"
              className="h-8 w-8 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Hồ sơ nhân sự chi tiết</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/employees/${emp.id}/edit`)}
            className="rounded-xl text-xs gap-1.5 h-9 bg-card hover:bg-muted/80 shadow-xs"
          >
            <Edit className="h-4 w-4 text-amber-500" />
            <span>Chỉnh sửa hồ sơ</span>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 border border-border/60 shadow-xs">
              <AvatarImage src={emp.avatar} alt={emp.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                {emp.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold text-foreground">{emp.name}</h2>
                <Badge variant="outline" className="font-mono text-xs bg-muted/60">
                  {emp.code}
                </Badge>
                <Badge
                  variant={emp.status === "Active" ? "default" : "secondary"}
                  className="text-[11px]"
                >
                  {emp.status === "Active" ? "Đang làm việc" : "Đã tạm dừng"}
                </Badge>
                {emp.hasSubmittedDocuments ? (
                  <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/40 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã nộp hồ sơ
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40">
                    Chưa nộp hồ sơ
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  {emp.departmentName || "Chưa phân bổ phòng ban"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  {emp.position || emp.roleName || "Chuyên viên"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {emp.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {emp.phone || "Chưa có số ĐT"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span>1. Thông tin cá nhân & Địa chỉ liên hệ</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Họ và tên</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.name}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>Email</span>
            </div>
            <div className="font-semibold text-foreground text-sm truncate">{emp.email}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>Số điện thoại</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.phone || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Số CCCD / CMND</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.cccd || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Ngày sinh</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.birthday || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Tỉnh / Thành phố</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.provinceName || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Quận / Huyện</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.districtName || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Phường / Xã</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.wardName || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 md:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Địa chỉ cụ thể</span>
            </div>
            <div className="font-semibold text-foreground text-sm">
              {fullAddress || "Chưa cập nhật"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <span>2. Thông tin công việc & Hợp đồng</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Phòng ban</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.departmentName || "Chưa phân bổ"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              <span>Chức vụ / Vị trí</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.position || "Chuyên viên"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Phân loại nhân sự</span>
            </div>
            <div className="font-semibold text-foreground text-sm">
              {emp.userType === "nhan_vien_chinh_thuc"
                ? "Nhân viên chính thức"
                : emp.userType === "thu_viec"
                ? "Thử việc"
                : emp.userType === "thuc_tap_sinh"
                ? "Thực tập sinh"
                : "Cộng tác viên"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span>ID Máy chấm công</span>
            </div>
            <div className="font-semibold font-mono text-foreground text-sm">
              {emp.attendanceMachineId || "Chưa đăng ký"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Ngày ký hợp đồng</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.contractSignedDate || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Ngày kết thúc hợp đồng</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.contractEndDate || "Không thời hạn"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Ngày gia nhập</span>
            </div>
            <div className="font-semibold text-foreground text-sm">{emp.joinedDate || "Chưa cập nhật"}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              <span>Trạng thái tài liệu hồ sơ</span>
            </div>
            <div className="font-semibold text-foreground text-sm">
              {emp.hasSubmittedDocuments ? (
                <span className="text-emerald-600 dark:text-emerald-400">Đã nộp tài liệu</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Chưa nộp tài liệu</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span>3. Thông tin thanh toán lương & Tài khoản ngân hàng</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 lg:col-span-1">
            <div className="text-muted-foreground mb-1">Mức lương cơ bản</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {emp.salary
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(emp.salary)
                : "Thỏa thuận"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="text-muted-foreground mb-1">Ngân hàng</div>
            <div className="font-semibold text-foreground text-sm">
              {emp.bankAccount?.bankName || "Chưa cập nhật"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="text-muted-foreground mb-1">Số tài khoản</div>
            <div className="font-mono font-semibold text-foreground text-sm">
              {emp.bankAccount?.accountNumber || "Chưa cập nhật"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="text-muted-foreground mb-1">Tên chủ tài khoản</div>
            <div className="font-semibold text-foreground text-sm uppercase">
              {emp.bankAccount?.holderName || emp.name}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="text-muted-foreground mb-1">Chi nhánh</div>
            <div className="font-semibold text-foreground text-sm">
              {emp.bankAccount?.branch || "Chưa cập nhật"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>4. Cài đặt tài khoản & Quyền hạn</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="text-muted-foreground mb-1">Quyền / Vai trò</div>
            <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{emp.roleName || emp.role || "Nhân sự"}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="text-muted-foreground mb-1">Trạng thái tài khoản</div>
            <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  emp.status === "Active" ? "bg-emerald-500" : "bg-muted-foreground/50"
                }`}
              />
              <span>{emp.status === "Active" ? "Kích hoạt (Active)" : "Đã tạm dừng (Inactive)"}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="text-muted-foreground mb-1">Mã hệ thống (ID)</div>
            <div className="font-mono font-semibold text-foreground text-sm">
              #{emp.id} ({emp.code})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

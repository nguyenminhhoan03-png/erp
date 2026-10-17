import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useEmployeeStore } from "../store/employeeStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserType, EmployeeStatus } from "../types";

export function EmployeeFormDialog() {
  const { isFormOpen, editingEmployee, closeForm, addEmployee, updateEmployee } =
    useEmployeeStore();
  const departments = useUserStore((s) => s.departments);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("it");
  const [position, setPosition] = React.useState("");
  const [role, setRole] = React.useState("EMPLOYEE");
  const [userType, setUserType] = React.useState<UserType>("nhan_vien_chinh_thuc");
  const [status, setStatus] = React.useState<EmployeeStatus>("Active");
  const [salary, setSalary] = React.useState("");
  const [cccd, setCccd] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [bankName, setBankName] = React.useState("Vietcombank");
  const [bankAccount, setBankAccount] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name || "");
      setEmail(editingEmployee.email || "");
      setPhone(editingEmployee.phone || "");
      setDepartmentId(editingEmployee.departmentId || "it");
      setPosition(editingEmployee.position || "");
      setRole(editingEmployee.role || "EMPLOYEE");
      setUserType(editingEmployee.userType || "nhan_vien_chinh_thuc");
      setStatus(editingEmployee.status || "Active");
      setSalary(editingEmployee.salary ? String(editingEmployee.salary) : "");
      setCccd(editingEmployee.cccd || "");
      setAddress(editingEmployee.address || "");
      setBankName(editingEmployee.bankAccount?.bankName || "Vietcombank");
      setBankAccount(editingEmployee.bankAccount?.accountNumber || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setDepartmentId("it");
      setPosition("");
      setRole("EMPLOYEE");
      setUserType("nhan_vien_chinh_thuc");
      setStatus("Active");
      setSalary("");
      setCccd("");
      setAddress("");
      setBankName("Vietcombank");
      setBankAccount("");
    }
    setError(null);
  }, [editingEmployee, isFormOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên");
      return;
    }
    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    const deptMap: Record<string, string> = {
      it: "Công nghệ thông tin",
      hr: "Nhân sự & Tuyển dụng",
      marketing: "Marketing & Truyền thông",
      sales: "Kinh doanh",
      accounting: "Kế toán & Tài chính",
    };
    const departmentName =
      deptMap[departmentId] ||
      departments.find((d) => d.id === departmentId)?.name ||
      departmentId;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || "0900000000",
      avatar:
        editingEmployee?.avatar ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      departmentId,
      departmentName,
      position: position.trim() || "Chuyên viên",
      role,
      userType,
      status,
      salary: salary ? Number(salary) : undefined,
      cccd: cccd.trim() || undefined,
      address: address.trim() || undefined,
      bankAccount: bankAccount
        ? {
            bankName,
            accountNumber: bankAccount.trim(),
            holderName: name.trim().toUpperCase(),
          }
        : undefined,
      joinedDate:
        editingEmployee?.joinedDate || new Date().toISOString().split("T")[0],
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, payload);
    } else {
      addEmployee(payload);
    }
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-border/80">
        <DialogHeader className="p-5 border-b border-border/70 bg-muted/20">
          <DialogTitle className="text-base font-semibold">
            {editingEmployee ? "Cập nhật hồ sơ nhân viên" : "Thêm mới nhân viên"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="h-9 rounded-xl text-xs bg-background/80"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  Email công ty <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="a.nv@company.com"
                  className="h-9 rounded-xl text-xs bg-background/80"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Số điện thoại</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0987654321"
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Số CCCD / CMND</label>
                <Input
                  value={cccd}
                  onChange={(e) => setCccd(e.target.value)}
                  placeholder="001094001234"
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Phòng ban</label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background/80">
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">Công nghệ thông tin</SelectItem>
                    <SelectItem value="hr">Nhân sự & Tuyển dụng</SelectItem>
                    <SelectItem value="marketing">Marketing & Truyền thông</SelectItem>
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

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Chức vụ</label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="VD: Senior Frontend Developer"
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Loại hình nhân viên</label>
                <Select
                  value={userType}
                  onValueChange={(val: UserType) => setUserType(val)}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nhan_vien_chinh_thuc">
                      Nhân viên chính thức
                    </SelectItem>
                    <SelectItem value="thu_viec">Thử việc</SelectItem>
                    <SelectItem value="thuc_tap_sinh">Thực tập sinh</SelectItem>
                    <SelectItem value="cong_tac_vien">Cộng tác viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Vai trò hệ thống</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Nhân viên (Thành viên)</SelectItem>
                    <SelectItem value="MANAGER">Trưởng đơn vị (Quản lý)</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên (Toàn quyền)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Mức lương cơ bản (VND)</label>
                <Input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="20000000"
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Trạng thái làm việc</label>
                <Select
                  value={status}
                  onValueChange={(val: EmployeeStatus) => setStatus(val)}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Đang làm việc</SelectItem>
                    <SelectItem value="Inactive">Tạm ngưng / Nghỉ việc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Ngân hàng</label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Vietcombank, Techcombank..."
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Số tài khoản ngân hàng</label>
                <Input
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="001100456789"
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-medium text-foreground">Địa chỉ thường trú</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quận Cầu Giấy, Hà Nội"
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/70 bg-muted/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              className="h-9 px-4 rounded-xl text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow-xs"
            >
              {editingEmployee ? "Lưu thay đổi" : "Tạo nhân viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

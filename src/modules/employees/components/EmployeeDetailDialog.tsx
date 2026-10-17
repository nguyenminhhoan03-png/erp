import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
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
} from "lucide-react";
import { useEmployeeStore } from "../store/employeeStore";

export function EmployeeDetailDialog() {
  const { isDetailOpen, selectedEmployee, closeDetail, openEdit } = useEmployeeStore();

  if (!selectedEmployee) return null;

  const emp = selectedEmployee;

  return (
    <Dialog open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/80">
        <div className="relative p-6 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-background border-b border-border/70">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                <AvatarImage src={emp.avatar} alt={emp.name} />
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
                  {emp.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">{emp.name}</h3>
                  <Badge variant="outline" className="font-mono text-xs bg-muted/60">
                    {emp.code}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground/90">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {emp.departmentName || emp.departmentId}
                  </span>
                  <span>•</span>
                  <span>{emp.position}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  closeDetail();
                  openEdit(emp);
                }}
                className="h-8.5 rounded-xl text-xs gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Chỉnh sửa</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted/50 p-1 rounded-xl mb-4">
              <TabsTrigger value="general" className="text-xs rounded-lg py-1.5">
                Thông tin chung
              </TabsTrigger>
              <TabsTrigger value="work" className="text-xs rounded-lg py-1.5">
                Công việc & Chức vụ
              </TabsTrigger>
              <TabsTrigger value="finance" className="text-xs rounded-lg py-1.5">
                Lương & Ngân hàng
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email công ty</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.email}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Số điện thoại</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.phone}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Số CCCD / Hộ chiếu</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.cccd || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Ngày sinh</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.birthday || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Địa chỉ liên hệ</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.address || "Chưa cập nhật"}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="work" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Phòng ban</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.departmentName || emp.departmentId}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Chức vụ chuyên môn</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.position}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Vai trò hệ thống</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.role === "ADMIN"
                      ? "Toàn quyền (Admin)"
                      : emp.role === "MANAGER"
                      ? "Trưởng đơn vị (Manager)"
                      : "Nhân viên (Employee)"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Loại hình công việc</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm capitalize">
                    {emp.userType === "nhan_vien_chinh_thuc"
                      ? "Nhân viên chính thức"
                      : emp.userType === "thu_viec"
                      ? "Thử việc"
                      : emp.userType === "thuc_tap_sinh"
                      ? "Thực tập sinh"
                      : "Cộng tác viên"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Ngày gia nhập công ty</span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.joinedDate}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="finance" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Mức lương cơ sở</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {emp.salary
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(emp.salary)
                      : "Thỏa thuận"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="text-muted-foreground mb-1">Ngân hàng thụ hưởng</div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.bankAccount?.bankName || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="text-muted-foreground mb-1">Số tài khoản</div>
                  <div className="font-mono font-semibold text-foreground text-sm">
                    {emp.bankAccount?.accountNumber || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="text-muted-foreground mb-1">Chủ tài khoản</div>
                  <div className="font-semibold text-foreground text-sm uppercase">
                    {emp.bankAccount?.holderName || emp.name}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="text-muted-foreground mb-1">Chi nhánh</div>
                  <div className="font-semibold text-foreground text-sm">
                    {emp.bankAccount?.branch || "Hà Nội"}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Sparkles } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import { MOCK_DEPARTMENTS } from "../mock/departments";
import { DepartmentId, Role } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DEFAULT_ROLE_CONFIGS } from "@/shared/permissions/permissions";
import { RoleConfig } from "@/shared/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const userSchema = z.object({
  name: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ").endsWith("@congty.vn", "Email phải có đuôi @congty.vn hoặc domain nội bộ").or(z.string().email()),
  title: z.string().min(2, "Vui lòng nhập chức danh"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  departmentId: z.enum(["it", "marketing", "hr", "sales", "accounting"], {
    message: "Vui lòng chọn phòng ban",
  }),
  role: z.string().min(1, "Vui lòng chọn vai trò"),
});

type UserFormValues = z.infer<typeof userSchema>;

// Danh sách avatar mẫu thực tế
const RANDOM_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
];

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDepartmentId?: DepartmentId;
}

export function UserFormDialog({
  open,
  onOpenChange,
  defaultDepartmentId = "it",
}: UserFormDialogProps) {
  const { addUser, setCurrentUser } = useUserStore();

  const availableRoles = React.useMemo<RoleConfig[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("erp_custom_roles_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_ROLE_CONFIGS;
  }, [open]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      phone: "0908 ",
      departmentId: defaultDepartmentId,
      role: "EMPLOYEE",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: "",
        email: "",
        title: "",
        phone: "0908 ",
        departmentId: defaultDepartmentId,
        role: "EMPLOYEE",
      });
    }
  }, [open, defaultDepartmentId, reset]);

  const onSubmit = (values: UserFormValues) => {
    const avatar = RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)];
    const newUser = addUser({
      name: values.name,
      email: values.email,
      title: values.title,
      phone: values.phone,
      departmentId: values.departmentId,
      role: values.role,
      avatar,
    });

    toast.success(`Đã thêm nhân sự: ${newUser.name}`, {
      description: `Chức danh: ${newUser.title} • Phòng ${newUser.departmentId.toUpperCase()}`,
      action: {
        label: "Đăng nhập thử",
        onClick: () => setCurrentUser(newUser),
      },
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span>Thêm nhân sự mới vào hệ thống</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Nhân sự mới sẽ ngay lập tức có thể được giao việc, xuất hiện trên sơ đồ phòng ban và trong bộ chọn vai trò demo.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-2">
          {/* Họ và tên */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Hoàng Đình Trọng"
              {...register("name")}
              className={cn(errors.name && "border-rose-500")}
            />
            {errors.name && (
              <span className="text-[11px] text-rose-500 mt-0.5 block">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Email nội bộ <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="trong.hoang@congty.vn"
                {...register("email")}
                className={cn(errors.email && "border-rose-500")}
              />
              {errors.email && (
                <span className="text-[11px] text-rose-500 mt-0.5 block">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="0908 123 456"
                {...register("phone")}
                className={cn(errors.phone && "border-rose-500")}
              />
              {errors.phone && (
                <span className="text-[11px] text-rose-500 mt-0.5 block">
                  {errors.phone.message}
                </span>
              )}
            </div>
          </div>

          {/* Chức danh */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Chức danh / Vị trí <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Backend Developer / Chuyên viên Tuyển dụng"
              {...register("title")}
              className={cn(errors.title && "border-rose-500")}
            />
            {errors.title && (
              <span className="text-[11px] text-rose-500 mt-0.5 block">
                {errors.title.message}
              </span>
            )}
          </div>

          {/* Phòng ban & Vai trò */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Phòng ban <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_DEPARTMENTS.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Vai trò phân quyền <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/80 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Thêm nhân sự"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

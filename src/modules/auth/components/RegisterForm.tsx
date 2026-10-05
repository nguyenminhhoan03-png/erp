"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { registerSchema, RegisterFormValues } from "../schemas";
import { authService } from "../services/authService";
import { AuthShell } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

export function RegisterForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const message = await authService.register({
        ...values,
        phone_number: values.phone_number || undefined,
      });
      setSuccessMessage(message);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setServerError("Đã có lỗi xảy ra");
        return;
      }
      const fieldNames = Object.keys(error.fieldErrors) as (keyof RegisterFormValues)[];
      fieldNames.forEach((name) =>
        setError(name, { message: error.fieldErrors[name]?.[0] })
      );
      if (fieldNames.length === 0) setServerError(error.message);
    }
  };

  if (successMessage) {
    return (
      <AuthShell
        title="Đăng ký thành công"
        subtitle="Một bước nữa để bắt đầu sử dụng hệ thống"
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Quay lại đăng nhập
          </Link>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{successMessage}</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Tài khoản mới sẽ được quản trị viên duyệt trước khi sử dụng"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="full_name" className="text-sm font-medium">
            Họ và tên
          </label>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            className="h-11"
            aria-invalid={!!errors.full_name}
            {...register("full_name")}
          />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ten@congty.vn"
            className="h-11"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone_number" className="text-sm font-medium">
            Số điện thoại <span className="text-muted-foreground font-normal">(tuỳ chọn)</span>
          </label>
          <Input
            id="phone_number"
            type="tel"
            autoComplete="tel"
            className="h-11"
            aria-invalid={!!errors.phone_number}
            {...register("phone_number")}
          />
          {errors.phone_number && (
            <p className="text-xs text-destructive">{errors.phone_number.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Mật khẩu
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password_confirmation" className="text-sm font-medium">
            Nhập lại mật khẩu
          </label>
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            aria-invalid={!!errors.password_confirmation}
            {...register("password_confirmation")}
          />
          {errors.password_confirmation && (
            <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full h-11" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Đăng ký
        </Button>
      </form>
    </AuthShell>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useUserStore } from "@/shared/store/useUserStore";
import { ApiError } from "@/lib/api-client";
import { loginSchema, LoginFormValues } from "../schemas";
import { authService, toStoreUser } from "../services/authService";
import { AuthShell } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const router = useRouter();
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await authService.login(values);
      setCurrentUser(toStoreUser(user));
      toast.success(`Xin chào, ${user.name}`);
      router.replace("/dashboard");
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Đã có lỗi xảy ra");
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Sử dụng tài khoản nội bộ để truy cập hệ thống ERP"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

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
          <label htmlFor="password" className="text-sm font-medium">
            Mật khẩu
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full h-11" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Đăng nhập
        </Button>
      </form>
    </AuthShell>
  );
}

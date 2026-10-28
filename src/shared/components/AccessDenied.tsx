"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  moduleName?: string;
  backHref?: string;
}

export function AccessDenied({
  title = "Bạn không có quyền truy cập",
  description,
  moduleName,
  backHref = "/dashboard",
}: AccessDeniedProps) {
  const defaultDescription = moduleName
    ? `Tài khoản của bạn chưa được cấp quyền truy cập danh mục ${moduleName}. Vui lòng liên hệ Quản trị viên để được phân quyền.`
    : "Tài khoản của bạn chưa được cấp quyền thực hiện thao tác hoặc xem nội dung này. Vui lòng liên hệ Quản trị viên.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in-50 duration-300">
      <div className="h-16 w-16 rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 flex items-center justify-center mb-4 ring-8 ring-rose-50/50 dark:ring-rose-950/20 shadow-sm">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description || defaultDescription}
      </p>
      <Link href={backHref}>
        <Button variant="outline" className="gap-2 rounded-xl text-xs font-medium h-9">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay về trang chủ</span>
        </Button>
      </Link>
    </div>
  );
}

"use client";

import * as React from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PermissionMatrixTable } from "@/shared/permissions/PermissionMatrixTable";
import { Button } from "@/shared/components/ui/button";

export default function PermissionsPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employees">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Nhân sự & Thành viên</span>
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>Ma trận Phân quyền (RBAC & ABAC)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Thiết lập danh mục quyền hạn theo từng vai trò (Role-Based) và gắn quyền trực tiếp cho từng nhân sự trong doanh nghiệp.
          </p>
        </div>
      </div>

      {/* Main Permission Matrix */}
      <PermissionMatrixTable />
    </div>
  );
}

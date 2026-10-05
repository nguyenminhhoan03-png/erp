"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/shared/store/useUserStore";
import { authService } from "@/modules/auth/services/authService";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Trưởng phòng",
  EMPLOYEE: "Nhân viên",
};

export function UserMenu() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);

  const handleLogout = async () => {
    await authService.logout().catch(() => undefined);
    toast.success("Đã đăng xuất");
    router.replace("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <UserAvatar user={currentUser} size="sm" />
      <div className="hidden sm:flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs max-w-[140px] truncate">{currentUser.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
            {ROLE_LABEL[currentUser.role] ?? currentUser.role}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
          {currentUser.title}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={handleLogout} title="Đăng xuất" aria-label="Đăng xuất">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

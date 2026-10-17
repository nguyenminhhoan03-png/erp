"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  ChevronDown,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/shared/store/useUserStore";
import { authService } from "@/modules/auth/services/authService";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Trưởng phòng",
  EMPLOYEE: "Nhân viên",
};

export function UserMenu() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);
  const departments = useUserStore((s) => s.departments);
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout().catch(() => undefined);
      toast.success("Đã đăng xuất thành công");
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="hidden sm:flex flex-col gap-1">
          <div className="w-20 h-3 bg-muted rounded" />
          <div className="w-14 h-2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const currentDept = departments.find(
    (d) => String(d.id) === String(currentUser.departmentId)
  );

  const roleText =
    currentUser.roleName ||
    ROLE_LABEL[currentUser.role] ||
    currentUser.role ||
    "Thành viên";

  const departmentText =
    currentDept?.name ||
    currentUser.departmentName ||
    (currentUser.role === "ADMIN" ? "Ban Điều Hành" : "Khối Doanh Nghiệp");

  const subtitleText = currentUser.title || departmentText;

  const getRoleBadgeVariant = () => {
    if (currentUser.isSuperAdmin || currentUser.role === "ADMIN") {
      return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
    }
    if (currentUser.role === "MANAGER") {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Tài khoản cá nhân"
          className={cn(
            "flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-border/60 hover:bg-muted/70 hover:border-border transition-all cursor-pointer group text-left focus:outline-none focus:ring-2 focus:ring-primary/20",
            open && "bg-muted border-border"
          )}
        >
          <div className="relative shrink-0">
            <UserAvatar user={currentUser} size="sm" />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          <div className="hidden sm:flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-foreground truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <span
                className={cn(
                  "text-[9px] font-semibold px-1.5 py-0.2 rounded-full border",
                  getRoleBadgeVariant()
                )}
              >
                {roleText}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[170px] mt-0.5">
              {subtitleText}
            </span>
          </div>

          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-hover:text-foreground hidden sm:block",
              open && "rotate-180"
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 sm:w-80 p-0 shadow-2xl rounded-2xl border-border/80 bg-background overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Profile Card Header */}
        <div className="p-4 bg-muted/25 space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <UserAvatar user={currentUser} size="md" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-sm text-foreground truncate">
                  {currentUser.name}
                </p>
                {currentUser.isSuperAdmin && (
                  <span title="Super Admin" className="inline-flex items-center">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {currentUser.email || "Chưa cập nhật email"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <Badge
              variant="outline"
              className={cn("text-[10px] font-medium h-5 px-2", getRoleBadgeVariant())}
            >
              {roleText}
            </Badge>

            {departmentText && (
              <Badge
                variant="secondary"
                className="text-[10px] font-medium h-5 px-2 gap-1 bg-muted text-muted-foreground"
              >
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[140px]">{departmentText}</span>
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="my-0 border-border/50" />

        {/* Logout Item */}
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2.5 py-2 px-3 text-xs rounded-lg cursor-pointer text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600 font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Đăng xuất tài khoản</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

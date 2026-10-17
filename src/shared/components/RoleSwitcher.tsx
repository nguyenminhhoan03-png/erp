"use client";

import * as React from "react";
import { Check, ChevronsUpDown, ShieldAlert, UserCheck, Users } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import { User, Role } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RoleSwitcher() {
  const { currentUser, setCurrentUser, users, departments } = useUserStore();

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    toast.success(`Đã chuyển sang: ${user.name}`, {
      description: `Vai trò: ${getRoleLabel(user.role)} • Phòng ${getDeptName(user.departmentId)}`,
    });
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên (Admin)";
      case "MANAGER":
        return "Trưởng phòng";
      case "EMPLOYEE":
        return "Nhân viên";
    }
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MANAGER":
        return "default";
      case "EMPLOYEE":
        return "secondary";
    }
  };

  const getDeptName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.code : deptId.toUpperCase();
  };

  const admins = users.filter((u) => u.role === "ADMIN");
  const managers = users.filter((u) => u.role === "MANAGER");
  const employees = users.filter((u) => u.role === "EMPLOYEE");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-3 flex items-center gap-2 border-border/80 bg-background/80 hover:bg-accent/80 transition-all rounded-xl shadow-2xs"
        >
          <UserAvatar user={currentUser} size="sm" />
          <div className="flex flex-col text-left leading-tight hidden sm:flex">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-foreground max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <Badge
                variant={getRoleBadgeVariant(currentUser.role)}
                className="text-[10px] px-1.5 py-0 h-4 font-normal"
              >
                {currentUser.role === "ADMIN" ? "Admin" : currentUser.role === "MANAGER" ? "Trưởng phòng" : "Nhân viên"}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
              {currentUser.title}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 max-h-[460px] overflow-y-auto p-1.5" align="end">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold px-2 py-1.5">
          <span>Giả lập đăng nhập (Demo Role)</span>
          <span className="text-[10px] text-muted-foreground font-normal">Click để đổi người</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Ban Giám Đốc (Admin)</span>
        </div>
        <DropdownMenuGroup>
          {admins.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className={cn(
                "flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer",
                currentUser.id === user.id && "bg-primary/10 text-primary font-medium"
              )}
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar user={user} size="sm" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">{user.name}</span>
                  <span className="text-[11px] text-muted-foreground">{user.title}</span>
                </div>
              </div>
              {currentUser.id === user.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
          <UserCheck className="h-3.5 w-3.5" />
          <span>Trưởng phòng (Department Leads)</span>
        </div>
        <DropdownMenuGroup>
          {managers.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className={cn(
                "flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer",
                currentUser.id === user.id && "bg-primary/10 text-primary font-medium"
              )}
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar user={user} size="sm" />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">{user.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-blue-300">
                      {getDeptName(user.departmentId)}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{user.title}</span>
                </div>
              </div>
              {currentUser.id === user.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Users className="h-3.5 w-3.5" />
          <span>Nhân viên (Staff Members)</span>
        </div>
        <DropdownMenuGroup>
          {employees.slice(0, 8).map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className={cn(
                "flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer",
                currentUser.id === user.id && "bg-primary/10 text-primary font-medium"
              )}
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar user={user} size="sm" />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground">({getDeptName(user.departmentId)})</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{user.title}</span>
                </div>
              </div>
              {currentUser.id === user.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

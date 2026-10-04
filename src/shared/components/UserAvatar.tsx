import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User } from "../types";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: User | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

export function UserAvatar({
  user,
  className,
  size = "md",
  showName = false,
}: UserAvatarProps) {
  if (!user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div
          className={cn(
            "rounded-full bg-muted border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground",
            size === "sm" && "h-6 w-6 text-[10px]",
            size === "md" && "h-8 w-8 text-xs",
            size === "lg" && "h-10 w-10 text-sm"
          )}
          title="Chưa gán người"
        >
          ?
        </div>
        {showName && <span className="text-xs text-muted-foreground italic">Chưa giao</span>}
      </div>
    );
  }

  // Lấy 2 ký tự đầu viết tắt tên tiếng Việt
  const initials = user.name
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)} title={`${user.name} (${user.title})`}>
      <Avatar className={cn(sizeClasses[size], "border border-background shadow-xs")}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-medium leading-none text-foreground">{user.name}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5">{user.title}</span>
        </div>
      )}
    </div>
  );
}

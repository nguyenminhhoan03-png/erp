"use client";

import * as React from "react";
import { Search, X, Check, ChevronDown, UserX } from "lucide-react";
import { User } from "@/shared/types";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Input } from "@/shared/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export interface UserSingleSelectProps {
  value?: string | number | null;
  onChange: (userId: string) => void;
  users?: User[];
  currentUser?: User;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
}

export function UserSingleSelect({
  value,
  onChange,
  users: propUsers,
  currentUser: propCurrentUser,
  placeholder = "Chọn người làm...",
  searchPlaceholder = "Tìm theo tên, chức vụ...",
  className,
  triggerClassName,
  popoverClassName,
  align = "start",
  disabled = false,
  allowClear = false,
  clearLabel = "Chưa phân công (Bỏ chọn)",
}: UserSingleSelectProps) {
  const store = useUserStore();
  const users = propUsers || store.users;
  const currentUser = propCurrentUser || store.currentUser;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  };

  const selectedUser = React.useMemo(() => {
    if (!value) return null;
    return users.find((u) => String(u.id) === String(value)) || null;
  }, [users, value]);

  const isSelf = selectedUser && currentUser && String(selectedUser.id) === String(currentUser.id);

  const normalizedSearch = search.trim().toLowerCase();
  const searchNoAccent = removeVietnameseTones(normalizedSearch);

  const filteredUsers = React.useMemo(() => {
    if (!normalizedSearch) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const title = (u.title || "").toLowerCase();
      const email = (u.email || "").toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        removeVietnameseTones(name).includes(searchNoAccent) ||
        title.includes(normalizedSearch) ||
        removeVietnameseTones(title).includes(searchNoAccent) ||
        email.includes(normalizedSearch)
      );
    });
  }, [users, normalizedSearch, searchNoAccent]);

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs transition-colors",
              "hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none",
              triggerClassName
            )}
          >
            {selectedUser ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <UserAvatar user={selectedUser} size="sm" className="h-4.5 w-4.5 text-[9px] shrink-0" />
                <span className="truncate font-medium">{selectedUser.name}</span>
                {isSelf && (
                  <span className="text-[9px] text-primary font-mono shrink-0">(Tôi)</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60 shrink-0 ml-1.5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          className={cn(
            "w-64 sm:w-72 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover z-50",
            popoverClassName
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
            setTimeout(() => {
              searchInputRef.current?.focus();
            }, 10);
          }}
        >
          <div className="p-1 border-b border-border/50 mb-1">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="h-8 pl-8 pr-7 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border-border/60 rounded-lg shadow-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-0.5">
            {allowClear && (
              <DropdownMenuItem
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs text-muted-foreground hover:text-foreground"
              >
                <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center shrink-0">
                  <UserX className="h-3 w-3" />
                </div>
                <span className="italic">{clearLabel}</span>
              </DropdownMenuItem>
            )}

            {filteredUsers.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Không tìm thấy nhân sự phù hợp
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = String(u.id) === String(value);
                const isCurrentUser = currentUser && String(u.id) === String(currentUser.id);

                return (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => {
                      onChange(String(u.id));
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 p-1.5 rounded-lg cursor-pointer text-xs transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <UserAvatar user={u} size="sm" className="h-5 w-5 text-[9px] shrink-0" />
                      <div className="min-w-0 flex-1 truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate font-medium">{u.name}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] px-1 py-0.2 rounded-full bg-primary/15 text-primary font-semibold shrink-0">
                              Tôi
                            </span>
                          )}
                        </div>
                        {u.title && (
                          <p className="text-[10px] text-muted-foreground truncate leading-tight">
                            {u.title}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

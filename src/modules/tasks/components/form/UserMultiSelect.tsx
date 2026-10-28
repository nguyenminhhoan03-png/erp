"use client";

import * as React from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { User } from "@/shared/types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface UserMultiSelectProps {
  label: string;
  icon?: React.ReactNode;
  isRequired?: boolean;
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentUser: User;
  selfActionLabel?: string;
  showSelfAction?: boolean;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  error?: string;
}

export function UserMultiSelect({
  label,
  icon,
  isRequired,
  users,
  selectedIds = [],
  onChange,
  currentUser,
  selfActionLabel = "Gán cho tôi",
  showSelfAction = true,
  placeholder = "Chọn người...",
  helpText,
  disabled,
  error,
}: UserMultiSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedUsers = React.useMemo(() => {
    return users.filter((u) => selectedIds.includes(String(u.id)));
  }, [users, selectedIds]);

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        (u.title && u.title.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const isSelfSelected = selectedIds.includes(String(currentUser.id));

  const handleToggleSelf = () => {
    if (disabled) return;
    const currentId = String(currentUser.id);
    if (isSelfSelected) {
      onChange(selectedIds.filter((id) => id !== currentId));
    } else {
      onChange([...selectedIds, currentId]);
    }
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const handleToggleUser = (userId: string) => {
    if (disabled) return;
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {icon}
            <span>
              {label} {isRequired && <span className="text-rose-500">*</span>}
            </span>
          </label>
          {selectedIds.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 font-normal px-1.5 bg-primary/10 text-primary border-primary/20"
            >
              Đã chọn {selectedIds.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!disabled && showSelfAction && (
            <button
              type="button"
              onClick={handleToggleSelf}
              className={cn(
                "text-xs font-medium cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-md border transition-all",
                isSelfSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-foreground border-border/80 hover:bg-muted/60 hover:text-primary"
              )}
              title={`${selfActionLabel} (ID: ${currentUser.id})`}
            >
              {isSelfSelected ? <Check className="h-3.5 w-3.5" /> : null}
              <span>{isSelfSelected ? `✓ Đã gồm tôi` : `+ ${selfActionLabel}`}</span>
            </button>
          )}

          {selectedIds.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-rose-500 hover:underline cursor-pointer"
            >
              Bỏ chọn
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 min-h-[34px]">
        {selectedUsers.map((u) => (
          <span
            key={u.id}
            className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full bg-background border border-border shadow-xs text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            <UserAvatar user={u} size="sm" className="h-5 w-5" />
            <span>{u.name}</span>
            {String(u.id) === String(currentUser.id) && (
              <span className="text-[10px] text-primary font-normal font-mono">(Tôi)</span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleToggleUser(String(u.id))}
                className="ml-0.5 text-muted-foreground hover:text-rose-500 rounded-full p-0.5 hover:bg-rose-50 transition-colors cursor-pointer"
                title={`Bỏ ${u.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {!disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer",
                  selectedUsers.length === 0
                    ? "w-full justify-between border-dashed border-input bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground py-1.5"
                    : "border-dashed border-primary/40 text-primary hover:bg-primary/10 bg-background"
                )}
              >
                <span>{selectedUsers.length === 0 ? placeholder : "+ Thêm người"}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-72 sm:w-84 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover z-50"
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Tìm theo tên hoặc vị trí..."
                    className="h-8 pl-8 pr-7 text-xs bg-muted/40 focus:bg-background border-border/60 rounded-lg shadow-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm("");
                      }}
                      className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-0.5 max-h-56 overflow-y-auto pr-0.5">
                {filteredUsers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy nhân viên phù hợp
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedIds.includes(String(u.id));
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleUser(String(u.id))}
                        className={cn(
                          "flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-xs select-none transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar user={u} size="sm" />
                          <div className="truncate">
                            <p className="truncate font-medium flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {String(u.id) === String(currentUser.id) && (
                                <span className="text-[10px] text-primary font-normal font-mono">
                                  (Tôi)
                                </span>
                              )}
                            </p>
                            {u.title && (
                              <p className="text-[10px] text-muted-foreground truncate">{u.title}</p>
                            )}
                          </div>
                        </div>
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                      </div>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {helpText && <p className="text-[11px] text-muted-foreground">{helpText}</p>}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

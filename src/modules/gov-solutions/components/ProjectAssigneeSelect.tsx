"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import {
  Search,
  UserCheck,
  UserPlus,
  UserX,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGovStore } from "../store/govStore";
import { IGB_TEAM_MEMBERS } from "../constants";

export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export const getInitials = (name: string): string => {
  if (!name || name === "Chưa phân công") return "--";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export interface ProjectAssigneeSelectProps {
  project: {
    id: string;
    provinceName?: string;
    igbAssignee: {
      id?: number | string | null;
      name: string;
      avatar?: string;
      role?: string;
    };
  };
  customTrigger?: React.ReactNode;
  onUpdateAssignee?: (
    projectId: string,
    userId: number | string | null,
    name?: string,
    avatar?: string,
    role?: string
  ) => Promise<boolean | void> | void;
}

export function ProjectAssigneeSelect({
  project,
  customTrigger,
  onUpdateAssignee,
}: ProjectAssigneeSelectProps) {
  const { teamMembers, updateProjectAssignee } = useGovStore();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const isUnassigned =
    !project.igbAssignee.name || project.igbAssignee.name === "Chưa phân công";

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  };

  const rawList =
    teamMembers && teamMembers.length > 0 ? teamMembers : IGB_TEAM_MEMBERS;

  const normalizedSearch = search.trim().toLowerCase();
  const searchNoAccent = removeVietnameseTones(normalizedSearch);

  const filteredMembers = React.useMemo(() => {
    if (!normalizedSearch) return rawList;

    return rawList.filter((m) => {
      const isUnassignOption =
        m.name === "Chưa phân công" || m.id === "unassigned";

      if (isUnassignOption) {
        return (
          "chua phan cong".includes(searchNoAccent) ||
          "bo gan".includes(searchNoAccent) ||
          "huy".includes(searchNoAccent)
        );
      }

      const name = (m.name || "").toLowerCase();
      const role = (m.role || "").toLowerCase();
      const nameNoAccent = removeVietnameseTones(name);
      const roleNoAccent = removeVietnameseTones(role);

      return (
        name.includes(normalizedSearch) ||
        nameNoAccent.includes(searchNoAccent) ||
        role.includes(normalizedSearch) ||
        roleNoAccent.includes(searchNoAccent)
      );
    });
  }, [rawList, normalizedSearch, searchNoAccent]);

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "group/assignee inline-flex items-center gap-2 px-2 py-1 -ml-1.5 rounded-lg text-left transition-all outline-none",
        "hover:bg-muted/80 focus-visible:ring-1 focus-visible:ring-ring border border-transparent hover:border-border/60 cursor-pointer select-none",
        isUnassigned && "hover:border-primary/20 hover:bg-primary/5"
      )}
      title={
        isUnassigned
          ? "Bấm vào icon hoặc tên để phân công đầu mối IGB"
          : `Đang phụ trách: ${project.igbAssignee.name} (Bấm để đổi)`
      }
    >
      <div className="relative shrink-0">
        {isUnassigned ? (
          <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/50 bg-muted/30 flex items-center justify-center text-muted-foreground group-hover/assignee:border-primary group-hover/assignee:bg-primary/10 group-hover/assignee:text-primary transition-all">
            <UserPlus className="h-3 w-3 transition-transform group-hover/assignee:scale-110" />
          </div>
        ) : project.igbAssignee.avatar ? (
          <img
            src={project.igbAssignee.avatar}
            alt={project.igbAssignee.name}
            className="h-6 w-6 rounded-full object-cover ring-1 ring-border group-hover/assignee:ring-2 group-hover/assignee:ring-primary/40 transition-all shadow-2xs"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center ring-1 ring-primary/20 group-hover/assignee:ring-2 group-hover/assignee:ring-primary/50 transition-all">
            {getInitials(project.igbAssignee.name)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 min-w-0">
        <span
          className={cn(
            "text-xs truncate max-w-[110px] transition-colors",
            isUnassigned
              ? "text-muted-foreground group-hover/assignee:text-primary font-normal"
              : "text-foreground group-hover/assignee:text-primary font-medium"
          )}
        >
          {project.igbAssignee.name}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground/40 group-hover/assignee:text-foreground transition-all shrink-0 -ml-0.5" />
      </div>
    </button>
  );

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {customTrigger || defaultTrigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-72 p-1.5 shadow-xl rounded-xl border border-border/80 backdrop-blur-md bg-popover/98 z-50"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchInputRef.current?.focus();
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 10);
        }}
      >
        <div className="px-2.5 py-2 border-b border-border/50 mb-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            Phân công đầu mối IGB
          </p>
          {project.provinceName && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Tỉnh/Thành:{" "}
              <span className="font-medium text-foreground">
                {project.provinceName}
              </span>
            </p>
          )}
        </div>

        <div className="px-1 pb-1.5 border-b border-border/40 mb-1">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Tìm nhân viên, chức vụ..."
              className="h-8 pl-8 pr-7 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border-border/60 rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-primary/40 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-0.5 max-h-60 overflow-y-auto pr-0.5">
          {filteredMembers.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-muted-foreground">
              <Search className="h-4 w-4 mx-auto mb-1.5 opacity-40 text-muted-foreground" />
              <p className="font-medium">Không tìm thấy nhân viên</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Thử tìm với từ khóa khác
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isCurrent =
                project.igbAssignee.name === member.name ||
                (member.id !== "unassigned" &&
                  String(project.igbAssignee.id) === String(member.id));
              const isUnassignOption =
                member.name === "Chưa phân công" || member.id === "unassigned";

              return (
                <DropdownMenuItem
                  key={member.id}
                  onClick={async () => {
                    const updateFn = onUpdateAssignee || updateProjectAssignee;
                    const ok = await updateFn(
                      project.id,
                      isUnassignOption ? null : member.id,
                      member.name,
                      member.avatar,
                      member.role
                    );
                    if (isUnassignOption) {
                      toast.info(
                        `Đã hủy phân công dự án ${project.provinceName || ""}`
                      );
                    } else if (ok !== false) {
                      toast.success(
                        `Đã phân công ${member.name} phụ trách dự án ${project.provinceName || ""}`
                      );
                    } else {
                      toast.error(`Không thể lưu phân công lên máy chủ`);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors",
                    isCurrent && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  {isUnassignOption ? (
                    <div className="h-7 w-7 rounded-full border border-dashed border-muted-foreground/40 bg-muted/40 flex items-center justify-center shrink-0">
                      <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ) : member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-border"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                      {member.initials || getInitials(member.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate font-medium text-foreground">
                      {member.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {member.role}
                    </div>
                  </div>

                  {isCurrent && (
                    <Check className="h-4 w-4 text-primary shrink-0 ml-1" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

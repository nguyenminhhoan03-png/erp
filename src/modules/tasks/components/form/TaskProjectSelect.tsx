"use client";

import * as React from "react";
import { Briefcase } from "lucide-react";
import { TaskProject } from "../../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface TaskProjectSelectProps {
  projects: TaskProject[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TaskProjectSelect({
  projects,
  value,
  onChange,
  disabled,
}: TaskProjectSelectProps) {
  const internalProjects = React.useMemo(
    () => projects.filter((p) => p.category === "INTERNAL"),
    [projects]
  );

  const govProjectsByGroup = React.useMemo(() => {
    const govList = projects.filter((p) => p.category === "GOV_SOLUTION");
    return govList.reduce((acc, proj) => {
      const group = proj.groupName || "Chưa phân nhóm";
      if (!acc[group]) acc[group] = [];
      acc[group].push(proj);
      return acc;
    }, {} as Record<string, TaskProject[]>);
  }, [projects]);

  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
        <Briefcase className="h-3.5 w-3.5 text-primary" />
        <span>
          Thuộc Dự án <span className="text-rose-500">*</span>
        </span>
      </label>
      <Select value={value || projects[0]?.id || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Chọn dự án" />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
            Dự án Nội bộ
          </div>
          {internalProjects.map((proj) => (
            <SelectItem key={proj.id} value={proj.id}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 w-14 shrink-0 text-left">
                  {proj.code ? `[${proj.code}]` : ""}
                </span>
                <span className="truncate">{proj.name}</span>
              </div>
            </SelectItem>
          ))}

          {Object.keys(govProjectsByGroup).length > 0 && (
            <div className="px-2 py-1 mt-1.5 mb-0.5 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-sm">
              Dự án Giải pháp CĐS Tỉnh (GOV)
            </div>
          )}

          {Object.entries(govProjectsByGroup).map(([groupName, groupProjects]) => (
            <React.Fragment key={groupName}>
              <div className="px-3 py-1 ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-l-2 border-primary/30">
                ↳ {groupName}
              </div>
              {groupProjects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id} className="pl-7">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 w-14 shrink-0 text-left">
                      {proj.code ? `[${proj.code}]` : ""}
                    </span>
                    <span className="truncate">{proj.name}</span>
                  </div>
                </SelectItem>
              ))}
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

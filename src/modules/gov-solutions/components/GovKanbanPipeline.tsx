"use client";

import * as React from "react";
import {
  Calendar,
  FileText,
  CheckSquare,
  ArrowRight,
  MoreVertical,
  ChevronRight,
  MapPin,
  User,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { GovProject, GovStage } from "../types";
import { GOV_STAGES, DLTM_STAGES } from "../constants";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

const PIPELINE_COLUMNS: GovStage[] = [
  "DISPATCHED",
  "FEEDBACK",
  "MOU_SIGNED",
  "SPONSOR_AGREED",
  "DATA_COLLECT",
  "DEPLOYING",
  "COMPLETED",
];

export function GovKanbanPipeline() {
  const { projects, filters, setSelectedProject, updateProjectStage, activeSolutionId } = useGovStore();

  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      if (activeSolutionId && p.solutionId !== activeSolutionId) return false;

      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchName = p.provinceName.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (filters.region && filters.region !== "ALL") {
        if (p.region !== filters.region) return false;
      }
      return true;
    });
  }, [projects, filters, activeSolutionId]);

  return (
    <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 items-start min-h-[calc(100vh-320px)] select-none">
      {PIPELINE_COLUMNS.map((stageKey) => {
        const config = DLTM_STAGES[stageKey];
        const stageProjects = filteredProjects.filter((p) => p.stage === stageKey);

        return (
          <div
            key={stageKey}
            className="flex flex-col flex-1 min-w-[270px] max-w-[320px] rounded-2xl bg-card/70 border border-border/80 p-3 space-y-3 backdrop-blur-md shadow-2xs shrink-0"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: config.colorHex }}
                />
                <span className="font-bold text-xs text-foreground tracking-tight">
                  {config.shortLabel}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0.2">
                {stageProjects.length}
              </Badge>
            </div>

            <div className="flex flex-col space-y-2.5 min-h-[150px] overflow-y-auto max-h-[calc(100vh-400px)] pr-1">
              {stageProjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground/60 text-xs border border-dashed border-border/60 rounded-xl">
                  Chưa có tỉnh nào
                </div>
              ) : (
                stageProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="p-3 rounded-xl bg-background/90 border border-border/70 hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer group space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                          {project.provinceName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] font-mono py-0 px-1">
                            {project.code}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {project.region}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-primary">
                        {project.progressPercent}%
                      </span>
                    </div>

                    {project.nextMeetingDate && (
                      <div className="p-1.5 rounded-lg bg-primary/5 border border-primary/20 text-[10px] text-primary flex items-start gap-1">
                        <Calendar className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{project.nextMeetingDate}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span title="Tài liệu" className="flex items-center gap-0.5">
                          <FileText className="h-3 w-3 text-blue-500" />
                          <span>{project.documentsCount || 0}</span>
                        </span>
                        <span title="Tasks nội bộ" className="flex items-center gap-0.5">
                          <CheckSquare className="h-3 w-3 text-emerald-500" />
                          <span>{project.tasksCount || 0}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {project.igbAssignee.avatar ? (
                          <img
                            src={project.igbAssignee.avatar}
                            alt={project.igbAssignee.name}
                            className="h-5 w-5 rounded-full object-cover"
                            title={`Phụ trách: ${project.igbAssignee.name}`}
                          />
                        ) : (
                          <div 
                            className="h-5 w-5 rounded-full bg-muted flex items-center justify-center border"
                            title="Chưa phân công"
                          >
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const DltmKanbanPipeline = GovKanbanPipeline;

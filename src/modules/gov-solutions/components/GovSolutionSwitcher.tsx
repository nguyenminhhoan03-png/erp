"use client";

import React, { useState } from "react";
import {
  Compass,
  Map,
  HeartPulse,
  GraduationCap,
  Car,
  Building2,
  Layers,
  Plus,
  Sparkles,
  Database,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { GovCreateSolutionModal } from "./GovCreateSolutionModal";
import { Button } from "@/shared/components/ui/button";

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Map,
  HeartPulse,
  GraduationCap,
  Car,
  Building2,
  Layers,
};

export function GovSolutionSwitcher() {
  const {
    solutions,
    activeSolutionId,
    setActiveSolutionId,
    getActiveSolution,
    deleteDigitalSolution,
    projects,
  } = useGovStore();

  const [createSolutionOpen, setCreateSolutionOpen] = useState(false);
  const activeSolution = getActiveSolution();

  // Calculate live statistics for active solution
  const solutionProjects = projects.filter((p) => (p.solutionId || "dltm") === activeSolutionId);
  const completedCount = solutionProjects.filter((p) => p.stage === "COMPLETED").length;
  const deployingCount = solutionProjects.filter((p) => p.stage === "DEPLOYING").length;
  const mouCount = solutionProjects.filter((p) => p.stage === "MOU_SIGNED" || p.stage === "SPONSOR_AGREED").length;

  return (
    <div className="space-y-3">
      {/* Top Bar: Solution Pill Selector */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md shadow-xs">
        {/* Solution Pills (Scrollable horizontally) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 pr-2 border-r border-border/60 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Dự án CĐS:
            </span>
          </div>

          {solutions.map((sol) => {
            const isSelected = sol.id === activeSolutionId;
            const Icon = ICON_MAP[sol.iconName] || Layers;

            return (
              <div
                key={sol.id}
                onClick={() => setActiveSolutionId(sol.id)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                    : "bg-muted/40 hover:bg-muted text-foreground border border-border/60 hover:border-primary/40"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isSelected ? "text-primary-foreground" : ""
                  }`}
                  style={{
                    color: isSelected ? undefined : sol.colorHex,
                  }}
                />
                <span>{sol.name}</span>

                {/* Nút xóa dành cho các giải pháp do sếp tự thêm */}
                {sol.id !== "dltm" && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Bạn có chắc muốn xóa dự án "${sol.name}"?`)) {
                        deleteDigitalSolution(sol.id);
                      }
                    }}
                    className="p-0.5 rounded-full hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors ml-0.5"
                    title="Xóa dự án này"
                  >
                    <Plus className="w-3.5 h-3.5 rotate-45" />
                  </span>
                )}
              </div>
            );
          })}

          {/* Add New Solution Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateSolutionOpen(true)}
            className="h-9 px-3 rounded-xl border-dashed border-primary/50 text-primary hover:bg-primary/5 shrink-0 text-xs gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm dự án</span>
          </Button>
        </div>
      </div>

      {/* Active Solution Contextual Banner */}
      <div
        className="relative overflow-hidden rounded-2xl border p-4 shadow-xs transition-all"
        style={{
          borderColor: `${activeSolution.colorHex}40`,
          background: `linear-gradient(135deg, ${activeSolution.colorHex}08 0%, var(--card) 100%)`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Solution metadata */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wider"
                style={{
                  borderColor: `${activeSolution.colorHex}40`,
                  color: activeSolution.colorHex,
                  backgroundColor: `${activeSolution.colorHex}15`,
                }}
              >
                {activeSolution.code}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>Đối tác chính quyền:</span>
                <span className="font-semibold text-foreground">
                  {activeSolution.targetGovDepartment} (34 Tỉnh/Thành)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="font-medium text-foreground/90">Dữ liệu trọng tâm:</span>
              <span className="truncate">{activeSolution.dataAssetDescription}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Solution Creation Modal */}
      <GovCreateSolutionModal
        open={createSolutionOpen}
        onOpenChange={setCreateSolutionOpen}
      />
    </div>
  );
}

export const DltmSolutionSwitcher = GovSolutionSwitcher;


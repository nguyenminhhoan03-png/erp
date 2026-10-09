"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { DLTM_STAGES, REGIONS } from "../constants";
import { Region, DltmProject, DltmStage } from "../types";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";

export function GovCrossSolutionMatrix() {
  const { solutions, projects, setSelectedProject, setActiveSolutionId, setActiveMainTab } =
    useGovStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL");

  const baseProvinces = useMemo(() => {
    const seen = new Set<string>();
    const list: {
      code: string;
      provinceName: string;
      region: Region;
      isMergedProvince?: boolean;
      mergedNotes?: string;
    }[] = [];
    projects.forEach((p) => {
      if (!seen.has(p.code)) {
        seen.add(p.code);
        list.push({
          code: p.code,
          provinceName: p.provinceName,
          region: p.region,
          isMergedProvince: p.isMergedProvince,
          mergedNotes: p.mergedNotes,
        });
      }
    });
    return list;
  }, [projects]);

  const filteredProvinces = useMemo(() => {
    return baseProvinces.filter((prov) => {
      const matchSearch =
        !searchTerm.trim() ||
        prov.provinceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prov.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRegion = selectedRegion === "ALL" || prov.region === selectedRegion;
      return matchSearch && matchRegion;
    });
  }, [baseProvinces, searchTerm, selectedRegion]);

  const projectMap = useMemo(() => {
    const map = new Map<string, DltmProject>();
    projects.forEach((p) => {
      const key = `${p.code}_${p.solutionId}`;
      map.set(key, p);
    });
    return map;
  }, [projects]);

  const solutionStats = useMemo(() => {
    return solutions.map((sol) => {
      const solProjects = projects.filter((p) => p.solutionId === sol.id);
      const activeCount = solProjects.filter(
        (p) => p.stage !== "PAUSED" && p.stage !== "DISPATCHED"
      ).length;
      const completedCount = solProjects.filter((p) => p.stage === "COMPLETED").length;
      const percent = Math.round((activeCount / 34) * 100);
      return {
        ...sol,
        activeCount,
        completedCount,
        percent,
      };
    });
  }, [solutions, projects]);

  const handleCellClick = (provCode: string, solutionId: string) => {
    const key = `${provCode}_${solutionId}`;
    const targetProject = projectMap.get(key);
    if (targetProject) {
      setSelectedProject(targetProject);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {solutionStats.map((sol) => (
          <div
            key={sol.id}
            onClick={() => {
              setActiveSolutionId(sol.id);
              setActiveMainTab("solution_workspace");
            }}
            className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: sol.colorHex }}
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                {sol.code}
              </span>
            </div>

            <div>
              <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{sol.name}</span>
                <span className="text-[11px] font-mono text-primary font-bold">
                  {sol.activeCount}/34
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {sol.targetGovDepartment}
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Tiến độ hợp tác</span>
                <span className="font-semibold text-foreground">{sol.percent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${sol.percent}%`, backgroundColor: sol.colorHex }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tỉnh thành hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Vùng miền:
          </span>
          <button
            onClick={() => setSelectedRegion("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              selectedRegion === "ALL"
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            }`}
          >
            Tất cả (34)
          </button>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedRegion === r
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[200px]">Tỉnh / Thành phố (34 Đơn vị)</th>
                <th className="py-3 px-3 w-28">Vùng miền</th>
                {solutions.map((sol) => (
                  <th key={sol.id} className="py-3 px-3 min-w-[140px] text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sol.colorHex }}
                      />
                      <span className="font-bold text-foreground">{sol.shortName}</span>
                    </div>
                    <div className="text-[10px] font-normal text-muted-foreground truncate max-w-[130px]">
                      {sol.targetGovDepartment.split("/")[0]}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 w-32 text-center">Độ phủ CĐS</th>
                <th className="py-3 px-3 w-16 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProvinces.map((prov, index) => {
                let activeSolCount = 0;
                let completedSolCount = 0;

                solutions.forEach((sol) => {
                  const proj = projectMap.get(`${prov.code}_${sol.id}`);
                  if (proj) {
                    if (proj.stage === "COMPLETED") completedSolCount++;
                    if (proj.stage !== "PAUSED" && proj.stage !== "DISPATCHED") activeSolCount++;
                  }
                });

                const totalSols = solutions.length;
                const coveragePercent = Math.round((activeSolCount / totalSols) * 100);

                return (
                  <tr
                    key={prov.code}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center text-muted-foreground font-mono">
                      {index + 1}
                    </td>

                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{prov.provinceName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                          {prov.code}
                        </span>
                        {prov.isMergedProvince && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Sáp nhập
                          </span>
                        )}
                      </div>
                      {prov.mergedNotes && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-xs mt-0.5">
                          {prov.mergedNotes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-muted-foreground font-medium">
                      {prov.region}
                    </td>

                    {solutions.map((sol) => {
                      const proj = projectMap.get(`${prov.code}_${sol.id}`);
                      const stageKey = (proj?.stage || "DISPATCHED") as DltmStage;
                      const stageConfig = DLTM_STAGES[stageKey] || DLTM_STAGES.DISPATCHED;

                      return (
                        <td
                          key={sol.id}
                          className="py-2.5 px-3 text-center"
                        >
                          {proj ? (
                            <button
                              onClick={() => handleCellClick(prov.code, sol.id)}
                              className={`w-full py-1 px-2 rounded-lg text-[11px] font-semibold border transition-all text-center hover:scale-105 hover:shadow-xs ${stageConfig.badgeClass}`}
                              title={`${prov.provinceName} - ${sol.name}: ${stageConfig.label}`}
                            >
                              <div className="truncate">{stageConfig.shortLabel}</div>
                              <div className="text-[9px] font-mono opacity-80">
                                {proj.progressPercent}%
                              </div>
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">
                              Chưa tạo
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              coveragePercent >= 70
                                ? "bg-emerald-500"
                                : coveragePercent >= 40
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${coveragePercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] font-mono">
                          {activeSolCount}/{totalSols}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleCellClick(prov.code, solutions[0]?.id || "")}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Xem chi tiết tỉnh"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const DltmCrossSolutionMatrix = GovCrossSolutionMatrix;

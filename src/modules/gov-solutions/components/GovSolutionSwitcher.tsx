"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Map,
  HeartPulse,
  GraduationCap,
  Car,
  Building2,
  Layers,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Pencil,
  Landmark,
  Handshake,
  Cpu,
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { GovCreateSolutionModal } from "./GovCreateSolutionModal";
import { GovEditSolutionModal } from "./GovEditSolutionModal";
import { DigitalSolution } from "../types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Map,
  HeartPulse,
  GraduationCap,
  Car,
  Building2,
  Layers,
  Landmark,
  Handshake,
  Cpu,
};

export function GovSolutionSwitcher() {
  const router = useRouter();
  const {
    solutions,
    activeSolutionId,
    setActiveSolutionId,
    deleteDigitalSolution,
  } = useGovStore();

  const [selectedCategoryTab, setSelectedCategoryTab] = useState<"ALL" | "GOV" | "INTERNAL" | "OUTSOURCE">("ALL");
  const [createSolutionOpen, setCreateSolutionOpen] = useState(false);
  const [editSolutionOpen, setEditSolutionOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<DigitalSolution | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const govCount = useMemo(() => solutions.filter((s) => (s.category || "GOV") === "GOV").length, [solutions]);
  const internalCount = useMemo(() => solutions.filter((s) => s.category === "INTERNAL").length, [solutions]);
  const outsourceCount = useMemo(() => solutions.filter((s) => s.category === "OUTSOURCE").length, [solutions]);

  const filteredSolutions = useMemo(() => {
    let result = solutions;
    if (selectedCategoryTab !== "ALL") {
      result = result.filter((s) => (s.category || "GOV") === selectedCategoryTab);
    }
    if (!searchTerm.trim()) return result;
    const q = searchTerm.toLowerCase().trim();
    return result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q))
    );
  }, [solutions, selectedCategoryTab, searchTerm]);

  const activeSolution = useMemo(() => {
    return solutions.find((s) => s.id === activeSolutionId) || solutions[0];
  }, [solutions, activeSolutionId]);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, filteredSolutions]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -350 : 350;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleSelectSolution = (solId: string) => {
    setActiveSolutionId(solId);
    setTimeout(() => {
      const el = tabRefs.current[solId];
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }, 60);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden transition-all">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-2 bg-muted/40 border-b border-border/70 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategoryTab("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
            selectedCategoryTab === "ALL"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          <span>Tất cả dự án</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 font-mono transition-colors",
              selectedCategoryTab === "ALL" && "bg-primary-foreground/20 text-primary-foreground border-transparent"
            )}
          >
            {solutions.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryTab("GOV");
            const firstGov = solutions.find((s) => (s.category || "GOV") === "GOV");
            if (firstGov) setActiveSolutionId(firstGov.id);
          }}
          className={cn(
            "px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
            selectedCategoryTab === "GOV"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          <Landmark className="h-3.5 w-3.5" />
          <span>Dự án CĐS</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 font-mono transition-colors",
              selectedCategoryTab === "GOV" && "bg-primary-foreground/20 text-primary-foreground border-transparent"
            )}
          >
            {govCount}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryTab("INTERNAL");
            const firstInternal = solutions.find((s) => s.category === "INTERNAL");
            if (firstInternal) setActiveSolutionId(firstInternal.id);
          }}
          className={cn(
            "px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
            selectedCategoryTab === "INTERNAL"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Dự án Nội bộ</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 font-mono transition-colors",
              selectedCategoryTab === "INTERNAL" && "bg-primary-foreground/20 text-primary-foreground border-transparent"
            )}
          >
            {internalCount}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCategoryTab("OUTSOURCE");
            const firstOutsource = solutions.find((s) => s.category === "OUTSOURCE");
            if (firstOutsource) setActiveSolutionId(firstOutsource.id);
          }}
          className={cn(
            "px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
            selectedCategoryTab === "OUTSOURCE"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          <Handshake className="h-3.5 w-3.5" />
          <span>Dự án Outsource</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 font-mono transition-colors",
              selectedCategoryTab === "OUTSOURCE" && "bg-primary-foreground/20 text-primary-foreground border-transparent"
            )}
          >
            {outsourceCount}
          </Badge>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-muted/25 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-foreground uppercase">
                {selectedCategoryTab === "INTERNAL"
                  ? "Dự án Nội bộ:"
                  : selectedCategoryTab === "OUTSOURCE"
                  ? "Dự án Outsource:"
                  : selectedCategoryTab === "GOV"
                  ? "Dự án CĐS:"
                  : "Tất cả dự án:"}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {filteredSolutions.length} dự án
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
              <span>Đang mở:</span>
              <strong className="text-foreground font-semibold truncate max-w-[280px] sm:max-w-[360px]">
                {activeSolution?.name}
              </strong>
              {activeSolution?.code && (
                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded border border-border/60 text-muted-foreground shrink-0 font-bold">
                  {activeSolution.code}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm dự án (tên, mã)..."
              className="pl-8.5 pr-8 h-9 text-xs bg-background rounded-xl border-border/80 focus-visible:ring-primary/30 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => router.push("/projects/create")}
            className="h-9 px-3.5 rounded-xl text-xs gap-1.5 font-semibold shrink-0 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dự án</span>
          </Button>
        </div>
      </div>

      <div className="relative p-3 sm:p-3.5 flex items-center bg-card">
        {canScrollLeft && (
          <div className="absolute left-2 top-0 bottom-0 z-10 flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md bg-background/95 border-border/80 hover:bg-muted cursor-pointer"
              onClick={() => scroll("left")}
              title="Cuộn sang trái"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1 flex-1 scroll-smooth px-1"
        >
          {filteredSolutions.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-2 px-3 flex items-center gap-2">
              <span>Không tìm thấy dự án nào khớp với &quot;{searchTerm}&quot;</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="h-6.5 px-2 text-[11px] text-primary hover:bg-primary/10 cursor-pointer"
              >
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            filteredSolutions.map((sol) => {
              const isSelected = sol.id === activeSolutionId;
              const Icon = ICON_MAP[sol.iconName] || Layers;

              return (
                <div
                  key={sol.id}
                  ref={(el) => {
                    tabRefs.current[sol.id] = el;
                  }}
                  onClick={() => handleSelectSolution(sol.id)}
                  className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer select-none ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                      : "bg-muted/40 hover:bg-muted text-foreground border border-border/70 hover:border-primary/40 shadow-2xs"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${
                      isSelected ? "text-primary-foreground" : ""
                    }`}
                    style={{
                      color: isSelected ? undefined : sol.colorHex,
                    }}
                  />
                  <span className="max-w-[280px] truncate">{sol.name}</span>

                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold uppercase shrink-0",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : sol.category === "INTERNAL"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : sol.category === "OUTSOURCE"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                    )}
                  >
                    {sol.category === "INTERNAL" ? "Nội bộ" : sol.category === "OUTSOURCE" ? "Outsource" : "CĐS"}
                  </span>

                  <div className="flex items-center gap-0.5 ml-1 shrink-0">
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSolution(sol);
                        setEditSolutionOpen(true);
                      }}
                      className={`p-1 rounded-full transition-colors cursor-pointer ${
                        isSelected
                          ? "hover:bg-primary-foreground/20 text-primary-foreground/80 hover:text-primary-foreground"
                          : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                      }`}
                      title={`Chỉnh sửa dự án "${sol.name}"`}
                    >
                      <Pencil className="w-3 h-3" />
                    </span>

                    {solutions.length > 1 && sol.id !== "dltm" && (
                      <span
                        role="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (
                            confirm(`Bạn có chắc muốn xóa dự án "${sol.name}"?`)
                          ) {
                            const success = await deleteDigitalSolution(sol.id);
                            if (success) {
                              toast.success(
                                `Đã xóa dự án "${sol.name}" thành công!`
                              );
                            } else {
                              toast.error(
                                `Không thể xóa dự án "${sol.name}"!`
                              );
                            }
                          }
                        }}
                        className={`p-1 rounded-full transition-colors cursor-pointer ${
                          isSelected
                            ? "hover:bg-rose-500/30 text-primary-foreground/80 hover:text-rose-200"
                            : "hover:bg-rose-500/15 text-muted-foreground hover:text-rose-500"
                        }`}
                        title="Xóa dự án này"
                      >
                        <Plus className="w-3.5 h-3.5 rotate-45" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canScrollRight && (
          <div className="absolute right-2 top-0 bottom-0 z-10 flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md bg-background/95 border-border/80 hover:bg-muted cursor-pointer"
              onClick={() => scroll("right")}
              title="Cuộn sang phải"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <GovCreateSolutionModal
        open={createSolutionOpen}
        onOpenChange={setCreateSolutionOpen}
        defaultCategory={selectedCategoryTab === "ALL" ? "GOV" : selectedCategoryTab}
      />
      <GovEditSolutionModal
        open={editSolutionOpen}
        onOpenChange={setEditSolutionOpen}
        solution={editingSolution}
      />
    </div>
  );
}

export const DltmSolutionSwitcher = GovSolutionSwitcher;

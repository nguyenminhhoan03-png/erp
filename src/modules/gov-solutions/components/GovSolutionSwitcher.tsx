"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { useGovStore } from "../store/govStore";
import { GovCreateSolutionModal } from "./GovCreateSolutionModal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";

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
    deleteDigitalSolution,
  } = useGovStore();

  const [createSolutionOpen, setCreateSolutionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Lọc danh sách giải pháp trực tiếp theo ô tìm kiếm
  const filteredSolutions = useMemo(() => {
    if (!searchTerm.trim()) return solutions;
    const q = searchTerm.toLowerCase().trim();
    return solutions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q))
    );
  }, [solutions, searchTerm]);

  // Dự án đang chọn hiện tại
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
      {/* TẦNG 1: Thanh công cụ phía trên (Tiêu đề, Đang chọn dự án nào, Ô tìm kiếm & Nút thêm dự án) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-muted/25 border-b border-border/60">
        {/* Bên trái: Tiêu đề danh mục & Thông tin dự án đang mở */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-foreground uppercase">
                Dự Án CĐS:
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {solutions.length} dự án
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

        {/* Bên phải: Ô tìm kiếm dự án & Nút Khởi tạo dự án */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Ô tìm kiếm dự án trực tiếp */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm dự án CĐS (tên, mã)..."
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

          {/* Nút Thêm dự án mới */}
          <Button
            size="sm"
            onClick={() => setCreateSolutionOpen(true)}
            className="h-9 px-3.5 rounded-xl text-xs gap-1.5 font-semibold shrink-0 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dự án</span>
          </Button>
        </div>
      </div>

      {/* TẦNG 2: Dãy thẻ dự án trượt ngang (Pills Carousel) hiển thị cao ráo, thoáng đãng */}
      <div className="relative p-3 sm:p-3.5 flex items-center bg-card">
        {/* Nút cuộn sang trái */}
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

        {/* Dãy thẻ các dự án */}
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
                      className="p-0.5 rounded-full hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors ml-0.5 cursor-pointer shrink-0"
                      title="Xóa dự án này"
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45" />
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Nút cuộn sang phải */}
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

      {/* Modal Khởi tạo dự án */}
      <GovCreateSolutionModal
        open={createSolutionOpen}
        onOpenChange={setCreateSolutionOpen}
      />
    </div>
  );
}

export const DltmSolutionSwitcher = GovSolutionSwitcher;

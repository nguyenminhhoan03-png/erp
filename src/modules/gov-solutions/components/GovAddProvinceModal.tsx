"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { useGovStore } from "../store/govStore";
import { DLTM_STAGES } from "../constants";
import { MapPin, Search, Plus, Sparkles, Building2, Check } from "lucide-react";
import { toast } from "sonner";

interface GovAddProvinceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenInitAll?: () => void;
  solutionId?: string;
  onProvinceAdded?: (provinceId: string) => void;
}

const REGION_BADGES: Record<string, string> = {
  "Bắc Bộ": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Trung Bộ": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Nam Bộ": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Tây Nguyên": "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export function GovAddProvinceModal({
  open,
  onOpenChange,
  onOpenInitAll,
  solutionId: propSolutionId,
  onProvinceAdded,
}: GovAddProvinceModalProps) {
  const { fetchAvailableProvinces, addProvinceToProject, activeSolutionId, solutions, getActiveSolution } =
    useGovStore();

  const currentSolutionId = propSolutionId || activeSolutionId;
  const currentSolution = solutions.find((s) => s.id === currentSolutionId) || getActiveSolution();

  const [availableList, setAvailableList] = useState<{ id: number; name: string; region: string }[]>(
    []
  );
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("1");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setSelectedProvinceId("");
      setSearch("");
      fetchAvailableProvinces(currentSolutionId)
        .then((list) => {
          setAvailableList(list);
          if (list.length > 0) {
            setSelectedProvinceId(String(list[0].id));
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, currentSolutionId, fetchAvailableProvinces]);

  const filteredProvinces = availableList.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.region.toLowerCase().includes(q);
  });

  const selectedProvince = availableList.find((p) => String(p.id) === selectedProvinceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvinceId) {
      toast.error("Vui lòng chọn một tỉnh thành!");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addProvinceToProject(
        Number(selectedProvinceId),
        Number(selectedStageId) || 1,
        currentSolutionId
      );

      if (success) {
        toast.success(
          `Đã thêm tỉnh "${selectedProvince?.name || "mới"}" vào dự án thành công!`
        );
        onOpenChange(false);
        onProvinceAdded?.(selectedProvinceId);
      } else {
        toast.error("Không thể thêm tỉnh vào dự án. Vui lòng thử lại!");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi thêm tỉnh!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden border-border/70 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="relative p-6 pb-4 bg-muted/30 border-b border-border/60">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground">
                  Thêm Tỉnh Làm Việc Mới
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Đưa địa phương vào quy trình tiếp cận, đề nghị tài trợ của{" "}
                  <strong className="text-foreground">{currentSolution?.name || "dự án"}</strong>
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Đang tải danh sách tỉnh thành khả dụng...
              </div>
            ) : availableList.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2 rounded-xl bg-muted/40 border border-border/60">
                <Building2 className="w-8 h-8 mx-auto text-muted-foreground/60" />
                <div className="text-xs font-semibold text-foreground">
                  Đã thêm đủ tất cả các tỉnh thành mục tiêu!
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Toàn bộ 34 tỉnh trong kế hoạch đã được đưa vào dự án này.
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      Chọn Tỉnh / Thành phố:
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Còn <strong>{availableList.length}</strong> tỉnh chưa liên kết
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Tìm nhanh tỉnh thành..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background/60 mb-2"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-border/60 rounded-xl p-1.5 bg-background/50">
                    {filteredProvinces.length === 0 ? (
                      <div className="py-4 text-center text-[11px] text-muted-foreground">
                        Không tìm thấy tỉnh nào phù hợp với từ khóa
                      </div>
                    ) : (
                      filteredProvinces.map((prov) => {
                        const isSelected = String(prov.id) === selectedProvinceId;
                        return (
                          <div
                            key={prov.id}
                            role="button"
                            onClick={() => setSelectedProvinceId(String(prov.id))}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{prov.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                  isSelected
                                    ? "bg-primary-foreground/20 text-primary-foreground border-transparent"
                                    : REGION_BADGES[prov.region] || "bg-muted text-muted-foreground"
                                }`}
                              >
                                {prov.region}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-foreground">
                    Giai đoạn khởi điểm:
                  </label>
                  <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                    <SelectTrigger className="h-9 text-xs bg-background/60">
                      <SelectValue placeholder="Chọn giai đoạn khởi điểm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1. Đã gửi công văn</SelectItem>
                      <SelectItem value="2">2. Tỉnh phản hồi</SelectItem>
                      <SelectItem value="3">3. Đã ký MOU</SelectItem>
                      <SelectItem value="4">4. Đồng ý tài trợ</SelectItem>
                      <SelectItem value="5">5. Thu thập dữ liệu</SelectItem>
                      <SelectItem value="6">6. Đang triển khai</SelectItem>
                      <SelectItem value="7">7. Đã tài trợ (Xong)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Mặc định sẽ bắt đầu từ <em>1. Đã gửi công văn</em> để quản lý tiến trình tiếp cận.
                  </p>
                </div>
              </>
            )}

            {onOpenInitAll && availableList.length > 0 && (
              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">
                  Muốn bắt đầu cả nước cùng lúc?
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenInitAll();
                  }}
                  className="h-auto p-0 text-primary text-[11px] font-semibold gap-1 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Khởi tạo cả 34 tỉnh mục tiêu
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || availableList.length === 0 || !selectedProvinceId}
              className="text-xs h-8 gap-1.5"
            >
              {isSubmitting ? (
                "Đang thêm..."
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Thêm tỉnh vào dự án
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

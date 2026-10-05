"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useGovStore } from "../store/govStore";
import { Plus, Sparkles, Building2 } from "lucide-react";

export interface GovCreateSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export type DltmCreateSolutionModalProps = GovCreateSolutionModalProps;

const COLOR_PRESETS = [
  { name: "Blue Ocean", hex: "#3b82f6", class: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { name: "Emerald Green", hex: "#10b981", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  { name: "Rose Ruby", hex: "#ef4444", class: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  { name: "Purple Royal", hex: "#8b5cf6", class: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { name: "Amber Sun", hex: "#f59e0b", class: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { name: "Cyan Tech", hex: "#06b6d4", class: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
  { name: "Indigo Night", hex: "#6366f1", class: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" },
  { name: "Teal Modern", hex: "#14b8a6", class: "bg-teal-500/10 text-teal-600 border-teal-500/30" },
];

export function GovCreateSolutionModal({ open, onOpenChange }: GovCreateSolutionModalProps) {
  const { addDigitalSolution } = useGovStore();

  const [name, setName] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [dataAssetDescription, setDataAssetDescription] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate code from name
  const generateCode = (str: string) => {
    const words = str.trim().split(/\s+/);
    const initials = words.map((w) => w[0]).join("").toUpperCase();
    return `SOL-${initials.slice(0, 5) || Date.now().toString().slice(-4)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetDepartment.trim()) return;

    setIsSubmitting(true);

    const code = generateCode(name);
    // Tự động chọn ngẫu nhiên màu nhận diện đẹp từ danh sách preset
    const randomColor = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];

    addDigitalSolution({
      name: name.trim(),
      shortName: name.trim(),
      code,
      iconName: "Layers",
      colorHex: randomColor.hex,
      badgeClass: randomColor.class,
      targetGovDepartment: targetDepartment.trim(),
      dataAssetDescription: dataAssetDescription.trim() || "Cơ sở dữ liệu chuyên ngành cấp tỉnh",
      description: description.trim() || `Dự án số hóa dành cho ${targetDepartment.trim()}`,
      totalTargetProvinces: 34,
    });

    setIsSubmitting(false);
    onOpenChange(false);

    // Reset form
    setName("");
    setTargetDepartment("");
    setDataAssetDescription("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Tạo Dự Án Chuyển Đổi Số Mới
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Khởi tạo dự án CĐS & tự động đồng bộ theo dõi trên 34 tỉnh/thành cả nước.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tên dự án CĐS <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Đất đai Thông minh & GIS, Y tế số, Nông nghiệp thông minh..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          {/* Target Gov Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Sở / Cơ quan chủ quản mục tiêu tại 34 tỉnh <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Sở Tài nguyên & Môi trường, Sở Nông nghiệp & PTNT..."
              value={targetDepartment}
              onChange={(e) => setTargetDepartment(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          {/* Data asset description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tài nguyên & Dữ liệu chuyên ngành cần số hóa (tùy chọn)
            </label>
            <Input
              placeholder="VD: Bản đồ địa chính, dữ liệu quy hoạch đất, hồ sơ bệnh án..."
              value={dataAssetDescription}
              onChange={(e) => setDataAssetDescription(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mô tả mục tiêu dự án (tùy chọn)
            </label>
            <Textarea
              placeholder="Mô tả tóm tắt dự án chuyển đổi số và giá trị đem lại cho địa phương..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Thông tin xác nhận */}
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold text-foreground">
                {name || "Tên dự án CĐS mới"}
              </span>
            </div>
            <span className="text-[11px] font-medium text-primary">
              Tự động khởi tạo theo dõi 34 Tỉnh/Thành
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name || !targetDepartment}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Khởi tạo & Kích hoạt 34 Tỉnh</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DltmCreateSolutionModal = GovCreateSolutionModal;


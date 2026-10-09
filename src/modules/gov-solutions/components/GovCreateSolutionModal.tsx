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
import { Sparkles, Building2, Layers } from "lucide-react";

interface GovCreateSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLOR_PRESETS = [
  { hex: "#8b5cf6", class: "bg-purple-100 text-purple-700" },
  { hex: "#06b6d4", class: "bg-cyan-100 text-cyan-700" },
  { hex: "#10b981", class: "bg-emerald-100 text-emerald-700" },
  { hex: "#f59e0b", class: "bg-amber-100 text-amber-700" },
  { hex: "#ec4899", class: "bg-pink-100 text-pink-700" },
  { hex: "#6366f1", class: "bg-indigo-100 text-indigo-700" },
];

export function GovCreateSolutionModal({ open, onOpenChange }: GovCreateSolutionModalProps) {
  const { addDigitalSolution } = useGovStore();

  const [name, setName] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [dataAssetDescription, setDataAssetDescription] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              disabled={isSubmitting || !name.trim() || !targetDepartment.trim()}
              className="font-semibold text-xs"
            >
              {isSubmitting ? "Đang tạo..." : "Khởi tạo dự án CĐS"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DltmCreateSolutionModal = GovCreateSolutionModal;

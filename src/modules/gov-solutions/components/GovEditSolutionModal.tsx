"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useGovStore } from "../store/govStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Pencil, Search, Check, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DigitalSolution } from "../types";

interface GovEditSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solution: DigitalSolution | null;
}

function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function GovEditSolutionModal({
  open,
  onOpenChange,
  solution,
}: GovEditSolutionModalProps) {
  const { solutions, updateDigitalSolution } = useGovStore();
  const { users } = useUserStore();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [managerId, setManagerId] = useState<string>("");
  const [managerSearch, setManagerSearch] = useState("");
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const managerSearchInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<string>("pending");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [dataAssetDescription, setDataAssetDescription] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (solution) {
      setName(solution.name || "");
      setCode(solution.code || "");
      const rawDept = solution.targetGovDepartment || "";
      setTargetDepartment(rawDept === "Cơ quan chuyên môn địa phương" ? "" : rawDept);
      setManagerId(solution.managerId ? String(solution.managerId) : "");
      setStatus(solution.status || "pending");
      setPriority((solution.priority as any) || "medium");
      setStartDate(solution.startDate ? solution.startDate.split("T")[0] : "");
      setEndDate(solution.endDate ? solution.endDate.split("T")[0] : "");
      if (solution.budget) {
        setBudget(Number(solution.budget).toLocaleString("vi-VN"));
      } else {
        setBudget("");
      }
      const rawAsset = solution.dataAssetDescription || "";
      setDataAssetDescription(rawAsset === "Dữ liệu..." ? "" : rawAsset);
      setDescription(solution.description || "");
    }
  }, [solution, open]);

  useEffect(() => {
    if (isManagerDropdownOpen) {
      const timer = setTimeout(() => {
        managerSearchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setManagerSearch("");
    }
  }, [isManagerDropdownOpen]);

  const selectedManager = useMemo(() => {
    if (!managerId) return null;
    return users.find((u) => String(u.id) === String(managerId)) || null;
  }, [users, managerId]);

  const filteredUsers = useMemo(() => {
    if (!managerSearch.trim()) return users;
    const q = removeVietnameseTones(managerSearch.trim());
    return users.filter((u) => {
      const nameMatch = removeVietnameseTones(u.name || "").includes(q);
      const roleMatch = removeVietnameseTones(u.role || "").includes(q);
      const emailMatch = (u.email || "").toLowerCase().includes(managerSearch.toLowerCase().trim());
      return nameMatch || roleMatch || emailMatch;
    });
  }, [users, managerSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solution) return;

    const trimmedName = name.trim();
    const finalCode = code.trim().toUpperCase();

    if (!trimmedName) {
      toast.error("Vui lòng nhập tên dự án CĐS");
      return;
    }
    if (!finalCode) {
      toast.error("Vui lòng nhập mã dự án (Code)");
      return;
    }
    if (!targetDepartment.trim()) {
      toast.error("Vui lòng nhập sở / cơ quan chủ quản mục tiêu tại 34 tỉnh");
      return;
    }

    const isDuplicateName = solutions.some(
      (s) => s.id !== solution.id && s.name.trim().normalize("NFC").toLowerCase() === trimmedName.normalize("NFC").toLowerCase()
    );
    if (isDuplicateName) {
      toast.error(`Tên dự án "${trimmedName}" đã bị trùng với một dự án khác!`);
      return;
    }

    const isDuplicateCode = solutions.some(
      (s) => s.id !== solution.id && s.code && s.code.trim().toUpperCase() === finalCode
    );
    if (isDuplicateCode) {
      toast.error(`Mã dự án [${finalCode}] đã bị trùng với một dự án khác!`);
      return;
    }

    setIsSubmitting(true);

    try {
      const numBudget = budget ? Number(budget.replace(/\D/g, "")) : undefined;

      await updateDigitalSolution(solution.id, {
        name: trimmedName,
        code: finalCode,
        targetGovDepartment: targetDepartment.trim() || undefined,
        managerId: managerId ? Number(managerId) : undefined,
        status,
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: numBudget,
        dataAssetDescription: dataAssetDescription.trim() || undefined,
        description: description.trim() || undefined,
      });

      toast.success(`Đã cập nhật dự án CĐS [${finalCode}] thành công!`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật dự án, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Chỉnh Sửa Dự Án Chuyển Đổi Số
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cập nhật thông tin chi tiết của dự án [{solution?.code || solution?.id}].
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tên dự án CĐS <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="VD: Đất đai Thông minh & GIS, Y tế số, Thương mại điện tử..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mã dự án (Code) <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="VD: TMDT, DDTM, GIS"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="h-9 text-xs font-mono uppercase font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Sở / Cơ quan chủ quản mục tiêu tại 34 tỉnh <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="VD: Sở Tài nguyên & Môi trường, Sở Công Thương..."
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Trưởng ban / Quản lý dự án (Manager)
              </label>

              <DropdownMenu open={isManagerDropdownOpen} onOpenChange={setIsManagerDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    {selectedManager ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={selectedManager} size="sm" />
                        <span className="truncate font-medium text-foreground">{selectedManager.name}</span>
                        {selectedManager.role && (
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            ({selectedManager.role})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">(Chưa chỉ định quản lý)</span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 ml-1.5" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-72 sm:w-80 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover z-50"
                  onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    managerSearchInputRef.current?.focus();
                    setTimeout(() => {
                      managerSearchInputRef.current?.focus();
                    }, 10);
                  }}
                >
                  <div className="p-1 border-b border-border/50 mb-1">
                    <div className="relative flex items-center">
                      <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        ref={managerSearchInputRef}
                        type="text"
                        value={managerSearch}
                        onChange={(e) => setManagerSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Tìm theo tên hoặc chức vụ..."
                        className="h-8 pl-8 pr-7 text-xs bg-muted/40 focus:bg-background border-border/60 rounded-lg shadow-none"
                      />
                      {managerSearch && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManagerSearch("");
                            managerSearchInputRef.current?.focus();
                          }}
                          className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5 max-h-56 overflow-y-auto pr-0.5">
                    <DropdownMenuItem
                      onClick={() => {
                        setManagerId("");
                        setIsManagerDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-xs",
                        !managerId && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <span className="text-muted-foreground">(Chưa chỉ định quản lý)</span>
                      {!managerId && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>

                    {filteredUsers.length === 0 ? (
                      <div className="py-5 text-center text-xs text-muted-foreground">
                        Không tìm thấy nhân viên phù hợp
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = String(managerId) === String(u.id);
                        return (
                          <DropdownMenuItem
                            key={u.id}
                            onClick={() => {
                              setManagerId(String(u.id));
                              setIsManagerDropdownOpen(false);
                            }}
                            className={cn(
                              "flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-xs",
                              isSelected && "bg-primary/10 text-primary font-medium"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <UserAvatar user={u} size="sm" />
                              <div className="truncate">
                                <p className="truncate font-medium">{u.name}</p>
                                {u.role && (
                                  <p className="text-[10px] text-muted-foreground truncate">{u.role}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Trạng thái dự án
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-xs">
                    Chờ duyệt (Pending)
                  </SelectItem>
                  <SelectItem value="in_progress" className="text-xs">
                    Đang triển khai (In Progress)
                  </SelectItem>
                  <SelectItem value="on_hold" className="text-xs">
                    Tạm hoãn (On Hold)
                  </SelectItem>
                  <SelectItem value="completed" className="text-xs">
                    Hoàn thành (Completed)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mức độ ưu tiên
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">
                    Thấp (Low)
                  </SelectItem>
                  <SelectItem value="medium" className="text-xs">
                    Trung bình (Medium)
                  </SelectItem>
                  <SelectItem value="high" className="text-xs">
                    Cao (High)
                  </SelectItem>
                  <SelectItem value="urgent" className="text-xs font-semibold text-rose-600">
                    Khẩn cấp (Urgent)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ngân sách dự kiến (VNĐ)
              </label>
              <Input
                placeholder="VD: 500,000,000"
                value={budget}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setBudget(raw ? Number(raw).toLocaleString("vi-VN") : "");
                }}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ngày bắt đầu dự kiến
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ngày kết thúc / Bàn giao
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
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
                {name || "Tên dự án CĐS"}
              </span>
              {code && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-background border font-mono font-bold text-primary">
                  {code}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-primary">
              Tự động đồng bộ theo dõi 34 Tỉnh/Thành
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
              disabled={isSubmitting || !name.trim() || !code.trim() || !targetDepartment.trim()}
              className="font-semibold text-xs"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

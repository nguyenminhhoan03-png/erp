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
import { Badge } from "@/shared/components/ui/badge";
import { UserAvatar } from "@/shared/components/UserAvatar";
import {
  Sparkles,
  Search,
  Check,
  ChevronDown,
  X,
  Building2,
  FolderGit2,
  Landmark,
  Layers,
  ArrowRight,
  Handshake,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GovCreateSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: "GOV" | "OUTSOURCE" | "INTERNAL";
}

const COLOR_PRESETS = [
  { hex: "#8b5cf6", class: "bg-purple-100 text-purple-700" },
  { hex: "#06b6d4", class: "bg-cyan-100 text-cyan-700" },
  { hex: "#10b981", class: "bg-emerald-100 text-emerald-700" },
  { hex: "#f59e0b", class: "bg-amber-100 text-amber-700" },
  { hex: "#ec4899", class: "bg-pink-100 text-pink-700" },
  { hex: "#6366f1", class: "bg-indigo-100 text-indigo-700" },
];

function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function GovCreateSolutionModal({
  open,
  onOpenChange,
  defaultCategory = "GOV",
}: GovCreateSolutionModalProps) {
  const { solutions, addDigitalSolution } = useGovStore();
  const { users, departments, fetchDepartments } = useUserStore();

  const [projectCategory, setProjectCategory] = useState<"GOV" | "OUTSOURCE" | "INTERNAL">(defaultCategory);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const deptSearchInputRef = useRef<HTMLInputElement>(null);

  const [scopeOfWork, setScopeOfWork] = useState("");
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
    if (!departments.length) {
      fetchDepartments();
    }
  }, [departments.length, fetchDepartments]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        deptDropdownRef.current &&
        !deptDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDeptDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setProjectCategory(defaultCategory);
      setSelectedDepartmentIds([]);
      setDepartmentId("");
    }
  }, [open, defaultCategory]);

  useEffect(() => {
    if (isDeptDropdownOpen && deptSearchInputRef.current) {
      setTimeout(() => {
        deptSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isDeptDropdownOpen]);

  const selectedDepartments = useMemo(() => {
    return departments.filter((d) => selectedDepartmentIds.includes(String(d.id)));
  }, [departments, selectedDepartmentIds]);

  const filteredDepartments = useMemo(() => {
    let list = departments;
    if (deptSearch.trim()) {
      const q = removeVietnameseTones(deptSearch.trim());
      list = list.filter((d) => {
        const dName = removeVietnameseTones(d.name || "");
        const dCode = removeVietnameseTones(d.code || "");
        return dName.includes(q) || dCode.includes(q);
      });
    }
    return list;
  }, [departments, deptSearch]);

  const toggleDepartment = (id: string | number) => {
    const sId = String(id);
    setSelectedDepartmentIds((prev) =>
      prev.includes(sId) ? prev.filter((item) => item !== sId) : [...prev, sId]
    );
  };

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
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên dự án");
      return;
    }
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã dự án (Code)");
      return;
    }
    if (projectCategory === "GOV" && !targetDepartment.trim()) {
      toast.error("Vui lòng nhập sở / cơ quan chủ quản mục tiêu tại 34 tỉnh");
      return;
    }
    if (projectCategory === "OUTSOURCE" && !partnerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng / đối tác doanh nghiệp");
      return;
    }

    const trimmedName = name.trim();
    const finalCode = code.trim().toUpperCase();

    const isDuplicateName = solutions.some(
      (s) => s.name.trim().normalize("NFC").toLowerCase() === trimmedName.normalize("NFC").toLowerCase()
    );
    if (isDuplicateName) {
      toast.error(`Tên dự án "${trimmedName}" đã tồn tại! Vui lòng đặt tên khác.`);
      return;
    }

    const isDuplicateCode = solutions.some(
      (s) => s.code && s.code.trim().toUpperCase() === finalCode
    );
    if (isDuplicateCode) {
      toast.error(`Mã dự án [${finalCode}] đã tồn tại! Vui lòng đặt mã khác.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const randomColor = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
      const numBudget = budget ? Number(budget.replace(/\D/g, "")) : undefined;
      const selectedDeptNames = selectedDepartments.map((d) => d.name);

      const extraDesc = [
        description.trim(),
        projectCategory === "OUTSOURCE" && partnerName ? `[Khách hàng: ${partnerName.trim()}]` : "",
        projectCategory === "OUTSOURCE" && scopeOfWork ? `[Phạm vi/Công nghệ: ${scopeOfWork.trim()}]` : "",
        projectCategory === "INTERNAL" && selectedDeptNames.length > 0
          ? `[Phòng ban phụ trách: ${selectedDeptNames.join(", ")}]`
          : "",
      ].filter(Boolean).join("\n");

      await addDigitalSolution({
        name: trimmedName,
        shortName: trimmedName,
        code: finalCode,
        category: projectCategory,
        departmentId:
          projectCategory === "INTERNAL" && selectedDepartmentIds[0]
            ? Number(selectedDepartmentIds[0])
            : undefined,
        departmentIds:
          projectCategory === "INTERNAL" ? selectedDepartmentIds.map(Number) : undefined,
        partnerName: partnerName.trim() || undefined,
        iconName: projectCategory === "GOV" ? "Landmark" : projectCategory === "OUTSOURCE" ? "Building2" : "Cpu",
        colorHex: randomColor.hex,
        badgeClass: randomColor.class,
        targetGovDepartment:
          projectCategory === "GOV"
            ? targetDepartment.trim()
            : projectCategory === "OUTSOURCE"
            ? partnerName.trim() || "Đối tác"
            : selectedDeptNames.join(", ") || "Nội bộ",
        managerId: managerId ? Number(managerId) : undefined,
        status,
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: numBudget,
        dataAssetDescription: dataAssetDescription.trim(),
        description: extraDesc,
        totalTargetProvinces: projectCategory === "GOV" ? 34 : 0,
      });

      const label =
        projectCategory === "GOV"
          ? "dự án CĐS 34 Tỉnh"
          : projectCategory === "OUTSOURCE"
            ? "dự án Outsource B2B"
            : "dự án Nội bộ R&D";

      toast.success(`Đã khởi tạo ${label} [${finalCode}] thành công!`);
      onOpenChange(false);

      setName("");
      setCode("");
      setTargetDepartment("");
      setPartnerName("");
      setDepartmentId("");
      setScopeOfWork("");
      setManagerId("");
      setManagerSearch("");
      setStatus("pending");
      setPriority("medium");
      setStartDate("");
      setEndDate("");
      setBudget("");
      setDataAssetDescription("");
      setDescription("");
    } catch {
      toast.error("Không thể tạo dự án. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {projectCategory === "GOV" && <Landmark className="w-5 h-5" />}
              {projectCategory === "OUTSOURCE" && <Building2 className="w-5 h-5" />}
              {projectCategory === "INTERNAL" && <Cpu className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Khởi Tạo Dự Án Mới
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {projectCategory === "GOV" && "Dự án Chuyển đổi số Chính quyền & tự động đồng bộ 34 Tỉnh/Thành."}
                {projectCategory === "OUTSOURCE" && "Dự án phát triển phần mềm theo hợp đồng cho Khách hàng & Đối tác B2B."}
                {projectCategory === "INTERNAL" && "Dự án R&D, phát triển module ERP & công nghệ nội bộ IGB."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Chọn loại hình dự án
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProjectCategory("GOV")}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                  projectCategory === "GOV"
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500/30"
                    : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Landmark className={cn("w-3.5 h-3.5 shrink-0", projectCategory === "GOV" ? "text-blue-600" : "text-muted-foreground")} />
                  <span>Chính quyền</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  CĐS 34 Tỉnh/Thành, tiếp cận Sở ban ngành
                </p>
                {projectCategory === "GOV" && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setProjectCategory("OUTSOURCE")}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                  projectCategory === "OUTSOURCE"
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500/30"
                    : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Building2 className={cn("w-3.5 h-3.5 shrink-0", projectCategory === "OUTSOURCE" ? "text-blue-600" : "text-muted-foreground")} />
                  <span>Outsource</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Outsource, phần mềm theo yêu cầu đối tác
                </p>
                {projectCategory === "OUTSOURCE" && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setProjectCategory("INTERNAL")}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                  projectCategory === "INTERNAL"
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500/30"
                    : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Cpu className={cn("w-3.5 h-3.5 shrink-0", projectCategory === "INTERNAL" ? "text-blue-600" : "text-muted-foreground")} />
                  <span>Nội bộ</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Dự án công nghệ & giải pháp IGB
                </p>
                {projectCategory === "INTERNAL" && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {projectCategory === "GOV" && "Tên dự án Chuyển đổi số"}
                {projectCategory === "OUTSOURCE" && "Tên dự án Outsource & Hợp đồng"}
                {projectCategory === "INTERNAL" && "Tên dự án / Sản phẩm nội bộ"}
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                placeholder={
                  projectCategory === "GOV"
                    ? "VD: Đất đai Thông minh & GIS, Y tế số, Du lịch thông minh..."
                    : projectCategory === "OUTSOURCE"
                      ? "VD: Cổng thanh toán B2B, App giao vận LogiTech, Sàn TMĐT..."
                      : "VD: Module Đánh giá KPI ERP, AI Chatbot nội bộ, Hệ thống HRM..."
                }
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
                placeholder={
                  projectCategory === "GOV"
                    ? "VD: DDTM, YTS, GIS"
                    : projectCategory === "OUTSOURCE"
                      ? "VD: LOGI, PAYM, B2B"
                      : "VD: ERP_KPI, HRM, AI_CORE"
                }
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="h-9 text-xs font-mono uppercase font-bold"
              />
            </div>
          </div>

          {projectCategory === "GOV" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sở / Cơ quan chủ quản mục tiêu</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="VD: Sở Tài nguyên & Môi trường, Sở Y tế..."
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  required
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Trưởng ban / Quản lý dự án (Manager)
                </label>
                <ManagerDropdown
                  users={filteredUsers}
                  selectedManager={selectedManager}
                  managerId={managerId}
                  setManagerId={setManagerId}
                  managerSearch={managerSearch}
                  setManagerSearch={setManagerSearch}
                  isManagerDropdownOpen={isManagerDropdownOpen}
                  setIsManagerDropdownOpen={setIsManagerDropdownOpen}
                  managerSearchInputRef={managerSearchInputRef}
                />
              </div>
            </div>
          )}

          {projectCategory === "OUTSOURCE" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Khách hàng / Doanh nghiệp đối tác</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="VD: Tập đoàn Bất động sản ABC, Công ty Vận tải XYZ..."
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  required
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Project Manager / Tech Lead
                </label>
                <ManagerDropdown
                  users={filteredUsers}
                  selectedManager={selectedManager}
                  managerId={managerId}
                  setManagerId={setManagerId}
                  managerSearch={managerSearch}
                  setManagerSearch={setManagerSearch}
                  isManagerDropdownOpen={isManagerDropdownOpen}
                  setIsManagerDropdownOpen={setIsManagerDropdownOpen}
                  managerSearchInputRef={managerSearchInputRef}
                />
              </div>
            </div>
          )}

          {projectCategory === "INTERNAL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <div className="space-y-1.5 relative" ref={deptDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>Phòng ban phụ trách nội bộ</span>
                  </label>
                  {selectedDepartmentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDepartmentIds([])}
                      className="text-[11px] text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                <div
                  onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                  className={cn(
                    "min-h-[36px] px-3 py-1.5 rounded-md border border-input bg-background flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-primary/50 transition-colors",
                    isDeptDropdownOpen && "ring-1 ring-ring border-ring"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    {selectedDepartments.length === 0 ? (
                      <span className="text-muted-foreground py-0.5">
                        Chọn các phòng ban phụ trách...
                      </span>
                    ) : (
                      selectedDepartments.map((dept) => (
                        <span
                          key={dept.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-500/20"
                        >
                          <span>{dept.name}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDepartment(dept.id);
                            }}
                            className="hover:text-rose-600 rounded p-0.5 hover:bg-amber-500/20 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform",
                      isDeptDropdownOpen && "rotate-180"
                    )}
                  />
                </div>

                {isDeptDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border/80 rounded-xl shadow-xl z-50 p-2 space-y-2 max-h-60 overflow-y-auto">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        ref={deptSearchInputRef}
                        value={deptSearch}
                        onChange={(e) => setDeptSearch(e.target.value)}
                        placeholder="Tìm kiếm phòng ban..."
                        className="h-8 text-xs pl-8 pr-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground border-b border-border/50 pb-1.5">
                      <span>Đã chọn: {selectedDepartmentIds.length} phòng ban</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDepartmentIds(departments.map((d) => String(d.id)));
                          }}
                          className="text-primary hover:underline"
                        >
                          Chọn tất cả
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDepartmentIds([]);
                          }}
                          className="hover:text-foreground hover:underline"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      {filteredDepartments.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Không tìm thấy phòng ban nào
                        </div>
                      ) : (
                        filteredDepartments.map((dept) => {
                          const isSelected = selectedDepartmentIds.includes(String(dept.id));
                          return (
                            <div
                              key={dept.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDepartment(dept.id);
                              }}
                              className={cn(
                                "p-2 rounded-lg text-xs hover:bg-muted/60 cursor-pointer flex items-center justify-between transition-colors",
                                isSelected &&
                                  "bg-amber-500/10 text-amber-800 dark:text-amber-200 font-medium"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                    isSelected
                                      ? "bg-amber-600 border-amber-600 text-white"
                                      : "border-border/80 bg-background"
                                  )}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="truncate">{dept.name}</span>
                              </div>
                              {dept.employeesCount !== undefined && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {dept.employeesCount} nhân sự
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Product Owner / Quản lý R&D
                </label>
                <ManagerDropdown
                  users={filteredUsers}
                  selectedManager={selectedManager}
                  managerId={managerId}
                  setManagerId={setManagerId}
                  managerSearch={managerSearch}
                  setManagerSearch={setManagerSearch}
                  isManagerDropdownOpen={isManagerDropdownOpen}
                  setIsManagerDropdownOpen={setIsManagerDropdownOpen}
                  managerSearchInputRef={managerSearchInputRef}
                />
              </div>
            </div>
          )}

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
                  <SelectItem value="completed" className="text-xs">
                    Hoàn thành (Completed)
                  </SelectItem>
                  <SelectItem value="on_hold" className="text-xs">
                    Tạm dừng (On Hold)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mức độ ưu tiên
              </label>
              <Select
                value={priority}
                onValueChange={(val: any) => setPriority(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Ưu tiên" />
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
                {projectCategory === "OUTSOURCE" ? "Giá trị hợp đồng (VNĐ)" : "Ngân sách dự kiến (VNĐ)"}
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
                {projectCategory === "OUTSOURCE" ? "Hạn bàn giao & nghiệm thu" : "Ngày kết thúc dự kiến"}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {projectCategory === "GOV" && (
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
          )}

          {projectCategory === "OUTSOURCE" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Công nghệ & Yêu cầu kỹ thuật chính (Scope of work)
              </label>
              <Input
                placeholder="VD: React Native, Node.js, AWS Cloud, Hệ thống thanh toán Napas/VNPay..."
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mô tả chi tiết mục tiêu dự án (tùy chọn)
            </label>
            <Textarea
              placeholder={
                projectCategory === "GOV"
                  ? "Mô tả tóm tắt dự án chuyển đổi số và giá trị đem lại cho các tỉnh..."
                  : projectCategory === "OUTSOURCE"
                    ? "Mô tả yêu cầu khách hàng, các mốc thanh toán và điều khoản bàn giao..."
                    : "Mô tả mục tiêu sản phẩm nội bộ, bài toán cần giải quyết và KPI đạt được..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="p-3 rounded-xl border flex items-center justify-between text-xs border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-blue-500" />
              <span className="font-semibold text-foreground truncate max-w-[200px]">
                {name || "Tên dự án mới"}
              </span>
              {code && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-background border font-mono font-bold">
                  {code}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
              {projectCategory === "GOV" && "Tự động đồng bộ theo dõi 34 Tỉnh/Thành"}
              {projectCategory === "OUTSOURCE" && "Dự án Outsource & Hợp đồng khách hàng"}
              {projectCategory === "INTERNAL" && "Dự án Công nghệ & ERP Nội bộ IGB"}
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
              disabled={
                isSubmitting ||
                !name.trim() ||
                !code.trim() ||
                (projectCategory === "GOV" && !targetDepartment.trim()) ||
                (projectCategory === "OUTSOURCE" && !partnerName.trim())
              }
              className="font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting
                ? "Đang tạo..."
                : projectCategory === "GOV"
                  ? "Khởi tạo dự án CĐS"
                  : projectCategory === "OUTSOURCE"
                    ? "Khởi tạo dự án Outsource"
                    : "Khởi tạo dự án Nội bộ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManagerDropdown({
  users,
  selectedManager,
  managerId,
  setManagerId,
  managerSearch,
  setManagerSearch,
  isManagerDropdownOpen,
  setIsManagerDropdownOpen,
  managerSearchInputRef,
}: {
  users: any[];
  selectedManager: any;
  managerId: string;
  setManagerId: (id: string) => void;
  managerSearch: string;
  setManagerSearch: (q: string) => void;
  isManagerDropdownOpen: boolean;
  setIsManagerDropdownOpen: (open: boolean) => void;
  managerSearchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
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

          {users.length === 0 ? (
            <div className="py-5 text-center text-xs text-muted-foreground">
              Không tìm thấy nhân viên phù hợp
            </div>
          ) : (
            users.map((u) => {
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
  );
}

export const DltmCreateSolutionModal = GovCreateSolutionModal;

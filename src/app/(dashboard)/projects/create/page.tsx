"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FolderGit2,
  Landmark,
  Layers,
  Sparkles,
  Search,
  Check,
  ChevronDown,
  X,
  ArrowRight,
  Handshake,
  Cpu,
} from "lucide-react";
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
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { Badge } from "@/shared/components/ui/badge";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export default function CreateGovProjectPage() {
  const router = useRouter();
  const { solutions, addDigitalSolution } = useGovStore();
  const { users, departments, fetchDepartments } = useUserStore();

  const [projectCategory, setProjectCategory] = useState<"GOV" | "OUTSOURCE" | "INTERNAL">("GOV");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const deptSearchInputRef = useRef<HTMLInputElement>(null);

  const [scopeOfWork, setScopeOfWork] = useState("");
  const [managerId, setManagerId] = useState<string>("");
  const [managerSearch, setManagerSearch] = useState("");
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const managerSearchInputRef = useRef<HTMLInputElement>(null);
  const managerDropdownRef = useRef<HTMLDivElement>(null);

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
      if (
        managerDropdownRef.current &&
        !managerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsManagerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isDeptDropdownOpen && deptSearchInputRef.current) {
      setTimeout(() => {
        deptSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isDeptDropdownOpen]);

  useEffect(() => {
    if (isManagerDropdownOpen && managerSearchInputRef.current) {
      setTimeout(() => {
        managerSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isManagerDropdownOpen]);

  const selectedDepartments = useMemo(() => {
    return departments.filter((d) => selectedDepartmentIds.includes(String(d.id)));
  }, [departments, selectedDepartmentIds]);

  const filteredDepartments = useMemo(() => {
    let list = departments;
    if (departmentSearch.trim()) {
      const q = removeVietnameseTones(departmentSearch.trim());
      list = list.filter((d) => {
        const dName = removeVietnameseTones(d.name || "");
        const dCode = removeVietnameseTones(d.code || "");
        return dName.includes(q) || dCode.includes(q);
      });
    }
    return list;
  }, [departments, departmentSearch]);

  const toggleDepartment = (id: string | number) => {
    const sId = String(id);
    setSelectedDepartmentIds((prev) =>
      prev.includes(sId) ? prev.filter((item) => item !== sId) : [...prev, sId]
    );
  };

  const selectedManager = useMemo(() => {
    if (!managerId) return null;
    return users.find((u) => u.id === managerId) || null;
  }, [managerId, users]);

  const filteredManagers = useMemo(() => {
    let list = users;
    if (managerSearch.trim()) {
      const q = removeVietnameseTones(managerSearch.trim());
      list = list.filter((u) => {
        const uName = removeVietnameseTones(u.name || "");
        const uEmail = removeVietnameseTones(u.email || "");
        const uTitle = removeVietnameseTones(u.title || "");
        return uName.includes(q) || uEmail.includes(q) || uTitle.includes(q);
      });
    }
    return list;
  }, [users, managerSearch]);

  const formatCurrency = (val: string) => {
    const numbersOnly = val.replace(/\D/g, "");
    if (!numbersOnly) return "";
    return new Intl.NumberFormat("vi-VN").format(parseInt(numbersOnly, 10));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setBudget(formatted);
  };

  const generateAutoCode = (projectName: string) => {
    const clean = removeVietnameseTones(projectName);
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "";
    if (words.length === 1) return words[0].substring(0, 4).toUpperCase();
    return words.map((w) => w[0]).join("").toUpperCase();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!code || code === generateAutoCode(name)) {
      setCode(generateAutoCode(newName));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên dự án!");
      return;
    }
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã dự án (Code)!");
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const isExisted = solutions.some(
      (s) => s.code.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode.toLowerCase()
    );
    if (isExisted) {
      toast.error(`Mã dự án "${cleanCode}" đã tồn tại! Vui lòng chọn mã khác.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const numericBudget = budget ? parseInt(budget.replace(/\D/g, ""), 10) : undefined;
      const trimmedName = name.trim();
      const selectedDeptNames = selectedDepartments.map((d) => d.name);

      const extraDesc = [
        description.trim(),
        projectCategory === "OUTSOURCE" && partnerName ? `[Khách hàng: ${partnerName.trim()}]` : "",
        projectCategory === "OUTSOURCE" && scopeOfWork ? `[Phạm vi/Công nghệ: ${scopeOfWork.trim()}]` : "",
        projectCategory === "INTERNAL" && selectedDeptNames.length > 0
          ? `[Phòng ban phụ trách: ${selectedDeptNames.join(", ")}]`
          : "",
      ].filter(Boolean).join("\n");

      const newSol = await addDigitalSolution({
        name: trimmedName,
        shortName: trimmedName,
        code: cleanCode,
        category: projectCategory,
        departmentId: projectCategory === "INTERNAL" && selectedDepartmentIds[0] ? Number(selectedDepartmentIds[0]) : undefined,
        departmentIds: projectCategory === "INTERNAL" ? selectedDepartmentIds.map(Number) : undefined,
        partnerName: partnerName.trim() || undefined,
        iconName: projectCategory === "GOV" ? "Landmark" : projectCategory === "OUTSOURCE" ? "Building2" : "Cpu",
        colorHex: "#3b82f6",
        badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        targetGovDepartment: projectCategory === "GOV"
          ? targetDepartment.trim()
          : (projectCategory === "OUTSOURCE"
            ? (partnerName.trim() || "Đối tác")
            : (selectedDeptNames.join(", ") || "Nội bộ")),
        managerId: managerId ? Number(managerId) : undefined,
        status: status as any,
        priority: priority as any,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: numericBudget,
        dataAssetDescription: dataAssetDescription.trim(),
        description: extraDesc,
        totalTargetProvinces: projectCategory === "GOV" ? 34 : 0,
      });

      if (newSol) {
        toast.success(`Đã khởi tạo dự án "${newSol.name}" thành công!`);
        router.push("/projects");
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tạo dự án!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/projects" className="hover:text-primary transition-colors">
              Quản lý dự án
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Khởi tạo dự án mới</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="h-8 w-8 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Quay lại danh sách dự án"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Khởi tạo dự án mới
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/projects")}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <span>Hủy bỏ</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl text-xs gap-1.5 h-9 bg-primary"
          >
            <span>{isSubmitting ? "Đang khởi tạo..." : "Khởi tạo dự án"}</span>
          </Button>
        </div>
      </div>

      {/* Main Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Phân loại loại hình dự án */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            1. Chọn loại hình dự án
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setProjectCategory("GOV")}
              className={cn(
                "p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between",
                projectCategory === "GOV"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                  : "border-border/70 hover:bg-muted/40 hover:border-primary/40 bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Landmark className={cn("w-4 h-4", projectCategory === "GOV" ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-bold text-xs text-foreground">Chính quyền</span>
                </div>
                {projectCategory === "GOV" && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dự án Chuyển đổi số 34 Tỉnh/Thành, tiếp cận Sở ban ngành.
              </p>
            </div>

            <div
              onClick={() => setProjectCategory("OUTSOURCE")}
              className={cn(
                "p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between",
                projectCategory === "OUTSOURCE"
                  ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-xs"
                  : "border-border/70 hover:bg-muted/40 hover:border-emerald-500/40 bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Handshake className={cn("w-4 h-4", projectCategory === "OUTSOURCE" ? "text-emerald-500" : "text-muted-foreground")} />
                  <span className="font-bold text-xs text-foreground">Outsource</span>
                </div>
                {projectCategory === "OUTSOURCE" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Outsource, phần mềm theo yêu cầu đối tác / khách hàng.
              </p>
            </div>

            <div
              onClick={() => setProjectCategory("INTERNAL")}
              className={cn(
                "p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between",
                projectCategory === "INTERNAL"
                  ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs"
                  : "border-border/70 hover:bg-muted/40 hover:border-amber-500/40 bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className={cn("w-4 h-4", projectCategory === "INTERNAL" ? "text-amber-500" : "text-muted-foreground")} />
                  <span className="font-bold text-xs text-foreground">Nội bộ</span>
                </div>
                {projectCategory === "INTERNAL" && <Check className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dự án công nghệ & giải pháp nội bộ công ty.
              </p>
            </div>
          </div>
        </div>

        {/* Thông tin cốt lõi dự án */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            2. Thông tin cơ bản
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Tên dự án</span>
                <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={handleNameChange}
                placeholder="VD: Đất đai Thông minh & GIS, Quản lý Y tế..."
                className="text-xs h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Mã dự án (Code)</span>
                <span className="text-rose-500">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: DDTM, YTS, ERP..."
                className="text-xs h-10 font-mono uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectCategory === "INTERNAL" ? (
              <div className="space-y-1.5 relative" ref={deptDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Phòng ban phụ trách nội bộ
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

                {/* Trigger box */}
                <div
                  onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                  className={cn(
                    "min-h-[40px] px-3 py-1.5 rounded-xl border border-border/80 bg-background flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-primary/50 transition-colors",
                    isDeptDropdownOpen && "ring-2 ring-primary/20 border-primary"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    {selectedDepartments.length === 0 ? (
                      <span className="text-muted-foreground py-1">
                        Chọn các phòng ban phụ trách (có thể chọn nhiều)...
                      </span>
                    ) : (
                      selectedDepartments.map((dept) => (
                        <span
                          key={dept.id}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-500/20"
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
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", isDeptDropdownOpen && "rotate-180")} />
                </div>

                {/* Dropdown popover */}
                {isDeptDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/80 rounded-xl shadow-xl z-30 p-2 space-y-2 max-h-64 overflow-y-auto">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={deptSearchInputRef}
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
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

                    <div className="space-y-1">
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
                                isSelected && "bg-amber-500/10 text-amber-800 dark:text-amber-200 font-medium"
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
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {projectCategory === "GOV"
                    ? "Sở / Cơ quan chủ quản mục tiêu"
                    : "Đối tác / Khách hàng"}
                </label>
                <Input
                  value={projectCategory === "GOV" ? targetDepartment : partnerName}
                  onChange={(e) =>
                    projectCategory === "GOV"
                      ? setTargetDepartment(e.target.value)
                      : setPartnerName(e.target.value)
                  }
                  placeholder={
                    projectCategory === "GOV"
                      ? "VD: Sở Tài nguyên & Môi trường, Sở Thông tin..."
                      : "VD: Công ty CP Công nghệ..."
                  }
                  className="text-xs h-10"
                />
              </div>
            )}

            <div className="space-y-1.5 relative" ref={managerDropdownRef}>
              <label className="text-xs font-semibold text-foreground">
                Trưởng ban / Quản lý dự án (Manager)
              </label>
              <div
                onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
                className="w-full h-10 px-3 rounded-xl border border-border/80 bg-background flex items-center justify-between text-xs cursor-pointer hover:bg-muted/40 transition-colors"
              >
                {selectedManager ? (
                  <div className="flex items-center gap-2 truncate">
                    <UserAvatar user={selectedManager} size="sm" />
                    <span className="font-medium text-foreground">{selectedManager.name}</span>
                    <span className="text-muted-foreground text-[11px]">({selectedManager.title})</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Chưa chỉ định quản lý</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              {isManagerDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/80 rounded-xl shadow-xl z-30 p-2 space-y-1 max-h-60 overflow-y-auto">
                  <Input
                    ref={managerSearchInputRef}
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    placeholder="Tìm nhân sự..."
                    className="h-8 text-xs mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    onClick={() => {
                      setManagerId("");
                      setIsManagerDropdownOpen(false);
                    }}
                    className="p-2 rounded-lg text-xs hover:bg-muted/60 cursor-pointer text-muted-foreground"
                  >
                    -- Không chỉ định quản lý --
                  </div>
                  {filteredManagers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setManagerId(u.id);
                        setIsManagerDropdownOpen(false);
                      }}
                      className={cn(
                        "p-2 rounded-lg text-xs hover:bg-muted/60 cursor-pointer flex items-center gap-2",
                        managerId === u.id && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <UserAvatar user={u} size="sm" />
                      <div className="truncate">
                        <div>{u.name}</div>
                        <div className="text-[10px] text-muted-foreground">{u.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thiết lập tiến độ & Ngân sách */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            3. Kế hoạch & Ngân sách
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Trạng thái khởi tạo</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="text-xs h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ duyệt (Pending)</SelectItem>
                  <SelectItem value="in_progress">Đang thực hiện (In Progress)</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành (Completed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mức độ ưu tiên</label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger className="text-xs h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp (Low)</SelectItem>
                  <SelectItem value="medium">Trung bình (Medium)</SelectItem>
                  <SelectItem value="high">Cao (High)</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp (Urgent)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ngân sách dự kiến (VNĐ)</label>
              <Input
                value={budget}
                onChange={handleBudgetChange}
                placeholder="VD: 500,000,000"
                className="text-xs h-10 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ngày bắt đầu dự kiến</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ngày kết thúc dự kiến</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mô tả chi tiết mục tiêu dự án (tùy chọn)
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt mục tiêu, phạm vi và giải pháp trọng tâm..."
              className="text-xs"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/projects")}
            className="rounded-xl text-xs h-10 px-5"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl text-xs h-10 px-6 bg-primary shadow-sm"
          >
            {isSubmitting ? "Đang khởi tạo..." : "Khởi tạo dự án"}
          </Button>
        </div>
      </form>
    </div>
  );
}

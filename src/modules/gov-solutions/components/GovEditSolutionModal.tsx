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
import {
  Pencil,
  Search,
  Check,
  ChevronDown,
  X,
  Landmark,
  Handshake,
  Cpu,
} from "lucide-react";
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
  const { users, departments, fetchDepartments } = useUserStore();

  const category = solution?.category || "GOV";

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const deptSearchInputRef = useRef<HTMLInputElement>(null);

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
    if (solution) {
      setName(solution.name || "");
      setCode(solution.code || "");
      const rawDept = solution.targetGovDepartment || "";
      setTargetDepartment(
        rawDept === "Cơ quan chuyên môn địa phương" || rawDept === "Nội bộ" ? "" : rawDept
      );
      setPartnerName(solution.partnerName || "");
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

      // Resolve department IDs for INTERNAL projects
      let initialDeptIds: string[] = [];
      if (Array.isArray(solution.departmentIds) && solution.departmentIds.length > 0) {
        initialDeptIds = solution.departmentIds.map(String);
      } else if (Array.isArray(solution.departments) && solution.departments.length > 0) {
        initialDeptIds = solution.departments.map((d) => String(d.id));
      } else if (solution.departmentId) {
        initialDeptIds = [String(solution.departmentId)];
      }

      let rawDesc = solution.description || "";

      // Extract department info from description tags if not found in relation
      const deptMatch = rawDesc.match(/\[Phòng ban(?: phụ trách)?: ([^\]]+)\]/);
      if (deptMatch && initialDeptIds.length === 0 && departments.length > 0) {
        const names = deptMatch[1].split(",").map((s) => s.trim().toLowerCase());
        const matched = departments.filter((d) => names.includes(d.name.toLowerCase()));
        if (matched.length > 0) {
          initialDeptIds = matched.map((d) => String(d.id));
        }
      }

      const partnerMatch = rawDesc.match(/\[Khách hàng: ([^\]]+)\]/);
      if (partnerMatch && !solution.partnerName) {
        setPartnerName(partnerMatch[1].trim());
      }

      const scopeMatch = rawDesc.match(/\[Phạm vi\/Công nghệ: ([^\]]+)\]/);
      if (scopeMatch) {
        setScopeOfWork(scopeMatch[1].trim());
      }

      // Clean metadata tags from description to display clean text
      const cleanDesc = rawDesc
        .replace(/\[Phòng ban(?: phụ trách)?: [^\]]+\]\n?/g, "")
        .replace(/\[Khách hàng: [^\]]+\]\n?/g, "")
        .replace(/\[Phạm vi\/Công nghệ: [^\]]+\]\n?/g, "")
        .trim();

      setDescription(cleanDesc);
      setSelectedDepartmentIds(initialDeptIds);
    }
  }, [solution, open, departments]);

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

  useEffect(() => {
    if (isDeptDropdownOpen && deptSearchInputRef.current) {
      setTimeout(() => {
        deptSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isDeptDropdownOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solution) return;

    const trimmedName = name.trim();
    const finalCode = code.trim().toUpperCase();

    if (!trimmedName) {
      toast.error("Vui lòng nhập tên dự án");
      return;
    }
    if (!finalCode) {
      toast.error("Vui lòng nhập mã dự án (Code)");
      return;
    }
    if (category === "GOV" && !targetDepartment.trim()) {
      toast.error("Vui lòng nhập sở / cơ quan chủ quản mục tiêu tại 34 tỉnh");
      return;
    }

    const isDuplicateName = solutions.some(
      (s) =>
        s.id !== solution.id &&
        s.name.trim().normalize("NFC").toLowerCase() === trimmedName.normalize("NFC").toLowerCase()
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
      const selectedDeptNames = selectedDepartments.map((d) => d.name);

      const extraDesc = [
        description.trim(),
        category === "OUTSOURCE" && partnerName ? `[Khách hàng: ${partnerName.trim()}]` : "",
        category === "OUTSOURCE" && (scopeOfWork || dataAssetDescription)
          ? `[Phạm vi/Công nghệ: ${(scopeOfWork || dataAssetDescription).trim()}]`
          : "",
        category === "INTERNAL" && selectedDeptNames.length > 0
          ? `[Phòng ban phụ trách: ${selectedDeptNames.join(", ")}]`
          : "",
      ].filter(Boolean).join("\n");

      await updateDigitalSolution(solution.id, {
        name: trimmedName,
        code: finalCode,
        category,
        targetGovDepartment:
          category === "GOV"
            ? targetDepartment.trim()
            : category === "OUTSOURCE"
            ? partnerName.trim() || "Đối tác"
            : selectedDeptNames.join(", ") || "Nội bộ",
        departmentId:
          category === "INTERNAL" && selectedDepartmentIds[0]
            ? Number(selectedDepartmentIds[0])
            : undefined,
        departmentIds: category === "INTERNAL" ? selectedDepartmentIds.map(Number) : undefined,
        partnerName: category === "OUTSOURCE" ? partnerName.trim() : undefined,
        managerId: managerId ? Number(managerId) : undefined,
        status,
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: numBudget,
        dataAssetDescription: dataAssetDescription.trim() || undefined,
        description: extraDesc,
      });

      toast.success(`Đã cập nhật dự án [${finalCode}] thành công!`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật dự án, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryTheme = () => {
    if (category === "INTERNAL") {
      return {
        badgeBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        icon: <Cpu className="w-5 h-5" />,
        title: "Chỉnh Sửa Dự Án Nội Bộ",
        subtitle: `Cập nhật thông tin chi tiết của dự án nội bộ [${solution?.code || solution?.id}].`,
        footerText: "Dự án công nghệ & giải pháp nội bộ công ty",
        dotColor: "bg-amber-500",
      };
    }
    if (category === "OUTSOURCE") {
      return {
        badgeBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        icon: <Handshake className="w-5 h-5" />,
        title: "Chỉnh Sửa Dự Án Outsource",
        subtitle: `Cập nhật thông tin chi tiết của dự án outsource [${solution?.code || solution?.id}].`,
        footerText: "Dự án Outsource theo yêu cầu đối tác / khách hàng",
        dotColor: "bg-emerald-500",
      };
    }
    return {
      badgeBg: "bg-primary/10 text-primary border-primary/20",
      icon: <Landmark className="w-5 h-5" />,
      title: "Chỉnh Sửa Dự Án Chuyển Đổi Số",
      subtitle: `Cập nhật thông tin chi tiết của dự án [${solution?.code || solution?.id}].`,
      footerText: "Tự động đồng bộ theo dõi 34 Tỉnh/Thành",
      dotColor: "bg-primary",
    };
  };

  const theme = getCategoryTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                theme.badgeBg
              )}
            >
              {theme.icon}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{theme.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{theme.subtitle}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tên dự án <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder={
                  category === "GOV"
                    ? "VD: Đất đai Thông minh & GIS, Y tế số..."
                    : category === "OUTSOURCE"
                    ? "VD: Hệ thống sàn TMĐT, App đối tác..."
                    : "VD: ERP Doanh nghiệp, Module chấm công AI..."
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
                placeholder="VD: TMDT, DDTM, GIS"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="h-9 text-xs font-mono uppercase font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {category === "INTERNAL" ? (
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
                    "min-h-[36px] px-3 py-1.5 rounded-md border border-input bg-transparent flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-primary/50 transition-colors",
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

                {/* Dropdown popover */}
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
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {category === "GOV" ? (
                    <>
                      Sở / Cơ quan chủ quản mục tiêu tại 34 tỉnh{" "}
                      <span className="text-rose-500">*</span>
                    </>
                  ) : (
                    "Đối tác / Khách hàng"
                  )}
                </label>
                <Input
                  placeholder={
                    category === "GOV"
                      ? "VD: Sở Tài nguyên & Môi trường, Sở Công Thương..."
                      : "VD: Công ty CP Công nghệ, Tập đoàn..."
                  }
                  value={category === "GOV" ? targetDepartment : partnerName}
                  onChange={(e) =>
                    category === "GOV"
                      ? setTargetDepartment(e.target.value)
                      : setPartnerName(e.target.value)
                  }
                  required={category === "GOV"}
                  className="h-9 text-xs"
                />
              </div>
            )}

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
                        <span className="truncate font-medium text-foreground">
                          {selectedManager.name}
                        </span>
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
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {u.role}
                                  </p>
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
              <label className="text-xs font-semibold text-foreground">Trạng thái dự án</label>
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
              <label className="text-xs font-semibold text-foreground">Mức độ ưu tiên</label>
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
              <label className="text-xs font-semibold text-foreground">Ngày bắt đầu dự kiến</label>
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
              {category === "GOV"
                ? "Tài nguyên & Dữ liệu chuyên ngành cần số hóa (tùy chọn)"
                : category === "OUTSOURCE"
                ? "Phạm vi công việc & Công nghệ bàn giao (tùy chọn)"
                : "Hệ thống liên kết & Phạm vi ứng dụng nội bộ (tùy chọn)"}
            </label>
            <Input
              placeholder={
                category === "GOV"
                  ? "VD: Bản đồ địa chính, dữ liệu quy hoạch đất, hồ sơ bệnh án..."
                  : category === "OUTSOURCE"
                  ? "VD: React, Flutter, Golang, hạ tầng AWS, SLA 99.9%..."
                  : "VD: Tích hợp HRM, chấm công, phục vụ toàn bộ nhân viên khối văn phòng..."
              }
              value={
                category === "OUTSOURCE" ? scopeOfWork || dataAssetDescription : dataAssetDescription
              }
              onChange={(e) => {
                setDataAssetDescription(e.target.value);
                if (category === "OUTSOURCE") {
                  setScopeOfWork(e.target.value);
                }
              }}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mô tả mục tiêu dự án (tùy chọn)
            </label>
            <Textarea
              placeholder={
                category === "GOV"
                  ? "Mô tả tóm tắt dự án chuyển đổi số và giá trị đem lại cho địa phương..."
                  : category === "OUTSOURCE"
                  ? "Mô tả tóm tắt dự án outsource, yêu cầu bàn giao..."
                  : "Mô tả mục tiêu triển khai công nghệ nội bộ..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div
            className={cn(
              "p-3 rounded-xl border flex items-center justify-between text-xs",
              category === "INTERNAL"
                ? "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                : category === "OUTSOURCE"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : "border-primary/20 bg-primary/5 text-primary"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse", theme.dotColor)} />
              <span className="font-semibold text-foreground">{name || "Tên dự án"}</span>
              {code && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-background border font-mono font-bold text-foreground">
                  {code}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium">{theme.footerText}</span>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isSubmitting ||
                !name.trim() ||
                !code.trim() ||
                (category === "GOV" && !targetDepartment.trim())
              }
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

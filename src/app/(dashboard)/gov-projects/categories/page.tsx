"use client";

import * as React from "react";
import Link from "next/link";
import {
  Tag,
  Search,
  Pencil,
  Sparkles,
  ShieldCheck,
  Building2,
  Layers,
  Handshake,
  Compass,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  useProjectCategoryStore,
  ProjectCategoryItem,
} from "@/modules/gov-solutions/store/projectCategoryStore";
import { toast } from "sonner";

export default function ProjectCategoriesPage() {
  const { categories, fetchCategories, updateCategory } = useProjectCategoryStore();

  const [search, setSearch] = React.useState("");
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<ProjectCategoryItem | null>(null);

  // Form state for editing
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenEdit = (item: ProjectCategoryItem) => {
    setEditingCategory(item);
    setName(item.name);
    setDescription(item.description || "");
    setSortOrder(item.sortOrder || 1);
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên loại dự án");
      return;
    }
    if (!editingCategory) return;

    setIsSubmitting(true);
    try {
      const ok = await updateCategory(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        sortOrder: Number(sortOrder) || 1,
      });
      if (ok) {
        toast.success("Đã cập nhật thông tin loại dự án thành công");
        setOpenDialog(false);
      } else {
        toast.error("Không thể cập nhật loại dự án");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show system categories
  const systemCategories = categories.filter((c) => c.isSystem !== false);

  const filteredCategories = systemCategories.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  const getCategoryIcon = (codeStr: string) => {
    switch (codeStr.toUpperCase()) {
      case "GOV":
        return <Layers className="h-4 w-4 text-blue-600" />;
      case "INTERNAL":
        return <Building2 className="h-4 w-4 text-amber-600" />;
      case "OUTSOURCE":
        return <Handshake className="h-4 w-4 text-emerald-600" />;
      default:
        return <FolderKanban className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const totalProjects = systemCategories.reduce((acc, c) => acc + (c.projectCount || 0), 0);

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-[11px] font-mono bg-primary/10 text-primary border-primary/20 gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Cấu Hình Hệ Thống • Project Categories</span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              • Cấu hình 3 khối phân loại dự án cốt lõi của doanh nghiệp
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <Tag className="h-6 w-6" />
            </span>
            <span>Danh Mục Loại Dự Án</span>
          </h1>

          <p className="text-xs text-muted-foreground mt-1">
            Quản trị 3 khối dự án chuẩn mực (Chính quyền CĐS 34 Tỉnh, Dự án Nội bộ công ty, Dự án Outsource đối tác) trên hệ thống ERP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/gov-projects">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8.5 font-medium cursor-pointer shadow-2xs">
              <Compass className="h-4 w-4" />
              <span>Xem Danh sách dự án</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary - 3 focused cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Khối dự án hệ thống
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">3</span>
            <span className="text-xs text-muted-foreground font-medium">phân loại cốt lõi</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Phạm vi nghiệp vụ
          </p>
          <p className="text-xs font-semibold text-foreground pt-1">
            34 Tỉnh CĐS • Khối Phòng ban • Khách hàng B2B
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Tổng dự án đang quản lý
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">{totalProjects}</span>
            <span className="text-xs text-muted-foreground font-medium">dự án toàn hệ thống</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm theo tên hoặc mã loại dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tên loại dự án</th>
                <th className="py-3 px-4">Mã định danh (Code)</th>
                <th className="py-3 px-4">Mô tả nghiệp vụ & Phạm vi</th>
                <th className="py-3 px-4 text-center">Số dự án</th>
                <th className="py-3 px-4 text-center">Phân loại</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy loại dự án nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-muted/60 border border-border/60">
                          {getCategoryIcon(cat.code)}
                        </span>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-mono text-[11px] bg-muted/30">
                        {cat.code}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-md">
                      {cat.description || "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-foreground">
                      <Badge variant="secondary" className="text-[10px] px-2 font-mono">
                        {cat.projectCount || 0}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        Hệ thống
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(cat)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Chỉnh sửa tên hiển thị và mô tả"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <span>Chỉnh sửa thông tin loại dự án</span>
            </DialogTitle>
          </DialogHeader>

          {editingCategory && (
            <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Mã định danh hệ thống (Code)
                </label>
                <Input
                  value={editingCategory.code}
                  disabled
                  className="text-xs font-mono bg-muted/50 cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground">
                  Mã loại hệ thống được bảo vệ cố định cho logic nghiệp vụ (CĐS, Nội bộ, Outsource).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tên hiển thị <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="VD: Dự án Chuyển đổi số Chính phủ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Mô tả nghiệp vụ & Phạm vi</label>
                <Textarea
                  placeholder="Mô tả phạm vi áp dụng, đối tượng quản lý của loại dự án..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Thứ tự hiển thị</label>
                <Input
                  type="number"
                  min={1}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 1)}
                  className="text-xs font-mono w-24"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDialog(false)}
                  disabled={isSubmitting}
                  className="text-xs cursor-pointer"
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs cursor-pointer">
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

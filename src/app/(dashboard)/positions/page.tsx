"use client";

import * as React from "react";
import {
  UserCog,
  ShieldCheck,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
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

interface PositionItem {
  id: string;
  name: string;
  code: string;
  level: "Cấp Lãnh Đạo" | "Cấp Quản Lý" | "Cấp Chuyên Viên" | "Nhân viên & TTS";
  departmentScope: string;
  dataScope: "GLOBAL" | "DEPARTMENT" | "OWN";
  description: string;
  memberCount: number;
  color: string;
}

const INITIAL_POSITIONS: PositionItem[] = [
  {
    id: "pos-1",
    name: "Giám đốc điều hành (CEO)",
    code: "CV-CEO",
    level: "Cấp Lãnh Đạo",
    departmentScope: "Toàn công ty",
    dataScope: "GLOBAL",
    description: "Điều hành tổng thể chiến lược, phê duyệt kế hoạch trọng tâm và ngân sách",
    memberCount: 1,
    color: "from-rose-500 to-red-600",
  },
  {
    id: "pos-2",
    name: "Trưởng phòng Kỹ thuật / CTO",
    code: "CV-CTO",
    level: "Cấp Quản Lý",
    departmentScope: "Công nghệ thông tin",
    dataScope: "GLOBAL",
    description: "Quản lý toàn bộ kiến trúc công nghệ, phân bổ nhân sự và giám sát tiến độ dự án",
    memberCount: 1,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "pos-3",
    name: "Trưởng phòng Nhân sự (HRM)",
    code: "CV-HRM",
    level: "Cấp Quản Lý",
    departmentScope: "Nhân sự & Tuyển dụng",
    dataScope: "DEPARTMENT",
    description: "Hoạch định nhân tài, quy chế lương thưởng, đánh giá KPI và chính sách công ty",
    memberCount: 1,
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "pos-4",
    name: "Senior Fullstack Developer",
    code: "CV-DEV-SR",
    level: "Cấp Chuyên Viên",
    departmentScope: "Công nghệ thông tin",
    dataScope: "DEPARTMENT",
    description: "Phát triển các module hệ thống cốt lõi, review code và hỗ trợ thành viên mới",
    memberCount: 3,
    color: "from-sky-500 to-cyan-600",
  },
  {
    id: "pos-5",
    name: "Kế toán trưởng",
    code: "CV-KTT",
    level: "Cấp Quản Lý",
    departmentScope: "Kế toán & Tài chính",
    dataScope: "DEPARTMENT",
    description: "Kiểm soát tài chính doanh nghiệp, duyệt chi và lập báo cáo tài chính định kỳ",
    memberCount: 1,
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "pos-6",
    name: "Chuyên viên Kinh doanh B2B",
    code: "CV-SALE",
    level: "Cấp Chuyên Viên",
    departmentScope: "Kinh doanh",
    dataScope: "OWN",
    description: "Tiếp cận khách hàng tiềm năng, đàm phán hợp đồng thương mại và theo dõi đơn hàng",
    memberCount: 2,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "pos-7",
    name: "Thực tập sinh (Intern)",
    code: "CV-INTERN",
    level: "Nhân viên & TTS",
    departmentScope: "Theo bộ phận thực tập",
    dataScope: "OWN",
    description: "Tham gia đào tạo, làm quen môi trường dự án thực tế và hoàn thành các task được giao",
    memberCount: 2,
    color: "from-slate-500 to-zinc-600",
  },
];

export default function PositionsPage() {
  const [positions, setPositions] = React.useState<PositionItem[]>(INITIAL_POSITIONS);
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPos, setEditingPos] = React.useState<PositionItem | null>(null);

  const [formName, setFormName] = React.useState("");
  const [formCode, setFormCode] = React.useState("");
  const [formLevel, setFormLevel] = React.useState<PositionItem["level"]>("Cấp Chuyên Viên");
  const [formScope, setFormScope] = React.useState("Công nghệ thông tin");
  const [formDataScope, setFormDataScope] = React.useState<PositionItem["dataScope"]>("DEPARTMENT");
  const [formDesc, setFormDesc] = React.useState("");

  const filteredPositions = positions.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.level.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingPos(null);
    setFormName("");
    setFormCode("");
    setFormLevel("Cấp Chuyên Viên");
    setFormScope("Toàn công ty");
    setFormDataScope("DEPARTMENT");
    setFormDesc("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pos: PositionItem) => {
    setEditingPos(pos);
    setFormName(pos.name);
    setFormCode(pos.code);
    setFormLevel(pos.level);
    setFormScope(pos.departmentScope);
    setFormDataScope(pos.dataScope);
    setFormDesc(pos.description);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPos) {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === editingPos.id
            ? {
                ...p,
                name: formName.trim(),
                code: formCode.trim() || p.code,
                level: formLevel,
                departmentScope: formScope.trim() || p.departmentScope,
                dataScope: formDataScope,
                description: formDesc.trim(),
              }
            : p
        )
      );
    } else {
      const newPos: PositionItem = {
        id: `pos-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim() || `CV-${Date.now().toString().slice(-4)}`,
        level: formLevel,
        departmentScope: formScope.trim() || "Toàn công ty",
        dataScope: formDataScope,
        description: formDesc.trim(),
        memberCount: 0,
        color: "from-blue-500 to-indigo-600",
      };
      setPositions((prev) => [newPos, ...prev]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa chức vụ này?")) {
      setPositions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Trang chủ</span>
            <span>/</span>
            <span>Quản lý nhân sự</span>
            <span>/</span>
            <span className="text-foreground font-medium">Chức vụ</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Quản lý chức vụ & Cấp bậc
              </h1>
              <p className="text-xs text-muted-foreground">
                Thiết lập hệ thống chức danh, phân tầng thẩm quyền và phạm vi dữ liệu
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-xs gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm chức vụ</span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên chức vụ, mã hoặc cấp bậc..."
            className="pl-9 h-10 rounded-xl bg-card/60 text-xs border-border/80"
          />
        </div>

        <div className="text-xs text-muted-foreground hidden sm:block">
          Hiển thị <span className="font-semibold text-foreground">{filteredPositions.length}</span> chức vụ
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4">Tên chức vụ & Mã</th>
                <th className="py-3 px-4">Cấp bậc quản lý</th>
                <th className="py-3 px-4">Phạm vi dữ liệu</th>
                <th className="py-3 px-4">Mô tả trách nhiệm</th>
                <th className="py-3 px-4">Số lượng đảm nhiệm</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredPositions.map((pos) => {
                return (
                  <tr
                    key={pos.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${pos.color} flex items-center justify-center text-white shadow-2xs shrink-0`}
                        >
                          <UserCog className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {pos.name}
                          </div>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-muted border border-border/70 text-muted-foreground mt-0.5">
                            {pos.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          pos.level === "Cấp Lãnh Đạo"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300/40"
                            : pos.level === "Cấp Quản Lý"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40"
                            : pos.level === "Cấp Chuyên Viên"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300/40"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {pos.level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                          {pos.dataScope === "GLOBAL"
                            ? "Toàn hệ thống (Global)"
                            : pos.dataScope === "DEPARTMENT"
                            ? "Theo phòng ban"
                            : "Dữ liệu cá nhân (Own)"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-muted-foreground truncate">
                        {pos.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-foreground font-semibold">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{pos.memberCount} nhân sự</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 text-xs">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(pos)}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Chỉnh sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(pos.id)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa chức vụ</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-border/80">
          <DialogHeader className="p-5 border-b border-border/70 bg-muted/20">
            <DialogTitle className="text-base font-semibold">
              {editingPos ? "Chỉnh sửa chức vụ" : "Thêm mới chức vụ"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave}>
            <div className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Tên chức danh *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Trưởng phòng Marketing"
                  className="h-9 rounded-xl text-xs bg-background/80"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Mã chức danh</label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="VD: CV-MKT-MGR"
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Mô tả nhiệm vụ trọng tâm</label>
                <Input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả tóm tắt vai trò..."
                  className="h-9 rounded-xl text-xs bg-background/80"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border/70 bg-muted/10 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-9 px-4 rounded-xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow-xs"
              >
                {editingPos ? "Lưu thay đổi" : "Tạo chức vụ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

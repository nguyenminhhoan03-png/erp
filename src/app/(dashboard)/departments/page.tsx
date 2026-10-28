"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Mail,
  Briefcase,
  AlertCircle,
  Building,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Department } from "@/modules/departments/types";
import { departmentService } from "@/modules/departments/services/departmentService";
import { usePermission } from "@/shared/permissions/PermissionGuard";
import { AccessDenied } from "@/shared/components/AccessDenied";

export default function DepartmentsPage() {
  const router = useRouter();

  const canView = usePermission("department_list");
  const canCreate = usePermission("department_create");
  const canEdit = usePermission("department_edit");
  const canDelete = usePermission("department_delete");

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [subCompanies, setSubCompanies] = React.useState<Array<{ id: number; name: string }>>([]);

  const [search, setSearch] = React.useState("");
  const [companyFilter, setCompanyFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([null]);

  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const fetchDepartments = React.useCallback(async (targetCursor?: string | null, targetPage?: number, customPerPage?: number) => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const activePerPage = customPerPage !== undefined ? customPerPage : perPage;
      const activeCursor = targetCursor !== undefined ? targetCursor : cursor;
      const activePage = targetPage !== undefined ? targetPage : page;

      const res = await departmentService.getDepartments({
        search: search.trim() || undefined,
        companyId: companyFilter !== "ALL" ? companyFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        perPage: activePerPage,
        cursor: activeCursor || undefined,
      });

      if (res?.data) {
        setDepartments(res.data);
        setPage(activePage);
        setCursor(activeCursor || null);
        setNextCursor(res.meta?.next_cursor || null);
        setHasMore(Boolean(res.meta?.has_more));
        setTotal(res.meta?.total ?? res.data.length);
      }
    } catch {
      toast.error("Không thể tải danh sách phòng ban");
    } finally {
      setIsLoading(false);
    }
  }, [search, companyFilter, statusFilter, perPage, cursor, page, canView]);

  React.useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    setPage(1);
    setCursor(null);
    setCursorHistory([null]);
    fetchDepartments(null, 1);
  }, [search, companyFilter, statusFilter, canView]);

  const handleNextPage = async () => {
    if (!nextCursor || isLoading) return;
    const nextPageNum = page + 1;
    const history = [...cursorHistory];
    history[nextPageNum - 1] = nextCursor;
    setCursorHistory(history);
    await fetchDepartments(nextCursor, nextPageNum);
  };

  const handlePrevPage = async () => {
    if (page <= 1 || isLoading) return;
    const prevPageNum = page - 1;
    const prevTargetCursor = cursorHistory[prevPageNum - 1] ?? null;
    await fetchDepartments(prevTargetCursor, prevPageNum);
  };

  const handleFirstPage = async () => {
    if (page === 1 || isLoading) return;
    setCursorHistory([null]);
    await fetchDepartments(null, 1);
  };

  const handlePerPageChange = async (val: string) => {
    const num = Number(val);
    setPerPage(num);
    setPage(1);
    setCursor(null);
    setCursorHistory([null]);
    await fetchDepartments(null, 1, num);
  };

  React.useEffect(() => {
    departmentService.getOptions().then((res) => {
      if (res?.data?.subCompanies) {
        setSubCompanies(res.data.subCompanies);
      }
    }).catch(() => {});
  }, []);

  const handleToggleStatus = async (dept: Department) => {
    try {
      const res = await departmentService.toggleStatus(dept.id);
      toast.success(res.message || "Cập nhật trạng thái thành công");
      setDepartments((prev) =>
        prev.map((d) => (d.id === dept.id ? { ...d, status: d.status === "Active" ? "Inactive" : "Active" } : d))
      );
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng ban "${dept.name}"? Các nhân sự thuộc phòng ban này sẽ được đưa về trạng thái chưa gán phòng ban.`)) {
      return;
    }

    setIsDeleting(dept.id);
    try {
      const res = await departmentService.deleteDepartment(dept.id);
      toast.success(res.message || "Đã xóa phòng ban thành công");
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa phòng ban");
    } finally {
      setIsDeleting(null);
    }
  };

  const totalDepts = departments.length;
  const activeDepts = departments.filter((d) => d.status === "Active").length;
  const totalEmployees = departments.reduce((acc, cur) => acc + (cur.employeesCount || 0), 0);

  if (!canView) {
    return <AccessDenied moduleName="phòng ban" />;
  }

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/employees" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>Quản lý tổ chức</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Phòng ban</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Danh mục phòng ban</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDepartments(cursor, page)}
            className="rounded-xl text-xs gap-1.5 h-9 bg-card shadow-2xs hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Làm mới</span>
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => router.push("/departments/create")}
              className="rounded-xl text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm phòng ban mới</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng số phòng ban</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalDepts}</span>
            <span className="text-xs text-muted-foreground">phòng ban</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đang hoạt động</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeDepts}</span>
            <span className="text-xs text-muted-foreground">phòng ban kích hoạt</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng nhân sự phân bổ</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalEmployees}</span>
            <span className="text-xs text-muted-foreground">nhân sự đã gán phòng</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên phòng ban, mô tả, tên trưởng phòng..."
              className="pl-9 rounded-xl h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-48">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Công ty con" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Tất cả công ty</SelectItem>
                  {subCompanies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Active" className="text-xs">Kích hoạt</SelectItem>
                  <SelectItem value="Inactive" className="text-xs">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
            <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Đang tải danh sách phòng ban...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 p-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Không tìm thấy phòng ban nào</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vui lòng thử lại với từ khóa khác hoặc tạo phòng ban mới.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/departments/create")}
              className="rounded-xl text-xs gap-1.5 h-8 bg-primary mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm phòng ban mới</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Mã & Tên phòng ban</th>
                  <th className="py-3 px-4">Công ty trực thuộc</th>
                  <th className="py-3 px-4">Trưởng phòng</th>
                  <th className="py-3 px-4 text-center">Số lượng nhân sự</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-muted/40 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/departments/${dept.id}`)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground text-sm hover:underline">
                              {dept.name}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted border border-border/80 text-muted-foreground">
                              {dept.code}
                            </span>
                          </div>
                          {dept.description && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-sm mt-0.5">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {dept.subCompanyName ? (
                        <div className="flex items-center gap-1.5 text-foreground/90 font-medium">
                          <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{dept.subCompanyName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Chưa chỉ định</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {dept.managerName ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border border-border/80 shrink-0">
                            <AvatarImage src={dept.managerAvatar} alt={dept.managerName} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                              {dept.managerName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{dept.managerName}</p>
                            {dept.managerPosition && (
                              <p className="text-[10px] text-muted-foreground truncate">{dept.managerPosition}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">Chưa bổ nhiệm</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border/80">
                        {dept.employeesCount} nhân sự
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={dept.status === "Active" ? "default" : "secondary"}
                        className="text-[11px] font-medium"
                      >
                        {dept.status === "Active" ? "Kích hoạt" : "Tạm dừng"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl shadow-md">
                          <DropdownMenuItem
                            onClick={() => router.push(`/departments/${dept.id}`)}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Xem chi tiết</span>
                          </DropdownMenuItem>

                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => router.push(`/departments/${dept.id}/edit`)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5 text-amber-500" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                          )}

                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(dept)}
                              className="gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                              <span>{dept.status === "Active" ? "Tạm dừng hoạt động" : "Kích hoạt hoạt động"}</span>
                            </DropdownMenuItem>
                          )}

                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(dept)}
                                disabled={isDeleting === dept.id}
                                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa phòng ban</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-3 px-4 border-t border-border/70 bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
              <span>
                Hiển thị <span className="font-semibold text-foreground">{departments.length}</span> / tổng số{" "}
                <span className="font-semibold text-foreground">{total}</span> phòng ban
              </span>
              <span className="hidden sm:inline-block text-border">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Số lượng:</span>
                <div className="w-20">
                  <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="h-7 text-xs rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="text-xs">10</SelectItem>
                      <SelectItem value="20" className="text-xs">20</SelectItem>
                      <SelectItem value="50" className="text-xs">50</SelectItem>
                      <SelectItem value="100" className="text-xs">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">
                Trang <span className="text-foreground font-semibold">{page}</span>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFirstPage}
                disabled={page <= 1 || isLoading}
                className="h-8 px-2.5 rounded-xl text-xs gap-1 hover:bg-muted"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trang đầu</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page <= 1 || isLoading}
                className="h-8 px-3 rounded-xl text-xs gap-1 hover:bg-muted"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Trước</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore || isLoading}
                className="h-8 px-3 rounded-xl text-xs gap-1 hover:bg-muted"
              >
                <span>Sau</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building,
  Building2,
  Users,
  UserCheck,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Eye,
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
import { Company } from "@/modules/companies/types";
import { companyService } from "@/modules/companies/services/companyService";
import { usePermission } from "@/shared/permissions/PermissionGuard";
import { AccessDenied } from "@/shared/components/AccessDenied";

export default function CompaniesPage() {
  const router = useRouter();

  const canView = usePermission("sub_company_list");
  const canCreate = usePermission("sub_company_create");
  const canEdit = usePermission("sub_company_edit");
  const canDelete = usePermission("sub_company_delete");

  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([null]);

  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const fetchCompanies = React.useCallback(
    async (targetCursor?: string | null, targetPage?: number, customPerPage?: number) => {
      if (!canView) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const activePerPage = customPerPage !== undefined ? customPerPage : perPage;
        const activeCursor = targetCursor !== undefined ? targetCursor : cursor;
        const activePage = targetPage !== undefined ? targetPage : page;

        const res = await companyService.getCompanies({
          search: search.trim() || undefined,
          perPage: activePerPage,
          cursor: activeCursor || undefined,
        });

        if (res?.data) {
          setCompanies(res.data);
          setPage(activePage);
          setCursor(activeCursor || null);
          setNextCursor(res.meta?.next_cursor || null);
          setHasMore(Boolean(res.meta?.has_more));
          setTotal(res.meta?.total ?? res.data.length);
        }
      } catch {
        toast.error("Không thể tải danh sách công ty");
      } finally {
        setIsLoading(false);
      }
    },
    [search, perPage, cursor, page, canView]
  );

  React.useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    setPage(1);
    setCursor(null);
    setCursorHistory([null]);
    fetchCompanies(null, 1);
  }, [search, canView]);

  const handleNextPage = async () => {
    if (!nextCursor || isLoading) return;
    const nextPageNum = page + 1;
    const history = [...cursorHistory];
    history[nextPageNum - 1] = nextCursor;
    setCursorHistory(history);
    await fetchCompanies(nextCursor, nextPageNum);
  };

  const handlePrevPage = async () => {
    if (page <= 1 || isLoading) return;
    const prevPageNum = page - 1;
    const prevTargetCursor = cursorHistory[prevPageNum - 1] ?? null;
    await fetchCompanies(prevTargetCursor, prevPageNum);
  };

  const handleFirstPage = async () => {
    if (page === 1 || isLoading) return;
    setCursorHistory([null]);
    await fetchCompanies(null, 1);
  };

  const handlePerPageChange = async (val: string) => {
    const num = Number(val);
    setPerPage(num);
    setPage(1);
    setCursor(null);
    setCursorHistory([null]);
    await fetchCompanies(null, 1, num);
  };

  const handleDelete = async (comp: Company) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa công ty "${comp.name}"? Dữ liệu liên kết phòng ban sẽ được giải phóng.`
      )
    ) {
      return;
    }

    setIsDeleting(comp.id);
    try {
      const res = await companyService.deleteCompany(comp.id);
      toast.success(res.message || "Đã xóa công ty thành công");
      setCompanies((prev) => prev.filter((c) => c.id !== comp.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa công ty");
    } finally {
      setIsDeleting(null);
    }
  };

  const totalCompanies = total || companies.length;
  const companiesWithHead = companies.filter((c) => !!c.headUserId).length;
  const totalAssignedDepts = companies.reduce((acc, cur) => acc + (cur.departmentsCount || 0), 0);

  if (!canView) {
    return <AccessDenied moduleName="công ty" />;
  }

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link href="/departments" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              <span>Quản lý tổ chức</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Công ty</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            <span>Danh mục công ty</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCompanies(cursor, page)}
            className="rounded-xl text-xs gap-1.5 h-9 bg-card shadow-2xs hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Làm mới</span>
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => router.push("/companies/create")}
              className="rounded-xl text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm công ty mới</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng số công ty</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalCompanies}</span>
            <span className="text-xs text-muted-foreground">pháp nhân / đơn vị</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đã có người đại diện</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{companiesWithHead}</span>
            <span className="text-xs text-muted-foreground">công ty có lãnh đạo</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng phòng ban liên kết</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalAssignedDepts}</span>
            <span className="text-xs text-muted-foreground">phòng ban trực thuộc</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên công ty, mã đơn vị, người đại diện..."
            className="pl-9 rounded-xl h-10 text-xs"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
            <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Đang tải danh sách công ty...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 p-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Không tìm thấy công ty nào</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Không có dữ liệu phù hợp với điều kiện tìm kiếm hoặc hệ thống chưa có dữ liệu công ty.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/companies/create")}
              className="rounded-xl text-xs gap-1.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm công ty ngay</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4 w-16">Mã</th>
                  <th className="py-3 px-4 min-w-[200px]">Tên công ty</th>
                  <th className="py-3 px-4 min-w-[220px]">Người đại diện / Giám đốc</th>
                  <th className="py-3 px-4 min-w-[240px]">Phòng ban trực thuộc</th>
                  <th className="py-3 px-4 w-32">Ngày tạo</th>
                  <th className="py-3 px-4 w-16 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {companies.map((comp) => {
                  return (
                    <tr
                      key={comp.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {comp.code}
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/companies/${comp.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group-hover:underline"
                        >
                          <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{comp.name}</span>
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        {comp.headUserName ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 rounded-xl border border-border/80">
                              <AvatarImage src={comp.headUserAvatar || undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                {comp.headUserName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{comp.headUserName}</p>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                                <span>{comp.headUserPosition || comp.headUserEmail || "Đại diện công ty"}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Chưa bổ nhiệm</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {comp.departments && comp.departments.length > 0 ? (
                            <>
                              {comp.departments.slice(0, 3).map((dept) => (
                                <Link
                                  key={dept.id}
                                  href={`/departments/${dept.id}`}
                                  className="inline-flex"
                                >
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-2 py-0.5 rounded-lg border-border/80 hover:bg-primary/10 hover:border-primary/40 transition-colors cursor-pointer"
                                  >
                                    {dept.name}
                                  </Badge>
                                </Link>
                              ))}
                              {comp.departments.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0.5 rounded-lg"
                                >
                                  +{comp.departments.length - 3}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Chưa gắn phòng ban nào
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {comp.createdAt ? comp.createdAt.substring(0, 10) : "-"}
                      </td>

                      <td className="py-3 px-4 text-right">
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
                          <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
                            <DropdownMenuItem
                              onClick={() => router.push(`/companies/${comp.id}`)}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Xem chi tiết</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => router.push(`/companies/${comp.id}/edit`)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-500" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              disabled={isDeleting === comp.id}
                              onClick={() => handleDelete(comp)}
                              className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              <span>Xóa công ty</span>
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
        )}

        {!isLoading && companies.length > 0 && (
          <div className="py-3 px-4 border-t border-border/70 bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
              <span>
                Hiển thị <span className="font-semibold text-foreground">{companies.length}</span> / tổng số{" "}
                <span className="font-semibold text-foreground">{total}</span> công ty
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
        )}
      </div>
    </div>
  );
}

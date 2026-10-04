"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Send,
  Save,
  Users,
  Eye,
  Building2,
  Search,
  Bell,
  BellRing,
  RotateCcw,
  Check,
} from "lucide-react";
import { reportService } from "@/modules/tasks/services/reportService";
import { DailyReport, DailyReportItem, DailyReportStatus } from "@/modules/tasks/types";
import { DepartmentId } from "@/shared/types";
import { useUserStore } from "@/shared/store/useUserStore";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { UserAvatar } from "@/shared/components/UserAvatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export default function DailyReportPage() {
  const { currentUser, users } = useUserStore();
  const { fetchTasks } = useTaskStore();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = React.useState(todayStr);
  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Bộ lọc phòng ban & tìm kiếm
  const [selectedDepartment, setSelectedDepartment] = React.useState<DepartmentId | "ALL">(() => {
    if (currentUser.role === "ADMIN") return "ALL";
    return (currentUser.departmentId as DepartmentId) || "ALL";
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "SUBMITTED" | "NOT_SUBMITTED">("ALL");

  // Form states for Employee report
  const [todayWorks, setTodayWorks] = React.useState<DailyReportItem[]>([
    {
      id: "work-1",
      taskTitle: "",
      hoursSpent: 4,
      status: "IN_PROGRESS",
      note: "",
    },
  ]);
  const [tomorrowPlans, setTomorrowPlans] = React.useState("");
  const [blockers, setBlockers] = React.useState("");
  const [existingReport, setExistingReport] = React.useState<DailyReport | null>(null);

  // Modal xem chi tiết báo cáo thành viên (cho Manager)
  const [viewingReport, setViewingReport] = React.useState<DailyReport | null>(null);

  const isManagerOrAdmin =
    currentUser.role === "ADMIN" ||
    currentUser.role === "MANAGER" ||
    currentUser.role === "LEAD";

  // Khi switch user, đồng bộ phòng ban tương ứng
  React.useEffect(() => {
    if (currentUser.role === "ADMIN") {
      setSelectedDepartment("ALL");
    } else if (currentUser.departmentId) {
      setSelectedDepartment(currentUser.departmentId as DepartmentId);
    }
  }, [currentUser.id, currentUser.role, currentUser.departmentId]);

  // Tải danh sách báo cáo
  const loadReports = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getReports({
        departmentId: selectedDepartment === "ALL" ? "ALL" : selectedDepartment,
        date: selectedDate,
      });
      setReports(data);

      // Tìm báo cáo của chính user hôm nay
      const myReport = await reportService.getReportByUserAndDate(currentUser.id, todayStr);
      setExistingReport(myReport);
      if (myReport) {
        setTodayWorks(myReport.todayWorks);
        setTomorrowPlans(myReport.tomorrowPlans);
        setBlockers(myReport.blockers || "");
      }
    } catch {
      toast.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, selectedDepartment, selectedDate, todayStr]);

  React.useEffect(() => {
    fetchTasks();
    loadReports();
  }, [loadReports, fetchTasks]);

  // Thêm dòng công việc trong ngày
  const handleAddWorkItem = () => {
    setTodayWorks((prev) => [
      ...prev,
      {
        id: `work-${Date.now()}`,
        taskTitle: "",
        hoursSpent: 2,
        status: "IN_PROGRESS",
        note: "",
      },
    ]);
  };

  const handleRemoveWorkItem = (id: string) => {
    if (todayWorks.length <= 1) {
      toast.error("Báo cáo cần có ít nhất một đầu việc");
      return;
    }
    setTodayWorks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateWorkItem = (
    id: string,
    field: keyof DailyReportItem,
    value: string | number
  ) => {
    setTodayWorks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Nộp hoặc lưu nháp báo cáo
  const handleSaveReport = async (status: DailyReportStatus) => {
    const invalidItems = todayWorks.filter((w) => !w.taskTitle.trim());
    if (invalidItems.length > 0) {
      toast.error("Vui lòng nhập tên cho tất cả các đầu việc đã làm hôm nay!");
      return;
    }

    if (status === "SUBMITTED" && (!tomorrowPlans.trim() || tomorrowPlans.trim().length < 5)) {
      toast.error("Vui lòng ghi rõ kế hoạch ngày mai trước khi nộp chính thức!");
      return;
    }

    try {
      await reportService.saveReport({
        id: existingReport?.id,
        userId: currentUser.id,
        departmentId: currentUser.departmentId,
        date: todayStr,
        status,
        todayWorks,
        tomorrowPlans,
        blockers,
      });

      toast.success(
        status === "SUBMITTED"
          ? "Đã nộp báo cáo ngày thành công!"
          : "Đã lưu bản nháp báo cáo!"
      );
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu báo cáo";
      toast.error(msg);
    }
  };

  // Gửi thông báo nhắc nhở 1 nhân sự
  const handleRemindUser = (userName: string) => {
    toast.info(`Đã gửi thông báo nhắc nhở nộp báo cáo ngày ${formatDate(selectedDate, "dd/MM")} tới ${userName}`);
  };

  // Gửi thông báo nhắc nhở tất cả nhân sự chưa nộp
  const handleRemindAll = (count: number) => {
    if (count === 0) {
      toast.success("Tất cả nhân sự trong phòng ban đã hoàn thành nộp báo cáo!");
      return;
    }
    toast.success(`Đã gửi thông báo đẩy nhắc nhở tới ${count} nhân sự chưa nộp báo cáo!`);
  };

  // Toàn bộ nhân viên trong phòng ban được chọn (không tính Admin hệ thống)
  const departmentAllUsers = React.useMemo(() => {
    let list = users.filter((u) => u.role !== "ADMIN");
    if (selectedDepartment !== "ALL") {
      list = list.filter((u) => u.departmentId === selectedDepartment);
    }
    return list;
  }, [users, selectedDepartment]);

  // Set các ID nhân viên đã nộp báo cáo chính thức (SUBMITTED) trong ngày được chọn
  const submittedUserIds = React.useMemo(() => {
    return new Set(
      reports
        .filter((r) => r.status === "SUBMITTED" && r.date === selectedDate)
        .map((r) => r.userId)
    );
  }, [reports, selectedDate]);

  const submittedCount = departmentAllUsers.filter((u) => submittedUserIds.has(u.id)).length;
  const notSubmittedCount = departmentAllUsers.length - submittedCount;

  // Danh sách nhân sự hiển thị sau khi lọc tìm kiếm và trạng thái
  const filteredUsers = React.useMemo(() => {
    let list = departmentAllUsers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.title.toLowerCase().includes(q)
      );
    }

    if (statusFilter === "SUBMITTED") {
      list = list.filter((u) => submittedUserIds.has(u.id));
    } else if (statusFilter === "NOT_SUBMITTED") {
      list = list.filter((u) => !submittedUserIds.has(u.id));
    }

    return list;
  }, [departmentAllUsers, searchQuery, statusFilter, submittedUserIds]);

  const isFutureDate = selectedDate > todayStr;

  // Lấy thông tin user đang được xem báo cáo trong Modal
  const viewingUser = React.useMemo(() => {
    if (!viewingReport) return null;
    return users.find((u) => u.id === viewingReport.userId);
  }, [viewingReport, users]);

  const viewingDept = React.useMemo(() => {
    if (!viewingReport) return null;
    return MOCK_DEPARTMENTS.find((d) => d.id === viewingReport.departmentId);
  }, [viewingReport]);

  const viewingTotalHours = React.useMemo(() => {
    if (!viewingReport) return 0;
    return viewingReport.todayWorks.reduce((acc, curr) => acc + (Number(curr.hoursSpent) || 0), 0);
  }, [viewingReport]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span>Báo cáo Công việc Hằng ngày</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Ghi nhận tiến độ công việc trong ngày, kế hoạch ngày tiếp theo và theo dõi báo cáo phòng ban.
          </p>
        </div>

        {/* Date Selector & Department Quick Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc phòng ban ở Header */}
          <div className="w-[200px]">
            <Select
              value={selectedDepartment}
              onValueChange={(val) => setSelectedDepartment(val as DepartmentId | "ALL")}
            >
              <SelectTrigger className="h-9 rounded-xl bg-card border-border/80 text-xs shadow-2xs font-medium">
                <Building2 className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
                <SelectValue placeholder="Chọn phòng ban">
                  {selectedDepartment === "ALL"
                    ? "Tất cả phòng ban"
                    : MOCK_DEPARTMENTS.find((d) => d.id === selectedDepartment)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="font-semibold">🏢 Tất cả phòng ban</span>
                </SelectItem>
                {MOCK_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span>{dept.name} ({dept.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border/80 shadow-2xs">
            <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 w-34"
            />
            {selectedDate !== todayStr && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(todayStr)}
                className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 rounded-lg"
              >
                Hôm nay
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-report" className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="my-report" className="rounded-lg text-xs font-semibold px-4">
            Báo cáo của tôi ({formatDate(todayStr, "dd/MM")})
          </TabsTrigger>
          {isManagerOrAdmin && (
            <TabsTrigger value="team-reports" className="rounded-lg text-xs font-semibold px-4 gap-1.5">
              <span>Theo dõi Phòng ban</span>
              <span className="bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded-full font-bold">
                {submittedCount}/{departmentAllUsers.length} đã nộp
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: BÁO CÁO CỦA TÔI */}
        <TabsContent value="my-report">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div className="flex items-center gap-3">
                <UserAvatar user={currentUser} size="md" />
                <div>
                  <h3 className="font-semibold text-base text-foreground">{currentUser.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    Ngày báo cáo: {formatDate(todayStr, "EEEE, dd/MM/yyyy")}
                  </span>
                </div>
              </div>

              {existingReport ? (
                <Badge
                  variant={existingReport.status === "SUBMITTED" ? "success" : "warning"}
                  className="text-xs px-2.5 py-1"
                >
                  {existingReport.status === "SUBMITTED"
                    ? "Đã nộp báo cáo"
                    : "Đang lưu nháp"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground">
                  Chưa nộp hôm nay
                </Badge>
              )}
            </div>

            {/* Mục 1: Việc đã làm hôm nay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>1. Công việc đã thực hiện hôm nay</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWorkItem}
                  className="h-8 gap-1.5 text-xs rounded-lg"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm đầu việc</span>
                </Button>
              </div>

              <div className="space-y-3">
                {todayWorks.map((work, idx) => (
                  <div
                    key={work.id}
                    className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/20 items-start sm:items-center"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Tên công việc */}
                    <div className="flex-1 w-full">
                      <Input
                        placeholder="Nhập tên việc hoặc mã task (ví dụ: ERP-101)..."
                        value={work.taskTitle}
                        onChange={(e) =>
                          handleUpdateWorkItem(work.id, "taskTitle", e.target.value)
                        }
                        className="h-9 text-xs bg-background"
                      />
                    </div>

                    {/* Số giờ */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0.5"
                        max="16"
                        step="0.5"
                        value={work.hoursSpent}
                        onChange={(e) =>
                          handleUpdateWorkItem(
                            work.id,
                            "hoursSpent",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-9 text-xs w-20 bg-background text-center font-mono font-medium"
                      />
                      <span className="text-xs text-muted-foreground">giờ</span>
                    </div>

                    {/* Nút xóa */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveWorkItem(work.id)}
                      className="h-9 w-9 text-muted-foreground hover:text-rose-500 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mục 2: Kế hoạch ngày mai */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                <span>2. Kế hoạch công việc ngày mai</span>
                <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="- Hoàn thiện giao diện báo cáo ngày&#10;- Kiểm thử tính năng kéo thả Kanban&#10;- Báo cáo tiến độ cho Trưởng phòng..."
                value={tomorrowPlans}
                onChange={(e) => setTomorrowPlans(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Mục 3: Khó khăn / Đề xuất */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>3. Vấn đề vướng mắc / Cần hỗ trợ (Không bắt buộc)</span>
              </label>
              <Textarea
                rows={2}
                placeholder="Nêu rõ khó khăn cần cấp trên hỗ trợ hoặc các dependency đang bị chặn..."
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveReport("DRAFT")}
                className="gap-2 text-xs h-9"
              >
                <Save className="h-4 w-4" />
                <span>Lưu bản nháp</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveReport("SUBMITTED")}
                className="gap-2 text-xs h-9 bg-primary shadow-sm shadow-primary/20"
              >
                <Send className="h-4 w-4" />
                <span>Nộp báo cáo ngày</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: THEO DÕI BÁO CÁO PHÒNG BAN (CHO MANAGER & ADMIN) */}
        {isManagerOrAdmin && (
          <TabsContent value="team-reports" className="space-y-5">
            {/* Quick Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedDepartment("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                  selectedDepartment === "ALL"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card hover:bg-muted text-muted-foreground border-border/80"
                )}
              >
                Tất cả phòng ban ({users.filter((u) => u.role !== "ADMIN").length})
              </button>
              {MOCK_DEPARTMENTS.map((dept) => {
                const count = users.filter((u) => u.departmentId === dept.id && u.role !== "ADMIN").length;
                const isSelected = selectedDepartment === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5",
                      isSelected
                        ? "bg-card text-foreground border-primary ring-1 ring-primary shadow-2xs"
                        : "bg-card hover:bg-muted text-muted-foreground border-border/80"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span>{dept.code}</span>
                    <span className="text-[10px] opacity-75 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Toolbar & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative min-w-[200px] max-w-xs flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, chức danh, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 pl-8 text-xs bg-background/50 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="w-[160px]">
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as "ALL" | "SUBMITTED" | "NOT_SUBMITTED")}
                  >
                    <SelectTrigger className="h-8.5 rounded-xl bg-background/50 text-xs">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                      <SelectItem value="SUBMITTED">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Đã nộp báo cáo</span>
                      </SelectItem>
                      <SelectItem value="NOT_SUBMITTED">
                        <span className="text-rose-600 dark:text-rose-400 font-medium">✕ Chưa nộp báo cáo</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(searchQuery || statusFilter !== "ALL" || selectedDepartment !== "ALL") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                      setSelectedDepartment("ALL");
                    }}
                    className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-xl"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại</span>
                  </Button>
                )}
              </div>

              {/* Remind All Button */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemindAll(notSubmittedCount)}
                  className="h-8.5 text-xs gap-1.5 rounded-xl border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  disabled={notSubmittedCount === 0 || isFutureDate}
                >
                  <BellRing className="h-3.5 w-3.5 text-amber-500" />
                  <span>Nhắc tất cả chưa nộp ({notSubmittedCount})</span>
                </Button>
              </div>
            </div>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                <span className="text-xs text-muted-foreground font-medium">
                  Tổng nhân sự ({selectedDepartment === "ALL" ? "Toàn công ty" : `Phòng ${selectedDepartment.toUpperCase()}`})
                </span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {departmentAllUsers.length} người
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Đã nộp báo cáo
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                    {departmentAllUsers.length > 0 ? Math.round((submittedCount / departmentAllUsers.length) * 100) : 0}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {submittedCount} người
                </div>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/20 p-4 shadow-2xs">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Chưa nộp báo cáo
                </span>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {notSubmittedCount} người
                </div>
              </div>
            </div>

            {/* Bảng danh sách nhân viên */}
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Nhân viên</th>
                    <th className="py-3 px-4">Chức vụ</th>
                    <th className="py-3 px-4">Phòng ban</th>
                    <th className="py-3 px-4">Giờ nộp</th>
                    <th className="py-3 px-4">Trạng thái ngày {formatDate(selectedDate, "dd/MM")}</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                        Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      // Tìm đúng báo cáo ĐÃ NỘP của nhân sự trong NGÀY ĐANG CHỌN
                      const userReport = reports.find(
                        (r) => r.userId === user.id && r.date === selectedDate
                      );
                      const isSubmitted = userReport?.status === "SUBMITTED";
                      const dept = MOCK_DEPARTMENTS.find((d) => d.id === user.departmentId);

                      return (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={user} size="sm" />
                              <div>
                                <span className="font-semibold text-xs text-foreground block">
                                  {user.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{user.title}</td>
                          <td className="py-3 px-4">
                            {dept && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold gap-1"
                                style={{ borderColor: `${dept.color}40` }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: dept.color }}
                                />
                                <span>{dept.code}</span>
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                            {isSubmitted && userReport?.submittedAt ? (
                              formatDate(userReport.submittedAt, "HH:mm")
                            ) : (
                              <span className="italic text-muted-foreground/60">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isSubmitted ? (
                              <Badge variant="success" className="text-[11px] gap-1 shadow-2xs font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Đã nộp</span>
                              </Badge>
                            ) : isFutureDate ? (
                              <Badge variant="outline" className="text-[11px] gap-1 text-muted-foreground border-dashed">
                                <Clock className="h-3 w-3" />
                                <span>Chưa đến ngày</span>
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[11px] gap-1 shadow-2xs font-medium">
                                <AlertCircle className="h-3 w-3" />
                                <span>Chưa nộp</span>
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {/* CHỈ HIỂN THỊ NÚT "XEM BÁO CÁO" KHI ĐÃ NỘP CHÍNH THỨC */}
                            {isSubmitted && userReport ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingReport(userReport)}
                                className="h-7.5 px-3 text-xs gap-1.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary font-medium rounded-lg transition-all"
                              >
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span>Xem báo cáo</span>
                              </Button>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-xs text-muted-foreground/50 italic mr-1">-</span>
                                {!isFutureDate && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemindUser(user.name)}
                                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1 rounded-md transition-colors"
                                    title={`Gửi thông báo nhắc nộp báo cáo tới ${user.name}`}
                                  >
                                    <Bell className="h-3 w-3 text-amber-500" />
                                    <span>Nhắc nộp</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog xem chi tiết báo cáo thành viên */}
      <Dialog
        open={Boolean(viewingReport)}
        onOpenChange={(open) => !open && setViewingReport(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4 pb-2 border-b border-border/70">
              <div className="flex items-center gap-3">
                {viewingUser && <UserAvatar user={viewingUser} size="md" />}
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {viewingUser?.name || "Báo cáo công việc"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {viewingUser?.title} • {viewingDept?.name} ({viewingDept?.code})
                  </p>
                </div>
              </div>
              <Badge variant="success" className="text-xs px-2.5 py-1 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  {viewingReport?.submittedAt
                    ? `Nộp lúc ${formatDate(viewingReport.submittedAt, "HH:mm dd/MM")}`
                    : "Đã nộp"}
                </span>
              </Badge>
            </div>
          </DialogHeader>

          {viewingReport && (
            <div className="space-y-4 py-2 text-xs">
              {/* Thống kê giờ làm */}
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/70">
                <span className="text-muted-foreground font-medium">
                  Ngày báo cáo: <strong className="text-foreground">{formatDate(viewingReport.date, "EEEE, dd/MM/yyyy")}</strong>
                </span>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  Tổng thời gian: {viewingTotalHours} giờ
                </span>
              </div>

              {/* Mục 1: Việc đã làm */}
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5 text-xs">
                  <span>1. Các đầu việc đã thực hiện trong ngày:</span>
                </h4>
                <div className="space-y-2">
                  {viewingReport.todayWorks.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors space-y-1"
                    >
                      <div className="flex justify-between items-start text-foreground">
                        <span className="font-medium text-xs">• {w.taskTitle}</span>
                        <span className="font-mono text-primary font-bold shrink-0 ml-2 bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                          {w.hoursSpent}h
                        </span>
                      </div>
                      {w.note && (
                        <p className="text-[11px] text-muted-foreground pl-2.5 border-l-2 border-primary/40">
                          {w.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mục 2: Kế hoạch ngày mai */}
              <div>
                <h4 className="font-semibold text-foreground mb-1.5 text-xs">
                  2. Kế hoạch công việc ngày tiếp theo:
                </h4>
                <p className="p-3 rounded-xl border border-border/70 bg-muted/20 whitespace-pre-line text-muted-foreground text-xs leading-relaxed">
                  {viewingReport.tomorrowPlans}
                </p>
              </div>

              {/* Mục 3: Vướng mắc */}
              {viewingReport.blockers && (
                <div>
                  <h4 className="font-semibold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1.5 text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>3. Vấn đề vướng mắc / Cần hỗ trợ:</span>
                  </h4>
                  <p className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
                    {viewingReport.blockers}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border/70 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewingReport(null)}
              className="text-xs h-8.5 rounded-xl"
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                toast.success(`Đã xác nhận và đánh dấu đã duyệt báo cáo của ${viewingUser?.name || "nhân viên"}!`);
                setViewingReport(null);
              }}
              className="text-xs h-8.5 rounded-xl bg-primary gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Xác nhận đã xem</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

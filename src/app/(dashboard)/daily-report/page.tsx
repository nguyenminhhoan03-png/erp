"use client";

import * as React from "react";
import { format } from "date-fns";
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
  Eye,
  Building2,
  Search,
  Bell,
  BellRing,
  RotateCcw,
  Check,
  Paperclip,
  UploadCloud,
  X,
  FileText,
  UserCheck,
  ShieldCheck,
  History,
  MessageSquare,
  XCircle,
  CalendarDays,
  PenLine,
  ClipboardCheck,
  Edit,
} from "lucide-react";
import { reportService } from "@/modules/tasks/services/reportService";
import {
  DailyReport,
  DailyReportItem,
  DailyReportStatus,
  DailyReportType,
  ReportFeedback,
} from "@/modules/tasks/types";
import { DepartmentId, User } from "@/shared/types";
import { useUserStore } from "@/shared/store/useUserStore";
import { useTaskStore } from "@/modules/tasks/store/taskStore";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { UserSingleSelect } from "@/modules/tasks/components/form/UserSingleSelect";
import { UserMultiSelect } from "@/modules/tasks/components/form/UserMultiSelect";
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

interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  url: string;
}

export default function DailyReportPage() {
  const { currentUser, users, departments } = useUserStore();
  const { fetchTasks } = useTaskStore();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = React.useState(todayStr);
  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [recentReports, setRecentReports] = React.useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [reportType, setReportType] = React.useState<DailyReportType>("daily");
  const [selectedDepartment, setSelectedDepartment] = React.useState<DepartmentId | "ALL">(() => {
    if (currentUser.role === "ADMIN") return "ALL";
    return (currentUser.departmentId as DepartmentId) || "ALL";
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "SUBMITTED" | "NOT_SUBMITTED">("ALL");

  const [approverId, setApproverId] = React.useState<string>("");
  const [ccRecipientIds, setCcRecipientIds] = React.useState<string[]>([]);

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
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([]);
  const [existingReport, setExistingReport] = React.useState<DailyReport | null>(null);

  const [viewingReport, setViewingReport] = React.useState<DailyReport | null>(null);
  const [feedbackInput, setFeedbackInput] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isManagerOrAdmin =
    currentUser.role === "ADMIN" ||
    currentUser.role === "MANAGER" ||
    currentUser.role === "LEAD";

  const potentialApprovers = React.useMemo(() => {
    return users.filter(
      (u) =>
        u.id !== currentUser.id &&
        (u.role === "ADMIN" || u.role === "MANAGER" || u.role === "LEAD")
    );
  }, [users, currentUser.id]);

  const potentialCcUsers = React.useMemo(() => {
    return users.filter((u) => u.id !== currentUser.id && u.id !== approverId);
  }, [users, currentUser.id, approverId]);

  const [activeTab, setActiveTab] = React.useState<string>("my-report");
  const [myAllReports, setMyAllReports] = React.useState<DailyReport[]>([]);
  const [historySearch, setHistorySearch] = React.useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = React.useState("ALL");
  const [historyTypeFilter, setHistoryTypeFilter] = React.useState("ALL");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "team-reports" && isManagerOrAdmin) {
        setActiveTab("team-reports");
      } else if (tab === "my-history") {
        setActiveTab("my-history");
      } else if (tab === "my-report" || tab === "create") {
        setActiveTab("my-report");
      }
    }
  }, [isManagerOrAdmin]);

  React.useEffect(() => {
    if (currentUser.role === "ADMIN") {
      setSelectedDepartment("ALL");
    } else if (currentUser.departmentId) {
      setSelectedDepartment(currentUser.departmentId as DepartmentId);
    }
  }, [currentUser.id, currentUser.role, currentUser.departmentId]);

  const loadReports = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getReports({
        departmentId: selectedDepartment === "ALL" ? "ALL" : selectedDepartment,
        date: selectedDate,
      });
      setReports(data);

      const allUserReports = await reportService.getReports({
        userId: currentUser.id,
      });
      setMyAllReports(allUserReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      const recent = await reportService.getRecentReports(currentUser.id, 5);
      setRecentReports(recent);

      const myReport = await reportService.getReportByUserAndDate(currentUser.id, selectedDate);
      setExistingReport(myReport);
      if (myReport) {
        setReportType(myReport.type || "daily");
        setTodayWorks(
          myReport.todayWorks && myReport.todayWorks.length > 0
            ? myReport.todayWorks
            : [{ id: "work-1", taskTitle: "", hoursSpent: 4, status: "IN_PROGRESS", note: "" }]
        );
        setTomorrowPlans(myReport.tomorrowPlans || "");
        setBlockers(myReport.blockers || "");
        setApproverId(myReport.approverId || "");
        setCcRecipientIds(myReport.ccRecipientIds || []);
        if (myReport.attachments && Array.isArray(myReport.attachments)) {
          setAttachments(
            myReport.attachments.map((name, i) => ({
              id: `att-${i}`,
              name,
              size: "1.2 MB",
              url: "#",
            }))
          );
        } else {
          setAttachments([]);
        }
      } else {
        setTodayWorks([
          {
            id: "work-1",
            taskTitle: "",
            hoursSpent: 4,
            status: "IN_PROGRESS",
            note: "",
          },
        ]);
        setTomorrowPlans("");
        setBlockers("");
        setAttachments([]);
        if (potentialApprovers.length > 0 && !approverId) {
          setApproverId(potentialApprovers[0].id);
        }
      }
    } catch {
      toast.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, selectedDepartment, selectedDate, potentialApprovers, approverId]);

  React.useEffect(() => {
    fetchTasks();
    loadReports();
  }, [loadReports, fetchTasks]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: AttachmentItem[] = Array.from(files).map((f) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      url: URL.createObjectURL(f),
    }));

    setAttachments((prev) => [...prev, ...newItems]);
    toast.success(`Đã đính kèm ${files.length} tệp tin`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveReport = async (status: DailyReportStatus) => {
    const invalidItems = todayWorks.filter((w) => !w.taskTitle.trim());
    if (invalidItems.length > 0) {
      toast.error("Vui lòng nhập tên cho tất cả các đầu việc đã thực hiện!");
      return;
    }

    if (status === "SUBMITTED" || status === "submitted") {
      if (!approverId) {
        toast.error("Vui lòng chọn Người duyệt trước khi nộp báo cáo!");
        return;
      }
      if (!tomorrowPlans.trim() || tomorrowPlans.trim().length < 5) {
        toast.error("Vui lòng ghi rõ kế hoạch tiếp theo trước khi nộp chính thức!");
        return;
      }
    }

    try {
      const saved = await reportService.saveReport({
        id: existingReport?.id,
        userId: currentUser.id,
        type: reportType,
        departmentId: currentUser.departmentId,
        date: selectedDate,
        status,
        todayWorks,
        tomorrowPlans,
        blockers,
        approverId: approverId || undefined,
        ccRecipientIds,
        attachments: attachments.map((a) => a.name),
        feedbacks: existingReport?.feedbacks,
      });

      setExistingReport(saved);
      toast.success(
        status === "SUBMITTED" || status === "submitted"
          ? "Đã nộp báo cáo thành công!"
          : "Đã lưu bản nháp báo cáo!"
      );
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu báo cáo";
      toast.error(msg);
    }
  };

  const handleSendFeedback = async (reportId: string) => {
    if (!feedbackInput.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi!");
      return;
    }
    try {
      const updated = await reportService.addFeedback(reportId, {
        feedbackBy: currentUser.id,
        feedbackContent: feedbackInput.trim(),
      });
      setFeedbackInput("");
      setExistingReport(updated);
      if (viewingReport && viewingReport.id === reportId) {
        setViewingReport(updated);
      }
      toast.success("Đã gửi phản hồi thành công!");
      loadReports();
    } catch {
      toast.error("Không thể gửi phản hồi");
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: DailyReportStatus) => {
    try {
      const updated = await reportService.updateReportStatus(reportId, newStatus);
      setExistingReport(updated);
      if (viewingReport && viewingReport.id === reportId) {
        setViewingReport(updated);
      }
      toast.success(
        newStatus === "APPROVED" || newStatus === "approved"
          ? "Đã duyệt báo cáo thành công!"
          : "Đã từ chối/yêu cầu sửa báo cáo!"
      );
      loadReports();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleRemindUser = (userName: string) => {
    toast.info(`Đã gửi thông báo nhắc nhở nộp báo cáo ngày ${formatDate(selectedDate, "dd/MM")} tới ${userName}`);
  };

  const handleRemindAll = (count: number) => {
    if (count === 0) {
      toast.success("Tất cả nhân sự trong phòng ban đã hoàn thành nộp báo cáo!");
      return;
    }
    toast.success(`Đã gửi thông báo đẩy nhắc nhở tới ${count} nhân sự chưa nộp báo cáo!`);
  };

  const departmentAllUsers = React.useMemo(() => {
    let list = users.filter((u) => u.role !== "ADMIN");
    if (selectedDepartment !== "ALL") {
      list = list.filter((u) => u.departmentId === selectedDepartment);
    }
    return list;
  }, [users, selectedDepartment]);

  const submittedUserIds = React.useMemo(() => {
    return new Set(
      reports
        .filter(
          (r) =>
            (r.status === "SUBMITTED" || r.status === "submitted" || r.status === "APPROVED" || r.status === "approved") &&
            r.date === selectedDate
        )
        .map((r) => r.userId)
    );
  }, [reports, selectedDate]);

  const submittedCount = departmentAllUsers.filter((u) => submittedUserIds.has(u.id)).length;
  const notSubmittedCount = departmentAllUsers.length - submittedCount;

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

  const viewingUser = React.useMemo(() => {
    if (!viewingReport) return null;
    return users.find((u) => u.id === viewingReport.userId);
  }, [viewingReport, users]);

  const filteredMyReports = React.useMemo(() => {
    return myAllReports.filter((r) => {
      if (historyStatusFilter !== "ALL" && r.status !== historyStatusFilter) return false;
      if (historyTypeFilter !== "ALL" && (r.type || "daily") !== historyTypeFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const matchWork = r.todayWorks?.some((w) => w.taskTitle.toLowerCase().includes(q) || w.note?.toLowerCase().includes(q));
        const matchPlans = r.tomorrowPlans?.toLowerCase().includes(q);
        const matchDate = r.date.includes(q);
        if (!matchWork && !matchPlans && !matchDate) return false;
      }
      return true;
    });
  }, [myAllReports, historyStatusFilter, historyTypeFilter, historySearch]);

  const viewingDept = React.useMemo(() => {
    if (!viewingReport) return null;
    return departments.find((d) => d.id === viewingReport.departmentId);
  }, [viewingReport, departments]);

  const viewingApprover = React.useMemo(() => {
    if (!viewingReport?.approverId) return null;
    return users.find((u) => u.id === viewingReport.approverId);
  }, [viewingReport, users]);

  const viewingCcUsers = React.useMemo(() => {
    if (!viewingReport?.ccRecipientIds) return [];
    return users.filter((u) => viewingReport.ccRecipientIds?.includes(u.id));
  }, [viewingReport, users]);

  const viewingTotalHours = React.useMemo(() => {
    if (!viewingReport?.todayWorks) return 0;
    return viewingReport.todayWorks.reduce((acc, curr) => acc + (Number(curr.hoursSpent) || 0), 0);
  }, [viewingReport]);

  const selectedApproverUser = React.useMemo(() => {
    return users.find((u) => u.id === approverId);
  }, [users, approverId]);

  const selectedCcUsersList = React.useMemo(() => {
    return users.filter((u) => ccRecipientIds.includes(u.id));
  }, [users, ccRecipientIds]);

  const getStatusBadge = (status?: DailyReportStatus) => {
    switch (status) {
      case "APPROVED":
      case "approved":
        return (
          <Badge variant="success" className="text-xs px-2.5 py-1 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Đã duyệt</span>
          </Badge>
        );
      case "REJECTED":
      case "rejected":
        return (
          <Badge variant="destructive" className="text-xs px-2.5 py-1 gap-1">
            <XCircle className="h-3 w-3" />
            <span>Cần sửa / Từ chối</span>
          </Badge>
        );
      case "SUBMITTED":
      case "submitted":
        return (
          <Badge className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-2.5 py-1 gap-1">
            <Send className="h-3 w-3" />
            <span>Đã nộp</span>
          </Badge>
        );
      case "DRAFT":
      case "draft":
        return (
          <Badge variant="secondary" className="text-xs px-2.5 py-1 gap-1">
            <Save className="h-3 w-3" />
            <span>Bản nháp</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground">
            Chưa nộp
          </Badge>
        );
    }
  };

  const getTypeLabel = (type?: DailyReportType) => {
    switch (type) {
      case "monthly":
        return "Báo cáo hàng tháng";
      case "yearly":
        return "Báo cáo hàng năm";
      case "daily":
      default:
        return "Báo cáo hàng ngày";
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span>Báo cáo Công việc</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Ghi nhận tiến độ công việc, kế hoạch tiếp theo, gửi người duyệt và theo dõi báo cáo phòng ban.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-[170px]">
            <Select
              value={reportType}
              onValueChange={(val) => setReportType(val as DailyReportType)}
            >
              <SelectTrigger className="h-9 rounded-xl bg-card border-border/80 text-xs shadow-2xs font-medium">
                <CalendarDays className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
                <SelectValue placeholder="Loại báo cáo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Báo cáo ngày</SelectItem>
                <SelectItem value="monthly">Báo cáo tháng</SelectItem>
                <SelectItem value="yearly">Báo cáo năm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[190px]">
            <Select
              value={selectedDepartment}
              onValueChange={(val) => setSelectedDepartment(val as DepartmentId | "ALL")}
            >
              <SelectTrigger className="h-9 rounded-xl bg-card border-border/80 text-xs shadow-2xs font-medium">
                <Building2 className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
                <SelectValue placeholder="Chọn phòng ban">
                  {selectedDepartment === "ALL"
                    ? "Tất cả phòng ban"
                    : departments.find((d) => d.id === selectedDepartment)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="font-semibold">🏢 Tất cả phòng ban</span>
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span>
                        {dept.name} ({dept.code})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="my-report" className="rounded-lg text-xs font-semibold px-4 gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            <span>Nộp báo cáo ({formatDate(selectedDate, "dd/MM")})</span>
          </TabsTrigger>
          <TabsTrigger value="my-history" className="rounded-lg text-xs font-semibold px-4 gap-1.5">
            <History className="h-3.5 w-3.5" />
            <span>Lịch sử của tôi ({myAllReports.length})</span>
          </TabsTrigger>
          {isManagerOrAdmin && (
            <TabsTrigger value="team-reports" className="rounded-lg text-xs font-semibold px-4 gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>Duyệt & Quản lý</span>
              <span className="bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded-full font-bold">
                {submittedCount}/{departmentAllUsers.length} đã nộp
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-report">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-3">
                  <UserAvatar user={currentUser} size="md" />
                  <div>
                    <h3 className="font-semibold text-base text-foreground">{currentUser.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      Ngày báo cáo: {formatDate(selectedDate, "EEEE, dd/MM/yyyy")} • {getTypeLabel(reportType)}
                    </span>
                  </div>
                </div>

                {existingReport ? (
                  getStatusBadge(existingReport.status)
                ) : (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground">
                    Chưa tạo báo cáo
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>1. Công việc đã thực hiện trong ngày</span>
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <span>2. Kế hoạch công việc ngày tiếp theo</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  placeholder="- Tiếp tục triển khai module báo cáo&#10;- Kiểm thử tính năng phân quyền duyệt&#10;- Họp tiến độ cùng bộ phận..."
                  value={tomorrowPlans}
                  onChange={(e) => setTomorrowPlans(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>3. Vấn đề vướng mắc / Cần hỗ trợ (Không bắt buộc)</span>
                </label>
                <Textarea
                  rows={2}
                  placeholder="Nêu rõ khó khăn cần cấp trên hỗ trợ hoặc các phụ thuộc đang bị chặn..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <span>4. Tệp tin đính kèm & Minh chứng</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 gap-1.5 text-xs rounded-lg"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Đính kèm tệp</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {attachments.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-border/80 rounded-xl p-4 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground">
                      Chưa có tệp đính kèm nào. Nhấp để tải lên tệp minh chứng hoặc tài liệu báo cáo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-muted/20 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-foreground block truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{file.size}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAttachment(file.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 shrink-0 ml-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {existingReport?.feedbacks && existingReport.feedbacks.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-border/80">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>5. Lịch sử phản hồi & Nhận xét của cấp trên</span>
                  </h4>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {existingReport.feedbacks.map((fb) => {
                      const fbUser = users.find((u) => u.id === fb.feedbackBy);
                      return (
                        <div
                          key={fb.id}
                          className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {fbUser && <UserAvatar user={fbUser} size="sm" />}
                              <span className="font-semibold text-xs text-foreground">
                                {fbUser?.name || "Người đánh giá"}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(fb.createdAt, "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                            {fb.feedbackContent}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {existingReport &&
                (currentUser.id === existingReport.approverId ||
                  currentUser.role === "ADMIN" ||
                  currentUser.role === "MANAGER") && (
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
                    <span className="text-xs font-semibold text-foreground block">
                      Phản hồi hoặc phê duyệt báo cáo này
                    </span>
                    <Textarea
                      rows={2}
                      placeholder="Nhập nội dung nhận xét, phản hồi cho nhân viên..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="text-xs bg-background"
                    />
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendFeedback(existingReport.id)}
                        className="text-xs h-8"
                      >
                        Gửi phản hồi
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUpdateStatus(existingReport.id, "REJECTED")}
                          className="text-xs h-8"
                        >
                          Yêu cầu sửa lại
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUpdateStatus(existingReport.id, "APPROVED")}
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Phê duyệt báo cáo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

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
                  <span>Nộp báo cáo</span>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-4">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>Người nhận & Phê duyệt</span>
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Người duyệt báo cáo</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <UserSingleSelect
                    value={approverId}
                    onChange={(id) => setApproverId(id)}
                    users={potentialApprovers}
                    currentUser={currentUser}
                    placeholder="Chọn người duyệt..."
                    triggerClassName="w-full h-9 rounded-xl text-xs bg-muted/20"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Chỉ định Leader hoặc Trưởng bộ phận phê duyệt báo cáo.
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <UserMultiSelect
                    label="Đồng kính gửi (CC)"
                    users={potentialCcUsers}
                    selectedIds={ccRecipientIds}
                    onChange={setCcRecipientIds}
                    currentUser={currentUser}
                    placeholder="Chọn người đồng nhận..."
                    helpText="Những người nhận CC có quyền xem và phản hồi báo cáo này."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Thông tin báo cáo</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-muted-foreground">Người báo cáo:</span>
                    <span className="font-medium text-foreground">{currentUser.name}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-muted-foreground">Ngày báo cáo:</span>
                    <span className="font-medium text-foreground">
                      {formatDate(selectedDate, "dd/MM/yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-muted-foreground">Loại báo cáo:</span>
                    <span className="font-medium text-foreground">{getTypeLabel(reportType)}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <span>{getStatusBadge(existingReport?.status)}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-muted-foreground">Người duyệt:</span>
                    <span className="font-medium text-foreground">
                      {selectedApproverUser ? selectedApproverUser.name : "Chưa chọn"}
                    </span>
                  </div>

                  {selectedCcUsersList.length > 0 && (
                    <div className="space-y-1 pb-2 border-b border-border/60">
                      <span className="text-muted-foreground block">Đồng kính gửi:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCcUsersList.map((u) => (
                          <Badge
                            key={u.id}
                            variant="secondary"
                            className="text-[10px] font-normal px-2 py-0.5"
                          >
                            {u.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingReport?.submittedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ngày gửi:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(existingReport.submittedAt, "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="h-4 w-4 text-primary" />
                  <span>Báo cáo gần đây</span>
                </h4>

                {recentReports.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    Chưa có lịch sử báo cáo nào trước đó.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5 divide-y divide-border/60">
                    {recentReports.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedDate(r.date)}
                        className={cn(
                          "pt-2 first:pt-0 pb-2 cursor-pointer transition-colors group",
                          selectedDate === r.date && "opacity-100"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {getTypeLabel(r.type)} - {formatDate(r.date, "dd/MM/yyyy")}
                          </span>
                          <span className="shrink-0">{getStatusBadge(r.status)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {r.todayWorks && r.todayWorks.length > 0
                            ? r.todayWorks.map((w) => `- ${w.taskTitle}`).join(" ")
                            : r.tomorrowPlans || "Chi tiết báo cáo..."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="my-history" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
              <span className="text-xs text-muted-foreground font-medium">Tổng báo cáo của tôi</span>
              <div className="text-2xl font-bold text-foreground mt-1">
                {myAllReports.length}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Tất cả các kỳ</span>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Đã phê duyệt</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                  {myAllReports.length > 0
                    ? Math.round(
                        (myAllReports.filter(
                          (r) => r.status === "APPROVED" || r.status === "approved"
                        ).length /
                          myAllReports.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {
                  myAllReports.filter(
                    (r) => r.status === "APPROVED" || r.status === "approved"
                  ).length
                }
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Sếp đã duyệt & đánh giá</span>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 p-4 shadow-2xs">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Đang chờ duyệt</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {
                  myAllReports.filter(
                    (r) => r.status === "SUBMITTED" || r.status === "submitted"
                  ).length
                }
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Đã gửi cho người duyệt</span>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 p-4 shadow-2xs">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Cần chỉnh sửa lại</span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {
                  myAllReports.filter(
                    (r) => r.status === "REJECTED" || r.status === "rejected"
                  ).length
                }
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Sếp yêu cầu cập nhật</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[200px] max-w-sm flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo nội dung đầu việc, kế hoạch, ngày..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="h-8.5 pl-8 text-xs bg-background/50 rounded-xl"
                />
              </div>

              <div className="w-[160px]">
                <Select
                  value={historyStatusFilter}
                  onValueChange={setHistoryStatusFilter}
                >
                  <SelectTrigger className="h-8.5 rounded-xl bg-background/50 text-xs">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
                    <SelectItem value="SUBMITTED">Đang chờ duyệt</SelectItem>
                    <SelectItem value="REJECTED">Cần sửa lại</SelectItem>
                    <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[150px]">
                <Select
                  value={historyTypeFilter}
                  onValueChange={setHistoryTypeFilter}
                >
                  <SelectTrigger className="h-8.5 rounded-xl bg-background/50 text-xs">
                    <SelectValue placeholder="Loại báo cáo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả loại hình</SelectItem>
                    <SelectItem value="daily">Báo cáo ngày</SelectItem>
                    <SelectItem value="monthly">Báo cáo tháng</SelectItem>
                    <SelectItem value="yearly">Báo cáo năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(historySearch || historyStatusFilter !== "ALL" || historyTypeFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHistorySearch("");
                    setHistoryStatusFilter("ALL");
                    setHistoryTypeFilter("ALL");
                  }}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-xl"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Đặt lại</span>
                </Button>
              )}
            </div>

            <Button
              type="button"
              onClick={() => {
                setSelectedDate(todayStr);
                setActiveTab("my-report");
              }}
              className="h-8.5 text-xs font-medium gap-1.5 rounded-xl bg-primary shadow-xs"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>+ Viết báo cáo hôm nay</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
                    <th className="py-3 px-4">Ngày báo cáo</th>
                    <th className="py-3 px-4">Đầu việc trọng tâm</th>
                    <th className="py-3 px-4">Người duyệt</th>
                    <th className="py-3 px-4">Thời gian gửi</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Phản hồi của Sếp</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMyReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <span className="block font-medium">Chưa có báo cáo nào phù hợp</span>
                        <span className="text-[11px] opacity-75 mt-0.5 block">
                          Hãy chọn bộ lọc khác hoặc bắt đầu viết báo cáo công việc.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredMyReports.map((report) => {
                      const approver = users.find((u) => u.id === report.approverId);
                      const latestFb =
                        report.feedbacks && report.feedbacks.length > 0
                          ? report.feedbacks[report.feedbacks.length - 1]
                          : null;

                      return (
                        <tr
                          key={report.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer group"
                          onClick={() => setViewingReport(report)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground text-xs">
                              {formatDate(report.date, "EEEE, dd/MM/yyyy")}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {getTypeLabel(report.type)}
                            </span>
                          </td>

                          <td className="py-3 px-4 max-w-sm">
                            {report.todayWorks && report.todayWorks.length > 0 ? (
                              <div className="space-y-0.5">
                                {report.todayWorks.slice(0, 2).map((w, idx) => (
                                  <div
                                    key={idx}
                                    className="truncate text-foreground/90 font-medium"
                                  >
                                    • {w.taskTitle}{" "}
                                    <span className="text-muted-foreground text-[10px]">
                                      ({w.hoursSpent}h)
                                    </span>
                                  </div>
                                ))}
                                {report.todayWorks.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{report.todayWorks.length - 2} đầu việc khác...
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">
                                {report.tomorrowPlans || "Chưa có chi tiết"}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {approver ? (
                              <div className="flex items-center gap-2">
                                <UserAvatar user={approver} size="sm" />
                                <div>
                                  <div className="font-medium text-foreground text-xs">
                                    {approver.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {approver.title}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Chưa chỉ định
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-muted-foreground">
                            {report.submittedAt
                              ? formatDate(report.submittedAt, "HH:mm dd/MM")
                              : "Bản nháp"}
                          </td>

                          <td className="py-3 px-4">
                            {getStatusBadge(report.status)}
                          </td>

                          <td
                            className="py-3 px-4 max-w-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {latestFb ? (
                              <div className="flex items-start gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60 text-xs">
                                <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <div className="text-[10px] font-semibold text-foreground">
                                    {users.find((u) => u.id === latestFb.feedbackBy)?.name ||
                                      "Người duyệt"}
                                    :
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {latestFb.feedbackContent}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">—</span>
                            )}
                          </td>

                          <td
                            className="py-3 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingReport(report)}
                                className="h-7 px-2.5 text-xs rounded-lg gap-1 hover:bg-muted"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Xem</span>
                              </Button>

                              {(report.status === "DRAFT" ||
                                report.status === "REJECTED" ||
                                report.status === "draft" ||
                                report.status === "rejected") && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDate(report.date);
                                    setActiveTab("my-report");
                                  }}
                                  className="h-7 px-2.5 text-xs rounded-lg gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Sửa</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-border/80 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>Hiển thị {filteredMyReports.length} báo cáo</span>
              <span>Lịch sử báo cáo cá nhân ERP</span>
            </div>
          </div>
        </TabsContent>

        {isManagerOrAdmin && (
          <TabsContent value="team-reports" className="space-y-5">
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
              {departments.map((dept) => {
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

            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
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
                      const userReport = reports.find(
                        (r) => r.userId === user.id && r.date === selectedDate
                      );
                      const isSubmitted =
                        userReport?.status === "SUBMITTED" ||
                        userReport?.status === "submitted" ||
                        userReport?.status === "APPROVED" ||
                        userReport?.status === "approved";
                      const dept = departments.find((d) => d.id === user.departmentId);

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
                              <span className="inline-block">{getStatusBadge(userReport?.status)}</span>
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

      <Dialog
        open={Boolean(viewingReport)}
        onOpenChange={(open) => !open && setViewingReport(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
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
              <div>{getStatusBadge(viewingReport?.status)}</div>
            </div>
          </DialogHeader>

          {viewingReport && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 p-3 rounded-xl border border-border/70">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Ngày báo cáo</span>
                  <span className="font-semibold text-foreground">
                    {formatDate(viewingReport.date, "dd/MM/yyyy")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Loại báo cáo</span>
                  <span className="font-semibold text-foreground">
                    {getTypeLabel(viewingReport.type)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Người duyệt</span>
                  <span className="font-semibold text-foreground">
                    {viewingApprover ? viewingApprover.name : "Chưa có"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Tổng giờ</span>
                  <span className="font-semibold text-primary font-mono">
                    {viewingTotalHours} giờ
                  </span>
                </div>
              </div>

              {viewingCcUsers.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Đồng kính gửi:</span>
                  <div className="flex flex-wrap gap-1">
                    {viewingCcUsers.map((u) => (
                      <Badge key={u.id} variant="secondary" className="text-[10px]">
                        {u.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5 text-xs">
                  <span>1. Các đầu việc đã thực hiện:</span>
                </h4>
                <div className="space-y-2">
                  {viewingReport.todayWorks?.map((w, idx) => (
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

              <div>
                <h4 className="font-semibold text-foreground mb-1.5 text-xs">
                  2. Kế hoạch công việc tiếp theo:
                </h4>
                <p className="p-3 rounded-xl border border-border/70 bg-muted/20 whitespace-pre-line text-muted-foreground text-xs leading-relaxed">
                  {viewingReport.tomorrowPlans}
                </p>
              </div>

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

              {viewingReport.attachments && viewingReport.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5 text-xs">
                    <Paperclip className="h-3.5 w-3.5 text-primary" />
                    <span>Tệp đính kèm ({viewingReport.attachments.length}):</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingReport.attachments.map((name, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 p-2 rounded-lg border border-border/70 bg-muted/20 text-xs text-foreground"
                      >
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingReport.feedbacks && viewingReport.feedbacks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/70">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Nhận xét & Góp ý:</span>
                  </h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {viewingReport.feedbacks.map((fb) => {
                      const fbUser = users.find((u) => u.id === fb.feedbackBy);
                      return (
                        <div
                          key={fb.id}
                          className="p-2.5 rounded-lg border border-border/70 bg-muted/20 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-foreground">
                              {fbUser?.name || "Người đánh giá"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(fb.createdAt, "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{fb.feedbackContent}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border/70 gap-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewingReport(null)}
              className="text-xs h-8.5 rounded-xl"
            >
              Đóng
            </Button>
            {viewingReport &&
              (currentUser.id === viewingReport.approverId ||
                currentUser.role === "ADMIN" ||
                currentUser.role === "MANAGER") && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(viewingReport.id, "REJECTED");
                      setViewingReport(null);
                    }}
                    className="text-xs h-8.5 rounded-xl"
                  >
                    Yêu cầu sửa
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(viewingReport.id, "APPROVED");
                      setViewingReport(null);
                    }}
                    className="text-xs h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Phê duyệt</span>
                  </Button>
                </div>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

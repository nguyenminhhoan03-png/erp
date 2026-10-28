"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Send,
  Save,
  Paperclip,
  UploadCloud,
  X,
  FileText,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  ArrowLeft,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { DailyReport, DailyReportItem, DailyReportStatus, Task } from "@/modules/tasks/types";
import { User } from "@/shared/types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { UserSingleSelect } from "@/modules/tasks/components/form/UserSingleSelect";
import { UserMultiSelect } from "@/modules/tasks/components/form/UserMultiSelect";
import { TaskSuggestInput } from "@/modules/tasks/components/form/TaskSuggestInput";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { formatDate } from "@/lib/date";
import { reportService } from "@/modules/tasks/services/reportService";
import { taskService } from "@/modules/tasks/services/taskService";
import { DailyReportStatusBadge } from "./DailyReportStatusBadge";
import { AttachmentItem } from "./types";

interface DailyReportFormProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  existingReport: DailyReport | null;
  currentUser: User;
  users: User[];
  onSaved: () => void;
  onBack: () => void;
}

export function DailyReportForm({
  selectedDate,
  setSelectedDate,
  existingReport,
  currentUser,
  users,
  onSaved,
  onBack,
}: DailyReportFormProps) {
  const [approverId, setApproverId] = React.useState<string>("");
  const [ccRecipientIds, setCcRecipientIds] = React.useState<string[]>([]);
  const [todayWorks, setTodayWorks] = React.useState<DailyReportItem[]>([
    {
      id: "work-1",
      taskTitle: "",
      hoursSpent: 0,
      status: "IN_PROGRESS",
      note: "",
    },
  ]);
  const [projectTasks, setProjectTasks] = React.useState<Task[]>([]);
  const [tomorrowPlans, setTomorrowPlans] = React.useState("");
  const [blockers, setBlockers] = React.useState("");
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    taskService
      .getTasks()
      .then((res) => {
        if (!cancelled && res.tasks) {
          setProjectTasks(res.tasks);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (existingReport) {
      setTodayWorks(
        existingReport.todayWorks && existingReport.todayWorks.length > 0
          ? existingReport.todayWorks
          : [{ id: "work-1", taskTitle: "", hoursSpent: 0, status: "IN_PROGRESS", note: "" }]
      );
      setTomorrowPlans(existingReport.tomorrowPlans || "");
      setBlockers(existingReport.blockers || "");
      setApproverId(existingReport.approverId || "");
      setCcRecipientIds(existingReport.ccRecipientIds || []);

      let parsedAtts: any[] = [];
      if (Array.isArray(existingReport.attachments)) {
        parsedAtts = existingReport.attachments;
      } else if (typeof existingReport.attachments === "string" && (existingReport.attachments as string).trim()) {
        try {
          const parsed = JSON.parse(existingReport.attachments);
          if (Array.isArray(parsed)) parsedAtts = parsed;
          else parsedAtts = [(existingReport.attachments as string).trim()];
        } catch {
          parsedAtts = [(existingReport.attachments as string).trim()];
        }
      }

      if (parsedAtts.length > 0) {
        setAttachments(
          parsedAtts.map((item, i) => {
            const str = typeof item === "string" ? item : (item as any)?.url || (item as any)?.name || (item as any)?.path || "";
            const fileName = str.split("/").pop() || str;
            return {
              id: `att-${i}-${Date.now()}`,
              name: fileName,
              size: "Đã tải lên",
              url: str,
            };
          })
        );
      } else {
        setAttachments([]);
      }
    } else {
      setTodayWorks([
        {
          id: "work-1",
          taskTitle: "",
          hoursSpent: 0,
          status: "IN_PROGRESS",
          note: "",
        },
      ]);
      setTomorrowPlans("");
      setBlockers("");
      setApproverId("");
      setCcRecipientIds([]);
      setAttachments([]);
    }
  }, [existingReport]);

  const potentialApprovers = React.useMemo(() => {
    return users.filter((u) => u.id !== currentUser.id);
  }, [users, currentUser.id]);

  const potentialCcUsers = React.useMemo(() => {
    return users.filter((u) => u.id !== currentUser.id && u.id !== approverId);
  }, [users, currentUser.id, approverId]);

  const selectedApproverUser = React.useMemo(() => {
    return users.find((u) => u.id === approverId);
  }, [users, approverId]);

  const selectedCcUsersList = React.useMemo(() => {
    return users.filter((u) => ccRecipientIds.includes(u.id));
  }, [users, ccRecipientIds]);

  const handleStepDate = (days: number) => {
    try {
      const current = new Date(selectedDate);
      current.setDate(current.getDate() + days);
      setSelectedDate(format(current, "yyyy-MM-dd"));
    } catch {}
  };

  const handleAddWorkItem = () => {
    setTodayWorks((prev) => [
      ...prev,
      {
        id: `work-${Date.now()}`,
        taskTitle: "",
        hoursSpent: 0,
        status: "IN_PROGRESS",
        note: "",
      },
    ]);
  };

  const handleRemoveWorkItem = (id: string) => {
    if (todayWorks.length <= 1) {
      toast.info("Báo cáo cần ít nhất 1 đầu việc");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    for (const f of fileList) {
      try {
        const uploaded = await reportService.uploadAttachment(f);
        setAttachments((prev) => [
          ...prev,
          {
            id: `file-${Date.now()}-${Math.random()}`,
            name: uploaded.name || f.name,
            size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
            url: uploaded.path || uploaded.url || f.name,
          },
        ]);
      } catch {
        setAttachments((prev) => [
          ...prev,
          {
            id: `file-${Date.now()}-${Math.random()}`,
            name: f.name,
            size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
            url: f.name,
          },
        ]);
      }
    }

    toast.success(`Đã đính kèm ${fileList.length} tệp tin`);
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

    setIsSubmitting(true);
    try {
      await reportService.saveReport({
        id: existingReport?.id,
        userId: currentUser.id,
        type: "daily",
        departmentId: currentUser.departmentId,
        date: selectedDate,
        status,
        todayWorks,
        tomorrowPlans,
        blockers,
        approverId: approverId || undefined,
        ccRecipientIds,
        attachments: attachments.map((a) => (a.url && a.url !== "#" ? a.url : a.name)),
        feedbacks: existingReport?.feedbacks,
      });

      toast.success(
        status === "SUBMITTED" || status === "submitted"
          ? "Đã nộp báo cáo thành công!"
          : "Đã lưu bản nháp báo cáo!"
      );
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu báo cáo";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="md" />
            <div>
              <h3 className="font-semibold text-base text-foreground">{currentUser.name}</h3>
              <span className="text-xs text-muted-foreground">
                Ngày báo cáo: {formatDate(selectedDate, "EEEE, dd/MM/yyyy")}
              </span>
            </div>
          </div>

          {existingReport ? (
            <DailyReportStatusBadge status={existingReport.status} />
          ) : (
            <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground">
              Chưa tạo báo cáo
            </Badge>
          )}
        </div>

        {existingReport && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span className="leading-relaxed">
              Bạn đã có báo cáo cho ngày này (
              {formatDate(existingReport.submittedAt || selectedDate, "HH:mm dd/MM/yyyy")}). Theo quy định hệ thống, mỗi nhân sự có 1 báo cáo/ngày nên bạn đang ở chế độ <strong>chỉnh sửa & bổ sung</strong> nội dung cho báo cáo này.
            </span>
          </div>
        )}

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
                className="flex gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/20 items-center"
              >
                <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
                  #{idx + 1}
                </span>

                <TaskSuggestInput
                  value={work.taskTitle}
                  onChange={(val) => handleUpdateWorkItem(work.id, "taskTitle", val)}
                  onSelectTask={(task) => {
                    handleUpdateWorkItem(work.id, "taskId", task.id);
                    if (task.estimatedHours) {
                      handleUpdateWorkItem(work.id, "hoursSpent", task.estimatedHours);
                    }
                  }}
                  tasks={projectTasks}
                />

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
            <span>3. Vấn đề vướng mắc / Cần hỗ trợ</span>
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
              {attachments.map((file) => {
                const fileUrl = file.url?.startsWith("http")
                  ? file.url
                  : file.url?.startsWith("storage/") ||
                    file.url?.startsWith("daily-reports/") ||
                    file.url?.startsWith("gov-docs/")
                  ? `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8000/storage/${file.url.replace(/^storage\//, "")}`
                  : "";

                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="truncate">
                        <span className="font-medium text-foreground block truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{file.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-medium text-[11px] px-1.5 py-1 rounded hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Xem</span>
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-500 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/80">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="gap-1.5 text-xs h-9 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách</span>
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSaveReport("DRAFT")}
              className="gap-2 text-xs h-9"
            >
              <Save className="h-4 w-4" />
              <span>Lưu bản nháp</span>
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveReport("SUBMITTED")}
              className="gap-2 text-xs h-9 bg-primary shadow-sm shadow-primary/20"
            >
              <Send className="h-4 w-4" />
              <span>Nộp báo cáo</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-5">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-4">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Thời gian báo cáo</span>
          </h4>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleStepDate(-1)}
                className="h-9 w-9 shrink-0 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 text-xs rounded-xl bg-muted/20"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleStepDate(1)}
                className="h-9 w-9 shrink-0 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground block text-center">
              {formatDate(selectedDate, "EEEE, dd/MM/yyyy")}
            </span>
          </div>
        </div>

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
              onChange={(id) => {
                setApproverId(id);
                setCcRecipientIds((prev) => prev.filter((ccId) => ccId !== id));
              }}
              users={potentialApprovers}
              currentUser={currentUser}
              placeholder="Chọn người duyệt..."
              triggerClassName="w-full h-9 rounded-xl text-xs bg-muted/20"
            />
            <span className="text-[10px] text-muted-foreground block">
              Chỉ định người nhận phê duyệt báo cáo.
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <UserMultiSelect
              label="Đồng kính gửi (CC)"
              users={potentialCcUsers}
              selectedIds={ccRecipientIds}
              onChange={setCcRecipientIds}
              currentUser={currentUser}
              showSelfAction={false}
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
              <span className="text-muted-foreground">Trạng thái:</span>
              <span>
                <DailyReportStatusBadge status={existingReport?.status} />
              </span>
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
      </div>
    </div>
  );
}

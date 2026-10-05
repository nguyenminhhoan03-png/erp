"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import { Calendar, Plus, Users, ShieldAlert, Sparkles, UserPlus, Clock, Briefcase } from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { REQUIRE_SELF_TASK_APPROVAL, TASK_PRIORITY_CONFIG, AVAILABLE_PROJECTS } from "../constants";
import { taskFormSchema, TaskFormValues } from "../schemas";
import { DepartmentId, User } from "@/shared/types";
import { TaskStatus } from "../types";
import { UserFormDialog } from "@/shared/components/UserFormDialog";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
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
import { Badge } from "@/shared/components/ui/badge";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TaskFormDialog() {
  const { isCreateOpen, closeCreate, createTask } = useTaskStore();
  const { currentUser, users } = useUserStore();

  const isEmployee = currentUser.role === "EMPLOYEE";
  const defaultDueDate = format(addDays(new Date(), 3), "yyyy-MM-dd");
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "ERP_CORE",
      departmentId: currentUser.departmentId,
      priority: "MEDIUM",
      assigneeIds: isEmployee ? [currentUser.id] : [],
      dueDate: defaultDueDate,
      tags: "",
      assignScope: "INDIVIDUAL",
      requiresApproval: isEmployee ? true : false,
    },
  });

  const selectedDepartmentId = watch("departmentId");
  const selectedAssigneeIds = watch("assigneeIds") || [];
  const assignScope = watch("assignScope");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isCreateOpen) {
      reset({
        title: "",
        description: "",
        projectId: "ERP_CORE",
        departmentId: currentUser.departmentId,
        priority: "MEDIUM",
        assigneeIds: isEmployee ? [currentUser.id] : [],
        dueDate: defaultDueDate,
        tags: "",
        assignScope: "INDIVIDUAL",
        requiresApproval: isEmployee ? true : false,
      });
    }
  }, [isCreateOpen, currentUser, isEmployee, defaultDueDate, reset]);

  // Lọc danh sách nhân viên thuộc phòng ban được chọn
  const departmentUsers = React.useMemo(() => {
    return users.filter((u) => u.departmentId === selectedDepartmentId);
  }, [users, selectedDepartmentId]);

  const handleToggleAssignee = (userId: string) => {
    if (isEmployee) return; // Nhân viên không được gán người khác
    if (selectedAssigneeIds.includes(userId)) {
      setValue(
        "assigneeIds",
        selectedAssigneeIds.filter((id) => id !== userId),
        { shouldValidate: true }
      );
    } else {
      setValue("assigneeIds", [...selectedAssigneeIds, userId], {
        shouldValidate: true,
      });
    }
  };

  const handleSelectAllDepartment = () => {
    if (assignScope === "ALL_DEPARTMENT") {
      setValue("assignScope", "INDIVIDUAL");
      setValue("assigneeIds", []);
    } else {
      setValue("assignScope", "ALL_DEPARTMENT");
      setValue(
        "assigneeIds",
        departmentUsers.map((u) => u.id),
        { shouldValidate: true }
      );
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    try {
      // Xác định trạng thái ban đầu:
      // - Nếu là Nhân viên: Tự động chuyển vào PENDING_APPROVAL theo quy trình duyệt nội bộ.
      // - Nếu là Quản lý / Admin / Lead: Tùy theo lựa chọn requiresApproval (nếu muốn gửi duyệt cấp trên)
      const shouldRequireApproval = isEmployee
        ? REQUIRE_SELF_TASK_APPROVAL
        : Boolean(values.requiresApproval);

      const initialStatus: TaskStatus = shouldRequireApproval ? "PENDING_APPROVAL" : "TODO";
      const requiresApproval = shouldRequireApproval;

      // Xử lý tags
      const tagsList = values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const selectedProj = AVAILABLE_PROJECTS.find((p) => p.id === values.projectId);

      await createTask({
        title: values.title,
        description: values.description,
        projectId: values.projectId || "ERP_CORE",
        projectName: selectedProj?.name || "Hệ thống ERP Doanh nghiệp",
        projectKey: selectedProj?.key || "ERP",
        departmentId: values.departmentId,
        priority: values.priority,
        creatorId: currentUser.id,
        assigneeIds: values.assigneeIds,
        dueDate: new Date(values.dueDate).toISOString(),
        status: initialStatus,
        requiresApproval,
        isApproved: !requiresApproval,
        tags: tagsList,
        checklist: [
          { id: `chk-new-1`, title: "Tiếp nhận và lên kế hoạch", isCompleted: false },
          { id: `chk-new-2`, title: "Tiến hành thực hiện nhiệm vụ", isCompleted: false },
          { id: `chk-new-3`, title: "Báo cáo và nghiệm thu", isCompleted: false },
        ],
        commentsCount: 0,
      });

      if (requiresApproval) {
        toast.info("Đã gửi đề xuất công việc!", {
          description: "Công việc đã chuyển vào hàng đợi 'Chờ duyệt' để Trưởng phòng phê duyệt.",
        });
      } else {
        toast.success("Tạo công việc thành công!", {
          description: "Công việc đã được thêm vào cột 'Cần làm'.",
        });
      }

      closeCreate();
    } catch {
      toast.error("Không thể tạo công việc. Vui lòng thử lại!");
    }
  };

  return (
    <Dialog open={isCreateOpen} onOpenChange={(open) => !open && closeCreate()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/80 bg-muted/20 pr-12">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>{isEmployee ? "Tạo đề xuất công việc mới" : "Tạo & Giao việc mới"}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee
              ? `Bạn đang tạo công việc với vai trò Nhân viên (${REQUIRE_SELF_TASK_APPROVAL ? "Cần Trưởng phòng duyệt" : "Tự động vào Cần làm"}).`
              : "Phân bổ công việc cho cá nhân, nhóm hoặc toàn bộ phòng ban phụ trách."}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Tối ưu hiệu năng tải trang và giảm bundle size..."
              {...register("title")}
              className={cn(errors.title && "border-rose-500 focus-visible:ring-rose-500")}
            />
            {errors.title && (
              <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                {errors.title.message}
              </span>
            )}
          </div>

          {/* Thuộc Dự án (Chuẩn Jira Multi-Project) */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              <span>Thuộc Dự án <span className="text-rose-500">*</span></span>
            </label>
            <Controller
              control={control}
              name="projectId"
              render={({ field }) => (
                <Select value={field.value || "ERP_CORE"} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Chọn dự án" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
                      Dự án Nội bộ
                    </div>
                    {AVAILABLE_PROJECTS.filter((p) => p.category === "INTERNAL").map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">[{proj.key}]</span>
                          <span>{proj.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40">
                      Dự án CĐS Tỉnh (Bước 6)
                    </div>
                    {AVAILABLE_PROJECTS.filter((p) => p.category === "GOV_SOLUTION").map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">[{proj.key}]</span>
                          <span>{proj.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Phòng ban & Mức độ ưu tiên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Phòng ban */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Phòng ban phụ trách <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (!isEmployee) setValue("assigneeIds", []);
                    }}
                    disabled={isEmployee} // Nhân viên chỉ tạo cho phòng mình
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Độ ưu tiên */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Mức độ ưu tiên <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn mức ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TASK_PRIORITY_CONFIG).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Người thực hiện (Assignees) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-semibold text-foreground">
                Người thực hiện <span className="text-rose-500">*</span>
              </label>
              {!isEmployee && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(true)}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>+ Thêm nhân sự</span>
                  </button>
                  {departmentUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllDepartment}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline font-medium cursor-pointer"
                    >
                      {assignScope === "ALL_DEPARTMENT" ? "Bỏ chọn tất cả" : "Giao cho cả phòng"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {isEmployee ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-muted/30">
                <UserAvatar user={currentUser} size="sm" />
                <div className="flex flex-col text-xs">
                  <span className="font-medium text-foreground">{currentUser.name} (Chính bạn)</span>
                  <span className="text-muted-foreground">{currentUser.title}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-36 overflow-y-auto rounded-lg border border-border/80 p-2 space-y-1 bg-card">
                  {departmentUsers.map((u) => {
                    const isSelected = selectedAssigneeIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleAssignee(u.id)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-xs select-none",
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                            : "hover:bg-muted/60 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar user={u} size="sm" />
                          <span>{u.name}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            ({u.title})
                          </span>
                        </div>
                        {isSelected && <Badge variant="default" className="text-[10px] h-4">Đã chọn</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {errors.assigneeIds && (
              <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                {errors.assigneeIds.message}
              </span>
            )}
          </div>

          {/* Hạn hoàn thành & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Hạn hoàn thành (Deadline) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                {...register("dueDate")}
                className={cn(errors.dueDate && "border-rose-500 focus-visible:ring-rose-500")}
              />
              {errors.dueDate && (
                <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                  {errors.dueDate.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Nhãn phân loại (Tags)
              </label>
              <Input
                placeholder="Frontend, Backend, Bug, ..."
                {...register("tags")}
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Cách nhau bằng dấu phẩy
              </span>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={4}
              placeholder="Nhập bối cảnh, tiêu chuẩn nghiệm thu hoặc tài liệu tham khảo..."
              {...register("description")}
              className={cn(errors.description && "border-rose-500 focus-visible:ring-rose-500")}
            />
            {errors.description && (
              <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Quy trình phê duyệt (Approval option) */}
          {isEmployee ? (
            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-amber-950 dark:text-amber-100">
                  Quy trình duyệt: Nhân viên đề xuất
                </span>
                <span className="text-[11px] leading-relaxed opacity-90">
                  Công việc bạn tạo sẽ được đưa vào hàng đợi <strong>Pending Approval (Chờ duyệt)</strong> để Trưởng phòng phê duyệt trước khi bắt tay vào làm.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label
                  htmlFor="requiresApproval"
                  className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Cần phê duyệt trước khi làm (Pending Approval)</span>
                </label>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Mặc định tắt: Công việc sẽ vào thẳng cột <strong>Cần làm (To Do)</strong>. Bật nếu cần Ban Giám Đốc hoặc Cấp trên duyệt trước.
                </p>
              </div>
              <Checkbox
                id="requiresApproval"
                checked={watch("requiresApproval")}
                onCheckedChange={(val) => setValue("requiresApproval", Boolean(val))}
              />
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border/80">
            <Button type="button" variant="outline" onClick={closeCreate}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : isEmployee ? "Gửi đề xuất" : "Tạo & Giao việc"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Dialog thêm nhanh nhân sự mới */}
      <UserFormDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        defaultDepartmentId={selectedDepartmentId}
      />
    </Dialog>
  );
}

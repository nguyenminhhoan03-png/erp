"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import {
  Calendar,
  Plus,
  Users,
  UserCheck,
  Timer,
} from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { TASK_PRIORITY_CONFIG } from "../constants";
import { taskFormSchema, TaskFormValues } from "../schemas";
import { TaskStatus } from "../types";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserMultiSelect } from "./form/UserMultiSelect";
import { TaskProjectSelect } from "./form/TaskProjectSelect";
import { TaskStatusSelect } from "./form/TaskStatusSelect";

export function TaskFormDialog() {
  const {
    isCreateOpen,
    closeCreate,
    createTask,
    projects,
    statuses,
    fetchStatuses,
    openWorkflowConfig,
    syncStatuses,
    createInitialStatus,
    createInitialProjectId,
    filters,
  } = useTaskStore();
  const { currentUser, users, departments, fetchUsers, fetchDepartments } = useUserStore();

  const wasOpenRef = React.useRef(false);
  const [isInitializingStatuses, setIsInitializingStatuses] = React.useState(false);

  const initialDeptId = currentUser.departmentId
    ? String(currentUser.departmentId)
    : departments[0]?.id
    ? String(departments[0]?.id)
    : "1";

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: projects[0]?.id || "",
      departmentId: initialDeptId,
      priority: "MEDIUM",
      status: "TODO",
      reportToId: "",
      reportToIds: [],
      assigneeIds: [],
      startDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
      estimatedHours: undefined,
      tags: "",
      assignScope: "INDIVIDUAL",
    },
  });

  const selectedDepartmentId = watch("departmentId");
  const selectedFormProjectId = watch("projectId");

  // Filter assignees by department if selected
  const departmentAssignees = React.useMemo(() => {
    if (!selectedDepartmentId) return users;
    const filtered = users.filter((u) => String(u.departmentId) === String(selectedDepartmentId));
    return filtered.length > 0 ? filtered : users;
  }, [users, selectedDepartmentId]);

  React.useEffect(() => {
    if (isCreateOpen && !wasOpenRef.current) {
      fetchUsers();
      fetchDepartments();
      const currentDeptId = currentUser.departmentId
        ? String(currentUser.departmentId)
        : departments[0]?.id
        ? String(departments[0]?.id)
        : "1";
      const defaultProj =
        createInitialProjectId ||
        (filters.projectId !== "ALL" ? filters.projectId : projects[0]?.id || "");
      const defaultStatus = createInitialStatus || "TODO";

      reset({
        title: "",
        description: "",
        projectId: defaultProj,
        departmentId: currentDeptId,
        priority: "MEDIUM",
        status: defaultStatus,
        reportToId: "",
        reportToIds: [],
        assigneeIds: [],
        startDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        estimatedHours: undefined,
        tags: "",
        assignScope: "INDIVIDUAL",
      });
      fetchStatuses(defaultProj !== "ALL" ? defaultProj : undefined);
    }
    wasOpenRef.current = isCreateOpen;
  }, [
    isCreateOpen,
    createInitialProjectId,
    createInitialStatus,
    filters.projectId,
    projects,
    currentUser,
    departments,
    reset,
    fetchStatuses,
    fetchUsers,
    fetchDepartments,
  ]);

  React.useEffect(() => {
    if (isCreateOpen && selectedFormProjectId) {
      fetchStatuses(selectedFormProjectId !== "ALL" ? selectedFormProjectId : undefined);
    }
  }, [isCreateOpen, selectedFormProjectId, fetchStatuses]);

  const projectStatuses = React.useMemo(() => {
    if (statuses && statuses.length > 0) return statuses;
    return [];
  }, [statuses]);

  React.useEffect(() => {
    if (projectStatuses.length > 0) {
      const currentVal = getValues("status");
      const exists = projectStatuses.some((s) => s.key === currentVal);
      if (!exists) {
        setValue("status", projectStatuses[0].key as any);
      }
    } else {
      setValue("status", "" as any);
    }
  }, [projectStatuses, setValue, getValues]);

  const handleQuickInitStatuses = async () => {
    if (!selectedFormProjectId) return;
    setIsInitializingStatuses(true);
    try {
      await syncStatuses({
        projectId: selectedFormProjectId,
        statuses: [
          { name: "Cần làm", category: "TODO", color: "#64748b", key: "TODO" },
          { name: "Đang làm", category: "IN_PROGRESS", color: "#2563eb", key: "IN_PROGRESS" },
          { name: "Hoàn thành", category: "DONE", color: "#10b981", key: "DONE" },
        ],
      });
      toast.success("Đã thiết lập 3 cột quy trình cơ bản cho dự án!");
      await fetchStatuses(selectedFormProjectId);
      setValue("status", "TODO" as any);
    } catch {
      toast.error("Không thể thiết lập quy trình");
    } finally {
      setIsInitializingStatuses(false);
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (projectStatuses.length === 0) {
      toast.error("Dự án chưa được cấu hình cột trạng thái!", {
        description: "Vui lòng bấm 'Khởi tạo nhanh 3 cột cơ bản' hoặc 'Cấu hình cột dự án' trước khi tạo việc.",
      });
      return;
    }

    try {
      const targetStatus: TaskStatus = (values.status ||
        createInitialStatus ||
        projectStatuses[0]?.key ||
        "TODO") as TaskStatus;

      const tagsList = values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const selectedProj = projects.find((p) => p.id === values.projectId);

      await createTask({
        title: values.title,
        description: values.description,
        projectId: values.projectId || projects[0]?.id || "",
        projectName: selectedProj?.name || "",
        projectKey: selectedProj?.key || "ERP",
        departmentId: values.departmentId,
        priority: values.priority,
        creatorId: currentUser.id,
        reportToId: (values.reportToIds && values.reportToIds[0]) || values.reportToId || "",
        reportToIds: values.reportToIds && values.reportToIds.length > 0 ? values.reportToIds : [],
        assigneeIds: values.assigneeIds,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        dueDate: new Date(values.dueDate).toISOString(),
        estimatedHours: values.estimatedHours && !isNaN(Number(values.estimatedHours)) ? Number(values.estimatedHours) : undefined,
        status: targetStatus,
        requiresApproval: false,
        isApproved: true,
        tags: tagsList,
        checklist: [],
        commentsCount: 0,
      });

      toast.success("Tạo công việc thành công!", {
        description: "Công việc đã được thêm vào danh sách.",
      });

      closeCreate();
    } catch {
      toast.error("Không thể tạo công việc. Vui lòng thử lại!");
    }
  };

  return (
    <Dialog open={isCreateOpen} onOpenChange={(open) => !open && closeCreate()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/80 bg-muted/20 pr-12">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Tạo & Giao việc mới</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Phân bổ công việc cho cá nhân, nhóm hoặc toàn bộ phòng ban phụ trách.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              e.preventDefault();
            }
          }}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {/* Tiêu đề công việc */}
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

          {/* Thuộc dự án */}
          <Controller
            control={control}
            name="projectId"
            render={({ field }) => (
              <TaskProjectSelect
                projects={projects}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {/* Phòng ban & Mức ưu tiên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      setValue("assigneeIds", []);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.departmentId && (
                <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                  {errors.departmentId.message}
                </span>
              )}
            </div>

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

          {/* Cột trạng thái công việc (Kanban) */}
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <TaskStatusSelect
                statuses={projectStatuses}
                value={field.value || ""}
                onChange={field.onChange}
                projectId={selectedFormProjectId}
                onOpenWorkflowConfig={openWorkflowConfig}
                onQuickInitStatuses={handleQuickInitStatuses}
                isInitializing={isInitializingStatuses}
              />
            )}
          />

          {/* Người nhận báo cáo */}
          <Controller
            control={control}
            name="reportToIds"
            render={({ field }) => (
              <UserMultiSelect
                label="Người nhận báo cáo (Báo cáo cho)"
                icon={<UserCheck className="h-3.5 w-3.5 text-primary" />}
                users={users}
                selectedIds={field.value || []}
                onChange={(ids) => {
                  field.onChange(ids);
                  setValue("reportToId", ids[0] || "");
                }}
                currentUser={currentUser}
                selfActionLabel="Thêm tôi"
                placeholder="Chọn người nhận báo cáo..."
                helpText="Những người này sẽ nhận được báo cáo tiến độ và có quyền nghiệm thu task."
              />
            )}
          />

          {/* Người thực hiện */}
          <Controller
            control={control}
            name="assigneeIds"
            render={({ field }) => (
              <UserMultiSelect
                label="Người thực hiện"
                isRequired
                icon={<Users className="h-3.5 w-3.5 text-primary" />}
                users={departmentAssignees}
                selectedIds={field.value || []}
                onChange={(ids) => field.onChange(ids)}
                currentUser={currentUser}
                selfActionLabel="Gán cho tôi"
                placeholder="Chọn người thực hiện..."
                helpText="Hỗ trợ giao việc cho một hoặc nhiều nhân sự cùng phối hợp thực hiện."
                error={errors.assigneeIds?.message}
              />
            )}
          />

          {/* Ngày bắt đầu & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Thời gian bắt đầu</span>
              </label>
              <Input type="date" {...register("startDate")} />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                <span>
                  Hạn hoàn thành (Deadline) <span className="text-rose-500">*</span>
                </span>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-primary" />
                <span>Thời gian ước tính (Giờ)</span>
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="Ví dụ: 8 hoặc 16.5..."
                {...register("estimatedHours")}
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Số giờ dự kiến để hoàn thành
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Nhãn phân loại (Tags)
              </label>
              <Input placeholder="Frontend, Backend, Bug, ..." {...register("tags")} />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Cách nhau bằng dấu phẩy
              </span>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Mô tả chi tiết
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

          <DialogFooter className="pt-4 border-t border-border/80">
            <Button type="button" variant="outline" onClick={closeCreate}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || projectStatuses.length === 0}
              title={
                projectStatuses.length === 0
                  ? "Vui lòng cấu hình cột trạng thái cho dự án trước khi tạo việc"
                  : undefined
              }
            >
              {isSubmitting ? "Đang xử lý..." : "Tạo & Giao việc"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

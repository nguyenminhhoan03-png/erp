"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import {
  Calendar,
  Plus,
  Users,
  UserPlus,
  Clock,
  Briefcase,
  Search,
  Timer,
  Check,
  Building2,
} from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { REQUIRE_SELF_TASK_APPROVAL, TASK_PRIORITY_CONFIG } from "../constants";
import { taskFormSchema, TaskFormValues } from "../schemas";
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
  const { isCreateOpen, closeCreate, createTask, projects } = useTaskStore();
  const { currentUser, users, departments, fetchUsers, fetchDepartments } = useUserStore();

  const isEmployee = currentUser.role === "EMPLOYEE";
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [userSearchTerm, setUserSearchTerm] = React.useState("");
  const wasOpenRef = React.useRef(false);

  const initialDeptId = currentUser.departmentId ? String(currentUser.departmentId) : (departments[0]?.id ? String(departments[0]?.id) : "1");

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
      departmentId: initialDeptId,
      priority: "MEDIUM",
      assigneeIds: isEmployee ? [currentUser.id] : [],
      startDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
      estimatedHours: undefined,
      tags: "",
      assignScope: "INDIVIDUAL",
      requiresApproval: isEmployee ? true : false,
    },
  });

  const selectedDepartmentId = watch("departmentId");
  const selectedAssigneeIds = watch("assigneeIds") || [];
  const assignScope = watch("assignScope");

  React.useEffect(() => {
    if (isCreateOpen && !wasOpenRef.current) {
      fetchUsers();
      fetchDepartments();
      const currentDeptId = currentUser.departmentId ? String(currentUser.departmentId) : (departments[0]?.id ? String(departments[0]?.id) : "1");
      reset({
        title: "",
        description: "",
        projectId: "ERP_CORE",
        departmentId: currentDeptId,
        priority: "MEDIUM",
        assigneeIds: isEmployee ? [currentUser.id] : [],
        startDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        estimatedHours: undefined,
        tags: "",
        assignScope: "INDIVIDUAL",
        requiresApproval: isEmployee ? true : false,
      });
      setUserSearchTerm("");
    }
    wasOpenRef.current = isCreateOpen;
  }, [isCreateOpen]);

  React.useEffect(() => {
    setUserSearchTerm("");
  }, [selectedDepartmentId]);

  const displayUsers = React.useMemo(() => {
    let list = !selectedDepartmentId
      ? users
      : users.filter((u) => String(u.departmentId) === String(selectedDepartmentId));

    if (userSearchTerm.trim()) {
      const q = userSearchTerm.toLowerCase().trim();
      list = list.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        (u.title && u.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [users, selectedDepartmentId, userSearchTerm]);

  const handleToggleAssignee = (userId: string) => {
    if (isEmployee) return;
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
        displayUsers.map((u) => u.id),
        { shouldValidate: true }
      );
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    try {
      const shouldRequireApproval = isEmployee
        ? REQUIRE_SELF_TASK_APPROVAL
        : Boolean(values.requiresApproval);

      const initialStatus: TaskStatus = shouldRequireApproval ? "PENDING_APPROVAL" : "TODO";
      const requiresApproval = shouldRequireApproval;

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
        projectId: values.projectId || "ERP_CORE",
        projectName: selectedProj?.name || "Hệ thống ERP Doanh nghiệp",
        projectKey: selectedProj?.key || "ERP",
        departmentId: values.departmentId,
        priority: values.priority,
        creatorId: currentUser.id,
        assigneeIds: values.assigneeIds,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        dueDate: new Date(values.dueDate).toISOString(),
        estimatedHours: values.estimatedHours,
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
          description: "Công việc đã được thêm vào danh sách.",
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              e.preventDefault();
            }
          }}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
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
                    {projects.filter((p) => p.category === "INTERNAL").map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 w-14 shrink-0 text-left">
                            {proj.code ? `[${proj.code}]` : ""}
                          </span>
                          <span className="truncate">{proj.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {projects.filter((p) => p.category === "GOV_SOLUTION").length > 0 && (
                      <div className="px-2 py-1 mt-1.5 mb-0.5 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-sm">
                        Dự án Giải pháp CĐS Tỉnh (GOV)
                      </div>
                    )}
                    {Object.entries(
                      projects.filter((p) => p.category === "GOV_SOLUTION").reduce((acc, proj) => {
                        const group = proj.groupName || "Chưa phân nhóm";
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(proj);
                        return acc;
                      }, {} as Record<string, typeof projects>)
                    ).map(([groupName, groupProjects]) => (
                      <React.Fragment key={groupName}>
                        <div className="px-3 py-1 ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-l-2 border-primary/30">
                          ↳ {groupName}
                        </div>
                        {groupProjects.map((proj) => (
                          <SelectItem key={proj.id} value={proj.id} className="pl-7">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 w-14 shrink-0 text-left">
                                {proj.code ? `[${proj.code}]` : ""}
                              </span>
                              <span className="truncate">{proj.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

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
                      if (!isEmployee) setValue("assigneeIds", []);
                    }}
                    disabled={isEmployee}
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

          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Người thực hiện <span className="text-rose-500">*</span></span>
                {selectedAssigneeIds.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 font-normal px-1.5">
                    Đã chọn {selectedAssigneeIds.length}
                  </Badge>
                )}
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
                  {displayUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllDepartment}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline font-medium cursor-pointer"
                    >
                      {assignScope === "ALL_DEPARTMENT" ? "Bỏ chọn tất cả" : "Chọn tất cả"}
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
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên hoặc vị trí..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs w-full"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto rounded-lg border border-border/80 p-2 space-y-1 bg-card">
                  {displayUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
                      <Users className="h-6 w-6 text-muted-foreground/40 mb-1" />
                      <span>
                        {userSearchTerm.trim()
                          ? "Không tìm thấy nhân sự phù hợp."
                          : "Chưa có nhân sự nào thuộc phòng ban này."}
                      </span>
                    </div>
                  ) : (
                    displayUsers.map((u) => {
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
                          {isSelected && (
                            <Badge variant="default" className="text-[10px] h-4 gap-1 px-1.5">
                              <Check className="h-2.5 w-2.5" />
                              <span>Đã chọn</span>
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            {errors.assigneeIds && (
              <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                {errors.assigneeIds.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Thời gian bắt đầu</span>
              </label>
              <Input
                type="date"
                {...register("startDate")}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                <span>Hạn hoàn thành (Deadline) <span className="text-rose-500">*</span></span>
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
                {...register("estimatedHours", { valueAsNumber: true })}
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Số giờ dự kiến để hoàn thành
              </span>
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

      <UserFormDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        defaultDepartmentId={selectedDepartmentId}
      />
    </Dialog>
  );
}

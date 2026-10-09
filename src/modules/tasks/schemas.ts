import { z } from "zod";

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(5, "Tiêu đề công việc phải có ít nhất 5 ký tự")
    .max(150, "Tiêu đề không được vượt quá 150 ký tự"),
  description: z
    .string()
    .min(10, "Mô tả công việc phải có ít nhất 10 ký tự")
    .max(2000, "Mô tả không được vượt quá 2000 ký tự"),
  projectId: z.string(),
  departmentId: z
    .string()
    .min(1, "Vui lòng chọn phòng ban phụ trách"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
    message: "Vui lòng chọn mức độ ưu tiên",
  }),
  assigneeIds: z
    .array(z.string())
    .min(1, "Vui lòng chỉ định ít nhất một người phụ trách"),
  startDate: z.string().optional(),
  dueDate: z
    .string()
    .min(1, "Vui lòng chọn hạn hoàn thành (Deadline)"),
  estimatedHours: z.number().min(0).max(9999).optional(),
  tags: z.string().optional(),
  assignScope: z.enum(["INDIVIDUAL", "ALL_DEPARTMENT"]),
  requiresApproval: z.boolean().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const dailyReportItemSchema = z.object({
  taskTitle: z.string().min(3, "Vui lòng nhập tên công việc đã làm"),
  hoursSpent: z.coerce.number().min(0.5, "Số giờ tối thiểu là 0.5h").max(16, "Số giờ tối đa là 16h"),
  status: z.string().min(1, "Vui lòng chọn trạng thái"),
  note: z.string().optional(),
});

export const dailyReportFormSchema = z.object({
  date: z.string().min(1, "Vui lòng chọn ngày báo cáo"),
  todayWorks: z
    .array(dailyReportItemSchema)
    .min(1, "Vui lòng ghi nhận ít nhất 1 đầu việc đã thực hiện hôm nay"),
  tomorrowPlans: z
    .string()
    .min(10, "Vui lòng nêu kế hoạch ngày mai (tối thiểu 10 ký tự)"),
  blockers: z.string().optional(),
});

export type DailyReportFormValues = z.infer<typeof dailyReportFormSchema>;

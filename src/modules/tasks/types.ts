import { DepartmentId, User } from "@/shared/types";

export type TaskStatus =
  | "PENDING_APPROVAL" // Chờ duyệt (cho task nhân viên tự tạo)
  | "TODO"             // Cần làm
  | "IN_PROGRESS"      // Đang làm
  | "IN_REVIEW"        // Chờ review / Chờ nghiệm thu
  | "DONE"             // Hoàn thành
  | "CANCELLED";       // Đã hủy / Đã đóng (Closed/Cancelled)

export type TaskResolution =
  | "DONE"             // Hoàn thành / Resolved
  | "NOT_A_BUG"        // Không phải lỗi / Invalid (By design, user thao tác nhầm)
  | "WONT_FIX"         // Không sửa / Won't Do (Chi phí cao, out of scope, tính năng sắp bỏ)
  | "CANNOT_REPRODUCE" // Không tái hiện được lỗi
  | "DUPLICATE";       // Trùng lặp với task khác

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: string;
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  action: string;
  details?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  code: string; // e.g. ERP-101
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  departmentId: DepartmentId;
  creatorId: string;
  creator?: User;
  assigneeIds: string[]; // Can assign to one or multiple users
  assignees?: User[];
  dueDate: string; // ISO string
  startDate?: string;
  checklist: TaskChecklistItem[];
  commentsCount: number;
  tags: string[];
  requiresApproval?: boolean;
  isApproved?: boolean;
  approvedById?: string;
  resolution?: TaskResolution; // Chuẩn Jira: Kết quả xử lý khi hoàn thành hoặc đóng/hủy task
  resolutionNote?: string;     // Ghi chú lý do đóng (vd: Trùng với ERP-102, Không tái hiện được)
  closedAt?: string;           // Thời điểm đóng task
  closedById?: string;         // Người thực hiện đóng task
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportItem {
  id: string;
  taskId?: string; // Link to existing task (optional)
  taskTitle: string; // Task name or free text
  hoursSpent: number;
  status: TaskStatus | "COMPLETED" | "IN_PROGRESS";
  note?: string;
}

export type DailyReportStatus = "DRAFT" | "SUBMITTED";

export interface DailyReport {
  id: string;
  userId: string;
  user?: User;
  departmentId: DepartmentId;
  date: string; // YYYY-MM-DD
  status: DailyReportStatus;
  todayWorks: DailyReportItem[];
  tomorrowPlans: string;
  blockers?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilterParams {
  search?: string;
  departmentId?: DepartmentId | "ALL";
  assigneeId?: string | "ALL";
  priority?: TaskPriority | "ALL";
  status?: TaskStatus | "ALL";
  isMyTasksOnly?: boolean;
  dueDateRange?: "today" | "this_week" | "overdue" | "all";
}

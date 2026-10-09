import { DepartmentId, User } from "@/shared/types";

export type TaskStatus =
  | "PENDING_APPROVAL" // Chờ duyệt (cho task nhân viên tự tạo)
  | "TODO"             // Cần làm
  | "IN_PROGRESS"      // Đang làm
  | "IN_REVIEW"        // Chờ review / Chờ nghiệm thu
  | "DONE"             // Hoàn thành
  | "CANCELLED"        // Đã hủy / Đã đóng (Closed/Cancelled)
  | (string & {});

export type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";

export interface CustomTaskStatus {
  id: string;
  key: string;
  name: string;
  category: StatusCategory;
  color: string;
  orderIndex: number;
  isDefault?: boolean;
  isSystem?: boolean;
  projectId?: string | null;
  departmentId?: string | null;
}

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

export interface TaskProject {
  id: string; // e.g. "ERP_CORE", "DLTM_LCA", "DLTM_LDO", "DLTM_KGI"
  key: string; // e.g. "ERP", "LCA", "LDO", "KGI"
  code?: string; // e.g. DLTM
  name: string; // e.g. "Hệ thống ERP Doanh nghiệp", "CĐS Du lịch - Tỉnh Lào Cai"
  category: "INTERNAL" | "GOV_SOLUTION";
  badgeBg?: string;
  badgeText?: string;
  provinceCode?: string;
  groupName?: string;
}

export interface Task {
  id: string;
  code: string; // e.g. ERP-101, LCA-01
  title: string;
  description: string;
  projectId?: string; // e.g. "ERP_CORE", "DLTM_LCA"
  projectName?: string;
  projectKey?: string; // e.g. "ERP", "LCA"
  status: TaskStatus;
  priority: TaskPriority;
  departmentId: DepartmentId;
  creatorId: string;
  creator?: User;
  assigneeIds: string[]; // Can assign to one or multiple users
  assignees?: User[];
  dueDate: string; // ISO string
  startDate?: string;
  estimatedHours?: number;
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
  projectId?: string | "ALL";
  departmentId?: DepartmentId | "ALL";
  assigneeId?: string | "ALL";
  priority?: TaskPriority | "ALL";
  status?: TaskStatus | "ALL";
  isMyTasksOnly?: boolean;
  dueDateRange?: "today" | "this_week" | "overdue" | "all";
  perPage?: number;
  cursor?: string;
}

export interface TaskPaginationMeta {
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
  has_more: boolean;
}

export interface TaskFetchResult {
  tasks: Task[];
  meta: TaskPaginationMeta | null;
}


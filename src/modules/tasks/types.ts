import { DepartmentId, User } from "@/shared/types";

export type TaskStatus =
  | "PENDING_APPROVAL" 
  | "TODO"             
  | "IN_PROGRESS"      
  | "IN_REVIEW"        
  | "DONE"             
  | "CANCELLED"        
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
  | "DONE"             
  | "NOT_A_BUG"        
  | "WONT_FIX"         
  | "CANNOT_REPRODUCE" 
  | "DUPLICATE";       

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

export interface TaskAttachment {
  id: string;
  taskId?: string;
  title?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  uploadedById?: string;
  uploadedBy?: string;
  uploader?: User;
  createdAt: string;
}

export interface TaskProject {
  id: string; 
  key: string; 
  code?: string; 
  name: string; 
  category: "INTERNAL" | "GOV_SOLUTION";
  badgeBg?: string;
  badgeText?: string;
  provinceCode?: string;
  groupName?: string;
}

export interface Task {
  id: string;
  code: string; 
  title: string;
  description: string;
  projectId?: string; 
  projectName?: string;
  projectKey?: string; 
  status: TaskStatus;
  priority: TaskPriority;
  departmentId: DepartmentId;
  departmentName?: string;
  creatorId: string;
  creator?: User;
  reportToId?: string;
  reportToIds?: string[];
  reportTo?: User;
  reporters?: User[];
  reportTos?: User[];
  assigneeIds: string[]; 
  assignees?: User[];
  dueDate: string; 
  startDate?: string;
  estimatedHours?: number;
  checklist: TaskChecklistItem[];
  commentsCount: number;
  tags: string[];
  requiresApproval?: boolean;
  isApproved?: boolean;
  approvedById?: string;
  resolution?: TaskResolution; 
  resolutionNote?: string;     
  closedAt?: string;           
  closedById?: string;         
  parentId?: string | null;
  parent?: Task | null;
  subTasks?: Task[];
  subtasksCount?: number;
  completedSubtasksCount?: number;
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskInput {
  title: string;
  assigneeIds?: string[];
  dueDate?: string;
  startDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedHours?: number;
  description?: string;
}

export interface DailyReportItem {
  id: string;
  taskId?: string; 
  taskTitle: string; 
  hoursSpent: number;
  status: TaskStatus | "COMPLETED" | "IN_PROGRESS";
  note?: string;
}

export type DailyReportType = "daily" | "monthly" | "yearly";

export type DailyReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected";

export interface ReportRecipient {
  id?: string;
  dailyReportId?: string;
  userId: string;
  recipientType: "reviewer" | "cc";
  user?: User;
}

export interface ReportFeedback {
  id: string;
  dailyReportId?: string;
  feedbackBy: string;
  feedbackContent: string;
  user?: User;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  user?: User;
  type?: DailyReportType;
  departmentId: DepartmentId;
  date: string;
  status: DailyReportStatus;
  todayWorks: DailyReportItem[];
  tomorrowPlans: string;
  blockers?: string;
  approverId?: string;
  approver?: User;
  ccRecipientIds?: string[];
  ccRecipients?: User[];
  attachments?: string[];
  feedbacks?: ReportFeedback[];
  managerFeedback?: string;
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
  parentId?: string;
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


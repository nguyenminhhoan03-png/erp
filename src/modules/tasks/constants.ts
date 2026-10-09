import { TaskPriority, TaskResolution, TaskStatus, TaskProject } from "./types";

/**
 * CẤU HÌNH HỆ THỐNG:
 * REQUIRE_SELF_TASK_APPROVAL: Khi nhân viên tự tạo task cho chính mình,
 * - true: Task vào trạng thái PENDING_APPROVAL (Chờ duyệt). Trưởng phòng hoặc Admin phải duyệt.
 * - false: Task vào thẳng trạng thái TODO (Cần làm).
 */
export const REQUIRE_SELF_TASK_APPROVAL = true;

export interface StatusConfig {
  id: TaskStatus;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  borderColor: string;
  description: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  PENDING_APPROVAL: {
    id: "PENDING_APPROVAL",
    label: "Pending Approval",
    color: "#f59e0b",
    badgeBg: "bg-amber-50 dark:bg-amber-950/50",
    badgeText: "text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-medium",
    dotColor: "bg-amber-500",
    borderColor: "border-amber-300 dark:border-amber-800",
    description: "Proposed task waiting for department lead approval",
  },
  TODO: {
    id: "TODO",
    label: "To Do",
    color: "#64748b",
    badgeBg: "bg-slate-100 dark:bg-slate-800/80",
    badgeText: "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-medium",
    dotColor: "bg-slate-500",
    borderColor: "border-slate-300 dark:border-slate-800",
    description: "Tasks scheduled and ready to be worked on",
  },
  IN_PROGRESS: {
    id: "IN_PROGRESS",
    label: "In Progress",
    color: "#2563eb",
    badgeBg: "bg-blue-50 dark:bg-blue-950/50",
    badgeText: "text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-medium",
    dotColor: "bg-blue-600",
    borderColor: "border-blue-300 dark:border-blue-800",
    description: "Tasks currently being worked on",
  },
  IN_REVIEW: {
    id: "IN_REVIEW",
    label: "In Review",
    color: "#9333ea",
    badgeBg: "bg-purple-50 dark:bg-purple-950/50",
    badgeText: "text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-medium",
    dotColor: "bg-purple-600",
    borderColor: "border-purple-300 dark:border-purple-800",
    description: "Pending verification and quality sign-off",
  },
  DONE: {
    id: "DONE",
    label: "Done",
    color: "#16a34a",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/50",
    badgeText: "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-medium",
    dotColor: "bg-emerald-600",
    borderColor: "border-emerald-300 dark:border-emerald-800",
    description: "Task completed and verified",
  },
  CANCELLED: {
    id: "CANCELLED",
    label: "Closed / Cancelled",
    color: "#64748b",
    badgeBg: "bg-slate-100 dark:bg-slate-850",
    badgeText: "text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 font-medium",
    dotColor: "bg-slate-400",
    borderColor: "border-slate-300 dark:border-slate-800",
    description: "Closed or cancelled task (Won't Fix, Not a Bug, Duplicate...)",
  },
};

export interface ResolutionConfig {
  id: TaskResolution;
  label: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const TASK_RESOLUTION_CONFIG: Record<TaskResolution, ResolutionConfig> = {
  DONE: {
    id: "DONE",
    label: "Hoàn thành (Done / Fixed)",
    badgeLabel: "Done",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/50",
    badgeText: "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-medium",
    description: "Công việc đã được nghiệm thu và hoàn thành xuất sắc",
  },
  NOT_A_BUG: {
    id: "NOT_A_BUG",
    label: "Không phải lỗi (Not a Bug)",
    badgeLabel: "Not a Bug",
    badgeBg: "bg-slate-100 dark:bg-slate-800/80",
    badgeText: "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold",
    description: "Hệ thống hoạt động đúng thiết kế (By Design) hoặc thao tác nhầm",
  },
  WONT_FIX: {
    id: "WONT_FIX",
    label: "Không sửa / Bỏ qua (Won't Fix)",
    badgeLabel: "Won't Fix",
    badgeBg: "bg-rose-50 dark:bg-rose-950/50",
    badgeText: "text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-semibold",
    description: "Quyết định không xử lý do chi phí cao hoặc tính năng sắp bỏ",
  },
  CANNOT_REPRODUCE: {
    id: "CANNOT_REPRODUCE",
    label: "Không tái hiện được (Cannot Reproduce)",
    badgeLabel: "Cannot Reproduce",
    badgeBg: "bg-amber-50 dark:bg-amber-950/50",
    badgeText: "text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold",
    description: "Không tái hiện lại được lỗi trên môi trường kiểm thử",
  },
  DUPLICATE: {
    id: "DUPLICATE",
    label: "Trùng lặp (Duplicate)",
    badgeLabel: "Duplicate",
    badgeBg: "bg-purple-50 dark:bg-purple-950/50",
    badgeText: "text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-semibold",
    description: "Trùng lặp với một công việc hoặc báo cáo lỗi đã tồn tại",
  },
};

export interface PriorityConfig {
  id: TaskPriority;
  label: string;
  badgeBg: string;
  badgeText: string;
  color: string;
  order: number;
}

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  LOW: {
    id: "LOW",
    label: "Low",
    badgeBg: "bg-slate-100 dark:bg-slate-800/80",
    badgeText: "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    color: "#64748b",
    order: 1,
  },
  MEDIUM: {
    id: "MEDIUM",
    label: "Medium",
    badgeBg: "bg-sky-50 dark:bg-sky-950/50",
    badgeText: "text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 font-semibold",
    color: "#0284c7",
    order: 2,
  },
  HIGH: {
    id: "HIGH",
    label: "High",
    badgeBg: "bg-amber-50 dark:bg-amber-950/50",
    badgeText: "text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold",
    color: "#d97706",
    order: 3,
  },
  URGENT: {
    id: "URGENT",
    label: "Urgent",
    badgeBg: "bg-rose-50 dark:bg-rose-950/50",
    badgeText: "text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold",
    color: "#e11d48",
    order: 4,
  },
};

// Thứ tự các cột mặc định trên bảng Kanban (chuẩn Jira Scrum/Kanban đầy đủ 6 cột)
export const KANBAN_COLUMNS: TaskStatus[] = [
  "PENDING_APPROVAL",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
];





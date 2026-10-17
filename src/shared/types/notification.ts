export type NotificationCategory = "TASK" | "MEETING" | "REPORT" | "APPROVAL" | "SYSTEM";

export type NotificationType =
  // Task
  | "TASK_COMMENT"
  | "TASK_ASSIGNED"
  | "TASK_STATUS"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "TASK_MENTION"
  // Meeting / Calendar
  | "MEETING_INVITE"
  | "MEETING_REMINDER"
  | "MEETING_CONFLICT"
  | "MEETING_UPDATE"
  | "MEETING_CANCEL"
  // Daily Report
  | "REPORT_REMINDER"
  | "REPORT_FEEDBACK"
  // Approval
  | "APPROVAL_REQUEST"
  | "APPROVAL_DECISION"
  // System
  | "SYSTEM_ANNOUNCEMENT";

export type NotificationPriority = "NORMAL" | "HIGH" | "URGENT";

export interface NotificationAction {
  type: "OPEN_TASK" | "NAVIGATE" | "OPEN_MEETING" | "NONE";
  url?: string;
  payload?: {
    taskId?: string;
    taskCode?: string;
    meetingId?: string;
    projectId?: string;
    reportDate?: string;
    [key: string]: any;
  };
}

export interface NotificationItem {
  id: string;
  userId?: string;
  category: NotificationCategory;
  type: NotificationType | string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  action?: NotificationAction;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
  };
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;

  // Backward compatibility fields
  taskId?: string;
  taskCode?: string;
  taskTitle?: string;
  data?: Record<string, any>;
}

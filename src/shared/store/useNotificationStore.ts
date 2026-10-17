import { create } from "zustand";
import {
  NotificationItem,
  NotificationCategory,
  NotificationType,
} from "../types/notification";
import { apiRequest } from "@/lib/api-client";

const NOTIFICATIONS_STORAGE_KEY = "erp_notifications_v2";

export type NotificationFilter = "all" | "unread" | NotificationCategory;

function loadLocalNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

function saveLocalNotifications(list: NotificationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  fetchNotifications: () => Promise<void>;
  addNotification: (
    item: Partial<NotificationItem> & {
      title: string;
      message: string;
      category?: NotificationCategory;
      type?: NotificationType | string;
    }
  ) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (category?: NotificationCategory) => Promise<void>;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  const initial = loadLocalNotifications();
  const initialUnread = initial.filter((n) => !n.isRead).length;

  return {
    notifications: initial,
    unreadCount: initialUnread,
    isLoading: false,
    filter: "all",

    setFilter: (filter) => set({ filter }),

    fetchNotifications: async () => {
      set({ isLoading: true });
      try {
        const res = await apiRequest<{ success: boolean; data: any[] }>("/erp/notifications");
        if (res?.success && Array.isArray(res.data)) {
          const mapped: NotificationItem[] = res.data.map((item: any) => {
            const rawType = String(item.type || "").toLowerCase();
            let category: NotificationCategory = "SYSTEM";
            if (item.category) {
              const catUpper = String(item.category).toUpperCase();
              if (["TASK", "MEETING", "REPORT", "APPROVAL", "SYSTEM"].includes(catUpper)) {
                category = catUpper as NotificationCategory;
              }
            } else if (rawType.includes("meeting") || rawType.includes("work_schedule") || rawType.includes("calendar")) {
              category = "MEETING";
            } else if (rawType.includes("report")) {
              category = "REPORT";
            } else if (rawType.includes("task") || rawType.includes("project")) {
              category = "TASK";
            } else if (rawType.includes("form") || rawType.includes("approve")) {
              category = "APPROVAL";
            }

            let parsedData = item.data;
            if (typeof parsedData === "string") {
              try { parsedData = JSON.parse(parsedData); } catch {}
            }
            parsedData = parsedData || {};

            return {
              id: String(item.id),
              userId: item.user_id ? String(item.user_id) : undefined,
              category,
              type: item.type || "SYSTEM_ANNOUNCEMENT",
              priority: parsedData?.priority || item.priority || "NORMAL",
              title: item.title || "Thông báo",
              message: item.message || "",
              action: parsedData?.action || (parsedData?.task_id || parsedData?.task_code
                ? { type: "OPEN_TASK", payload: { taskId: parsedData.task_id, taskCode: parsedData.task_code } }
                : parsedData?.url
                ? { type: "NAVIGATE", url: parsedData.url }
                : { type: "NONE" }),
              taskId: parsedData?.task_id ? String(parsedData.task_id) : undefined,
              taskCode: parsedData?.task_code || undefined,
              taskTitle: parsedData?.task_title || undefined,
              actor: parsedData?.actor || undefined,
              data: parsedData,
              isRead: !!item.read_at,
              readAt: item.read_at,
              createdAt: item.created_at || new Date().toISOString(),
            };
          });

          const unreadCount = mapped.filter((n) => !n.isRead).length;
          set({ notifications: mapped, unreadCount, isLoading: false });
          saveLocalNotifications(mapped);
          return;
        }
      } catch {}

      const current = loadLocalNotifications();
      set({
        notifications: current,
        unreadCount: current.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    },

    addNotification: (item) => {
      const category = item.category || "TASK";
      const newItem: NotificationItem = {
        id: `notif-${Date.now()}`,
        category,
        type: item.type || "TASK_COMMENT",
        priority: item.priority || "NORMAL",
        title: item.title,
        message: item.message,
        action: item.action || (item.taskId || item.taskCode
          ? { type: "OPEN_TASK", payload: { taskId: item.taskId, taskCode: item.taskCode } }
          : { type: "NONE" }),
        taskId: item.taskId,
        taskCode: item.taskCode,
        taskTitle: item.taskTitle,
        actor: item.actor,
        data: item.data,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [newItem, ...get().notifications];
      set({
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      });
      saveLocalNotifications(updated);
    },

    markAsRead: async (id: string) => {
      const updated = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      );
      set({
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      });
      saveLocalNotifications(updated);

      try {
        await apiRequest(`/erp/notifications/${id}/read`, { method: "PUT" });
      } catch {}
    },

    markAllAsRead: async (category?: NotificationCategory) => {
      const updated = get().notifications.map((n) => {
        if (!category || n.category === category) {
          return { ...n, isRead: true, readAt: new Date().toISOString() };
        }
        return n;
      });

      set({
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      });
      saveLocalNotifications(updated);

      try {
        await apiRequest("/erp/notifications/read-all", {
          method: "PUT",
          body: JSON.stringify(category ? { category } : {}),
        });
      } catch {}
    },

    clearNotifications: () => {
      set({ notifications: [], unreadCount: 0 });
      saveLocalNotifications([]);
    },
  };
});

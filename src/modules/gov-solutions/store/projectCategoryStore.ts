import { create } from "zustand";
import { apiRequest } from "@/lib/api-client";

export interface ProjectCategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
  projectCount?: number;
  sortOrder?: number;
  createdAt?: string;
}

const STORAGE_KEY = "igb_project_categories";

export const DEFAULT_PROJECT_CATEGORIES: ProjectCategoryItem[] = [
  {
    id: "1",
    name: "Dự án CĐS Chính phủ",
    code: "GOV",
    description: "Dự án chuyển đổi số triển khai theo tỉnh thành, văn bản và 7 giai đoạn",
    isSystem: true,
    projectCount: 2,
    sortOrder: 1,
    createdAt: "2026-10-01",
  },
  {
    id: "2",
    name: "Dự án Nội bộ công ty",
    code: "INTERNAL",
    description: "Dự án phát triển phần mềm, hạ tầng kỹ thuật và công việc nội bộ gắn với phòng ban",
    isSystem: true,
    projectCount: 0,
    sortOrder: 2,
    createdAt: "2026-10-01",
  },
  {
    id: "3",
    name: "Dự án Outsource / Đối tác",
    code: "OUTSOURCE",
    description: "Hợp đồng gia công, triển khai giải pháp phần mềm cho khách hàng và đối tác B2B",
    isSystem: true,
    projectCount: 0,
    sortOrder: 3,
    createdAt: "2026-10-01",
  },
];

interface ProjectCategoryStore {
  categories: ProjectCategoryItem[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (item: Omit<ProjectCategoryItem, "id" | "createdAt">) => Promise<boolean>;
  updateCategory: (id: string, item: Partial<ProjectCategoryItem>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
}

const mapApiToItem = (item: any): ProjectCategoryItem => ({
  id: String(item.id),
  name: item.name,
  code: item.code,
  description: item.description || "",
  isSystem: Boolean(item.is_system),
  projectCount: item.projects_count ?? 0,
  sortOrder: item.sort_order ?? 0,
  createdAt: item.created_at ? item.created_at.split("T")[0] : "",
});

export const useProjectCategoryStore = create<ProjectCategoryStore>((set, get) => ({
  categories: DEFAULT_PROJECT_CATEGORIES,
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>("/erp/gov-projects/project-categories");
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapApiToItem).filter((c) => c.isSystem !== false);
        set({ categories: mapped, isLoading: false });
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        }
        return;
      }
    } catch {
      // Fallback to local storage or presets
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const systemOnly = parsed.filter((c: any) => c.isSystem !== false);
            set({ categories: systemOnly.length > 0 ? systemOnly : DEFAULT_PROJECT_CATEGORIES, isLoading: false });
            return;
          }
        } catch {
          // ignore error
        }
      }
    }
    set({ categories: DEFAULT_PROJECT_CATEGORIES, isLoading: false });
  },

  addCategory: async (item) => {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>("/erp/gov-projects/project-categories", {
        method: "POST",
        body: {
          name: item.name,
          code: item.code,
          description: item.description,
          sort_order: item.sortOrder || get().categories.length + 1,
        },
      });

      const newCategory: ProjectCategoryItem = res?.data
        ? mapApiToItem(res.data)
        : {
            ...item,
            id: `cat_${Date.now()}`,
            projectCount: 0,
            sortOrder: get().categories.length + 1,
            createdAt: new Date().toISOString().split("T")[0],
          };

      const updated = [...get().categories, newCategory];
      set({ categories: updated });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return true;
    } catch {
      const newCategory: ProjectCategoryItem = {
        ...item,
        id: `cat_${Date.now()}`,
        projectCount: 0,
        sortOrder: get().categories.length + 1,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...get().categories, newCategory];
      set({ categories: updated });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return true;
    }
  },

  updateCategory: async (id, item) => {
    try {
      await apiRequest(`/erp/gov-projects/project-categories/${id}`, {
        method: "PUT",
        body: {
          name: item.name,
          code: item.code,
          description: item.description,
          sort_order: item.sortOrder,
        },
      });
    } catch {
      // Continue optimistic local update
    }

    const updated = get().categories.map((cat) => (cat.id === id ? { ...cat, ...item } : cat));
    set({ categories: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },

  deleteCategory: async (id) => {
    try {
      await apiRequest(`/erp/gov-projects/project-categories/${id}`, {
        method: "DELETE",
      });
    } catch {
      // Continue optimistic local deletion
    }

    const updated = get().categories.filter((cat) => cat.id !== id);
    set({ categories: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },
}));

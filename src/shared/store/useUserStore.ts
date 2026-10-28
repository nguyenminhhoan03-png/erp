import { create } from "zustand";
import { User, Department } from "../types";

const defaultUser: User = {
  id: "",
  name: "",
  email: "",
  avatar: "",
  role: "EMPLOYEE",
  departmentId: "",
  title: "",
  permissions: [],
};

interface UserState {
  currentUser: User;
  users: User[];
  departments: Department[];
  setCurrentUser: (user: User) => void;
  getUserById: (id: string) => User | undefined;
  fetchUsers: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: defaultUser,
  users: [],
  departments: [],

  setCurrentUser: (user: User) => set({ currentUser: user }),

  getUserById: (id: string) => get().users.find((u) => u.id === id),

  fetchUsers: async () => {
    try {
      const { apiRequest } = await import("@/lib/api-client");
      const res = await apiRequest<{ success: boolean; data: any[] }>("/erp/users");
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        set((state) => {
          const matchedCurrent = state.currentUser?.id
            ? res.data.find((u) => u.id === state.currentUser.id)
            : null;
          return {
            users: res.data,
            currentUser: matchedCurrent || state.currentUser,
          };
        });
      }
    } catch (err) {
      console.warn("Failed to fetch users", err);
    }
  },

  fetchDepartments: async () => {
    try {
      const { apiRequest } = await import("@/lib/api-client");
      const res = await apiRequest<{ success: boolean; data: any[] }>("/erp/departments?perPage=100");
      if (res?.success && Array.isArray(res.data)) {
        set({ departments: res.data });
      }
    } catch (err) {
      console.warn("Failed to fetch departments", err);
    }
  },
}));

import { create } from "zustand";
import { User } from "../types";
import { MOCK_USERS } from "../mock/users";

const USERS_STORAGE_KEY = "erp_users_cache_v1";

function getInitialUsers(): User[] {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
  }
  const defaultUsers = [...MOCK_USERS];
  saveUsers(defaultUsers);
  return defaultUsers;
}

function saveUsers(users: User[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Ignore
    }
  }
}

interface UserState {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  getUserById: (id: string) => User | undefined;
  addUser: (userData: Omit<User, "id">) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const initialList = getInitialUsers();

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: initialList.find((u) => u.id === "user-admin") || initialList[0],
  users: initialList,

  setCurrentUser: (user: User) => set({ currentUser: user }),

  getUserById: (id: string) => get().users.find((u) => u.id === id),

  addUser: (userData) => {
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
    };

    const updated = [newUser, ...get().users];
    set({ users: updated });
    saveUsers(updated);
    return newUser;
  },

  updateUser: (id, updates) => {
    const updated = get().users.map((u) => (u.id === id ? { ...u, ...updates } : u));
    set({
      users: updated,
      currentUser: get().currentUser.id === id ? { ...get().currentUser, ...updates } : get().currentUser,
    });
    saveUsers(updated);
  },

  deleteUser: (id) => {
    const updated = get().users.filter((u) => u.id !== id);
    set({ users: updated });
    saveUsers(updated);
  },
}));

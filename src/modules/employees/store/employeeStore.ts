import { create } from "zustand";
import { Employee, EmployeeFilter } from "../types";
import { employeeService, EmployeeOptionsData } from "../services/employeeService";
import { toast } from "sonner";

export interface EmployeePagination {
  page: number;
  perPage: number;
  cursor: string | null;
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  total: number;
  cursorHistory: (string | null)[];
}

interface EmployeeState {
  employees: Employee[];
  isLoading: boolean;
  options: EmployeeOptionsData | null;
  filter: EmployeeFilter;
  pagination: EmployeePagination;
  selectedEmployee: Employee | null;
  isDetailOpen: boolean;
  isFormOpen: boolean;
  editingEmployee: Employee | null;

  setFilter: (updates: Partial<EmployeeFilter>) => void;
  resetFilter: () => void;
  setPerPage: (perPage: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToFirstPage: () => Promise<void>;
  openCreate: () => void;
  openEdit: (emp: Employee) => void;
  closeForm: () => void;
  openDetail: (emp: Employee) => void;
  closeDetail: () => void;
  loadEmployees: (targetCursor?: string | null, targetPage?: number) => Promise<void>;
  loadOptions: () => Promise<void>;
  addEmployee: (data: Omit<Employee, "id" | "code">) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
}

const DEFAULT_FILTER: EmployeeFilter = {
  search: "",
  departmentId: "ALL",
  userType: "ALL",
  status: "ALL",
};

const DEFAULT_PAGINATION: EmployeePagination = {
  page: 1,
  perPage: 20,
  cursor: null,
  nextCursor: null,
  prevCursor: null,
  hasMore: false,
  total: 0,
  cursorHistory: [null],
};

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  isLoading: false,
  options: null,
  filter: DEFAULT_FILTER,
  pagination: DEFAULT_PAGINATION,
  selectedEmployee: null,
  isDetailOpen: false,
  isFormOpen: false,
  editingEmployee: null,

  setFilter: (updates) => {
    set((state) => ({
      filter: { ...state.filter, ...updates },
      pagination: {
        ...state.pagination,
        page: 1,
        cursor: null,
        cursorHistory: [null],
      },
    }));
    get().loadEmployees(null, 1);
  },

  resetFilter: () => {
    set({
      filter: DEFAULT_FILTER,
      pagination: DEFAULT_PAGINATION,
    });
    get().loadEmployees(null, 1);
  },

  setPerPage: async (perPage: number) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        perPage,
        page: 1,
        cursor: null,
        cursorHistory: [null],
      },
    }));
    await get().loadEmployees(null, 1);
  },

  nextPage: async () => {
    const { pagination, isLoading } = get();
    if (isLoading || !pagination.nextCursor) return;

    const nextTargetPage = pagination.page + 1;
    const history = [...pagination.cursorHistory];
    history[nextTargetPage - 1] = pagination.nextCursor;

    set((state) => ({
      pagination: {
        ...state.pagination,
        cursorHistory: history,
      },
    }));

    await get().loadEmployees(pagination.nextCursor, nextTargetPage);
  },

  prevPage: async () => {
    const { pagination, isLoading } = get();
    if (isLoading || pagination.page <= 1) return;

    const prevTargetPage = pagination.page - 1;
    const targetCursor = pagination.cursorHistory[prevTargetPage - 1] ?? null;

    await get().loadEmployees(targetCursor, prevTargetPage);
  },

  goToFirstPage: async () => {
    const { isLoading, pagination } = get();
    if (isLoading || pagination.page === 1) return;

    set((state) => ({
      pagination: {
        ...state.pagination,
        page: 1,
        cursor: null,
        cursorHistory: [null],
      },
    }));

    await get().loadEmployees(null, 1);
  },

  openCreate: () => set({ isFormOpen: true, editingEmployee: null }),

  openEdit: (emp) => set({ isFormOpen: true, editingEmployee: emp }),

  closeForm: () => set({ isFormOpen: false, editingEmployee: null }),

  openDetail: (emp) => set({ isDetailOpen: true, selectedEmployee: emp }),

  closeDetail: () => set({ isDetailOpen: false, selectedEmployee: null }),

  loadEmployees: async (targetCursor?: string | null, targetPage?: number) => {
    set({ isLoading: true });
    try {
      const { filter, pagination } = get();
      const cursorToUse = targetCursor !== undefined ? targetCursor : pagination.cursor;
      const pageToUse = targetPage !== undefined ? targetPage : pagination.page;

      const res = await employeeService.getEmployees(filter, cursorToUse, pagination.perPage);

      if (res?.data) {
        set((state) => ({
          employees: res.data,
          pagination: {
            ...state.pagination,
            page: pageToUse,
            cursor: cursorToUse ?? null,
            nextCursor: res.meta?.next_cursor ?? null,
            prevCursor: res.meta?.prev_cursor ?? null,
            hasMore: Boolean(res.meta?.has_more),
            total: res.meta?.total ?? res.data.length,
          },
        }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh sách nhân sự");
      set({ employees: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  loadOptions: async () => {
    try {
      const res = await employeeService.getOptions();
      if (res?.data) {
        set({ options: res.data });
      }
    } catch {
      toast.error("Không thể tải danh mục cấu hình nhân sự");
    }
  },

  addEmployee: async (data) => {
    set({ isLoading: true });
    try {
      const res = await employeeService.createEmployee(data);
      if (res?.data) {
        set((state) => ({
          employees: [res.data!, ...state.employees],
          isFormOpen: false,
        }));
        toast.success(res.message || "Thêm nhân sự mới thành công");
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể thêm nhân sự");
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateEmployee: async (id, updates) => {
    set({ isLoading: true });
    try {
      const res = await employeeService.updateEmployee(id, updates);
      const updated = res?.data;
      set((state) => ({
        employees: state.employees.map((e) =>
          e.id === id ? (updated ? { ...e, ...updated } : { ...e, ...updates }) : e
        ),
        selectedEmployee:
          state.selectedEmployee?.id === id
            ? updated
              ? { ...state.selectedEmployee, ...updated }
              : { ...state.selectedEmployee, ...updates }
            : state.selectedEmployee,
        isFormOpen: false,
        editingEmployee: null,
      }));
      toast.success(res.message || "Cập nhật thông tin nhân sự thành công");
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật nhân sự");
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteEmployee: async (id) => {
    try {
      const res = await employeeService.deleteEmployee(id);
      set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
        isDetailOpen: state.selectedEmployee?.id === id ? false : state.isDetailOpen,
        selectedEmployee: state.selectedEmployee?.id === id ? null : state.selectedEmployee,
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
      }));
      toast.success(res?.message || "Đã xóa nhân sự thành công");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa nhân sự");
      throw err;
    }
  },

  toggleStatus: async (id) => {
    try {
      const res = await employeeService.toggleStatus(id);
      const currentEmp = get().employees.find((e) => e.id === id);
      const newStatus = res?.status || (currentEmp?.status === "Active" ? "Inactive" : "Active");

      set((state) => ({
        employees: state.employees.map((e) =>
          e.id === id ? { ...e, status: newStatus as any } : e
        ),
        selectedEmployee:
          state.selectedEmployee?.id === id
            ? { ...state.selectedEmployee, status: newStatus as any }
            : state.selectedEmployee,
      }));
      toast.success(res?.message || `Đã chuyển trạng thái sang ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Không thể đổi trạng thái nhân sự");
      throw err;
    }
  },
}));

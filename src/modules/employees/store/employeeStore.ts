import { create } from "zustand";
import { Employee, EmployeeFilter, UserType, EmployeeStatus } from "../types";

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    code: "NV-001",
    name: "Nguyễn Minh Hoàn",
    email: "hoan.nm@company.com",
    phone: "0987654321",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    departmentId: "it",
    departmentName: "Công nghệ thông tin",
    position: "Trưởng phòng Kỹ thuật",
    role: "ADMIN",
    userType: "nhan_vien_chinh_thuc",
    status: "Active",
    joinedDate: "2022-03-15",
    birthday: "1994-08-20",
    cccd: "001094012345",
    salary: 35000000,
    bankAccount: {
      bankName: "Vietcombank",
      accountNumber: "0011004567890",
      holderName: "NGUYEN MINH HOAN",
      branch: "Hà Nội",
    },
    address: "Cầu Giấy, Hà Nội",
  },
  {
    id: "emp-2",
    code: "NV-002",
    name: "Trần Thị Mai",
    email: "mai.tt@company.com",
    phone: "0912345678",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    departmentId: "hr",
    departmentName: "Nhân sự & Tuyển dụng",
    position: "Chuyên viên HR Senior",
    role: "MANAGER",
    userType: "nhan_vien_chinh_thuc",
    status: "Active",
    joinedDate: "2023-01-10",
    birthday: "1996-05-12",
    cccd: "025096054321",
    salary: 22000000,
    bankAccount: {
      bankName: "Techcombank",
      accountNumber: "19034567891011",
      holderName: "TRAN THI MAI",
      branch: "Đống Đa, Hà Nội",
    },
    address: "Ba Đình, Hà Nội",
  },
  {
    id: "emp-3",
    code: "NV-003",
    name: "Lê Hoàng Nam",
    email: "nam.lh@company.com",
    phone: "0934567890",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    departmentId: "it",
    departmentName: "Công nghệ thông tin",
    position: "Senior Fullstack Developer",
    role: "EMPLOYEE",
    userType: "nhan_vien_chinh_thuc",
    status: "Active",
    joinedDate: "2023-06-01",
    birthday: "1997-11-25",
    cccd: "001097008899",
    salary: 28000000,
    bankAccount: {
      bankName: "MB Bank",
      accountNumber: "0934567890",
      holderName: "LE HOANG NAM",
      branch: "Thăng Long, Hà Nội",
    },
    address: "Thanh Xuân, Hà Nội",
  },
  {
    id: "emp-4",
    code: "NV-004",
    name: "Phạm Thu Hương",
    email: "huong.pt@company.com",
    phone: "0945678901",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    departmentId: "marketing",
    departmentName: "Marketing & Truyền thông",
    position: "Trưởng nhóm Digital Marketing",
    role: "MANAGER",
    userType: "nhan_vien_chinh_thuc",
    status: "Active",
    joinedDate: "2023-08-15",
    birthday: "1995-03-30",
    cccd: "031095007788",
    salary: 25000000,
    bankAccount: {
      bankName: "VPBank",
      accountNumber: "9876543210",
      holderName: "PHAM THU HUONG",
      branch: "Hà Nội",
    },
    address: "Hoàn Kiếm, Hà Nội",
  },
  {
    id: "emp-5",
    code: "NV-005",
    name: "Đặng Quốc Huy",
    email: "huy.dq@company.com",
    phone: "0967890123",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    departmentId: "sales",
    departmentName: "Kinh doanh & Phát triển thị trường",
    position: "Chuyên viên Kinh doanh B2B",
    role: "EMPLOYEE",
    userType: "thu_viec",
    status: "Active",
    joinedDate: "2026-09-01",
    birthday: "1999-07-18",
    cccd: "001099003344",
    salary: 14000000,
    bankAccount: {
      bankName: "VietinBank",
      accountNumber: "102005432198",
      holderName: "DANG QUOC HUY",
      branch: "Hà Đông, Hà Nội",
    },
    address: "Hà Đông, Hà Nội",
  },
  {
    id: "emp-6",
    code: "NV-006",
    name: "Vũ Bảo Ngọc",
    email: "ngoc.vb@company.com",
    phone: "0978901234",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    departmentId: "accounting",
    departmentName: "Kế toán & Tài chính",
    position: "Kế toán tổng hợp",
    role: "EMPLOYEE",
    userType: "nhan_vien_chinh_thuc",
    status: "Active",
    joinedDate: "2024-02-20",
    birthday: "1998-12-05",
    cccd: "022098001122",
    salary: 18000000,
    bankAccount: {
      bankName: "BIDV",
      accountNumber: "12310009876543",
      holderName: "VU BAO NGOC",
      branch: "Quang Trung, Hà Nội",
    },
    address: "Nam Từ Liêm, Hà Nội",
  },
  {
    id: "emp-7",
    code: "NV-007",
    name: "Hoàng Minh Tuấn",
    email: "tuan.hm@company.com",
    phone: "0989012345",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    departmentId: "it",
    departmentName: "Công nghệ thông tin",
    position: "Thực tập sinh UI/UX Design",
    role: "EMPLOYEE",
    userType: "thuc_tap_sinh",
    status: "Active",
    joinedDate: "2026-10-01",
    birthday: "2003-04-14",
    cccd: "001203004455",
    salary: 5000000,
    bankAccount: {
      bankName: "TPBank",
      accountNumber: "02468135790",
      holderName: "HOANG MINH TUAN",
      branch: "Hà Nội",
    },
    address: "Cầu Giấy, Hà Nội",
  },
  {
    id: "emp-8",
    code: "NV-008",
    name: "Đỗ Phương Linh",
    email: "linh.dp@company.com",
    phone: "0901234567",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    departmentId: "marketing",
    departmentName: "Marketing & Truyền thông",
    position: "Cộng tác viên Nội dung (Content Creator)",
    role: "EMPLOYEE",
    userType: "cong_tac_vien",
    status: "Active",
    joinedDate: "2026-08-01",
    birthday: "2001-09-09",
    cccd: "001201006677",
    salary: 8000000,
    address: "Tây Hồ, Hà Nội",
  },
];

interface EmployeeState {
  employees: Employee[];
  filter: EmployeeFilter;
  selectedEmployee: Employee | null;
  isDetailOpen: boolean;
  isFormOpen: boolean;
  editingEmployee: Employee | null;

  setFilter: (updates: Partial<EmployeeFilter>) => void;
  resetFilter: () => void;
  openCreate: () => void;
  openEdit: (emp: Employee) => void;
  closeForm: () => void;
  openDetail: (emp: Employee) => void;
  closeDetail: () => void;
  addEmployee: (data: Omit<Employee, "id" | "code">) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  toggleStatus: (id: string) => void;
}

const DEFAULT_FILTER: EmployeeFilter = {
  search: "",
  departmentId: "ALL",
  userType: "ALL",
  status: "ALL",
};

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: INITIAL_EMPLOYEES,
  filter: DEFAULT_FILTER,
  selectedEmployee: null,
  isDetailOpen: false,
  isFormOpen: false,
  editingEmployee: null,

  setFilter: (updates) =>
    set((state) => ({ filter: { ...state.filter, ...updates } })),

  resetFilter: () => set({ filter: DEFAULT_FILTER }),

  openCreate: () => set({ isFormOpen: true, editingEmployee: null }),

  openEdit: (emp) => set({ isFormOpen: true, editingEmployee: emp }),

  closeForm: () => set({ isFormOpen: false, editingEmployee: null }),

  openDetail: (emp) => set({ isDetailOpen: true, selectedEmployee: emp }),

  closeDetail: () => set({ isDetailOpen: false, selectedEmployee: null }),

  addEmployee: (data) => {
    const list = get().employees;
    const nextIndex = list.length + 1;
    const code = `NV-${String(nextIndex).padStart(3, "0")}`;
    const newEmp: Employee = {
      ...data,
      id: `emp-${Date.now()}`,
      code,
      status: data.status || "Active",
      joinedDate: data.joinedDate || new Date().toISOString().split("T")[0],
    };
    set({ employees: [newEmp, ...list], isFormOpen: false });
  },

  updateEmployee: (id, updates) => {
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
      selectedEmployee:
        state.selectedEmployee?.id === id
          ? { ...state.selectedEmployee, ...updates }
          : state.selectedEmployee,
      isFormOpen: false,
      editingEmployee: null,
    }));
  },

  deleteEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
      isDetailOpen: state.selectedEmployee?.id === id ? false : state.isDetailOpen,
      selectedEmployee: state.selectedEmployee?.id === id ? null : state.selectedEmployee,
    }));
  },

  toggleStatus: (id) => {
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "Active" ? "Inactive" : "Active" }
          : e
      ),
    }));
  },
}));

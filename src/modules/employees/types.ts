export type UserType =
  | "nhan_vien_chinh_thuc"
  | "thu_viec"
  | "thuc_tap_sinh"
  | "cong_tac_vien";

export type EmployeeStatus = "Active" | "Inactive";

export interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  avatarFile?: File;
  departmentId: string;
  departmentName?: string;
  position: string;
  role: string;
  roleId?: string;
  roleName?: string;
  userType: UserType;
  status: EmployeeStatus;
  joinedDate: string;
  birthday?: string;
  cccd?: string;
  salary?: number;
  bankAccount?: {
    bankId?: string;
    bankName: string;
    accountNumber: string;
    holderName: string;
    branch?: string;
  };
  address?: string;
  provinceId?: string;
  provinceName?: string;
  districtId?: string;
  districtName?: string;
  wardId?: string;
  wardName?: string;
  contract?: string;
  contractSignedDate?: string;
  contractEndDate?: string;
  signature?: string;
  attendanceMachineId?: string;
  hasSubmittedDocuments?: boolean;
  password?: string;
}

export interface EmployeeFilter {
  search: string;
  departmentId: string;
  userType: string;
  status: string;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
  managerName?: string;
  managerAvatar?: string;
  employeeCount: number;
}

export interface PositionRole {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  departmentId?: string;
  employeeCount: number;
  permissionsCount: number;
}

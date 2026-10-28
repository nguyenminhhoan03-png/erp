export interface DepartmentEmployee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  position?: string;
  status?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  statusNumber?: number;
  managerId?: string | null;
  managerName?: string;
  managerEmail?: string;
  managerAvatar?: string;
  managerPosition?: string;
  subCompanyId?: string | null;
  subCompanyName?: string;
  employeesCount: number;
  employees?: DepartmentEmployee[];
  createdAt: string;
  updatedAt?: string;
}

export interface DepartmentOptionsData {
  subCompanies: Array<{ id: number; name: string }>;
  availableManagers: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    position: string;
  }>;
  availableEmployees: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    position: string;
    isCurrent?: boolean;
  }>;
}

export interface DepartmentListResponse {
  success: boolean;
  message?: string;
  data: Department[];
  meta?: {
    per_page: number;
    next_cursor?: string | null;
    prev_cursor?: string | null;
    has_more?: boolean;
    total?: number;
  };
}

export interface DepartmentDetailResponse {
  success: boolean;
  message?: string;
  data: Department;
}

export interface DepartmentOptionsResponse {
  success: boolean;
  data: DepartmentOptionsData;
}

export interface DepartmentMutationResponse {
  success: boolean;
  message: string;
  data?: Department;
  status?: string;
}

export interface CompanyDepartment {
  id: string;
  code: string;
  name: string;
  managerName?: string;
  status: "Active" | "Inactive";
  employeesCount: number;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  headUserId?: string | null;
  headUserName?: string;
  headUserEmail?: string;
  headUserAvatar?: string;
  headUserPosition?: string;
  departmentsCount: number;
  departments?: CompanyDepartment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyOptionsData {
  headUsers: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    position: string;
  }>;
  departments: Array<{
    id: string;
    name: string;
    managerName?: string;
    status: string;
  }>;
}

export interface CompanyListResponse {
  success: boolean;
  message?: string;
  data: Company[];
  meta?: {
    per_page: number;
    next_cursor?: string | null;
    prev_cursor?: string | null;
    has_more?: boolean;
    total?: number;
  };
}

export interface CompanyDetailResponse {
  success: boolean;
  message?: string;
  data: Company;
}

export interface CompanyOptionsResponse {
  success: boolean;
  data: CompanyOptionsData;
}

export interface CompanyMutationResponse {
  success: boolean;
  message: string;
  data?: Company;
}

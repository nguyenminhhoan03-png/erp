import { apiRequest } from "@/lib/api-client";
import { Employee, EmployeeFilter } from "../types";

export interface EmployeeListResponse {
  success: boolean;
  message?: string;
  data: Employee[];
  meta?: {
    per_page: number;
    next_cursor?: string | null;
    prev_cursor?: string | null;
    has_more?: boolean;
    total?: number;
  };
}

export interface EmployeeDetailResponse {
  success: boolean;
  data: Employee;
}

export interface EmployeeMutationResponse {
  success: boolean;
  message: string;
  data?: Employee;
  status?: string;
}

export interface EmployeeOptionsData {
  departments: Array<{ id: number; name: string; description?: string }>;
  roles: Array<{ id: number; role_name: string }>;
  banks: Array<{ id: number; name: string }>;
  provinces: Array<{ id: number; name: string; type?: string }>;
  userTypes: Array<{ value: string; label: string }>;
}

export interface EmployeeOptionsResponse {
  success: boolean;
  data: EmployeeOptionsData;
}

export const employeeService = {
  async getEmployees(
    filter?: Partial<EmployeeFilter>,
    cursor?: string | null,
    perPage: number | string = 20
  ): Promise<EmployeeListResponse> {
    const params = new URLSearchParams();
    if (filter?.search) params.set("search", filter.search);
    if (filter?.departmentId && filter.departmentId !== "ALL") {
      params.set("departmentId", filter.departmentId);
    }
    if (filter?.userType && filter.userType !== "ALL") {
      params.set("userType", filter.userType);
    }
    if (filter?.status && filter.status !== "ALL") {
      params.set("status", filter.status);
    }
    if (cursor) {
      params.set("cursor", cursor);
    }
    params.set("per_page", String(perPage));

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<EmployeeListResponse>(`/erp/employees${query}`);
  },

  async getEmployeeById(id: string): Promise<EmployeeDetailResponse> {
    return apiRequest<EmployeeDetailResponse>(`/erp/employees/${id}`);
  },

  async createEmployee(data: Partial<Employee> & Record<string, any>): Promise<EmployeeMutationResponse> {
    const avatarFile = data.avatarFile || ((data.avatar as any) instanceof File ? (data.avatar as any) : null);

    if (avatarFile instanceof File) {
      const formData = new FormData();
      formData.append("name", data.name || "");
      formData.append("full_name", data.name || "");
      if (data.email) formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      if (data.departmentId) formData.append("departmentId", data.departmentId);
      if (data.position) formData.append("position", data.position);
      if (data.roleId) formData.append("roleId", data.roleId);
      if (data.userType) formData.append("userType", data.userType);
      if (data.status) formData.append("status", data.status);
      if (data.salary !== undefined) formData.append("salary", String(data.salary));
      if (data.cccd) formData.append("cccd", data.cccd);
      if (data.birthday) formData.append("birthday", data.birthday);
      if (data.address) formData.append("address", data.address);
      if (data.provinceId) formData.append("province_id", data.provinceId);
      if (data.attendanceMachineId) formData.append("attendance_machine_id", data.attendanceMachineId);
      formData.append("has_submitted_documents", data.hasSubmittedDocuments ? "1" : "0");
      if (data.contractSignedDate) formData.append("contract_signed_date", data.contractSignedDate);
      if (data.contractEndDate) formData.append("contract_end_date", data.contractEndDate);
      if (data.password) formData.append("password", data.password);
      if (data.bankAccount?.bankId) formData.append("bank_id", data.bankAccount.bankId);
      if (data.bankAccount?.bankName) formData.append("bank_name", data.bankAccount.bankName);
      if (data.bankAccount?.accountNumber) formData.append("bank_account", data.bankAccount.accountNumber);
      if (data.bankAccount?.holderName) formData.append("account_holder_name", data.bankAccount.holderName);
      if (data.bankAccount?.branch) formData.append("branch", data.bankAccount.branch);
      formData.append("avatar", avatarFile);

      return apiRequest<EmployeeMutationResponse>("/erp/employees", {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<EmployeeMutationResponse>("/erp/employees", {
      method: "POST",
      body: {
        name: data.name,
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId,
        position: data.position,
        role: data.role,
        roleId: data.roleId,
        userType: data.userType,
        status: data.status || "Active",
        salary: data.salary,
        cccd: data.cccd,
        birthday: data.birthday,
        address: data.address,
        province_id: data.provinceId ?? data.province_id,
        district_id: data.districtId ?? data.district_id,
        ward_id: data.wardId ?? data.ward_id,
        attendance_machine_id: data.attendanceMachineId ?? data.attendance_machine_id,
        has_submitted_documents: data.hasSubmittedDocuments ?? data.has_submitted_documents,
        contract_signed_date: data.contractSignedDate ?? data.contract_signed_date,
        contract_end_date: data.contractEndDate ?? data.contract_end_date,
        bank_id: data.bankAccount?.bankId ?? data.bankId,
        bank_name: data.bankAccount?.bankName,
        bank_account: data.bankAccount?.accountNumber,
        account_holder_name: data.bankAccount?.holderName ?? data.account_holder_name,
        branch: data.bankAccount?.branch,
        avatar: data.avatar,
      },
    });
  },

  async updateEmployee(id: string, updates: Partial<Employee> & Record<string, any>): Promise<EmployeeMutationResponse> {
    const avatarFile = updates.avatarFile || ((updates.avatar as any) instanceof File ? (updates.avatar as any) : null);

    if (avatarFile instanceof File) {
      const formData = new FormData();
      formData.append("name", updates.name || "");
      formData.append("full_name", updates.name || "");
      if (updates.email) formData.append("email", updates.email);
      if (updates.phone) formData.append("phone", updates.phone);
      if (updates.departmentId) formData.append("departmentId", updates.departmentId);
      if (updates.position) formData.append("position", updates.position);
      if (updates.roleId) formData.append("roleId", updates.roleId);
      if (updates.userType) formData.append("userType", updates.userType);
      if (updates.status) formData.append("status", updates.status);
      if (updates.salary !== undefined && updates.salary !== null) formData.append("salary", String(updates.salary));
      if (updates.cccd) formData.append("cccd", updates.cccd);
      if (updates.birthday) formData.append("birthday", updates.birthday);
      if (updates.address) formData.append("address", updates.address);
      if (updates.provinceId) formData.append("province_id", updates.provinceId);
      if (updates.attendanceMachineId) formData.append("attendance_machine_id", updates.attendanceMachineId);
      formData.append("has_submitted_documents", updates.hasSubmittedDocuments ? "1" : "0");
      if (updates.contractSignedDate) formData.append("contract_signed_date", updates.contractSignedDate);
      if (updates.contractEndDate) formData.append("contract_end_date", updates.contractEndDate);
      if (updates.password) formData.append("password", updates.password);
      if (updates.bankAccount?.bankId) formData.append("bank_id", updates.bankAccount.bankId);
      if (updates.bankAccount?.bankName) formData.append("bank_name", updates.bankAccount.bankName);
      if (updates.bankAccount?.accountNumber) formData.append("bank_account", updates.bankAccount.accountNumber);
      if (updates.bankAccount?.holderName) formData.append("account_holder_name", updates.bankAccount.holderName);
      if (updates.bankAccount?.branch) formData.append("branch", updates.bankAccount.branch);
      formData.append("avatar", avatarFile);

      return apiRequest<EmployeeMutationResponse>(`/erp/employees/${id}/update`, {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<EmployeeMutationResponse>(`/erp/employees/${id}`, {
      method: "PUT",
      body: {
        name: updates.name,
        full_name: updates.name,
        email: updates.email,
        phone: updates.phone,
        departmentId: updates.departmentId,
        position: updates.position,
        role: updates.role,
        roleId: updates.roleId,
        userType: updates.userType,
        status: updates.status,
        salary: updates.salary,
        cccd: updates.cccd,
        birthday: updates.birthday,
        address: updates.address,
        province_id: updates.provinceId ?? updates.province_id,
        district_id: updates.districtId ?? updates.district_id,
        ward_id: updates.wardId ?? updates.ward_id,
        attendance_machine_id: updates.attendanceMachineId ?? updates.attendance_machine_id,
        has_submitted_documents: updates.hasSubmittedDocuments ?? updates.has_submitted_documents,
        contract_signed_date: updates.contractSignedDate ?? updates.contract_signed_date,
        contract_end_date: updates.contractEndDate ?? updates.contract_end_date,
        bank_id: updates.bankAccount?.bankId ?? updates.bankId,
        bank_name: updates.bankAccount?.bankName,
        bank_account: updates.bankAccount?.accountNumber,
        account_holder_name: updates.bankAccount?.holderName ?? updates.account_holder_name,
        branch: updates.bankAccount?.branch,
        avatar: updates.avatar,
        password: updates.password,
      },
    });
  },

  async toggleStatus(id: string): Promise<EmployeeMutationResponse> {
    return apiRequest<EmployeeMutationResponse>(`/erp/employees/${id}/status`, {
      method: "PATCH",
    });
  },

  async deleteEmployee(id: string): Promise<EmployeeMutationResponse> {
    return apiRequest<EmployeeMutationResponse>(`/erp/employees/${id}`, {
      method: "DELETE",
    });
  },

  async getOptions(): Promise<EmployeeOptionsResponse> {
    return apiRequest<EmployeeOptionsResponse>("/erp/employees/options");
  },
};

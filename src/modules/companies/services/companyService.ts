import { apiRequest } from "@/lib/api-client";
import {
  Company,
  CompanyListResponse,
  CompanyDetailResponse,
  CompanyOptionsResponse,
  CompanyMutationResponse,
} from "../types";

export const companyService = {
  async getCompanies(params?: {
    search?: string;
    perPage?: number;
    cursor?: string;
  }): Promise<CompanyListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.perPage) query.set("perPage", String(params.perPage));
    if (params?.cursor) query.set("cursor", params.cursor);

    const qs = query.toString();
    const endpoint = `/erp/companies${qs ? `?${qs}` : ""}`;

    return apiRequest<CompanyListResponse>(endpoint);
  },

  async getCompanyById(id: string): Promise<CompanyDetailResponse> {
    return apiRequest<CompanyDetailResponse>(`/erp/companies/${id}`);
  },

  async createCompany(data: {
    name: string;
    headUserId?: string | null;
    departmentIds?: string[];
  }): Promise<CompanyMutationResponse> {
    return apiRequest<CompanyMutationResponse>("/erp/companies", {
      method: "POST",
      body: data,
    });
  },

  async updateCompany(
    id: string,
    updates: {
      name?: string;
      headUserId?: string | null;
      departmentIds?: string[];
    }
  ): Promise<CompanyMutationResponse> {
    return apiRequest<CompanyMutationResponse>(`/erp/companies/${id}`, {
      method: "PUT",
      body: updates,
    });
  },

  async deleteCompany(id: string): Promise<CompanyMutationResponse> {
    return apiRequest<CompanyMutationResponse>(`/erp/companies/${id}`, {
      method: "DELETE",
    });
  },

  async getOptions(): Promise<CompanyOptionsResponse> {
    return apiRequest<CompanyOptionsResponse>("/erp/companies/options");
  },
};

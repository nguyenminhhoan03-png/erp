import { apiRequest } from "@/lib/api-client";
import {
  Partner,
  PartnerListResponse,
  PartnerDetailResponse,
  PartnerOptionsResponse,
  PartnerMutationResponse,
  PartnerContact,
  CustomerCareLog,
  PartnerStatus,
  CareChannel,
} from "../types";

export const partnerService = {
  async getPartners(params?: {
    search?: string;
    type?: string;
    status?: string;
    source?: string;
    service?: string;
    assignedUserId?: string;
    perPage?: number;
    cursor?: string;
  }): Promise<PartnerListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.type && params.type !== "all") query.set("type", params.type);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.source && params.source !== "all") query.set("source", params.source);
    if (params?.service && params.service !== "all") query.set("service", params.service);
    if (params?.assignedUserId && params.assignedUserId !== "all") query.set("assigned_user_id", params.assignedUserId);
    if (params?.perPage) query.set("perPage", String(params.perPage));
    if (params?.cursor) query.set("cursor", params.cursor);

    const qs = query.toString();
    return apiRequest<PartnerListResponse>(`/erp/partners${qs ? `?${qs}` : ""}`);
  },

  async getPartnerById(id: string): Promise<PartnerDetailResponse> {
    return apiRequest<PartnerDetailResponse>(`/erp/partners/${id}`);
  },

  async getOptions(): Promise<PartnerOptionsResponse> {
    return apiRequest<PartnerOptionsResponse>("/erp/partners/options");
  },

  async createPartner(data: {
    name: string;
    code?: string;
    partner_type?: string;
    organization_type?: string;
    status?: string;
    source?: string;
    source_detail?: string;
    services?: string[];
    assigned_user_id?: string | null;
    phone_number?: string;
    email?: string;
    address?: string;
    notes?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    contact_position?: string;
    contact_avatar_image?: string;
    avatar_file?: File | null;
  }): Promise<PartnerMutationResponse> {
    if (data.avatar_file instanceof File) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === "avatar_file") {
          formData.append("avatar", val as File);
        } else if (key === "services" && Array.isArray(val)) {
          formData.append("services", JSON.stringify(val));
        } else if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      return apiRequest<PartnerMutationResponse>("/erp/partners", {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<PartnerMutationResponse>("/erp/partners", {
      method: "POST",
      body: data,
    });
  },

  async updatePartner(
    id: string,
    data: Partial<Partner> & {
      assigned_user_id?: string | null;
      phone_number?: string;
      source_detail?: string;
      avatar_file?: File | null;
    }
  ): Promise<PartnerMutationResponse> {
    if (data.avatar_file instanceof File) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === "avatar_file") {
          formData.append("avatar", val as File);
        } else if (key === "services" && Array.isArray(val)) {
          formData.append("services", JSON.stringify(val));
        } else if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      return apiRequest<PartnerMutationResponse>(`/erp/partners/${id}`, {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<PartnerMutationResponse>(`/erp/partners/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  async updateStatus(id: string, status: PartnerStatus): Promise<PartnerMutationResponse> {
    return apiRequest<PartnerMutationResponse>(`/erp/partners/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async deletePartner(id: string): Promise<PartnerMutationResponse> {
    return apiRequest<PartnerMutationResponse>(`/erp/partners/${id}`, {
      method: "DELETE",
    });
  },

  async createContact(
    partnerId: string,
    data: {
      name: string;
      phone: string;
      email?: string;
      position?: string;
      avatar_image?: string;
      avatar_file?: File | null;
      is_primary?: boolean;
      services?: string[];
      note?: string;
    }
  ): Promise<{ success: boolean; message: string; data?: PartnerContact }> {
    if (data.avatar_file instanceof File) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === "avatar_file") {
          formData.append("avatar", val as File);
        } else if (key === "services" && Array.isArray(val)) {
          formData.append("services", JSON.stringify(val));
        } else if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      return apiRequest(`/erp/partners/${partnerId}/contacts`, {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest(`/erp/partners/${partnerId}/contacts`, {
      method: "POST",
      body: data,
    });
  },

  async updateContact(
    contactId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      position?: string;
      avatar_image?: string;
      is_primary?: boolean;
      services?: string[];
      note?: string;
    }
  ): Promise<{ success: boolean; message: string; data?: PartnerContact }> {
    return apiRequest(`/erp/partner-contacts/${contactId}`, {
      method: "PUT",
      body: data,
    });
  },

  async setPrimaryContact(contactId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/erp/partner-contacts/${contactId}/set-primary`, {
      method: "PATCH",
    });
  },

  async deleteContact(contactId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/erp/partner-contacts/${contactId}`, {
      method: "DELETE",
    });
  },

  async createCareLog(
    partnerId: string,
    data: {
      contact_id?: string | null;
      user_id?: string | number | null;
      channel: CareChannel;
      service?: string;
      content: string;
      result?: string;
      source?: string;
      contacted_at?: string;
    }
  ): Promise<{ success: boolean; message: string; data?: CustomerCareLog }> {
    return apiRequest(`/erp/partners/${partnerId}/care-logs`, {
      method: "POST",
      body: data,
    });
  },

  async deleteCareLog(logId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/erp/customer-care-logs/${logId}`, {
      method: "DELETE",
    });
  },
};

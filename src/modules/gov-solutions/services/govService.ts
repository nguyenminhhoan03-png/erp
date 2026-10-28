import { apiClient } from "@/lib/api";
import {
  DigitalSolution,
  GovDocument,
  GovMeetingSchedule,
  GovProject,
  GovWorkLog,
  GovCalendarSummary,
} from "../types";
import type {
  GovBootstrapDto,
  GovDocumentDto,
  GovMeetingScheduleDto,
  GovProjectDto,
  GovWorkLogDto,
  GovCalendarSummaryDto,
} from "../api/dto";
import {
  isGovBootstrapDto,
  isGovProjectDto,
} from "../api/schema";
import {
  mapDigitalSolution,
  mapGovDocument,
  mapGovMeeting,
  mapGovProject,
  mapGovWorkLog,
} from "../api/mapper";

export const govService = {
  async bootstrap(projectId?: string): Promise<{
    solutions: DigitalSolution[];
    activeProjectId: number | null;
    activeSolutionId?: string;
    provinces: GovProject[];
    upcomingMeetings: GovMeetingSchedule[];
    documents: GovDocument[];
  }> {
    const query: Record<string, string> = {};
    if (projectId && !isNaN(Number(projectId))) {
      query.project_id = projectId;
    }

    const result = await apiClient.get<GovBootstrapDto>("/erp/gov-projects/bootstrap", { query });

    if (result.type !== "success" || !isGovBootstrapDto(result.data)) {
      return {
        solutions: [],
        activeProjectId: null,
        provinces: [],
        upcomingMeetings: [],
        documents: [],
      };
    }

    const raw = result.data.data;
    return {
      solutions: (raw.solutions || []).map(mapDigitalSolution),
      activeProjectId: raw.active_project_id,
      activeSolutionId: raw.active_solution_id ? String(raw.active_solution_id) : undefined,
      provinces: (raw.provinces || []).map(mapGovProject),
      upcomingMeetings: (raw.upcoming_meetings || []).map(mapGovMeeting),
      documents: (raw.documents || []).map(mapGovDocument),
    };
  },

  async createSolution(data: any): Promise<DigitalSolution> {
    const payload = {
      name: data.name,
      short_name: data.shortName || data.name,
      code: data.code,
      icon_name: data.iconName || "Compass",
      color_hex: data.colorHex || "#3b82f6",
      badge_class: data.badgeClass || "bg-blue-500/10 text-blue-600",
      target_department: data.targetGovDepartment || "",
      target_gov_department: data.targetGovDepartment || "",
      data_asset_description: data.dataAssetDescription || "",
      description: data.description || "",
      manager_id: data.managerId || null,
      manager_ids: data.managerIds || [],
      department_id: data.departmentId || (Array.isArray(data.departmentIds) && data.departmentIds[0] ? data.departmentIds[0] : null),
      department_ids: data.departmentIds || (data.departmentId ? [data.departmentId] : []),
      partner_id: data.partnerId || null,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      budget: data.budget ? Number(data.budget) : null,
      priority: data.priority || "medium",
      status: data.status || "active",
      category: data.category || "GOV",
    };

    const result = await apiClient.postJson<{ data: any }>("/erp/projects", payload);
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Không thể tạo dự án.");
    }

    return mapDigitalSolution(result.data.data);
  },

  async updateSolution(id: string, data: any): Promise<DigitalSolution> {
    const payload = {
      name: data.name,
      short_name: data.shortName || data.name,
      code: data.code,
      icon_name: data.iconName,
      color_hex: data.colorHex,
      badge_class: data.badgeClass,
      target_department: data.targetGovDepartment,
      target_gov_department: data.targetGovDepartment,
      data_asset_description: data.dataAssetDescription,
      description: data.description,
      manager_id: data.managerId || null,
      manager_ids: data.managerIds || [],
      department_id: data.departmentId || (Array.isArray(data.departmentIds) && data.departmentIds[0] ? data.departmentIds[0] : null),
      department_ids: data.departmentIds || (data.departmentId ? [data.departmentId] : []),
      partner_id: data.partnerId || null,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      budget: data.budget ? Number(data.budget) : null,
      priority: data.priority,
      status: data.status,
      category: data.category,
    };

    const result = await apiClient.putJson<{ data: any }>(`/erp/projects/${id}`, payload);
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Không thể cập nhật dự án.");
    }

    return mapDigitalSolution(result.data.data);
  },

  async deleteSolution(id: string): Promise<boolean> {
    const result = await apiClient.delete(`/erp/projects/${id}`);
    return result.type === "success";
  },

  async getAvailableProvinces(solutionId: string): Promise<{ id: number; name: string; region: string }[]> {
    const result = await apiClient.get<{ data: { id: number; name: string; region: string }[] }>(
      `/erp/gov-projects/projects/${solutionId}/available-provinces`
    );
    if (result.type === "success" && Array.isArray(result.data?.data)) {
      return result.data.data;
    }
    return [];
  },

  async addProvince(solutionId: string, payload: any): Promise<GovProject> {
    const result = await apiClient.postJson<{ data: GovProjectDto }>(
      `/erp/gov-projects/projects/${solutionId}/provinces`,
      payload
    );

    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Không thể thêm địa phương.");
    }

    return mapGovProject(result.data.data);
  },

  async initProvinces(solutionId: string): Promise<number> {
    const result = await apiClient.postJson<{ success: boolean; data?: { inserted_count: number } }>(
      `/erp/gov-projects/projects/${solutionId}/init-provinces`,
      {}
    );

    if (result.type === "success" && result.data?.data) {
      return result.data.data.inserted_count;
    }
    return 0;
  },

  async fetchProvinceLogs(solutionId: string, provinceId: number | string): Promise<GovWorkLog[]> {
    const result = await apiClient.get<{ success: boolean; data: GovWorkLogDto[] }>(
      `/erp/gov-projects/projects/${solutionId}/provinces/${provinceId}/work-logs`
    );

    if (result.type === "success" && Array.isArray(result.data?.data)) {
      return result.data.data.map(mapGovWorkLog);
    }
    return [];
  },

  async fetchProvinceDocs(solutionId: string, provinceId: number | string): Promise<GovDocument[]> {
    const result = await apiClient.get<{ success: boolean; data: GovDocumentDto[] }>(
      `/erp/gov-projects/projects/${solutionId}/provinces/${provinceId}/documents`
    );

    if (result.type === "success" && Array.isArray(result.data?.data)) {
      return result.data.data.map(mapGovDocument);
    }
    return [];
  },

  async fetchProjectDocs(solutionId: string): Promise<GovDocument[]> {
    const result = await apiClient.get<{ success: boolean; data: GovDocumentDto[] }>(
      `/erp/gov-projects/projects/${solutionId}/documents`
    );

    if (result.type === "success" && Array.isArray(result.data?.data)) {
      return result.data.data.map(mapGovDocument);
    }
    return [];
  },

  async updateProvince(solutionId: string, provinceId: number | string, payload: any): Promise<void> {
    const result = await apiClient.putJson(
      `/erp/gov-projects/projects/${solutionId}/provinces/${provinceId}`,
      payload
    );
    if (result.type !== "success") {
      throw new Error(result.error.message);
    }
  },

  async updateGovProjectDirect(projectId: string, payload: any): Promise<void> {
    const result = await apiClient.putJson(`/erp/gov-projects/${projectId}`, payload);
    if (result.type !== "success") {
      throw new Error(result.error.message);
    }
  },

  async deleteGovProjectDirect(projectId: string): Promise<void> {
    const result = await apiClient.delete(`/erp/gov-projects/${projectId}`);
    if (result.type !== "success") {
      throw new Error(result.error.message);
    }
  },

  async uploadDocument(formData: FormData): Promise<GovDocument> {
    const rawProjectId = formData.get("projectId") || formData.get("gov_project_id") || formData.get("project_id");
    const endpoint = rawProjectId
      ? `/erp/gov-projects/projects/${rawProjectId}/documents`
      : "/erp/gov-projects/upload";

    const result = await apiClient.postForm<{ success: boolean; data: GovDocumentDto }>(
      endpoint,
      formData
    );

    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Tải lên tài liệu thất bại.");
    }

    return mapGovDocument(result.data.data);
  },

  async storeDocumentJson(solutionId: string, payload: any): Promise<GovDocument> {
    const result = await apiClient.postJson<{ success: boolean; data: GovDocumentDto }>(
      `/erp/gov-projects/projects/${solutionId}/documents`,
      payload
    );

    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Lưu tài liệu thất bại.");
    }

    return mapGovDocument(result.data.data);
  },

  async deleteDocument(docId: string): Promise<boolean> {
    const result = await apiClient.delete(`/erp/gov-projects/documents/${docId}`);
    return result.type === "success";
  },

  async storeWorkLog(solutionId: string, payload: any): Promise<GovWorkLog> {
    const result = await apiClient.postJson<{ success: boolean; data: GovWorkLogDto }>(
      `/erp/gov-projects/projects/${solutionId}/work-logs`,
      payload
    );

    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Tạo nhật ký thất bại.");
    }

    return mapGovWorkLog(result.data.data);
  },

  async updateWorkLog(logId: string, payload: any): Promise<void> {
    const result = await apiClient.putJson(`/erp/gov-projects/work-logs/${logId}`, payload);
    if (result.type !== "success") {
      throw new Error(result.error.message);
    }
  },

  async deleteWorkLog(logId: string): Promise<boolean> {
    const result = await apiClient.delete(`/erp/gov-projects/work-logs/${logId}`);
    return result.type === "success";
  },

  async storeMeeting(solutionId: string | undefined, payload: any): Promise<GovMeetingSchedule> {
    const url = solutionId && !isNaN(Number(solutionId))
      ? `/erp/gov-projects/projects/${solutionId}/meetings`
      : "/erp/gov-projects/meetings";

    const result = await apiClient.postJson<{ success: boolean; data: GovMeetingScheduleDto }>(url, payload);
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Lưu lịch họp thất bại.");
    }

    return mapGovMeeting(result.data.data);
  },

  async updateMeeting(meetingId: string, payload: any, solutionId?: string): Promise<GovMeetingSchedule> {
    const url = solutionId && !isNaN(Number(solutionId))
      ? `/erp/gov-projects/projects/${solutionId}/meetings/${meetingId}`
      : `/erp/gov-projects/meetings/${meetingId}`;

    const result = await apiClient.putJson<{ success: boolean; data: GovMeetingScheduleDto }>(url, payload);
    if (result.type !== "success" || !result.data?.data) {
      throw new Error(result.type !== "success" ? result.error.message : "Cập nhật lịch họp thất bại.");
    }

    return mapGovMeeting(result.data.data);
  },

  async deleteMeeting(meetingId: string, solutionId?: string): Promise<boolean> {
    const url = solutionId && !isNaN(Number(solutionId))
      ? `/erp/gov-projects/projects/${solutionId}/meetings/${meetingId}`
      : `/erp/gov-projects/meetings/${meetingId}`;

    const result = await apiClient.delete(url);
    return result.type === "success";
  },

  async checkMeetingConflict(payload: any): Promise<{
    has_conflict: boolean;
    conflicting_with?: string;
    conflicts?: any[];
  }> {
    const result = await apiClient.postJson<{
      success: boolean;
      data: {
        has_conflict: boolean;
        conflicting_with?: string;
        conflicts?: any[];
      };
    }>("/erp/gov-projects/meetings/check-conflict", payload);

    if (result.type === "success" && result.data?.data) {
      return result.data.data;
    }
    return { has_conflict: false };
  },

  async fetchMasterCalendarSummary(month?: string): Promise<GovCalendarSummary | null> {
    const query: Record<string, string> = {};
    if (month) query.month = month;

    const result = await apiClient.get<{
      success: boolean;
      data: GovCalendarSummaryDto;
    }>("/erp/gov-projects/master-calendar/summary", { query });

    if (result.type === "success" && result.data?.data) {
      return result.data.data;
    }
    return null;
  },

  async fetchMasterCalendar(month?: string, assigneeId?: string): Promise<{
    meetings: GovMeetingSchedule[];
  }> {
    const query: Record<string, string> = {};
    if (month) query.month = month;
    if (assigneeId && assigneeId !== "ALL") query.assignee_id = assigneeId;

    const result = await apiClient.get<{
      success: boolean;
      data: {
        meetings: GovMeetingScheduleDto[];
      };
    }>("/erp/gov-projects/master-calendar", { query });

    if (result.type === "success" && Array.isArray(result.data?.data?.meetings)) {
      return {
        meetings: result.data.data.meetings.map(mapGovMeeting),
      };
    }
    return { meetings: [] };
  },
};

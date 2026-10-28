import { apiClient } from "@/lib/api/client";
import { DailyReport, DailyReportStatus } from "../types";
import { DepartmentId } from "@/shared/types";
import {
  DailyReportDto,
  DailyReportCollectionDto,
  DailyReportSingleDto,
} from "../api/dto";
import { mapDailyReportDtoToEntity } from "../api/mapper";

export interface ReportFilterParams {
  tab?: "my-history" | "team-reports" | "all";
  userId?: string;
  departmentId?: DepartmentId | "ALL";
  date?: string;
  status?: string;
  type?: string;
  search?: string;
  cursor?: string;
  page?: number;
  perPage?: number;
}

export const reportService = {
  async getReports(params?: ReportFilterParams): Promise<DailyReport[]> {
    const query: Record<string, string | number> = {};
    if (params?.tab) query.tab = params.tab;
    if (params?.departmentId && params.departmentId !== "ALL") {
      query.department_id = params.departmentId;
    }
    if (params?.date) query.date = params.date;
    if (params?.status && params.status !== "ALL") {
      query.status = params.status.toLowerCase();
    }
    if (params?.search) query.search = params.search;
    if (params?.cursor) query.cursor = params.cursor;
    if (params?.page) query.page = params.page;
    if (params?.perPage) query.perPage = params.perPage;

    const result = await apiClient.get<DailyReportCollectionDto>("/erp/daily-report", { query });
    if (result.type !== "success" || !result.data?.data) {
      return [];
    }
    let list = result.data.data.map(mapDailyReportDtoToEntity);
    if (params?.userId) {
      list = list.filter((r) => r.userId === params.userId);
    }
    return list;
  },

  async getReportByUserAndDate(userId: string, date: string): Promise<DailyReport | null> {
    const myReports = await this.getReports({
      tab: "my-history",
      date,
    });
    const myFound = myReports.find((r) => r.userId === userId && r.date === date);
    if (myFound) return myFound;

    const reports = await this.getReports({
      tab: "all",
      date,
    });
    const found = reports.find((r) => r.userId === userId && r.date === date);
    return found || null;
  },

  async getReportById(id: string): Promise<DailyReport | null> {
    const result = await apiClient.get<DailyReportSingleDto>(`/erp/daily-report/${id}`);
    if (result.type !== "success" || !result.data?.data) {
      return null;
    }
    return mapDailyReportDtoToEntity(result.data.data);
  },

  async getRecentReports(userId: string, limit = 5): Promise<DailyReport[]> {
    const reports = await this.getReports({ tab: "my-history", perPage: limit });
    return reports
      .filter((r) => r.userId === userId && r.status !== "DRAFT" && r.status !== "draft")
      .slice(0, limit);
  },

  async saveReport(
    reportData: Omit<DailyReport, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<DailyReport> {
    const payload = {
      type: reportData.type || "daily",
      reportDate: reportData.date,
      reportStatus: (reportData.status || "submitted").toLowerCase(),
      approverId: reportData.approverId || undefined,
      ccRecipientIds: reportData.ccRecipientIds || [],
      attachments: reportData.attachments || [],
      content: {
        todayWorks: reportData.todayWorks,
        tomorrowPlans: reportData.tomorrowPlans,
        blockers: reportData.blockers || "",
      },
    };

    if (reportData.id) {
      const result = await apiClient.putJson<DailyReportSingleDto>(
        `/erp/daily-report/${reportData.id}`,
        payload
      );
      if (result.type !== "success" || !result.data?.data) {
        const error = result as { error?: { message?: string } };
        const msg = error.error?.message || "Không thể cập nhật báo cáo";
        throw new Error(msg);
      }
      return mapDailyReportDtoToEntity(result.data.data);
    } else {
      const result = await apiClient.postJson<DailyReportSingleDto>(
        "/erp/daily-report",
        payload
      );
      if (result.type !== "success" || !result.data?.data) {
        const error = result as { error?: { message?: string } };
        const msg = error.error?.message || "Không thể tạo báo cáo";
        throw new Error(msg);
      }
      return mapDailyReportDtoToEntity(result.data.data);
    }
  },

  async addFeedback(
    reportId: string,
    feedback: { feedbackBy: string; feedbackContent: string }
  ): Promise<DailyReport> {
    const result = await apiClient.postJson<DailyReportSingleDto>(
      `/erp/daily-report/${reportId}/approval`,
      {
        feedbackType: "approved",
        feedbackContent: feedback.feedbackContent,
      }
    );
    if (result.type !== "success" || !result.data?.data) {
      const error = result as { error?: { message?: string } };
      const msg = error.error?.message || "Không thể gửi phản hồi";
      throw new Error(msg);
    }
    return mapDailyReportDtoToEntity(result.data.data);
  },

  async updateReportStatus(
    reportId: string,
    status: DailyReportStatus,
    feedbackContent?: string
  ): Promise<DailyReport> {
    const normalizedStatus = status.toLowerCase() === "rejected" ? "rejected" : "approved";
    const result = await apiClient.postJson<DailyReportSingleDto>(
      `/erp/daily-report/${reportId}/approval`,
      {
        feedbackType: normalizedStatus,
        feedbackContent: feedbackContent || undefined,
      }
    );
    if (result.type !== "success" || !result.data?.data) {
      const error = result as { error?: { message?: string } };
      const msg = error.error?.message || "Không thể cập nhật trạng thái";
      throw new Error(msg);
    }
    return mapDailyReportDtoToEntity(result.data.data);
  },

  async deleteReport(reportId: string): Promise<boolean> {
    const result = await apiClient.delete<{ success?: boolean }>(`/erp/daily-report/${reportId}`);
    return result.type === "success";
  },

  async uploadAttachment(file: File): Promise<{ path: string; name: string; url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "daily-reports");
    const result = await apiClient.postForm<{
      success?: boolean;
      data?: { path?: string; file_name?: string; url?: string };
    }>("/erp/gov-projects/upload", formData);

    if (result.type === "success" && result.data?.data) {
      const data = result.data.data;
      return {
        path: data.path || "",
        name: data.file_name || file.name,
        url: data.url || data.path || "",
      };
    }
    return {
      path: file.name,
      name: file.name,
      url: "",
    };
  },

  async resetToDefault(): Promise<void> {},
};

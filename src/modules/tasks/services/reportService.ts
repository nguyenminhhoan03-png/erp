import { DailyReport } from "../types";
import { DepartmentId } from "@/shared/types";

const DELAY_MIN = 100;
const DELAY_MAX = 200;

function fakeDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STORAGE_KEY = "erp_reports_clean_v1";

function getStoredReports(): DailyReport[] {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
    }
  }
  return [];
}

function saveStoredReports(reports: DailyReport[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
    }
  }
}

let inMemoryReports: DailyReport[] = getStoredReports();

export const reportService = {
  async getReports(params?: {
    userId?: string;
    departmentId?: DepartmentId | "ALL";
    date?: string;
  }): Promise<DailyReport[]> {
    await fakeDelay();
    if (!inMemoryReports || inMemoryReports.length === 0) {
      inMemoryReports = getStoredReports();
    }
    let list = [...inMemoryReports];

    if (params?.userId) {
      list = list.filter((r) => r.userId === params.userId);
    }

    if (params?.departmentId && params.departmentId !== "ALL") {
      list = list.filter((r) => r.departmentId === params.departmentId);
    }

    if (params?.date) {
      list = list.filter((r) => r.date === params.date);
    }

    return list;
  },

  async getReportByUserAndDate(userId: string, date: string): Promise<DailyReport | null> {
    await fakeDelay();
    if (!inMemoryReports || inMemoryReports.length === 0) {
      inMemoryReports = getStoredReports();
    }
    const report = inMemoryReports.find((r) => r.userId === userId && r.date === date);
    return report ? { ...report } : null;
  },

  async resetToDefault(): Promise<void> {
    await fakeDelay();
    inMemoryReports = [];
    saveStoredReports(inMemoryReports);
  },

  async saveReport(
    reportData: Omit<DailyReport, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<DailyReport> {
    await fakeDelay();

    const existing = inMemoryReports.find(
      (r) =>
        r.userId === reportData.userId &&
        r.date === reportData.date &&
        r.id !== reportData.id
    );

    if (existing && reportData.status === "SUBMITTED" && existing.status === "SUBMITTED") {
      throw new Error(`Bạn đã nộp báo cáo cho ngày ${reportData.date} rồi.`);
    }

    const now = new Date().toISOString();
    let savedReport: DailyReport;

    if (reportData.id) {
      const idx = inMemoryReports.findIndex((r) => r.id === reportData.id);
      if (idx === -1) {
        throw new Error("Không tìm thấy báo cáo để cập nhật");
      }
      savedReport = {
        ...inMemoryReports[idx],
        ...reportData,
        submittedAt: reportData.status === "SUBMITTED" ? now : inMemoryReports[idx].submittedAt,
        updatedAt: now,
      } as DailyReport;
      inMemoryReports[idx] = savedReport;
    } else {
      savedReport = {
        ...reportData,
        id: `report-${Date.now()}`,
        submittedAt: reportData.status === "SUBMITTED" ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };
      inMemoryReports = [savedReport, ...inMemoryReports];
    }

    saveStoredReports(inMemoryReports);
    return { ...savedReport };
  },

  async getRecentReports(userId: string, limit = 5): Promise<DailyReport[]> {
    await fakeDelay();
    if (!inMemoryReports || inMemoryReports.length === 0) {
      inMemoryReports = getStoredReports();
    }
    return inMemoryReports
      .filter((r) => r.userId === userId && r.status !== "DRAFT" && r.status !== "draft")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },

  async addFeedback(
    reportId: string,
    feedback: { feedbackBy: string; feedbackContent: string }
  ): Promise<DailyReport> {
    await fakeDelay();
    if (!inMemoryReports || inMemoryReports.length === 0) {
      inMemoryReports = getStoredReports();
    }
    const idx = inMemoryReports.findIndex((r) => r.id === reportId);
    if (idx === -1) {
      throw new Error("Không tìm thấy báo cáo");
    }
    const newFeedback = {
      id: `fb-${Date.now()}`,
      dailyReportId: reportId,
      feedbackBy: feedback.feedbackBy,
      feedbackContent: feedback.feedbackContent,
      createdAt: new Date().toISOString(),
    };
    const report = inMemoryReports[idx];
    const feedbacks = report.feedbacks ? [...report.feedbacks, newFeedback] : [newFeedback];
    const updated = {
      ...report,
      feedbacks,
      updatedAt: new Date().toISOString(),
    };
    inMemoryReports[idx] = updated;
    saveStoredReports(inMemoryReports);
    return { ...updated };
  },

  async updateReportStatus(reportId: string, status: DailyReport["status"]): Promise<DailyReport> {
    await fakeDelay();
    if (!inMemoryReports || inMemoryReports.length === 0) {
      inMemoryReports = getStoredReports();
    }
    const idx = inMemoryReports.findIndex((r) => r.id === reportId);
    if (idx === -1) {
      throw new Error("Không tìm thấy báo cáo");
    }
    const updated = {
      ...inMemoryReports[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    inMemoryReports[idx] = updated;
    saveStoredReports(inMemoryReports);
    return { ...updated };
  },
};

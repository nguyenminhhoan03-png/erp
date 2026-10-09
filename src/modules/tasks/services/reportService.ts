import { INITIAL_MOCK_REPORTS } from "../mock-data";
import { DailyReport } from "../types";
import { DepartmentId } from "@/shared/types";

const DELAY_MIN = 250;
const DELAY_MAX = 500;

function fakeDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STORAGE_KEY = "erp_reports_clean_v1";

function getStoredReports(): DailyReport[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("erp_reports_cache_v1");
    } catch {
      // Ignore
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
  }
  return [];
}


function saveStoredReports(reports: DailyReport[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // Ignore
    }
  }
}

let inMemoryReports: DailyReport[] = getStoredReports();

export const reportService = {
  /**
   * Lấy danh sách báo cáo theo bộ lọc
   */
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

  /**
   * Lấy báo cáo của 1 user theo ngày cụ thể (để kiểm tra xem đã nộp chưa)
   */
  async getReportByUserAndDate(userId: string, date: string): Promise<DailyReport | null> {
    await fakeDelay();
    if (!inMemoryReports || inMemoryReports.length === 0) {
      inMemoryReports = getStoredReports();
    }
    const report = inMemoryReports.find((r) => r.userId === userId && r.date === date);
    return report ? { ...report } : null;
  },

  /**
   * Khôi phục toàn bộ danh sách báo cáo mẫu
   */
  async resetToDefault(): Promise<void> {
    await fakeDelay();
    inMemoryReports = [...INITIAL_MOCK_REPORTS];
    saveStoredReports(inMemoryReports);
  },

  /**
   * Lưu bản nháp hoặc nộp báo cáo
   */
  async saveReport(
    reportData: Omit<DailyReport, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<DailyReport> {
    await fakeDelay();

    // Kiểm tra nộp trùng trong cùng một ngày nếu tạo mới
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
      // Update
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
      // Create new
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
};

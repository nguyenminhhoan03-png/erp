export type ProjectCategory = "DLTM" | "SMART_LAND" | "SMART_HEALTH" | "SMART_EDU" | "SMART_TRAFFIC" | "OUTSOURCE" | "INTERNAL";

export interface DigitalSolution {
  id: string; // 'dltm', 'smart_land', 'smart_health', 'smart_edu', 'smart_traffic'
  name: string; // "Du lịch Thông minh (DLTM)"
  shortName: string; // "DLTM"
  code: string;
  iconName: string; // "Compass" | "Map" | "HeartPulse" | "GraduationCap" | "Car" | "Building2" | "Layers" | "Trees"
  colorHex: string;
  badgeClass: string;
  targetGovDepartment: string; // "Sở Du lịch / Sở VHTTDL", "Sở Tài nguyên & Môi trường", "Sở Y tế"...
  dataAssetDescription: string; // "Điểm danh lam, khách sạn, cẩm nang", "Bản đồ địa chính, quy hoạch đất"...
  description: string;
  activeCount: number; // Số tỉnh đang triển khai
  totalTargetProvinces?: number; // Mặc định 34
}

export type GovStage =
  | "DISPATCHED"    // 1. IGB đã gửi công văn đề nghị tài trợ
  | "FEEDBACK"      // 2. Địa phương phản hồi, đang lấy yêu cầu
  | "MOU_SIGNED"    // 3. Đã làm việc & Ký biên bản ghi nhớ (MOU)
  | "SPONSOR_AGREED"// 4. Đồng ý tiếp nhận tài trợ chính thức
  | "DATA_COLLECT"  // 5. Thu thập thông tin, logo, dữ liệu chuyên ngành
  | "DEPLOYING"     // 6. Đang triển khai kỹ thuật & Vận hành
  | "COMPLETED"     // 7. Đã bàn giao / Đã tài trợ hoàn tất
  | "PAUSED";       // Tạm dừng / Cần liên hệ lại

// Alias for compatibility
export type DltmStage = GovStage;

export type Region = "Bắc Bộ" | "Trung Bộ" | "Nam Bộ" | "Tây Nguyên";

export interface GovDocument {
  id: string;
  projectId: string;
  solutionId?: string;
  title: string;
  type: "CONG_VAN_DI" | "CONG_VAN_DEN" | "MOU" | "LOGO_ASSETS" | "DATA_SHEET" | "OTHER";
  fileUrlOrLink: string;
  fileName?: string;
  fileSize?: string;
  note?: string;
  uploadedAt: string;
  uploadedBy: string;
}
export type DltmDocument = GovDocument;

export interface GovWorkLog {
  id: string;
  projectId: string;
  solutionId?: string;
  meetingDate: string;
  meetingType: "TRUC_TIEP" | "ONLINE" | "DIEN_THOAI";
  participants: string;
  content: string;
  agreements?: string;
  nextSteps?: string;
  recordedBy: string;
  createdAt: string;
}
export type DltmWorkLog = GovWorkLog;

export interface GovMeetingSchedule {
  id: string;
  projectId: string;
  solutionId?: string;
  provinceName: string;
  scheduledAt: string;
  location: string;
  content: string;
  hostName: string;
  contactPerson: string;
  status: "UPCOMING" | "DONE" | "CANCELLED";
}
export type DltmMeetingSchedule = GovMeetingSchedule;

export interface GovProjectTask {
  id: string;
  projectId: string;
  solutionId?: string;
  title: string;
  assignedTo: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  category: "DATA_COLLECTION" | "DESIGN" | "TECH_DEV" | "LEGAL";
}
export type DltmProjectTask = GovProjectTask;

export interface GovProject {
  id: string;
  code: string;
  name?: string;
  solutionId?: string; // 'dltm', 'smart_land', 'smart_health'...
  category?: ProjectCategory;
  provinceName: string;
  region: Region;
  isMergedProvince?: boolean;
  mergedNotes?: string;
  stage: GovStage;
  leaderContact: {
    fullName: string;
    position: string;
    departmentName?: string; // VD: Sở Du lịch hoặc Sở Tài nguyên & Môi trường
    phone: string;
    email: string;
  };
  igbAssignee: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  budget?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  nextMeetingDate?: string;
  nextMeetingContent?: string;
  documentsCount: number;
  workLogsCount: number;
  tasksCount: number;
  completedTasksCount: number;
  progressPercent: number;
  dispatchedDate?: string;
  mouSignedDate?: string;
  sponsorApprovedDate?: string;
  createdAt: string;
  updatedAt: string;
}
export type DltmProject = GovProject;

export interface GovFilterParams {
  search?: string;
  solutionId?: string | "ALL";
  category?: ProjectCategory | "ALL";
  region?: Region | "ALL";
  stage?: GovStage | "ALL";
  assigneeId?: string | "ALL";
}
export type DltmFilterParams = GovFilterParams;

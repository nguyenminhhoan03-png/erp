export type ProjectCategory = "DLTM" | "SMART_LAND" | "SMART_HEALTH" | "SMART_EDU" | "SMART_TRAFFIC" | "OUTSOURCE" | "INTERNAL";

export interface DigitalSolution {
  id: string;
  name: string;
  shortName: string;
  code: string;
  iconName: string;
  colorHex: string;
  badgeClass: string;
  targetGovDepartment: string;
  dataAssetDescription: string;
  description: string;
  activeCount: number;
  totalTargetProvinces?: number;
  managerId?: number | string | null;
  managerIds?: (number | string)[];
  managers?: any[];
  status?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  category?: "GOV" | "INTERNAL" | "OUTSOURCE" | string;
  departmentId?: number | string | null;
  partnerId?: number | string | null;
  departmentName?: string;
  partnerName?: string;
}

export type GovStage =
  | "NOT_STARTED"
  | "DISPATCHED"
  | "FEEDBACK"
  | "MOU_SIGNED"
  | "SPONSOR_AGREED"
  | "DATA_COLLECT"
  | "DEPLOYING"
  | "COMPLETED"
  | "PAUSED";

export type DltmStage = GovStage;

export type Region = "Bắc Bộ" | "Trung Bộ" | "Nam Bộ" | "Tây Nguyên";

export type DocumentType =
  | "CONG_VAN_DI"
  | "CONG_VAN_DEN"
  | "MOU"
  | "LOGO_ASSETS"
  | "DATA_SHEET"
  | "CONTRACT"
  | "REQUIREMENT"
  | "DESIGN_UI"
  | "TECH_SPEC"
  | "PRD_PLAN"
  | "ACCEPTANCE_MINUTES"
  | "USER_GUIDE"
  | "MEETING_REPORT"
  | "OTHER";

export interface GovDocument {
  id: string;
  projectId: string;
  solutionId?: string;
  title: string;
  type: DocumentType;
  fileUrlOrLink: string;
  fileName?: string;
  fileSize?: string;
  note?: string;
  uploadedAt: string;
  uploadedBy: string;
}
export type DltmDocument = GovDocument;

export type GovLogType =
  | "DISPATCH_SENT"
  | "DISPATCH_RECEIVED"
  | "CALL"
  | "MEETING"
  | "MOU_SIGNING"
  | "DATA_COLLECT"
  | "TECHNICAL"
  | "ACCEPTANCE"
  | "STAGE_CHANGE";
export type DltmLogType = GovLogType;

export interface GovWorkLog {
  id: string;
  projectId: string;
  solutionId?: string;
  stageId?: number;
  stageName?: string;
  stageColor?: string;
  logType?: GovLogType;
  title?: string;
  meetingDate: string;
  meetingType: "TRUC_TIEP" | "ONLINE" | "DIEN_THOAI";
  participants: string;
  content: string;
  agreements?: string;
  nextSteps?: string;
  recordedBy: string;
  location?: string;
  attachments?: {
    name: string;
    url: string;
    size?: number;
    type?: string;
  }[];
  metadata?: Record<string, any>;
  createdAt: string;
}
export type DltmWorkLog = GovWorkLog;

export type MeetingCategory = "GOV_MISSION" | "INTERNAL_MEETING" | "COMPANY_EVENT" | "CLIENT_MEETING";

export interface GovMeetingSchedule {
  id: string;
  category?: MeetingCategory;
  eventType?: MeetingCategory;
  projectId?: string;
  solutionId?: string;
  department?: string;
  clientName?: string;
  provinceId?: number;
  stageId?: number | string | null;
  stageName?: string;
  stageColor?: string;
  stageOrder?: number;
  provinceName?: string;
  scheduledAt: string;
  location: string;
  content: string;
  title?: string;
  notes?: string;
  hostName: string;
  hostUser?: string;
  hostUserId?: number;
  participantIds?: (string | number)[];
  meetingType?: "TRUC_TIEP" | "ONLINE" | "DIEN_THOAI";
  durationMinutes?: number;
  endTime?: string;
  contactPerson?: string;
  partnerParticipants?: string;
  status: "UPCOMING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  hasConflict?: boolean;
  conflictingWith?: string;
  conflicts?: {
    meeting_id: number | string;
    label: string;
    users?: { id: number | string; name: string }[];
  }[];
  conflictUserIds?: (string | number)[];
  conflictChecked?: boolean;
}
export type DltmMeetingSchedule = GovMeetingSchedule;

export interface GovCalendarSummary {
  upcoming: number;
  today: number;
  this_week: number;
  this_month: number;
  upcoming_onsite: number;
  upcoming_online: number;
  completed_this_month: number;
  conflict_count: number;
  total: number;
}
export type DltmCalendarSummary = GovCalendarSummary;

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
  projectId?: string;
  code: string;
  name?: string;
  solutionId?: string;
  category?: ProjectCategory;
  provinceId?: number;
  provinceName: string;
  region: Region;
  isMergedProvince?: boolean;
  mergedNotes?: string;
  stage: GovStage;
  leaderContact: {
    fullName: string;
    position: string;
    departmentName?: string;
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

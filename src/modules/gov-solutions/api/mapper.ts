import {
  DigitalSolution,
  GovDocument,
  GovMeetingSchedule,
  GovProject,
  GovStage,
  GovWorkLog,
  MeetingCategory,
  Region,
  DocumentType,
  GovLogType,
} from "../types";
import type {
  GovBootstrapSolutionDto,
  GovDocumentDto,
  GovMeetingScheduleDto,
  GovProjectDto,
  GovWorkLogDto,
} from "./dto";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toString = (value: unknown, fallback = ""): string =>
  value !== null && value !== undefined ? String(value) : fallback;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const mapDigitalSolution = (dto: GovBootstrapSolutionDto): DigitalSolution => ({
  id: toString(dto.id),
  name: toString(dto.name),
  shortName: toString(dto.short_name || dto.name),
  code: toString(dto.code || dto.short_name, "SOL"),
  iconName: toString(dto.icon_name, "Compass"),
  colorHex: toString(dto.color_hex, "#3b82f6"),
  badgeClass: toString(dto.badge_class, "bg-blue-500/10 text-blue-600"),
  targetGovDepartment: toString(dto.target_department || dto.target_gov_department, ""),
  dataAssetDescription: toString(dto.data_asset_description),
  description: toString(dto.description),
  activeCount: toNumber(dto.active_count, 0),
  totalTargetProvinces: dto.total_target_provinces ? toNumber(dto.total_target_provinces) : undefined,
  managerId: dto.manager_id ? toString(dto.manager_id) : null,
  managerIds: Array.isArray(dto.manager_ids) ? dto.manager_ids.map(String) : [],
  managers: Array.isArray(dto.managers) ? dto.managers : [],
  status: dto.status,
  priority: dto.priority,
  startDate: dto.start_date,
  endDate: dto.end_date,
  budget: dto.budget ? toNumber(dto.budget) : null,
  category: dto.category || "GOV",
  departmentId: dto.department_id ? toString(dto.department_id) : ((dto as any).internal_project?.department_id ? toString((dto as any).internal_project.department_id) : null),
  departmentIds: Array.isArray((dto as any).department_ids)
    ? (dto as any).department_ids.map(String)
    : (Array.isArray((dto as any).departments)
      ? (dto as any).departments.map((d: any) => String(d.id))
      : ((dto as any).department_id ? [String((dto as any).department_id)] : [])),
  departments: Array.isArray((dto as any).departments)
    ? (dto as any).departments.map((d: any) => ({ id: String(d.id), name: d.name }))
    : (Array.isArray((dto as any).internal_projects)
      ? (dto as any).internal_projects.map((ip: any) => ({ id: String(ip.department?.id || ip.department_id), name: ip.department?.name })).filter((x: any) => x.name)
      : []),
  partnerId: dto.partner_id ? toString(dto.partner_id) : null,
  departmentName: dto.department?.name || (Array.isArray((dto as any).departments) && (dto as any).departments.length > 0 ? (dto as any).departments.map((d: any) => d.name).join(", ") : undefined),
  partnerName: dto.partner?.name,
});

const STAGE_ORDER_MAP: Record<number, GovStage> = {
  0: "NOT_STARTED",
  1: "DISPATCHED",
  2: "FEEDBACK",
  3: "MOU_SIGNED",
  4: "SPONSOR_AGREED",
  5: "DATA_COLLECT",
  6: "DEPLOYING",
  7: "COMPLETED",
};

export const mapGovProject = (dto: GovProjectDto | any): GovProject => {
  const stage = (typeof dto.stage === "string" && ["NOT_STARTED", "DISPATCHED", "FEEDBACK", "MOU_SIGNED", "SPONSOR_AGREED", "DATA_COLLECT", "DEPLOYING", "COMPLETED", "PAUSED"].includes(dto.stage) ? dto.stage : undefined)
    || (dto.stage_id ? STAGE_ORDER_MAP[Number(dto.stage_id)] : undefined)
    || (dto.stage_order ? STAGE_ORDER_MAP[Number(dto.stage_order)] : undefined)
    || "NOT_STARTED";

  const leader = dto.leader_contact_detail || (typeof dto.leader_contact === "object" ? dto.leader_contact : null);

  return {
    id: toString(dto.id),
    projectId: dto.project_id ? toString(dto.project_id) : (dto.solution_id ? toString(dto.solution_id) : undefined),
    code: toString(dto.code, `PROV-${dto.id}`),
    name: dto.name,
    solutionId: dto.solution_id ? toString(dto.solution_id) : (dto.project_id ? toString(dto.project_id) : undefined),
    category: dto.category as any,
    provinceId: dto.province_id ? toNumber(dto.province_id) : undefined,
    provinceName: toString(dto.province_name || dto.name, "Địa phương"),
    region: (dto.region as Region) || "Bắc Bộ",
    isMergedProvince: Boolean(dto.is_merged_province),
    mergedNotes: dto.merged_notes,
    stage: stage as GovStage,
    leaderContact: {
      fullName: toString(leader?.full_name || leader?.fullName || leader?.name || (typeof dto.leader_contact === "string" ? dto.leader_contact : ""), "Đang cập nhật"),
      position: toString(leader?.position, "Lãnh đạo"),
      departmentName: leader?.department_name || leader?.departmentName,
      phone: toString(leader?.phone),
      email: toString(leader?.email),
    },
    igbAssignee: {
      id: toString(dto.igb_assignee?.id, "unassigned"),
      name: toString(dto.igb_assignee?.name, "Chưa phân công"),
      avatar: toString(dto.igb_assignee?.avatar),
      role: toString(dto.igb_assignee?.role, "Phụ trách"),
    },
    budget: dto.budget ? toNumber(dto.budget) : undefined,
    startDate: dto.start_date,
    endDate: dto.end_date,
    notes: dto.notes,
    nextMeetingDate: dto.next_meeting_date,
    nextMeetingContent: dto.next_meeting_content,
    documentsCount: toNumber(dto.documents_count, 0),
    workLogsCount: toNumber(dto.work_logs_count, 0),
    tasksCount: toNumber(dto.tasks_count, 0),
    completedTasksCount: toNumber(dto.completed_tasks_count, 0),
    progressPercent: toNumber(dto.progress_percent ?? dto.completion_percentage, 0),
    dispatchedDate: dto.dispatched_date,
    mouSignedDate: dto.mou_signed_date,
    sponsorApprovedDate: dto.sponsor_approved_date,
    createdAt: toString(dto.created_at, new Date().toISOString()),
    updatedAt: toString(dto.updated_at, new Date().toISOString()),
  };
};

export const mapGovDocument = (dto: GovDocumentDto): GovDocument => ({
  id: toString(dto.id),
  projectId: toString(dto.gov_project_id || dto.project_id || dto.projectId),
  solutionId: (dto.solution_id || dto.solutionId) ? toString(dto.solution_id || dto.solutionId) : undefined,
  title: toString(dto.title),
  type: (dto.type as DocumentType) || "OTHER",
  fileUrlOrLink: toString(dto.file_url || dto.fileUrlOrLink),
  fileName: dto.file_name || dto.fileName,
  fileSize: dto.file_size !== undefined ? String(dto.file_size) : (dto.fileSize !== undefined ? String(dto.fileSize) : undefined),
  note: dto.note,
  uploadedAt: toString(dto.created_at || dto.uploaded_at || dto.uploadedAt, new Date().toISOString()),
  uploadedBy: toString(dto.uploaded_by || dto.uploadedBy, "Thành viên IGB"),
});

export const mapGovWorkLog = (dto: GovWorkLogDto): GovWorkLog => ({
  id: toString(dto.id),
  projectId: toString(dto.gov_project_id || dto.project_id),
  solutionId: dto.solution_id ? toString(dto.solution_id) : undefined,
  stageId: dto.stage_id ? toNumber(dto.stage_id) : undefined,
  stageName: dto.stage_name,
  stageColor: dto.stage_color,
  logType: dto.log_type as GovLogType,
  title: dto.title,
  meetingDate: toString(dto.meeting_date, new Date().toISOString().split("T")[0]),
  meetingType: (dto.meeting_type as any) || "TRUC_TIEP",
  participants: toString(dto.participants),
  content: toString(dto.content),
  agreements: dto.agreements,
  nextSteps: dto.next_steps,
  recordedBy: toString(dto.recorded_by, "Tôi"),
  location: dto.location,
  attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
  metadata: isRecord(dto.metadata) ? dto.metadata : undefined,
  createdAt: toString(dto.created_at, new Date().toISOString()),
});

export const mapGovMeeting = (raw: GovMeetingScheduleDto | any): GovMeetingSchedule => {
  const dto = raw || {};
  const rawScheduled = dto.scheduledAt || dto.scheduled_at || dto.startTime || dto.start_time;
  const rawEnd = dto.endTime || dto.end_time;
  const rawGovProject = dto.govProjectId !== undefined ? dto.govProjectId : dto.gov_project_id;
  const rawProject = dto.projectId !== undefined ? dto.projectId : dto.project_id;
  const rawSolution = dto.solutionId !== undefined ? dto.solutionId : dto.solution_id;
  const rawProjectName = dto.projectName || dto.project_name;
  const rawProvinceId = dto.provinceId !== undefined ? dto.provinceId : dto.province_id;
  const rawStageId = dto.stageId !== undefined ? dto.stageId : dto.stage_id;
  const rawStageOrder = dto.stageOrder !== undefined ? dto.stageOrder : dto.stage_order;
  const rawHostUser = dto.hostUser || dto.host_user;
  const rawHostUserId = dto.hostUserId !== undefined ? dto.hostUserId : dto.host_user_id;
  const rawHostName = dto.hostName || dto.host_name || rawHostUser;
  const rawMeetingType = dto.meetingType || dto.meeting_type;
  const rawDuration = dto.durationMinutes !== undefined ? dto.durationMinutes : dto.duration_minutes;
  const rawContact = dto.contactPerson || dto.contact_person;
  const rawHasConflict = dto.hasConflict !== undefined ? dto.hasConflict : dto.has_conflict;
  const rawConflictingWith = dto.conflictingWith || dto.conflicting_with;
  const rawConflictUsers = dto.conflictUserIds || dto.conflict_user_ids;
  const rawConflictChecked = dto.conflictChecked !== undefined ? dto.conflictChecked : dto.conflict_checked;
  const rawParticipants = dto.participantIds || dto.participant_ids;

  return {
    id: toString(dto.id),
    category: (dto.category || dto.event_type) as MeetingCategory,
    eventType: (dto.eventType || dto.event_type || dto.category) as MeetingCategory,
    projectId: rawProject ? toString(rawProject) : undefined,
    govProjectId: rawGovProject ? toString(rawGovProject) : undefined,
    solutionId: rawSolution ? toString(rawSolution) : undefined,
    projectName: rawProjectName ? toString(rawProjectName) : undefined,
    department: dto.department,
    clientName: dto.clientName || dto.client_name,
    provinceId: rawProvinceId ? toNumber(rawProvinceId) : undefined,
    stageId: rawStageId,
    stageName: dto.stageName || dto.stage_name,
    stageColor: dto.stageColor || dto.stage_color,
    stageOrder: rawStageOrder ? toNumber(rawStageOrder) : undefined,
    provinceName: dto.provinceName || dto.province_name,
    scheduledAt: toString(rawScheduled, new Date().toISOString()),
    location: toString(dto.location),
    content: toString(dto.content || dto.title),
    title: dto.title,
    notes: dto.notes,
    hostName: toString(rawHostName, "Đại diện IGB"),
    hostUser: rawHostUser,
    hostUserId: rawHostUserId ? toNumber(rawHostUserId) : undefined,
    participantIds: Array.isArray(rawParticipants) ? rawParticipants.map(String) : [],
    meetingType: (rawMeetingType as any) || "TRUC_TIEP",
    durationMinutes: rawDuration ? toNumber(rawDuration) : undefined,
    endTime: rawEnd,
    contactPerson: rawContact,
    partnerParticipants: dto.partnerParticipants || dto.partner_participants,
    status: ((dto.status as any) || "UPCOMING"),
    hasConflict: Boolean(rawHasConflict),
    conflictingWith: rawConflictingWith,
    conflicts: Array.isArray(dto.conflicts) ? dto.conflicts : [],
    conflictUserIds: Array.isArray(rawConflictUsers) ? rawConflictUsers.map(String) : [],
    conflictChecked: Boolean(rawConflictChecked),
  };
};

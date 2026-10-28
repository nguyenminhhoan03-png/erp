export interface GovBootstrapSolutionDto {
  id: number | string;
  name: string;
  short_name?: string;
  code?: string;
  icon_name?: string;
  color_hex?: string;
  badge_class?: string;
  target_gov_department?: string;
  target_department?: string;
  data_asset_description?: string;
  description?: string;
  active_count?: number;
  total_target_provinces?: number;
  manager_id?: number | string | null;
  manager_ids?: (number | string)[];
  managers?: any[];
  status?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  category?: string;
  department_id?: number | string | null;
  partner_id?: number | string | null;
  department?: { id: number | string; name: string };
  partner?: { id: number | string; name: string };
}

export interface GovLeaderContactDto {
  full_name?: string;
  fullName?: string;
  position?: string;
  department_name?: string;
  departmentName?: string;
  phone?: string;
  email?: string;
}

export interface GovAssigneeDto {
  id?: number | string;
  name?: string;
  avatar?: string;
  role?: string;
}

export interface GovProjectDto {
  id: number | string;
  project_id?: number | string;
  code?: string;
  name?: string;
  solution_id?: number | string;
  category?: string;
  province_id?: number;
  province_name?: string;
  region?: string;
  is_merged_province?: boolean;
  merged_notes?: string;
  stage?: string;
  leader_contact?: GovLeaderContactDto;
  igb_assignee?: GovAssigneeDto;
  budget?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  next_meeting_date?: string;
  next_meeting_content?: string;
  documents_count?: number;
  work_logs_count?: number;
  tasks_count?: number;
  completed_tasks_count?: number;
  progress_percent?: number;
  dispatched_date?: string;
  mou_signed_date?: string;
  sponsor_approved_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GovDocumentDto {
  id: number | string;
  project_id?: number | string;
  projectId?: number | string;
  gov_project_id?: number | string;
  solution_id?: number | string;
  solutionId?: number | string;
  title: string;
  type?: string;
  file_url?: string;
  fileUrlOrLink?: string;
  file_name?: string;
  fileName?: string;
  file_size?: number | string;
  fileSize?: number | string;
  note?: string;
  created_at?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  uploaded_by?: string;
  uploadedBy?: string;
}

export interface GovWorkLogDto {
  id: number | string;
  project_id?: number | string;
  gov_project_id?: number | string;
  solution_id?: number | string;
  stage_id?: number;
  stage_name?: string;
  stage_color?: string;
  log_type?: string;
  title?: string;
  meeting_date?: string;
  meeting_type?: string;
  participants?: string;
  content: string;
  agreements?: string;
  next_steps?: string;
  recorded_by?: string;
  location?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface GovMeetingScheduleDto {
  id: number | string;
  category?: string;
  event_type?: string;
  eventType?: string;
  project_id?: number | string;
  projectId?: number | string;
  gov_project_id?: number | string;
  govProjectId?: number | string;
  solution_id?: number | string;
  solutionId?: number | string;
  project_name?: string;
  projectName?: string;
  department?: string;
  client_name?: string;
  clientName?: string;
  province_id?: number;
  provinceId?: number;
  stage_id?: number | string | null;
  stageId?: number | string | null;
  stage_name?: string;
  stageName?: string;
  stage_color?: string;
  stageColor?: string;
  stage_order?: number;
  stageOrder?: number;
  province_name?: string;
  provinceName?: string;
  scheduled_at?: string;
  scheduledAt?: string;
  start_time?: string;
  startTime?: string;
  location?: string;
  content?: string;
  title?: string;
  description?: string;
  notes?: string;
  host_name?: string;
  hostName?: string;
  host_user?: string;
  hostUser?: string;
  host_user_id?: number;
  hostUserId?: number;
  participant_ids?: (string | number)[];
  participantIds?: (string | number)[];
  meeting_type?: string;
  meetingType?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  end_time?: string;
  endTime?: string;
  contact_person?: string;
  contactPerson?: string;
  partner_participants?: string;
  partnerParticipants?: string;
  status?: string;
  is_master_calendar?: boolean;
  isMasterCalendar?: boolean;
  has_conflict?: boolean;
  hasConflict?: boolean;
  conflicting_with?: string;
  conflictingWith?: string;
  conflicts?: any[];
  conflict_user_ids?: (string | number)[];
  conflictUserIds?: (string | number)[];
  conflict_checked?: boolean;
  conflictChecked?: boolean;
}

export interface GovBootstrapDto {
  success?: boolean;
  data: {
    solutions: GovBootstrapSolutionDto[];
    active_project_id: number | null;
    active_solution_id?: string;
    provinces: GovProjectDto[];
    upcoming_meetings: GovMeetingScheduleDto[];
    documents?: GovDocumentDto[];
  };
}

export interface GovCalendarSummaryDto {
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

export interface GovBootstrapSolutionDto {
  id: number | string;
  name: string;
  short_name?: string;
  code?: string;
  icon_name?: string;
  color_hex?: string;
  badge_class?: string;
  target_gov_department?: string;
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
  gov_project_id?: number | string;
  solution_id?: number | string;
  title: string;
  type?: string;
  file_url?: string;
  fileUrlOrLink?: string;
  file_name?: string;
  file_size?: number | string;
  note?: string;
  created_at?: string;
  uploaded_at?: string;
  uploaded_by?: string;
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
  project_id?: number | string;
  solution_id?: number | string;
  department?: string;
  client_name?: string;
  province_id?: number;
  stage_id?: number | string | null;
  stage_name?: string;
  stage_color?: string;
  stage_order?: number;
  province_name?: string;
  scheduled_at?: string;
  location?: string;
  content: string;
  title?: string;
  notes?: string;
  host_name?: string;
  host_user?: string;
  host_user_id?: number;
  participant_ids?: (string | number)[];
  meeting_type?: string;
  duration_minutes?: number;
  end_time?: string;
  contact_person?: string;
  partner_participants?: string;
  status?: string;
  has_conflict?: boolean;
  conflicting_with?: string;
  conflicts?: any[];
  conflict_user_ids?: (string | number)[];
  conflict_checked?: boolean;
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

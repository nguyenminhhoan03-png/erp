export interface TaskUserDto {
  id: number | string;
  name?: string;
  full_name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  position?: string;
  department_id?: number | string;
}

export interface TaskAttachmentDto {
  id: number | string;
  task_id?: number | string;
  title?: string;
  file_name?: string;
  file_url?: string;
  url?: string;
  file_size?: number;
  file_type?: string;
  type?: string;
  uploaded_by?: number | string;
  uploader?: TaskUserDto;
  created_at?: string;
}

export interface TaskChecklistItemDto {
  id: string;
  title: string;
  isCompleted?: boolean;
  is_completed?: boolean;
}

export interface TaskDto {
  id: number | string;
  code?: string;
  title: string;
  description?: string;
  project_id?: number | string;
  gov_project_id?: number | string;
  project?: {
    id: number | string;
    name: string;
    code?: string;
    key?: string;
  };
  gov_project?: {
    id: number | string;
    province_name?: string;
    solution_name?: string;
  };
  status: string;
  priority: string;
  department_id?: string;
  department?: {
    id: string;
    name?: string;
  };
  creator_id?: number | string;
  creator?: TaskUserDto;
  assignees?: TaskUserDto[];
  assignee_ids?: (number | string)[];
  reporters?: TaskUserDto[];
  report_tos?: TaskUserDto[];
  report_to_ids?: (number | string)[];
  report_to_id?: number | string;
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  checklist?: TaskChecklistItemDto[];
  comments_count?: number;
  tags?: string[];
  requires_approval?: boolean;
  is_approved?: boolean;
  approved_by_id?: number | string;
  resolution?: string;
  resolution_note?: string;
  closed_at?: string;
  closed_by_id?: number | string;
  parent_id?: number | string | null;
  parent?: {
    id: number | string;
    code?: string;
    title?: string;
  } | null;
  sub_tasks?: TaskDto[];
  subtasks?: TaskDto[];
  subtasks_count?: number;
  completed_subtasks_count?: number;
  attachments?: TaskAttachmentDto[];
  created_at?: string;
  updated_at?: string;
}

export interface TaskCollectionPaginationMetaDto {
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
  has_more: boolean;
}

export interface TaskCollectionDto {
  success?: boolean;
  data: TaskDto[];
  meta?: TaskCollectionPaginationMetaDto;
}

export interface TaskSingleDto {
  success?: boolean;
  data: TaskDto;
  message?: string;
}

export interface TaskCommentDto {
  id: number | string;
  task_id: number | string;
  user_id?: number | string;
  author_id?: number | string;
  user?: TaskUserDto;
  content: string;
  created_at?: string;
}

export interface TaskCommentCollectionDto {
  success?: boolean;
  data: TaskCommentDto[];
}

export interface TaskCommentSingleDto {
  success?: boolean;
  data: TaskCommentDto;
}

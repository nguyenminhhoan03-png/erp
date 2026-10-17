import { User, DepartmentId } from "@/shared/types";
import {
  Task,
  TaskAttachment,
  TaskChecklistItem,
  TaskComment,
  TaskPaginationMeta,
  TaskPriority,
  TaskResolution,
  TaskStatus,
} from "../types";
import type {
  TaskAttachmentDto,
  TaskChecklistItemDto,
  TaskCollectionDto,
  TaskCommentDto,
  TaskDto,
  TaskUserDto,
} from "./dto";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toString = (value: unknown, fallback = ""): string =>
  value !== null && value !== undefined ? String(value) : fallback;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const mapTaskUser = (dto?: TaskUserDto | null): User | undefined => {
  if (!dto || !isRecord(dto)) return undefined;
  return {
    id: toString(dto.id),
    name: toString(dto.full_name || dto.name, "Thành viên"),
    email: toString(dto.email),
    role: (dto.role as any) || "STAFF",
    avatar: toString(dto.avatar),
    departmentId: (dto.department_id ? toString(dto.department_id) : "dept-it") as DepartmentId,
    title: toString(dto.position, "Thành viên"),
  };
};

export const mapChecklistItem = (dto: TaskChecklistItemDto): TaskChecklistItem => ({
  id: toString(dto.id, `item-${Date.now()}`),
  title: toString(dto.title),
  isCompleted: Boolean(dto.isCompleted ?? dto.is_completed),
});

export const mapAttachment = (dto: TaskAttachmentDto): TaskAttachment => ({
  id: toString(dto.id),
  taskId: dto.task_id ? toString(dto.task_id) : undefined,
  title: toString(dto.title || dto.file_name, "Tệp đính kèm"),
  fileName: toString(dto.file_name || dto.title, "file"),
  fileUrl: toString(dto.file_url || dto.url),
  fileSize: dto.file_size ? toNumber(dto.file_size) : undefined,
  fileType: toString(dto.file_type || dto.type),
  uploadedById: dto.uploaded_by ? toString(dto.uploaded_by) : undefined,
  uploadedBy: dto.uploader?.full_name || dto.uploader?.name || "Người dùng",
  uploader: mapTaskUser(dto.uploader),
  createdAt: toString(dto.created_at, new Date().toISOString()),
});

export const mapComment = (dto: TaskCommentDto): TaskComment => ({
  id: toString(dto.id),
  taskId: toString(dto.task_id),
  authorId: toString(dto.user_id || dto.author_id),
  author: mapTaskUser(dto.user),
  content: toString(dto.content),
  createdAt: toString(dto.created_at, new Date().toISOString()),
});

export const mapTask = (dto: TaskDto): Task => {
  const assigneesList = Array.isArray(dto.assignees) ? dto.assignees.map(mapTaskUser).filter(Boolean) as User[] : [];
  const assigneeIds = Array.isArray(dto.assignee_ids)
    ? dto.assignee_ids.map(String)
    : Array.isArray((dto as any).assigneeIds)
    ? (dto as any).assigneeIds.map(String)
    : assigneesList.map((u) => u.id);

  const rawReporters = dto.report_tos || dto.reporters || (dto as any).reportTos || [];
  const reportersList = Array.isArray(rawReporters) ? rawReporters.map(mapTaskUser).filter(Boolean) as User[] : [];

  const rawReportIds = dto.report_to_ids || (dto as any).reportToIds;
  const reportToIds = Array.isArray(rawReportIds)
    ? rawReportIds.map(String)
    : dto.report_to_id || (dto as any).reportToId
    ? [String(dto.report_to_id || (dto as any).reportToId)]
    : reportersList.map((u) => u.id);

  const subTasksRaw = dto.sub_tasks || dto.subtasks || (dto as any).subTasks || [];
  const subTasks = Array.isArray(subTasksRaw) ? subTasksRaw.map(mapTask) : [];

  const attachmentsRaw = dto.attachments || [];
  const attachments = Array.isArray(attachmentsRaw) ? attachmentsRaw.map(mapAttachment) : [];

  const checklistRaw = dto.checklist || [];
  const checklist = Array.isArray(checklistRaw) ? checklistRaw.map(mapChecklistItem) : [];

  let projectId = dto.project_id ? String(dto.project_id) : (dto as any).projectId ? String((dto as any).projectId) : undefined;
  let projectName = dto.project?.name || (dto as any).projectName;
  let projectKey = dto.project?.key || dto.project?.code || (dto as any).projectKey;

  if (!projectId && dto.gov_project_id) {
    projectId = `gov-${dto.gov_project_id}`;
    projectName = dto.gov_project?.province_name || dto.gov_project?.solution_name || projectName;
  }

  return {
    id: toString(dto.id),
    code: toString(dto.code, `TASK-${dto.id}`),
    title: toString(dto.title),
    description: toString(dto.description),
    projectId,
    projectName,
    projectKey,
    status: (dto.status as TaskStatus) || "TODO",
    priority: (dto.priority as TaskPriority) || "MEDIUM",
    departmentId: (dto.department_id || (dto as any).departmentId || "dept-it") as DepartmentId,
    departmentName: dto.department?.name || (dto as any).departmentName,
    creatorId: toString(dto.creator_id || (dto as any).creatorId),
    creator: mapTaskUser(dto.creator),
    assigneeIds,
    assignees: assigneesList,
    reportToId: reportToIds[0],
    reportToIds,
    reportTo: reportersList[0],
    reportTos: reportersList,
    reporters: reportersList,
    dueDate: toString(dto.due_date || (dto as any).dueDate, new Date().toISOString().split("T")[0]),
    startDate: dto.start_date || (dto as any).startDate,
    estimatedHours: dto.estimated_hours ? toNumber(dto.estimated_hours) : (dto as any).estimatedHours,
    checklist,
    commentsCount: toNumber(dto.comments_count ?? (dto as any).commentsCount),
    tags: Array.isArray(dto.tags) ? dto.tags : [],
    requiresApproval: Boolean(dto.requires_approval ?? (dto as any).requiresApproval),
    isApproved: Boolean(dto.is_approved ?? (dto as any).isApproved),
    approvedById: dto.approved_by_id ? String(dto.approved_by_id) : (dto as any).approvedById,
    resolution: (dto.resolution as TaskResolution) || (dto as any).resolution,
    resolutionNote: dto.resolution_note || (dto as any).resolutionNote,
    closedAt: dto.closed_at || (dto as any).closedAt,
    closedById: dto.closed_by_id ? String(dto.closed_by_id) : (dto as any).closedById,
    parentId: dto.parent_id !== undefined ? (dto.parent_id ? String(dto.parent_id) : null) : (dto as any).parentId,
    parent: dto.parent ? { id: String(dto.parent.id), code: dto.parent.code || "", title: dto.parent.title || "" } as Task : null,
    subTasks,
    subtasksCount: toNumber(dto.subtasks_count ?? subTasks.length),
    completedSubtasksCount: toNumber(dto.completed_subtasks_count ?? subTasks.filter((s) => s.status === "DONE").length),
    attachments,
    createdAt: toString(dto.created_at || (dto as any).createdAt, new Date().toISOString()),
    updatedAt: toString(dto.updated_at || (dto as any).updatedAt, new Date().toISOString()),
  };
};

export const mapTaskCollectionResponse = (
  dto: TaskCollectionDto,
): { tasks: Task[]; meta: TaskPaginationMeta | null } => {
  const tasks = Array.isArray(dto.data) ? dto.data.map(mapTask) : [];
  const meta: TaskPaginationMeta | null = dto.meta
    ? {
        per_page: toNumber(dto.meta.per_page, 10),
        next_cursor: dto.meta.next_cursor || null,
        prev_cursor: dto.meta.prev_cursor || null,
        has_more: Boolean(dto.meta.has_more),
      }
    : null;

  return { tasks, meta };
};

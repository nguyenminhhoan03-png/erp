import type {
  TaskDto,
  TaskCollectionDto,
  TaskSingleDto,
  TaskCommentDto,
  TaskCommentCollectionDto,
  TaskCommentSingleDto,
} from "./dto";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isTaskDto = (value: unknown): value is TaskDto => {
  if (!isRecord(value)) return false;
  return "id" in value && typeof value.title === "string";
};

export const isTaskCollectionDto = (value: unknown): value is TaskCollectionDto => {
  if (!isRecord(value)) return false;
  return Array.isArray(value.data);
};

export const isTaskSingleDto = (value: unknown): value is TaskSingleDto => {
  if (!isRecord(value)) return false;
  return isTaskDto(value.data);
};

export const isTaskCommentDto = (value: unknown): value is TaskCommentDto => {
  if (!isRecord(value)) return false;
  return "id" in value && typeof value.content === "string";
};

export const isTaskCommentCollectionDto = (
  value: unknown,
): value is TaskCommentCollectionDto => {
  if (!isRecord(value)) return false;
  return Array.isArray(value.data);
};

export const isTaskCommentSingleDto = (
  value: unknown,
): value is TaskCommentSingleDto => {
  if (!isRecord(value)) return false;
  return isTaskCommentDto(value.data);
};

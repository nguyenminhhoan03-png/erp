import type {
  GovBootstrapDto,
  GovDocumentDto,
  GovMeetingScheduleDto,
  GovProjectDto,
  GovWorkLogDto,
} from "./dto";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isGovBootstrapDto = (value: unknown): value is GovBootstrapDto => {
  if (!isRecord(value)) return false;
  if (!isRecord(value.data)) return false;
  return Array.isArray(value.data.solutions) && Array.isArray(value.data.provinces);
};

export const isGovProjectDto = (value: unknown): value is GovProjectDto => {
  if (!isRecord(value)) return false;
  return "id" in value;
};

export const isGovDocumentDto = (value: unknown): value is GovDocumentDto => {
  if (!isRecord(value)) return false;
  return "id" in value && typeof value.title === "string";
};

export const isGovWorkLogDto = (value: unknown): value is GovWorkLogDto => {
  if (!isRecord(value)) return false;
  return "id" in value && typeof value.content === "string";
};

export const isGovMeetingScheduleDto = (
  value: unknown,
): value is GovMeetingScheduleDto => {
  if (!isRecord(value)) return false;
  return "id" in value;
};

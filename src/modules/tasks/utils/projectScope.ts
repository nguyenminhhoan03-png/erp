/**
 * Phân giải projectId từ giao diện (VD: "gov_12", "5", "ALL")
 * thành định dạng chuẩn { project_id, gov_project_id } để gửi lên Backend.
 */
export function resolveProjectScope(projectId?: string | null): {
  project_id?: number;
  gov_project_id?: number;
} {
  if (!projectId || projectId === "ALL") {
    return {};
  }

  const pid = String(projectId).trim();
  if (pid.toLowerCase().startsWith("gov_")) {
    const id = parseInt(pid.slice(4), 10);
    return isNaN(id) ? {} : { gov_project_id: id };
  }

  const id = parseInt(pid, 10);
  return isNaN(id) ? {} : { project_id: id };
}

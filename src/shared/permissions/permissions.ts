import { Role, RoleConfig } from "../types";

/**
 * Danh mục Fine-grained Permissions (Chuẩn Laravel Spatie / Enterprise RBAC)
 * Quy tắc đặt tên: {module}:{action}
 */
export type PermissionKey =
  // 1. Phân hệ Công việc (Task Management)
  | "tasks:view"
  | "tasks:create"
  | "tasks:assign_all"        // Giao việc cho bất kỳ ai / cả phòng
  | "tasks:assign_self"       // Tự gán việc cho bản thân
  | "tasks:approve"           // Phê duyệt đề xuất task
  | "tasks:verify"            // Nghiệm thu hoàn thành (Done)
  | "tasks:edit"
  | "tasks:delete"
  | "tasks:export"            // Xuất file Excel / CSV danh sách công việc
  
  // 2. Phân hệ Báo cáo ngày (Daily Report)
  | "reports:submit"          // Nộp báo cáo ngày
  | "reports:view_department" // Xem báo cáo toàn phòng ban
  | "reports:view_company"    // Xem báo cáo toàn công ty
  | "reports:export"          // Xuất file tổng hợp chấm công & báo cáo
  
  // 3. Phân hệ Nhân sự (HRM)
  | "employees:view"
  | "employees:create"
  | "employees:delete"
  | "employees:edit_role"     // Thay đổi chức danh & phân bổ quyền
  
  // 4. Phân hệ Thống kê & Báo cáo (Analytics)
  | "analytics:view_company"
  | "analytics:view_department"
  | "analytics:view_own"

  // 5. Cấu hình hệ thống (System Settings)
  | "settings:manage";        // Thiết lập quy trình, deadline, cấu hình ERP

/**
 * Phạm vi dữ liệu (Data Scope - ABAC Engine)
 */
export type DataScope = "GLOBAL" | "DEPARTMENT" | "OWN";

export interface PermissionDefinition {
  key: PermissionKey;
  module: "TASKS" | "REPORTS" | "HRM" | "ANALYTICS" | "SYSTEM";
  name: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Task Module
  {
    key: "tasks:view",
    module: "TASKS",
    name: "Xem bảng công việc",
    description: "Xem các task trên bảng Kanban và danh sách",
  },
  {
    key: "tasks:create",
    module: "TASKS",
    name: "Tạo công việc",
    description: "Khởi tạo công việc mới trên hệ thống",
  },
  {
    key: "tasks:assign_all",
    module: "TASKS",
    name: "Giao việc diện rộng",
    description: "Giao việc cho nhiều nhân sự hoặc toàn bộ phòng ban",
  },
  {
    key: "tasks:assign_self",
    module: "TASKS",
    name: "Tự nhận việc",
    description: "Tự tạo và gán công việc cho chính bản thân",
  },
  {
    key: "tasks:approve",
    module: "TASKS",
    name: "Phê duyệt đề xuất",
    description: "Duyệt hoặc từ chối các task do nhân viên tự đề xuất",
  },
  {
    key: "tasks:verify",
    module: "TASKS",
    name: "Nghiệm thu đóng task",
    description: "Đóng task sang trạng thái Done sau khi kiểm tra chất lượng",
  },
  {
    key: "tasks:edit",
    module: "TASKS",
    name: "Chỉnh sửa công việc",
    description: "Sửa tiêu đề, deadline, mô tả và checklist của task",
  },
  {
    key: "tasks:delete",
    module: "TASKS",
    name: "Xóa công việc",
    description: "Xóa bỏ vĩnh viễn task khỏi hệ thống",
  },
  {
    key: "tasks:export",
    module: "TASKS",
    name: "Xuất dữ liệu công việc",
    description: "Xuất file Excel/CSV danh sách công việc và tiến độ sprint",
  },

  // Daily Report Module
  {
    key: "reports:submit",
    module: "REPORTS",
    name: "Nộp báo cáo ngày",
    description: "Khai báo giờ làm, đầu việc và kế hoạch ngày mai",
  },
  {
    key: "reports:view_department",
    module: "REPORTS",
    name: "Xem báo cáo phòng ban",
    description: "Theo dõi danh sách nhân viên trong phòng ai đã nộp/chưa nộp",
  },
  {
    key: "reports:view_company",
    module: "REPORTS",
    name: "Xem báo cáo toàn công ty",
    description: "Xem toàn bộ báo cáo của tất cả các phòng ban",
  },
  {
    key: "reports:export",
    module: "REPORTS",
    name: "Xuất báo cáo chấm công",
    description: "Tải file tổng hợp giờ làm và công việc để đối soát lương",
  },

  // HRM Module
  {
    key: "employees:view",
    module: "HRM",
    name: "Xem danh sách nhân sự",
    description: "Xem hồ sơ, danh bạ nhân sự trong hệ thống",
  },
  {
    key: "employees:create",
    module: "HRM",
    name: "Thêm nhân sự mới",
    description: "Cấp tài khoản và phân bổ phòng ban cho nhân sự",
  },
  {
    key: "employees:delete",
    module: "HRM",
    name: "Xóa nhân sự",
    description: "Thu hồi tài khoản và xóa nhân sự khỏi hệ thống",
  },
  {
    key: "employees:edit_role",
    module: "HRM",
    name: "Phân bổ vai trò & chức danh",
    description: "Nâng hạ cấp bậc, chuyển đổi vai trò nhân sự và phân bổ quyền",
  },

  // Analytics Module
  {
    key: "analytics:view_company",
    module: "ANALYTICS",
    name: "Thống kê toàn công ty",
    description: "Xem dashboard tổng hợp, so sánh giữa các phòng ban",
  },
  {
    key: "analytics:view_department",
    module: "ANALYTICS",
    name: "Thống kê phòng ban",
    description: "Xem chỉ số KPI và tỷ lệ hoàn thành của phòng mình",
  },
  {
    key: "analytics:view_own",
    module: "ANALYTICS",
    name: "Thống kê cá nhân",
    description: "Xem số liệu task và KPI của chính bản thân",
  },

  // System Settings Module
  {
    key: "settings:manage",
    module: "SYSTEM",
    name: "Cấu hình quy trình hệ thống",
    description: "Thiết lập quy định phê duyệt task, thời gian chốt báo cáo và ma trận phân quyền",
  },
];

export const DEFAULT_ROLE_CONFIGS: RoleConfig[] = [
  {
    id: "ADMIN",
    name: "Ban Giám Đốc",
    code: "ADMIN",
    description: "Ban Giám Đốc / Quản trị viên hệ thống với toàn quyền can thiệp",
    color: "rose",
    dataScope: "GLOBAL",
    isSystem: true,
  },
  {
    id: "MANAGER",
    name: "Trưởng phòng",
    code: "MANAGER",
    description: "Trưởng bộ phận quản lý công việc và nhân sự trong phòng ban",
    color: "blue",
    dataScope: "DEPARTMENT",
    isSystem: true,
  },
  {
    id: "EMPLOYEE",
    name: "Nhân viên",
    code: "EMPLOYEE",
    description: "Nhân viên thực thi công việc và tự quản lý tiến độ cá nhân",
    color: "emerald",
    dataScope: "OWN",
    isSystem: true,
  },
  {
    id: "LEAD",
    name: "Trưởng nhóm (Lead)",
    code: "LEAD",
    description: "Tech Lead / Team Leader điều phối sprint, phân công và duyệt chất lượng task",
    color: "purple",
    dataScope: "DEPARTMENT",
    isSystem: false,
  },
];

/**
 * Cấu hình Phân quyền mặc định theo Vai trò (Role-Permission Mapping)
 * Dễ dàng tùy biến hoặc đồng bộ từ Database Laravel
 */
export const ROLE_PERMISSIONS: Record<
  string,
  {
    permissions: PermissionKey[];
    dataScope: DataScope;
    description: string;
  }
> = {
  ADMIN: {
    description: "Ban Giám Đốc / Quản trị viên hệ thống với toàn quyền can thiệp",
    dataScope: "GLOBAL",
    permissions: [
      "tasks:view",
      "tasks:create",
      "tasks:assign_all",
      "tasks:assign_self",
      "tasks:approve",
      "tasks:verify",
      "tasks:edit",
      "tasks:delete",
      "tasks:export",
      "reports:submit",
      "reports:view_department",
      "reports:view_company",
      "reports:export",
      "employees:view",
      "employees:create",
      "employees:delete",
      "employees:edit_role",
      "analytics:view_company",
      "analytics:view_department",
      "analytics:view_own",
      "settings:manage",
    ],
  },
  MANAGER: {
    description: "Trưởng bộ phận quản lý công việc và nhân sự trong phòng ban",
    dataScope: "DEPARTMENT",
    permissions: [
      "tasks:view",
      "tasks:create",
      "tasks:assign_all",
      "tasks:assign_self",
      "tasks:approve",
      "tasks:verify",
      "tasks:edit",
      "tasks:delete",
      "tasks:export",
      "reports:submit",
      "reports:view_department",
      "reports:export",
      "employees:view",
      "employees:create",
      "analytics:view_department",
      "analytics:view_own",
    ],
  },
  LEAD: {
    description: "Tech Lead / Team Leader điều phối sprint, phân công và duyệt chất lượng task",
    dataScope: "DEPARTMENT",
    permissions: [
      "tasks:view",
      "tasks:create",
      "tasks:assign_all",
      "tasks:assign_self",
      "tasks:verify",
      "tasks:approve",
      "tasks:edit",
      "tasks:export",
      "reports:submit",
      "reports:view_department",
      "employees:view",
      "analytics:view_department",
      "analytics:view_own",
    ],
  },
  EMPLOYEE: {
    description: "Nhân viên thực thi công việc và tự quản lý tiến độ cá nhân",
    dataScope: "OWN",
    permissions: [
      "tasks:view",
      "tasks:create",
      "tasks:assign_self",
      "reports:submit",
      "employees:view",
      "analytics:view_own",
    ],
  },
};

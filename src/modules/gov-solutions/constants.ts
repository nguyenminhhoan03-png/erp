import { DigitalSolution, GovStage, DltmStage, Region, GovLogType } from "./types";

export interface StageConfig {
  id: GovStage;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  colorHex: string;
}

export const GOV_STAGES: Record<GovStage, StageConfig> = {
  NOT_STARTED: {
    id: "NOT_STARTED",
    stepNumber: 0,
    label: "0. Chưa bắt đầu",
    shortLabel: "Chưa bắt đầu",
    description: "Dự án mới tạo, chưa có hoạt động gửi công văn",
    badgeClass: "bg-gray-500/10 text-gray-600 border-gray-500/30 dark:text-gray-400",
    colorHex: "#9ca3af",
  },
  DISPATCHED: {
    id: "DISPATCHED",
    stepNumber: 1,
    label: "1. Đã gửi công văn đề nghị tài trợ",
    shortLabel: "Đã gửi công văn",
    description: "IGB liên hệ và phát hành công văn chính thức đề nghị tài trợ nền tảng CĐS",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
    colorHex: "#3b82f6",
  },
  FEEDBACK: {
    id: "FEEDBACK",
    stepNumber: 2,
    label: "2. Địa phương phản hồi & Lấy yêu cầu",
    shortLabel: "Tỉnh phản hồi",
    description: "Địa phương có văn bản phản hồi đồng ý hoặc đang bố trí lịch làm việc sơ bộ",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
    colorHex: "#f59e0b",
  },
  MOU_SIGNED: {
    id: "MOU_SIGNED",
    stepNumber: 3,
    label: "3. Ký Biên bản ghi nhớ (MOU)",
    shortLabel: "Đã ký MOU",
    description: "Hai bên đã họp làm việc thực tế và ký kết biên bản ghi nhớ hợp tác",
    badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400",
    colorHex: "#6366f1",
  },
  SPONSOR_AGREED: {
    id: "SPONSOR_AGREED",
    stepNumber: 4,
    label: "4. Đồng ý tiếp nhận tài trợ chính thức",
    shortLabel: "Đồng ý tài trợ",
    description: "UBND Tỉnh / Sở ban hành quyết định tiếp nhận gói tài trợ chuyển đổi số",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
    colorHex: "#8b5cf6",
  },
  DATA_COLLECT: {
    id: "DATA_COLLECT",
    stepNumber: 5,
    label: "5. Thu thập thông tin, Dữ liệu số & Tài liệu",
    shortLabel: "Thu thập dữ liệu",
    description: "Địa phương cung cấp logo, cẩm nang, bản đồ, cơ sở dữ liệu chuyên ngành",
    badgeClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:text-cyan-400",
    colorHex: "#06b6d4",
  },
  DEPLOYING: {
    id: "DEPLOYING",
    stepNumber: 6,
    label: "6. Đang triển khai kỹ thuật & Vận hành",
    shortLabel: "Đang triển khai",
    description: "Đội ngũ kỹ thuật IGB đang cấu hình nền tảng, số hóa dữ liệu và đào tạo",
    badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400",
    colorHex: "#ea580c",
  },
  COMPLETED: {
    id: "COMPLETED",
    stepNumber: 7,
    label: "7. Đã hoàn tất bàn giao & Vận hành",
    shortLabel: "Đã tài trợ hoàn tất",
    description: "Dự án đã nghiệm thu bàn giao, nền tảng số đã chính thức đi vào hoạt động phục vụ nhân dân",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    colorHex: "#10b981",
  },
  PAUSED: {
    id: "PAUSED",
    stepNumber: 0,
    label: "Tạm dừng / Chờ liên hệ lại",
    shortLabel: "Tạm dừng",
    description: "Địa phương đang kiện toàn nhân sự hoặc đề nghị hoãn làm việc",
    badgeClass: "bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400",
    colorHex: "#64748b",
  },
};

export const DLTM_STAGES = GOV_STAGES;

export const DEFAULT_DIGITAL_SOLUTIONS: DigitalSolution[] = [];

export const DOCUMENT_TYPE_LABELS = {
  CONG_VAN_DI: "Công văn IGB gửi đi",
  CONG_VAN_DEN: "Công văn trả lời của Tỉnh",
  MOU: "Biên bản ghi nhớ (MOU)",
  LOGO_ASSETS: "Logo & Bộ nhận diện tỉnh",
  DATA_SHEET: "Dữ liệu chuyên ngành (Địa điểm/Địa chính/Y tế)",
  OTHER: "Tài liệu khác",
};

export const REGIONS: Region[] = ["Bắc Bộ", "Trung Bộ", "Nam Bộ", "Tây Nguyên"];

export interface IgbTeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
}

export const IGB_TEAM_MEMBERS: IgbTeamMember[] = [
  {
    id: "unassigned",
    name: "Chưa phân công",
    role: "Bỏ gán người phụ trách",
    avatar: "",
    initials: "--",
  },
];


export interface LogTypeConfig {
  id: GovLogType;
  label: string;
  icon: string;
  badgeClass: string;
  defaultTitle: string;
  suggestedStageId?: number;
}

export const GOV_LOG_TYPES: Record<GovLogType, LogTypeConfig> = {
  DISPATCH_SENT: {
    id: "DISPATCH_SENT",
    label: "Gửi công văn đi",
    icon: "Send",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
    defaultTitle: "Gửi công văn đề nghị tài trợ CĐS",
    suggestedStageId: 1,
  },
  DISPATCH_RECEIVED: {
    id: "DISPATCH_RECEIVED",
    label: "Tỉnh phản hồi công văn",
    icon: "Inbox",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    defaultTitle: "Tiếp nhận văn bản phản hồi từ địa phương",
    suggestedStageId: 2,
  },
  CALL: {
    id: "CALL",
    label: "Cuộc gọi trao đổi",
    icon: "PhoneCall",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
    defaultTitle: "Gọi điện trao đổi xúc tiến dự án",
    suggestedStageId: 2,
  },
  MEETING: {
    id: "MEETING",
    label: "Họp / Buổi làm việc",
    icon: "Users",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    defaultTitle: "Buổi làm việc với Lãnh đạo Sở / UBND",
    suggestedStageId: 2,
  },
  MOU_SIGNING: {
    id: "MOU_SIGNING",
    label: "Ký kết thỏa thuận MOU",
    icon: "FileSignature",
    badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
    defaultTitle: "Lễ ký kết biên bản ghi nhớ hợp tác (MOU)",
    suggestedStageId: 3,
  },
  DATA_COLLECT: {
    id: "DATA_COLLECT",
    label: "Thu thập số liệu & Media",
    icon: "FolderDown",
    badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300",
    defaultTitle: "Tiếp nhận số liệu, tư liệu truyền thông",
    suggestedStageId: 5,
  },
  TECHNICAL: {
    id: "TECHNICAL",
    label: "Làm việc kỹ thuật & Tích hợp",
    icon: "Wrench",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
    defaultTitle: "Hỗ trợ kết nối hệ thống & kỹ thuật",
    suggestedStageId: 6,
  },
  ACCEPTANCE: {
    id: "ACCEPTANCE",
    label: "Nghiệm thu & Bàn giao",
    icon: "CheckCircle2",
    badgeClass: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300",
    defaultTitle: "Nghiệm thu bàn giao nền tảng số",
    suggestedStageId: 7,
  },
  STAGE_CHANGE: {
    id: "STAGE_CHANGE",
    label: "Chuyển giai đoạn dự án",
    icon: "Milestone",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    defaultTitle: "Cập nhật tiến trình vòng đời dự án",
  },
};

export const STAGE_OPTIONS = [
  { id: 1, label: "Bước 1: Đã gửi công văn đề nghị tài trợ", stageKey: "DISPATCHED" as GovStage },
  { id: 2, label: "Bước 2: Địa phương phản hồi & Lấy yêu cầu", stageKey: "FEEDBACK" as GovStage },
  { id: 3, label: "Bước 3: Ký Biên bản ghi nhớ (MOU)", stageKey: "MOU_SIGNED" as GovStage },
  { id: 4, label: "Bước 4: Đồng ý tiếp nhận tài trợ chính thức", stageKey: "SPONSOR_AGREED" as GovStage },
  { id: 5, label: "Bước 5: Thu thập thông tin, Dữ liệu số & Tài liệu", stageKey: "DATA_COLLECT" as GovStage },
  { id: 6, label: "Bước 6: Đang triển khai kỹ thuật & Vận hành", stageKey: "DEPLOYING" as GovStage },
  { id: 7, label: "Bước 7: Đã hoàn tất bàn giao & Vận hành", stageKey: "COMPLETED" as GovStage },
];

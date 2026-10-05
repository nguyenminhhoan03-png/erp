import { DigitalSolution, GovStage, DltmStage, Region } from "./types";

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

// Backward-compatibility alias
export const DLTM_STAGES = GOV_STAGES;

export const DEFAULT_DIGITAL_SOLUTIONS: DigitalSolution[] = [
  {
    id: "dltm",
    name: "Du lịch Thông minh",
    shortName: "DLTM",
    code: "SOL-DLTM",
    iconName: "Compass",
    colorHex: "#3b82f6",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
    targetGovDepartment: "Sở Du lịch / Sở VHTTDL",
    dataAssetDescription: "Bản đồ số du lịch, điểm đến danh lam, cơ sở lưu trú, VR 360",
    description: "Nền tảng Cổng thông tin & Ứng dụng Du lịch thông minh phục vụ du khách và cơ quan quản lý 34 tỉnh/thành.",
    activeCount: 34,
    totalTargetProvinces: 34,
  },
];

export const DOCUMENT_TYPE_LABELS = {
  CONG_VAN_DI: "Công văn IGB gửi đi",
  CONG_VAN_DEN: "Công văn trả lời của Tỉnh",
  MOU: "Biên bản ghi nhớ (MOU)",
  LOGO_ASSETS: "Logo & Bộ nhận diện tỉnh",
  DATA_SHEET: "Dữ liệu chuyên ngành (Địa điểm/Địa chính/Y tế)",
  OTHER: "Tài liệu khác",
};

export const REGIONS: Region[] = ["Bắc Bộ", "Trung Bộ", "Nam Bộ", "Tây Nguyên"];

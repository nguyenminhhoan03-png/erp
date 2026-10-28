export type PartnerType = "customer" | "partner";
export type PartnerStatus = "new_contact" | "official" | "vip";
export type PartnerSource = "cms_manual" | "web_form";
export type CareChannel = "call" | "meeting" | "zalo" | "email" | "web_form" | "other";

export interface PartnerContact {
  id: string;
  partnerId: string;
  name: string;
  phone: string;
  email?: string;
  position?: string;
  avatarImage?: string;
  isPrimary: boolean;
  services?: string[];
  note?: string;
  createdAt?: string;
}

export interface CustomerCareLog {
  id: string;
  partnerId: string;
  contactId?: string | null;
  contactName?: string;
  userId?: string | null;
  userName?: string;
  userAvatar?: string;
  channel: CareChannel;
  service?: string;
  content: string;
  result?: string;
  source?: string;
  contactedAt: string;
  createdAt?: string;
}

export interface PartnerProject {
  id: string;
  code?: string;
  name: string;
  status?: string;
  priority?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  partnerType: PartnerType;
  partnerTypeLabel?: string;
  organizationType: "individual" | "organization";
  status: PartnerStatus;
  statusLabel?: string;
  source: PartnerSource;
  sourceDetail?: string;
  services: string[];
  assignedUserId?: string | null;
  assignedUserName?: string;
  assignedUserAvatar?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  primaryContact?: PartnerContact | null;
  contactsCount: number;
  contacts?: PartnerContact[];
  careLogsCount: number;
  careLogs?: CustomerCareLog[];
  projectsCount: number;
  projects?: PartnerProject[];
  lastCareLog?: {
    channel: CareChannel;
    service?: string;
    content: string;
    source?: string;
    contactedAt: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PartnerOptionsData {
  salesUsers: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    position: string;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    code: string;
    label: string;
  }>;
  services: string[];
  channels: Array<{ value: CareChannel; label: string }>;
  statuses: Array<{ value: PartnerStatus; label: string }>;
  types: Array<{ value: PartnerType; label: string }>;
}

export interface PartnerListResponse {
  success: boolean;
  message?: string;
  data: Partner[];
  meta?: {
    per_page: number;
    next_cursor?: string | null;
    prev_cursor?: string | null;
    has_more: boolean;
    total: number;
  };
}

export interface PartnerDetailResponse {
  success: boolean;
  message?: string;
  data: Partner;
}

export interface PartnerOptionsResponse {
  success: boolean;
  data: PartnerOptionsData;
}

export interface PartnerMutationResponse {
  success: boolean;
  message: string;
  data?: Partner;
}

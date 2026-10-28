"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building,
  UserCheck,
  Star,
  Plus,
  MessageSquare,
  PhoneCall,
  Users,
  Globe,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Eye,
  Trash2,
  Edit,
  FolderKanban,
  CheckCircle2,
  Crown,
  ShieldCheck,
  UserPlus,
  Pencil,
  Upload,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { getStorageImageUrl } from "@/modules/partners/utils/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { Partner, PartnerContact, CustomerCareLog, PartnerStatus, CareChannel, PartnerOptionsData } from "@/modules/partners/types";
import { partnerService } from "@/modules/partners/services/partnerService";
import { PartnerFormDialog } from "@/modules/partners/components/PartnerFormDialog";
import { INITIAL_PARTNERS_MOCK, MOCK_PARTNER_OPTIONS } from "@/modules/partners/mockData";
import { useUserStore } from "@/shared/store/useUserStore";
import { cn } from "@/lib/utils";
import { UserSingleSelect } from "@/modules/tasks/components/form/UserSingleSelect";
import { User } from "@/shared/types";

const CARE_CHANNEL_OPTIONS: Array<{
  value: CareChannel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { value: "call", label: "Cuộc gọi", icon: PhoneCall, color: "text-blue-500" },
  { value: "meeting", label: "Gặp mặt", icon: Users, color: "text-emerald-500" },
  { value: "other", label: "Kênh khác", icon: HelpCircle, color: "text-muted-foreground" },
];

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params?.id as string;

  const [partner, setPartner] = React.useState<Partner | null>(null);
  const currentUser = useUserStore((s) => s.currentUser);
  const users = useUserStore((s) => s.users);
  const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null);

  const [isAddingContact, setIsAddingContact] = React.useState(false);
  const [newContactName, setNewContactName] = React.useState("");
  const [newContactPhone, setNewContactPhone] = React.useState("");
  const [newContactEmail, setNewContactEmail] = React.useState("");
  const [newContactPosition, setNewContactPosition] = React.useState("");
  const [newContactAvatarFile, setNewContactAvatarFile] = React.useState<File | null>(null);
  const [newContactAvatarPreview, setNewContactAvatarPreview] = React.useState<string | null>(null);
  const [newContactIsPrimary, setNewContactIsPrimary] = React.useState(false);
  const contactFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (newContactAvatarPreview) {
        URL.revokeObjectURL(newContactAvatarPreview);
      }
    };
  }, [newContactAvatarPreview]);

  const handleContactAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP,...)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa là 5MB");
      return;
    }

    if (newContactAvatarPreview) {
      URL.revokeObjectURL(newContactAvatarPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setNewContactAvatarFile(file);
    setNewContactAvatarPreview(objectUrl);
  };

  const handleRemoveContactAvatar = () => {
    if (newContactAvatarPreview) {
      URL.revokeObjectURL(newContactAvatarPreview);
    }
    setNewContactAvatarFile(null);
    setNewContactAvatarPreview(null);
    if (contactFileInputRef.current) {
      contactFileInputRef.current.value = "";
    }
  };

  const [quickChannel, setQuickChannel] = React.useState<CareChannel>("call");
  const [quickContent, setQuickContent] = React.useState("");
  const [quickService, setQuickService] = React.useState("");
  const [quickUserId, setQuickUserId] = React.useState<string>("");
  const [isLoggingCare, setIsLoggingCare] = React.useState(false);

  const [isEditPartnerOpen, setIsEditPartnerOpen] = React.useState(false);
  const [partnerOptions, setPartnerOptions] = React.useState<PartnerOptionsData | null>(null);

  const availableServices = React.useMemo(() => {
    const fromApi = partnerOptions?.projects?.map((p) => p.name) || [];
    const fromPartner = partner?.services || [];
    return Array.from(new Set([...fromApi, ...fromPartner].filter(Boolean)));
  }, [partnerOptions, partner?.services]);

  const availableUsers: User[] = React.useMemo(() => {
    const list: User[] = [];
    const seen = new Set<string>();

    if (currentUser?.id) {
      seen.add(String(currentUser.id));
      list.push({
        ...currentUser,
        avatar: getStorageImageUrl(currentUser.avatar),
      });
    }

    if (partnerOptions?.salesUsers && partnerOptions.salesUsers.length > 0) {
      partnerOptions.salesUsers.forEach((u) => {
        if (!seen.has(String(u.id))) {
          seen.add(String(u.id));
          list.push({
            id: String(u.id),
            name: u.name,
            email: u.email || "",
            avatar: getStorageImageUrl(u.avatar),
            role: "EMPLOYEE",
            title: u.position || "",
            departmentId: "sales",
          });
        }
      });
    }

    if (users && users.length > 0) {
      users.forEach((u) => {
        if (!seen.has(String(u.id))) {
          seen.add(String(u.id));
          list.push({
            ...u,
            avatar: getStorageImageUrl(u.avatar),
          });
        }
      });
    }

    return list;
  }, [currentUser, partnerOptions?.salesUsers, users]);

  React.useEffect(() => {
    if (currentUser?.id && !quickUserId) {
      setQuickUserId(String(currentUser.id));
    }
  }, [currentUser?.id, quickUserId]);

  React.useEffect(() => {
    if (availableServices.length > 0 && (!quickService || !availableServices.includes(quickService))) {
      setQuickService(availableServices[0]);
    }
  }, [availableServices, quickService]);

  const loadPartnerDetail = React.useCallback(async () => {
    try {
      const res = await partnerService.getPartnerById(partnerId);
      if (res?.data) {
        setPartner(res.data);
      }
    } catch {}
  }, [partnerId]);

  React.useEffect(() => {
    let matched = INITIAL_PARTNERS_MOCK.find(
      (p) => p.id === partnerId || p.code === partnerId
    );

    if (matched) {
      setPartner(matched);
    }

    loadPartnerDetail();

    partnerService.getOptions()
      .then((res) => {
        if (res?.data) {
          setPartnerOptions(res.data);
        }
      })
      .catch(() => {});
  }, [partnerId, loadPartnerDetail]);

  const careLogs = React.useMemo(() => {
    return [...(partner?.careLogs || [])].sort((a, b) => {
      const timeA = new Date(a.contactedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.contactedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [partner?.careLogs]);

  if (!partner) {
    return (
      <div className="w-full p-8 text-center space-y-3">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">Đang tải chi tiết hồ sơ...</p>
      </div>
    );
  }

  const contacts = partner.contacts || (partner.primaryContact ? [partner.primaryContact] : []);
  const projects = partner.projects || [];

  const handleUpdateStatus = async (newStatus: PartnerStatus) => {
    try {
      await partnerService.updateStatus(partner.id, newStatus);
    } catch {}
    setPartner((prev) => (prev ? { ...prev, status: newStatus } : null));
    toast.success("Đã cập nhật trạng thái quan hệ");
  };

  const handleQuickAddCareLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContent.trim()) {
      toast.error("Vui lòng nhập nội dung chăm sóc");
      return;
    }

    const selectedUser = availableUsers.find((u) => String(u.id) === String(quickUserId)) || (currentUser ? {
      id: String(currentUser.id),
      name: currentUser.name || "Tôi",
      avatar: currentUser.avatar,
    } : null);

    setIsLoggingCare(true);
    const optimisticLog: CustomerCareLog = {
      id: `log-${Date.now()}`,
      partnerId: partner.id,
      contactId: partner.primaryContact?.id,
      contactName: partner.primaryContact?.name,
      userId: selectedUser?.id || currentUser?.id,
      userName: selectedUser?.name || currentUser?.name || "Nhân viên",
      userAvatar: selectedUser?.avatar || currentUser?.avatar,
      channel: quickChannel,
      service: quickService,
      content: quickContent.trim(),
      source: "CMS Thao tác nhanh",
      contactedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setPartner((prev) =>
      prev
        ? {
            ...prev,
            careLogs: [optimisticLog, ...(prev.careLogs || [])],
            careLogsCount: (prev.careLogsCount || 0) + 1,
            lastCareLog: {
              channel: quickChannel,
              service: quickService,
              content: quickContent.trim(),
              source: "CMS Thao tác nhanh",
              contactedAt: new Date().toISOString(),
            },
          }
        : null
    );

    try {
      const res = await partnerService.createCareLog(partner.id, {
        contact_id: partner.primaryContact?.id,
        user_id: selectedUser?.id ? Number(selectedUser.id) : undefined,
        channel: quickChannel,
        service: quickService,
        content: quickContent.trim(),
      });
      if (res?.data) {
        setPartner((prev) =>
          prev
            ? {
                ...prev,
                careLogs: [res.data!, ...(prev.careLogs || []).filter((l) => l.id !== optimisticLog.id)],
              }
            : null
        );
      }
    } catch {}

    setQuickContent("");
    setIsLoggingCare(false);
    toast.success("Đã ghi nhận chăm sóc khách hàng");
    loadPartnerDetail();
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) {
      toast.error("Vui lòng nhập tên và số điện thoại người liên hệ");
      return;
    }

    let createdAvatar: string | undefined = newContactAvatarPreview || undefined;

    try {
      const res = await partnerService.createContact(partner.id, {
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
        email: newContactEmail.trim() || undefined,
        position: newContactPosition.trim() || undefined,
        avatar_file: newContactAvatarFile,
        is_primary: newContactIsPrimary || contacts.length === 0,
      });
      if (res?.data?.avatarImage) {
        createdAvatar = res.data.avatarImage;
      }
    } catch {}

    const newContact: PartnerContact = {
      id: `contact-${Date.now()}`,
      partnerId: partner.id,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      email: newContactEmail.trim() || undefined,
      position: newContactPosition.trim() || undefined,
      avatarImage: createdAvatar,
      isPrimary: newContactIsPrimary || contacts.length === 0,
      createdAt: new Date().toISOString(),
    };

    setPartner((prev) => {
      if (!prev) return null;
      let nextContacts = [...(prev.contacts || [])];
      if (newContact.isPrimary) {
        nextContacts = nextContacts.map((c) => ({ ...c, isPrimary: false }));
      }
      nextContacts.push(newContact);
      return {
        ...prev,
        contacts: nextContacts,
        contactsCount: nextContacts.length,
        primaryContact: newContact.isPrimary ? newContact : prev.primaryContact || newContact,
      };
    });

    setNewContactName("");
    setNewContactPhone("");
    setNewContactEmail("");
    setNewContactPosition("");
    handleRemoveContactAvatar();
    setNewContactIsPrimary(false);
    setIsAddingContact(false);
    toast.success("Đã thêm người liên hệ mới");
    loadPartnerDetail();
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      await partnerService.setPrimaryContact(contactId);
    } catch {}

    setPartner((prev) => {
      if (!prev) return null;
      const target = prev.contacts?.find((c) => c.id === contactId);
      if (!target) return prev;
      const nextContacts = (prev.contacts || []).map((c) => ({
        ...c,
        isPrimary: c.id === contactId,
      }));
      return {
        ...prev,
        contacts: nextContacts,
        primaryContact: { ...target, isPrimary: true },
      };
    });
    toast.success("Đã đặt làm đại diện chính");
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await partnerService.deleteContact(contactId);
    } catch {}

    setPartner((prev) => {
      if (!prev) return null;
      const nextContacts = (prev.contacts || []).filter((c) => c.id !== contactId);
      const nextPrimary = prev.primaryContact?.id === contactId ? nextContacts[0] || null : prev.primaryContact;
      return {
        ...prev,
        contacts: nextContacts,
        contactsCount: nextContacts.length,
        primaryContact: nextPrimary,
      };
    });
    toast.success("Đã xóa liên hệ");
  };

  const getStatusBadge = (status: PartnerStatus) => {
    switch (status) {
      case "new_contact":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Mới liên hệ</Badge>;
      case "official":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Khách hàng chính thức</Badge>;
      case "vip":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">Thân thiết / VIP</Badge>;
      default:
        return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "call":
        return <PhoneCall className="w-3.5 h-3.5 text-blue-500" />;
      case "meeting":
        return <Users className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/partners"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Khách hàng & Đối tác
            </Link>
            <span>/</span>
            <span className="font-mono text-foreground">{partner.code}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {partner.name}
            </h1>
            <Badge variant={partner.partnerType === "customer" ? "secondary" : "default"}>
              {partner.partnerType === "customer" ? "Khách hàng" : "Đối tác"}
            </Badge>
            {getStatusBadge(partner.status)}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <Select
            value={partner.status}
            onValueChange={(val: PartnerStatus) => handleUpdateStatus(val)}
          >
            <SelectTrigger className="h-9 px-3 text-xs w-[215px] rounded-xl bg-card border-border/80 font-medium shadow-2xs hover:bg-muted/40 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl text-xs">
              <SelectItem value="new_contact">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Mới liên hệ</span>
                </div>
              </SelectItem>
              <SelectItem value="official">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Khách hàng chính thức</span>
                </div>
              </SelectItem>
              <SelectItem value="vip">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span>Thân thiết / VIP</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/partners")}
            className="h-9 px-3 rounded-xl text-xs gap-1.5 bg-card hover:bg-muted font-medium shadow-2xs border-border/80 transition-all hover:-translate-x-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-primary" />
                Thông tin đơn vị
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditPartnerOpen(true)}
                className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 font-medium"
              >
                <Pencil className="w-3 h-3" />
                Chỉnh sửa
              </Button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Đại diện chính:</span>
                <span className="font-semibold text-foreground">
                  {partner.primaryContact?.name || "Chưa có"}
                </span>
                {partner.primaryContact?.position && (
                  <span className="text-muted-foreground block text-[11px]">
                    {partner.primaryContact.position}
                  </span>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Số điện thoại:</span>
                <a
                  href={`tel:${partner.phone || partner.primaryContact?.phone}`}
                  className="font-medium text-primary hover:underline"
                >
                  {partner.phone || partner.primaryContact?.phone || "Chưa có"}
                </a>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Email:</span>
                <a
                  href={`mailto:${partner.email || partner.primaryContact?.email}`}
                  className="font-medium hover:underline text-foreground"
                >
                  {partner.email || partner.primaryContact?.email || "Chưa có"}
                </a>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Địa chỉ:</span>
                <span className="text-foreground">{partner.address || "Chưa cập nhật"}</span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Nhân viên phụ trách:</span>
                <span className="font-medium text-foreground">
                  {partner.assignedUserName || "Chưa phân bổ"}
                </span>
              </div>

              {partner.services && partner.services.length > 0 && (
                <div className="pt-1">
                  <span className="text-muted-foreground block text-[11px] mb-1">Dịch vụ sử dụng:</span>
                  <div className="flex flex-wrap gap-1">
                    {partner.services.map((svc) => (
                      <Badge key={svc} variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        {svc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {partner.notes && (
                <div className="pt-1 border-t border-border/40">
                  <span className="text-muted-foreground block text-[11px]">Ghi chú:</span>
                  <p className="text-muted-foreground whitespace-pre-wrap italic">
                    "{partner.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Danh bạ người liên hệ ({contacts.length})
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAddingContact((prev) => !prev)}
                className="h-6 text-[11px] text-primary px-1.5"
              >
                {isAddingContact ? "Đóng" : "+ Thêm liên hệ"}
              </Button>
            </div>

            {isAddingContact && (
              <form onSubmit={handleCreateContact} className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2.5">
                <span className="text-xs font-semibold text-foreground block">Thêm người liên hệ nhanh</span>
                <Input
                  placeholder="Họ tên người liên hệ *"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="h-8 text-xs bg-background"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Số điện thoại *"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                  />
                  <Input
                    placeholder="Chức vụ"
                    value={newContactPosition}
                    onChange={(e) => setNewContactPosition(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <input
                  ref={contactFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleContactAvatarChange}
                />

                {newContactAvatarPreview ? (
                  <div className="flex items-center gap-2.5 p-2 rounded-lg border border-border/80 bg-muted/30">
                    <img
                      src={newContactAvatarPreview}
                      alt="Preview"
                      className="w-10 h-10 rounded-md object-cover border border-border shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-medium text-foreground truncate">
                        {newContactAvatarFile?.name || "Ảnh đại diện"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {newContactAvatarFile ? `${(newContactAvatarFile.size / 1024).toFixed(0)} KB` : "Ảnh đã chọn"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => contactFileInputRef.current?.click()}
                        className="h-6 text-[10px] px-2"
                      >
                        Đổi ảnh
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveContactAvatar}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => contactFileInputRef.current?.click()}
                    className="border border-dashed border-border rounded-lg p-2.5 text-center cursor-pointer hover:bg-muted/40 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs">Tải ảnh đại diện / ảnh chat gợi nhớ</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={newContactIsPrimary}
                      onChange={(e) => setNewContactIsPrimary(e.target.checked)}
                      className="rounded"
                    />
                    Đặt làm đại diện chính
                  </label>
                  <Button type="submit" size="sm" className="h-7 text-xs">
                    Lưu liên hệ
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all text-xs flex items-start justify-between gap-2.5",
                    contact.isPrimary
                      ? "border-primary/40 bg-primary/5 shadow-2xs"
                      : "border-border/70 bg-card/40"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={getStorageImageUrl(contact.avatarImage) || undefined} alt={contact.name} />
                        <AvatarFallback className="text-xs font-semibold bg-muted">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {contact.avatarImage && (
                        <button
                          type="button"
                          title="Xem ảnh / tin nhắn chat gợi nhớ"
                          onClick={() => setPreviewImage({ url: getStorageImageUrl(contact.avatarImage), title: `${contact.name} - Ảnh đại diện / tin nhắn` })}
                          className="absolute -bottom-1 -right-1 p-0.5 bg-background border border-border rounded-full shadow-xs hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{contact.name}</span>
                        {contact.isPrimary && (
                          <span title="Đại diện chính">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      {contact.position && (
                        <span className="text-[11px] text-muted-foreground block">{contact.position}</span>
                      )}
                      <div className="pt-0.5 flex flex-col gap-0.5 text-[11px]">
                        <a href={`tel:${contact.phone}`} className="font-medium text-foreground hover:text-primary">
                          {contact.phone}
                        </a>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!contact.isPrimary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(contact.id)}
                        className="h-6 text-[10px] text-muted-foreground hover:text-amber-500 px-1"
                        title="Đặt làm đại diện chính"
                      >
                        Đại diện
                      </Button>
                    )}
                    {contacts.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        title="Xóa liên hệ"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-primary/20">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                <Send className="w-3.5 h-3.5" />
                Ghi nhận chăm sóc nhanh
              </span>
            </div>

            <form onSubmit={handleQuickAddCareLog} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Kênh tương tác
                  </label>
                  <Select
                    value={quickChannel}
                    onValueChange={(val: CareChannel) => setQuickChannel(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue>
                        {(() => {
                          const opt = CARE_CHANNEL_OPTIONS.find((c) => c.value === quickChannel) || CARE_CHANNEL_OPTIONS[0];
                          const Icon = opt.icon;
                          return (
                            <div className="flex items-center gap-1.5 truncate">
                              <Icon className={cn("w-3.5 h-3.5 shrink-0", opt.color)} />
                              <span>{opt.label}</span>
                            </div>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {CARE_CHANNEL_OPTIONS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SelectItem key={item.value} value={item.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn("w-3.5 h-3.5 shrink-0", item.color)} />
                              <span>{item.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Dự án / Dịch vụ
                  </label>
                  <Select
                    value={quickService}
                    onValueChange={setQuickService}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Chọn dự án...">
                        {quickService ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{quickService}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Chọn dự án...</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {availableServices.map((svc) => (
                        <SelectItem key={svc} value={svc}>
                          <div className="flex items-center gap-2">
                            <FolderKanban className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span>{svc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Nhân viên chăm sóc
                  </label>
                  <UserSingleSelect
                    value={quickUserId}
                    onChange={(val) => setQuickUserId(val)}
                    users={availableUsers}
                    currentUser={currentUser || undefined}
                    placeholder="Chọn nhân viên..."
                    searchPlaceholder="Tìm theo tên, chức vụ..."
                    triggerClassName="h-8 text-xs bg-background"
                    popoverClassName="w-72"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Nội dung trao đổi <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Nhập nội dung trao đổi, phản hồi của khách, yêu cầu báo giá..."
                    value={quickContent}
                    onChange={(e) => setQuickContent(e.target.value)}
                    className="text-xs min-h-[64px] bg-background flex-1"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoggingCare}
                    className="self-end h-8 text-xs gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ghi nhận
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  Lịch sử chăm sóc ({careLogs.length})
                </h3>
              </div>
            </div>

            {careLogs.length === 0 ? (
              <div className="p-8 text-center border rounded-xl border-dashed bg-muted/20">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">Chưa có lịch sử chăm sóc</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sử dụng ô ghi nhận nhanh phía trên để lưu lại nội dung làm việc với khách.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
                {careLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-xs">
                      {getChannelIcon(log.channel)}
                    </div>

                    <div className="p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card transition-colors space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground uppercase tracking-wide">
                            {log.channel === "call" && "Cuộc gọi điện thoại"}
                            {log.channel === "meeting" && "Gặp mặt trực tiếp"}
                            {log.channel !== "call" && log.channel !== "meeting" && "Kênh khác"}
                          </span>
                          {log.service && (
                            <Badge variant="outline" className="text-[10px] h-4.5 bg-primary/5 text-primary border-primary/20">
                              {log.service}
                            </Badge>
                          )}
                        </div>

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.contactedAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {log.content}
                      </div>

                      {log.result && (
                        <div className="text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <span className="font-semibold">Kết quả: </span>
                          {log.result}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                        <span>{log.contactName ? `Người liên hệ: ${log.contactName}` : "Đầu mối chung"}</span>
                        <span>{log.userName ? `Nhân viên: ${log.userName}` : "Hệ thống tự động"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-xl p-4 bg-background">
          <DialogTitle className="text-sm font-semibold truncate mb-2">
            {previewImage?.title}
          </DialogTitle>
          {previewImage && (
            <div className="flex items-center justify-center rounded-lg overflow-hidden bg-black/5 dark:bg-black/30 max-h-[75vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-md shadow-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PartnerFormDialog
        open={isEditPartnerOpen}
        onOpenChange={setIsEditPartnerOpen}
        partner={partner}
        options={partnerOptions}
        onSuccess={loadPartnerDetail}
      />
    </div>
  );
}

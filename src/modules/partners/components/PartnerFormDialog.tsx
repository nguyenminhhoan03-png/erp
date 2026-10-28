"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Partner, PartnerOptionsData } from "../types";
import { partnerService } from "../services/partnerService";
import { Building, UserCheck, Star, Upload, Trash2 } from "lucide-react";
import { UserSingleSelect } from "@/modules/tasks/components/form/UserSingleSelect";
import { User } from "@/shared/types";

interface PartnerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  options?: PartnerOptionsData | null;
  onSuccess: () => void;
}

export function PartnerFormDialog({
  open,
  onOpenChange,
  partner,
  options,
  onSuccess,
}: PartnerFormDialogProps) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [partnerType, setPartnerType] = React.useState<"customer" | "partner">("customer");
  const [organizationType, setOrganizationType] = React.useState<"individual" | "organization">("organization");
  const [status, setStatus] = React.useState<"new_contact" | "official" | "vip">("new_contact");
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
  const [assignedUserId, setAssignedUserId] = React.useState<string>("none");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactPosition, setContactPosition] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const availableServices = options?.projects?.map((p) => p.name) || options?.services || [];
  const allDisplayedServices = React.useMemo(() => {
    return Array.from(new Set([...availableServices, ...selectedServices].filter(Boolean)));
  }, [availableServices, selectedServices]);
  const salesUsers = options?.salesUsers || [];

  const userOptions: User[] = React.useMemo(() => {
    return salesUsers.map((u) => ({
      id: String(u.id),
      name: u.name,
      email: u.email || "",
      avatar: u.avatar || "",
      title: u.position || "",
      role: "EMPLOYEE",
      departmentId: "sales",
    }));
  }, [salesUsers]);

  React.useEffect(() => {
    if (partner) {
      setName(partner.name || "");
      setCode(partner.code || "");
      setPartnerType(partner.partnerType || "customer");
      setOrganizationType(partner.organizationType || "organization");
      setStatus(partner.status || "new_contact");
      setSelectedServices(partner.services || []);
      setAssignedUserId(partner.assignedUserId ? String(partner.assignedUserId) : "none");
      setPhone(partner.phone || "");
      setEmail(partner.email || "");
      setAddress(partner.address || "");
      setNotes(partner.notes || "");
      setContactName("");
      setContactPhone("");
      setContactPosition("");
      const existingAvatar = partner.primaryContact?.avatarImage || "";
      setAvatarPreview(existingAvatar || null);
      setAvatarFile(null);
    } else {
      setName("");
      setCode("");
      setPartnerType("customer");
      setOrganizationType("organization");
      setStatus("new_contact");
      setSelectedServices([]);
      setAssignedUserId("none");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");
      setContactName("");
      setContactPhone("");
      setContactPosition("");
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [partner, open]);

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên đối tác hoặc khách hàng");
      return;
    }

    setIsSubmitting(true);
    try {
      if (partner) {
        await partnerService.updatePartner(partner.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          partnerType,
          organizationType,
          status,
          services: selectedServices,
          assigned_user_id: assignedUserId !== "none" ? assignedUserId : null,
          phone_number: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          avatar_file: avatarFile,
        });
        toast.success("Cập nhật thông tin thành công");
      } else {
        await partnerService.createPartner({
          name: name.trim(),
          code: code.trim() || undefined,
          partner_type: partnerType,
          organization_type: organizationType,
          status,
          source: "cms_manual",
          services: selectedServices,
          assigned_user_id: assignedUserId !== "none" ? assignedUserId : null,
          phone_number: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          contact_name: contactName.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          contact_position: contactPosition.trim() || undefined,
          avatar_file: avatarFile,
        });
        toast.success("Tạo mới đối tác / khách hàng thành công");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {partner ? `Chỉnh sửa đối tác: ${partner.name}` : "Thêm mới đối tác / khách hàng"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Phân loại đối tượng</label>
              <Select
                value={partnerType}
                onValueChange={(val: "customer" | "partner") => setPartnerType(val)}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="customer">Khách hàng</SelectItem>
                  <SelectItem value="partner">Đối tác hợp tác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Mô hình tổ chức</label>
              <Select
                value={organizationType}
                onValueChange={(val: "individual" | "organization") => setOrganizationType(val)}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="organization">Doanh nghiệp / Tổ chức</SelectItem>
                  <SelectItem value="individual">Cá nhân</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Trạng thái quan hệ</label>
              <Select
                value={status}
                onValueChange={(val: "new_contact" | "official" | "vip") => setStatus(val)}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="new_contact">Mới liên hệ</SelectItem>
                  <SelectItem value="official">Chính thức</SelectItem>
                  <SelectItem value="vip">Thân thiết (VIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Tên công ty / Tên khách hàng <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Công ty TNHH Vận Tải ABC hoặc Anh Hoàng Minh..."
              className="h-9 rounded-xl text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Dịch vụ sử dụng / quan tâm
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allDisplayedServices.map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <Badge
                    key={service}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1 px-2.5 rounded-lg select-none transition-all"
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Nhân viên Sale / CSKH phụ trách</span>
              </label>
              <UserSingleSelect
                value={assignedUserId === "none" ? "" : assignedUserId}
                onChange={(val) => setAssignedUserId(val || "none")}
                users={userOptions.length > 0 ? userOptions : undefined}
                placeholder="Chọn nhân viên phụ trách..."
                searchPlaceholder="Tìm theo tên, chức vụ..."
                allowClear
                clearLabel="Chưa phân bổ"
                triggerClassName="h-9 rounded-xl text-xs"
                popoverClassName="w-80"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Số điện thoại chính</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.vn"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Địa chỉ trụ sở / văn phòng</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tầng 5, Tòa nhà ABC, Hà Nội..."
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ảnh đại diện / Ảnh chat gợi nhớ</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {avatarPreview ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/30">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-border shrink-0 shadow-2xs"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs font-medium text-foreground truncate">
                    {avatarFile?.name || "Ảnh đại diện"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {avatarFile ? `${(avatarFile.size / 1024).toFixed(0)} KB` : "Ảnh hiện tại"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-[11px] px-2.5"
                  >
                    Đổi ảnh
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Bấm để tải ảnh đại diện / ảnh chat từ máy tính
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {!partner && (
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>Thiết lập người liên hệ đại diện ban đầu (tùy chọn)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Tên người đại diện</label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="VD: Anh Nam, Chị Linh..."
                    className="h-8 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Số điện thoại đại diện</label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0988123456"
                    className="h-8 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Chức vụ đại diện</label>
                  <Input
                    value={contactPosition}
                    onChange={(e) => setContactPosition(e.target.value)}
                    placeholder="VD: Giám đốc, Quản lý..."
                    className="h-8 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Ghi chú thêm</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Yêu cầu đặc biệt, lưu ý khi làm việc với đối tác..."
              className="rounded-xl text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-9 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl h-9 text-xs bg-primary text-primary-foreground font-medium"
            >
              {isSubmitting ? "Đang lưu..." : partner ? "Cập nhật" : "Tạo đối tác"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

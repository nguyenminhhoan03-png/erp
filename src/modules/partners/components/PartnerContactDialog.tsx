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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { PartnerContact } from "../types";
import { partnerService } from "../services/partnerService";
import { User, Phone, Mail, Briefcase, Image as ImageIcon, Star, Upload, Trash2 } from "lucide-react";

interface PartnerContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  contact?: PartnerContact | null;
  availableServices?: string[];
  onSuccess: () => void;
}

export function PartnerContactDialog({
  open,
  onOpenChange,
  partnerId,
  contact,
  availableServices: propAvailableServices,
  onSuccess,
}: PartnerContactDialogProps) {
  const [dynamicServices, setDynamicServices] = React.useState<string[]>([]);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [avatarImage, setAvatarImage] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isPrimary, setIsPrimary] = React.useState(false);
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    setAvatarImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  React.useEffect(() => {
    partnerService.getOptions()
      .then((res) => {
        if (res?.data?.projects) {
          setDynamicServices(res.data.projects.map((p) => p.name));
        }
      })
      .catch(() => {});
  }, []);

  const serviceOptions = React.useMemo(() => {
    if (propAvailableServices && propAvailableServices.length > 0) {
      return propAvailableServices;
    }
    return dynamicServices;
  }, [propAvailableServices, dynamicServices]);

  React.useEffect(() => {
    if (contact) {
      setName(contact.name || "");
      setPhone(contact.phone || "");
      setEmail(contact.email || "");
      setPosition(contact.position || "");
      setAvatarImage(contact.avatarImage || "");
      setAvatarPreview(contact.avatarImage || null);
      setAvatarFile(null);
      setIsPrimary(Boolean(contact.isPrimary));
      setSelectedServices(contact.services || []);
      setNote(contact.note || "");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setPosition("");
      setAvatarImage("");
      setAvatarPreview(null);
      setAvatarFile(null);
      setIsPrimary(false);
      setSelectedServices([]);
      setNote("");
    }
  }, [contact, open]);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên người liên hệ");
      return;
    }
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    setIsSubmitting(true);
    try {
      if (contact) {
        await partnerService.updateContact(contact.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          position: position.trim() || undefined,
          avatar_image: avatarImage.trim() || undefined,
          is_primary: isPrimary,
          services: selectedServices,
          note: note.trim() || undefined,
        });
        toast.success("Cập nhật người liên hệ thành công");
      } else {
        await partnerService.createContact(partnerId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          position: position.trim() || undefined,
          avatar_image: avatarImage.trim() || undefined,
          avatar_file: avatarFile,
          is_primary: isPrimary,
          services: selectedServices,
          note: note.trim() || undefined,
        });
        toast.success("Thêm người liên hệ mới thành công");
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
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {contact ? "Chỉnh sửa người liên hệ" : "Thêm người liên hệ vào danh bạ"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Họ và tên</span>
              <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn Tuấn, Chị Mai..."
              className="h-9 rounded-xl text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Số điện thoại</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0988123456"
                className="h-9 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Chức vụ / Bộ phận</span>
              </label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Giám đốc, Kế toán..."
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Email</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuan@company.com"
              className="h-9 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ảnh đại diện hoặc ảnh chụp tin nhắn gợi nhớ</span>
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
                    {avatarFile?.name || "Ảnh nhận diện"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {avatarFile ? `${(avatarFile.size / 1024).toFixed(0)} KB` : "Ảnh đã lưu"}
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
                    Bấm để chọn ảnh từ máy tính
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Dịch vụ người này phụ trách / quan tâm
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {serviceOptions.map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <Badge
                    key={service}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1 px-2.5 rounded-lg transition-all select-none"
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Checkbox
              id="isPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(Boolean(checked))}
            />
            <label
              htmlFor="isPrimary"
              className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5 select-none"
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Đặt người này làm Người đại diện liên hệ chính</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Ghi chú đặc điểm liên hệ
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thói quen liên lạc, thời gian thuận tiện, tính cách khách hàng..."
              className="rounded-xl text-xs min-h-[64px]"
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
              {isSubmitting ? "Đang lưu..." : contact ? "Cập nhật" : "Thêm liên hệ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

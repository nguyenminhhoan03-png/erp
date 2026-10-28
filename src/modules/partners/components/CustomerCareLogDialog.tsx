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
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { PartnerContact, CareChannel, PartnerStatus } from "../types";
import { partnerService } from "../services/partnerService";
import { useUserStore } from "@/shared/store/useUserStore";
import { PhoneCall, Users, MessageSquare, Mail, Globe, HelpCircle } from "lucide-react";
import { UserSingleSelect } from "@/modules/tasks/components/form/UserSingleSelect";
import { User } from "@/shared/types";
import { getStorageImageUrl } from "../utils/image";

interface CustomerCareLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
  contacts?: PartnerContact[];
  availableServices?: string[];
  currentStatus?: PartnerStatus;
  onSuccess: () => void;
}

const CHANNELS: Array<{ value: CareChannel; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "call", label: "Cuộc gọi", icon: PhoneCall },
  { value: "meeting", label: "Gặp mặt", icon: Users },
  { value: "other", label: "Kênh khác", icon: HelpCircle },
];

export function CustomerCareLogDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  contacts = [],
  availableServices: propAvailableServices,
  currentStatus,
  onSuccess,
}: CustomerCareLogDialogProps) {
  const currentUser = useUserStore((s) => s.currentUser);
  const users = useUserStore((s) => s.users);
  const [salesUsers, setSalesUsers] = React.useState<Array<{ id: string; name: string; email?: string; avatar?: string; position?: string }>>([]);
  const [userId, setUserId] = React.useState<string>("");
  const [dynamicServices, setDynamicServices] = React.useState<string[]>([]);
  const [contactId, setContactId] = React.useState<string>("none");
  const [channel, setChannel] = React.useState<CareChannel>("call");
  const [service, setService] = React.useState<string>("none");
  const [content, setContent] = React.useState("");
  const [newStatus, setNewStatus] = React.useState<string>("keep");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    partnerService.getOptions()
      .then((res) => {
        if (res?.data?.projects) {
          setDynamicServices(res.data.projects.map((p) => p.name));
        }
        if (res?.data?.salesUsers) {
          setSalesUsers(res.data.salesUsers);
        }
      })
      .catch(() => {});
  }, []);

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
    salesUsers.forEach((u) => {
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
    users.forEach((u) => {
      if (!seen.has(String(u.id))) {
        seen.add(String(u.id));
        list.push({
          ...u,
          avatar: getStorageImageUrl(u.avatar),
        });
      }
    });
    return list;
  }, [currentUser, salesUsers, users]);

  const projectList = React.useMemo(() => {
    if (propAvailableServices && propAvailableServices.length > 0) {
      return propAvailableServices;
    }
    return dynamicServices;
  }, [propAvailableServices, dynamicServices]);

  React.useEffect(() => {
    if (open) {
      const primary = contacts.find((c) => c.isPrimary);
      setContactId(primary ? primary.id : contacts[0]?.id || "none");
      setChannel("call");
      setService("none");
      setContent("");
      setNewStatus("keep");
      setUserId(currentUser?.id ? String(currentUser.id) : "");
    }
  }, [open, contacts, currentUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung trao đổi");
      return;
    }

    setIsSubmitting(true);
    try {
      await partnerService.createCareLog(partnerId, {
        contact_id: contactId !== "none" ? contactId : null,
        user_id: userId ? Number(userId) : undefined,
        channel,
        service: service !== "none" ? service : undefined,
        content: content.trim(),
        source: "cms_manual",
      });

      if (newStatus !== "keep" && newStatus !== currentStatus) {
        await partnerService.updateStatus(partnerId, newStatus as PartnerStatus);
      }

      toast.success("Ghi nhận chăm sóc khách hàng thành công");
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
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Ghi nhận chăm sóc khách hàng
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Khách hàng: <span className="font-medium text-foreground">{partnerName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Người liên hệ trao đổi
            </label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder="Chọn người liên hệ" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="none">Không chỉ định cụ thể</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""} {c.isPrimary ? "⭐" : ""}
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
              value={userId}
              onChange={(val) => setUserId(val)}
              users={availableUsers}
              currentUser={currentUser || undefined}
              placeholder="Chọn nhân viên..."
              searchPlaceholder="Tìm theo tên, chức vụ..."
              triggerClassName="h-9 rounded-xl text-xs"
              popoverClassName="w-80"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Kênh tương tác</label>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map((item) => {
                const Icon = item.icon;
                const isSelected = channel === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setChannel(item.value)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border/80 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Dịch vụ trao đổi</label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder="Chọn dịch vụ" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="none">Chung / Chưa rõ</SelectItem>
                {projectList.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Nội dung trao đổi <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ghi lại tóm tắt nội dung cuộc gọi, buổi họp hoặc tin nhắn..."
              className="rounded-xl text-xs min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Cập nhật phân loại khách hàng
            </label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="keep">Giữ nguyên phân loại hiện tại</SelectItem>
                <SelectItem value="new_contact">Mới liên hệ</SelectItem>
                <SelectItem value="official">Khách hàng chính thức</SelectItem>
                <SelectItem value="vip">Thân thiết (VIP)</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Đang lưu..." : "Lưu ghi nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

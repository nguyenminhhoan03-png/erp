"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { getStorageImageUrl } from "../utils/image";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import {
  Partner,
  PartnerContact,
  PartnerStatus,
} from "../types";
import {
  Phone,
  Mail,
  MapPin,
  Building,
  UserCheck,
  Star,
  Plus,
  MessageSquare,
  PhoneCall,
  Users,
  Globe,
  HelpCircle,
  Calendar,
  Layers,
  Edit,
  Trash2,
  ExternalLink,
  FolderKanban,
  Eye,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onEditPartner: (partner: Partner) => void;
  onAddContact: (partner: Partner) => void;
  onEditContact: (partner: Partner, contact: PartnerContact) => void;
  onDeleteContact: (contactId: string) => void;
  onSetPrimaryContact: (contactId: string) => void;
  onAddCareLog: (partner: Partner) => void;
  onDeleteCareLog: (logId: string) => void;
  onUpdateStatus: (partnerId: string, status: PartnerStatus) => void;
}

export function PartnerDetailDrawer({
  open,
  onOpenChange,
  partner,
  onEditPartner,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onSetPrimaryContact,
  onAddCareLog,
  onDeleteCareLog,
  onUpdateStatus,
}: PartnerDetailDrawerProps) {
  const [activeTab, setActiveTab] = React.useState("contacts");
  const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null);

  if (!partner) return null;

  const contacts = partner.contacts || (partner.primaryContact ? [partner.primaryContact] : []);
  const careLogs = partner.careLogs || [];
  const projects = partner.projects || [];

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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl flex flex-col p-0 bg-background border-l border-border/80">
          <SheetHeader className="p-6 border-b border-border/70 bg-card/60 backdrop-blur-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                  {partner.code}
                </span>
                <Badge variant={partner.partnerType === "customer" ? "secondary" : "default"}>
                  {partner.partnerType === "customer" ? "Khách hàng" : "Đối tác"}
                </Badge>
                {getStatusBadge(partner.status)}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddCareLog(partner)}
                  className="h-8 gap-1 text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  Chăm sóc
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddContact(partner)}
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm liên hệ
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onEditPartner(partner)}
                  className="h-8 gap-1 text-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Sửa
                </Button>
              </div>
            </div>

            <div>
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                {partner.name}
              </SheetTitle>
              {partner.services && partner.services.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs text-muted-foreground mr-1">Dịch vụ quan tâm / sử dụng:</span>
                  {partner.services.map((svc) => (
                    <Badge key={svc} variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                      {svc}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground block">Đại diện chính:</span>
                <span className="font-medium text-foreground">
                  {partner.primaryContact?.name || "Chưa thiết lập"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Số điện thoại:</span>
                <span className="font-medium text-foreground">
                  {partner.phone || partner.primaryContact?.phone || "Chưa có"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Người phụ trách:</span>
                <span className="font-medium text-foreground">
                  {partner.assignedUserName || "Chưa phân bổ"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Số dự án liên kết:</span>
                <span className="font-medium text-primary">
                  {projects.length} dự án
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-10 p-1">
                <TabsTrigger value="contacts" className="text-xs gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Danh bạ ({contacts.length})
                </TabsTrigger>
                <TabsTrigger value="care_logs" className="text-xs gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chăm sóc ({careLogs.length})
                </TabsTrigger>
                <TabsTrigger value="projects" className="text-xs gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5" />
                  Dự án ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Thông tin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Danh bạ nhân sự đại diện và liên hệ trao đổi của đối tác / khách hàng này.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddContact(partner)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm người liên hệ
                  </Button>
                </div>

                {contacts.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl border-dashed bg-muted/20">
                    <UserCheck className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-medium">Chưa có thông tin danh bạ</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Thêm người liên hệ đại diện để tiện theo dõi và trao đổi công việc.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => onAddContact(partner)}
                      className="mt-3 text-xs"
                    >
                      Thêm người liên hệ đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "p-4 rounded-xl border bg-card/80 transition-all duration-200 relative group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                          contact.isPrimary
                            ? "border-primary/50 shadow-xs ring-1 ring-primary/20 bg-primary/5"
                            : "border-border/70 hover:border-border"
                        )}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-2 border-background shadow-xs">
                              <AvatarImage src={getStorageImageUrl(contact.avatarImage) || undefined} alt={contact.name} />
                              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                {contact.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {contact.avatarImage && (
                              <button
                                type="button"
                                title="Xem ảnh / ảnh chat gợi nhớ"
                                onClick={() => setPreviewImage({ url: getStorageImageUrl(contact.avatarImage), title: `${contact.name} - Ảnh đại diện / tin nhắn` })}
                                className="absolute -bottom-1 -right-1 p-1 bg-background border border-border rounded-full shadow-xs hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                {contact.name}
                              </span>
                              {contact.isPrimary && (
                                <Badge variant="default" className="text-[10px] h-4.5 px-1.5 gap-0.5 bg-amber-500 hover:bg-amber-600 text-white border-0">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  Đại diện chính
                                </Badge>
                              )}
                              {contact.position && (
                                <span className="text-xs text-muted-foreground">
                                  • {contact.position}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <a
                                href={`tel:${contact.phone}`}
                                className="flex items-center gap-1 hover:text-primary transition-colors font-medium text-foreground"
                              >
                                <Phone className="w-3 h-3 text-primary" />
                                {contact.phone}
                              </a>
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Mail className="w-3 h-3 text-muted-foreground" />
                                  {contact.email}
                                </a>
                              )}
                            </div>

                            {contact.services && contact.services.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {contact.services.map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground font-medium">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            {contact.note && (
                              <p className="text-xs text-muted-foreground italic pt-0.5">
                                "{contact.note}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {!contact.isPrimary && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSetPrimaryContact(contact.id)}
                              className="h-8 text-xs text-muted-foreground hover:text-amber-500"
                              title="Đặt làm người liên hệ đại diện chính"
                            >
                              <Star className="w-3.5 h-3.5 mr-1" />
                              Đặt đại diện
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditContact(partner, contact)}
                            className="h-8 w-8 p-0"
                            title="Sửa thông tin liên hệ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          {contacts.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteContact(contact.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Xóa liên hệ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="care_logs" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Nhật ký tương tác chăm sóc khách hàng (Cuộc gọi, gặp mặt, Kênh khác).
                  </p>
                  <Button
                    size="sm"
                    onClick={() => onAddCareLog(partner)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm lượt chăm sóc
                  </Button>
                </div>

                {careLogs.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl border-dashed bg-muted/20">
                    <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-medium">Chưa có lịch sử chăm sóc</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lưu lại thông tin các cuộc gọi, tin nhắn Zalo hoặc ghi chú trao đổi.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => onAddCareLog(partner)}
                      className="mt-3 text-xs"
                    >
                      Ghi nhận lượt chăm sóc đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
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

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(log.contactedAt).toLocaleString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDeleteCareLog(log.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Xóa ghi chép này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                            {log.content}
                          </div>

                          {log.result && (
                            <div className="text-xs p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              <span className="font-semibold">Kết quả: </span>
                              {log.result}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                            <span>
                              {log.contactName ? `Liên hệ: ${log.contactName}` : "Đầu mối chung"}
                            </span>
                            <span>
                              {log.userName ? `Nhân viên: ${log.userName}` : "Hệ thống tự động"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="projects" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Dự án Outsource và dịch vụ liên kết thuộc đối tác / khách hàng này.
                  </p>
                </div>

                {projects.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl border-dashed bg-muted/20">
                    <FolderKanban className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-medium">Chưa có dự án outsource nào</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Các dự án outsource liên kết với đối tác này sẽ được tổng hợp tự động tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-xl border border-border/80 bg-card/80 space-y-2.5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {proj.code && (
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                {proj.code}
                              </span>
                            )}
                            <h4 className="font-semibold text-sm text-foreground">
                              {proj.name}
                            </h4>
                          </div>
                          {proj.status && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {proj.status}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-border/40">
                          {proj.budget !== undefined && (
                            <div>
                              <span className="text-muted-foreground block">Ngân sách:</span>
                              <span className="font-semibold text-foreground">
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(proj.budget)}
                              </span>
                            </div>
                          )}
                          {proj.priority && (
                            <div>
                              <span className="text-muted-foreground block">Mức ưu tiên:</span>
                              <span className="font-medium text-foreground">{proj.priority}</span>
                            </div>
                          )}
                          {(proj.startDate || proj.endDate) && (
                            <div>
                              <span className="text-muted-foreground block">Thời gian:</span>
                              <span className="font-medium text-foreground">
                                {proj.startDate || "..."} → {proj.endDate || "..."}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Thông tin liên hệ & Đơn vị
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Loại đối tác:</span>
                      <span className="font-medium text-foreground">
                        {partner.partnerType === "customer" ? "Khách hàng" : "Đối tác chiến lược"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">Hình thức tổ chức:</span>
                      <span className="font-medium text-foreground">
                        {partner.organizationType === "organization" ? "Doanh nghiệp / Tổ chức" : "Cá nhân"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">Trạng thái quan hệ:</span>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(partner.status)}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] text-primary px-1.5"
                          onClick={() => {
                            const next = partner.status === "new_contact" ? "official" : partner.status === "official" ? "vip" : "official";
                            onUpdateStatus(partner.id, next);
                          }}
                        >
                          Chuyển sang {partner.status === "new_contact" ? "Chính thức" : partner.status === "official" ? "Thân thiết" : "Chính thức"}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">Điện thoại đơn vị:</span>
                      <span className="font-medium text-foreground">
                        {partner.phone || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">Email đơn vị:</span>
                      <span className="font-medium text-foreground">
                        {partner.email || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block">Địa chỉ:</span>
                      <span className="font-medium text-foreground">
                        {partner.address || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block">Ghi chú nghiệp vụ:</span>
                      <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
                        {partner.notes || "Không có ghi chú thêm."}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

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
    </>
  );
}

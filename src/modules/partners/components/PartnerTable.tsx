"use client";

import * as React from "react";
import Link from "next/link";
import {
  Partner,
  PartnerStatus,
  PartnerContact,
} from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { getStorageImageUrl } from "../utils/image";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import {
  MoreHorizontal,
  Phone,
  Eye,
  Edit,
  Trash2,
  PhoneCall,
  Users,
  Globe,
  HelpCircle,
  MessageSquare,
  Mail,
  Building,
  ArrowUpDown,
} from "lucide-react";

interface PartnerTableProps {
  partners: Partner[];
  isLoading?: boolean;
  onViewDetail: (partner: Partner) => void;
  onEditPartner: (partner: Partner) => void;
  onDeletePartner: (partner: Partner) => void;
  onAddContact: (partner: Partner) => void;
  onAddCareLog: (partner: Partner) => void;
  onUpdateStatus: (partnerId: string, status: PartnerStatus) => void;
}

export function PartnerTable({
  partners,
  isLoading,
  onViewDetail,
  onEditPartner,
  onDeletePartner,
  onAddContact,
  onAddCareLog,
  onUpdateStatus,
}: PartnerTableProps) {
  const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null);

  const getStatusBadge = (status: PartnerStatus) => {
    switch (status) {
      case "new_contact":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs font-medium">
            Mới liên hệ
          </Badge>
        );
      case "official":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs font-medium">
            Chính thức
          </Badge>
        );
      case "vip":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-xs font-medium">
            Thân thiết / VIP
          </Badge>
        );
      default:
        return null;
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case "call":
        return <PhoneCall className="w-3.5 h-3.5 text-blue-500" />;
      case "meeting":
        return <Users className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getChannelLabel = (channel?: string) => {
    switch (channel) {
      case "call":
        return "Gọi điện";
      case "meeting":
        return "Gặp mặt";
      default:
        return "Khác";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-card overflow-hidden">
        <div className="p-8 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách đối tác & khách hàng...</p>
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="w-full bg-card overflow-hidden">
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Building className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-foreground text-base">Không có đối tác hoặc khách hàng nào</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại. Thử xóa bộ lọc hoặc thêm mới đối tác / khách hàng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full border border-border/80 rounded-xl bg-card/60 backdrop-blur-xs overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4 min-w-[260px]">ĐỐI TÁC / KHÁCH HÀNG</th>
                <th className="py-3 px-4 min-w-[220px]">ĐẠI DIỆN LIÊN HỆ</th>
                <th className="py-3 px-3 min-w-[150px]">DỰ ÁN / DỊCH VỤ</th>
                <th className="py-3 px-3 min-w-[150px]">PHÂN LOẠI & TRẠNG THÁI</th>
                <th className="py-3 px-4 min-w-[160px]">LIÊN HỆ GẦN NHẤT</th>
                <th className="py-3 px-3 text-right w-[80px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {partners.map((partner) => {
                const rep = partner.primaryContact || partner.contacts?.[0];

                return (
                  <tr
                    key={partner.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => onViewDetail(partner)}
                  >
                    <td className="py-3 px-4 align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                            {partner.code}
                          </span>
                          <Badge
                            variant={partner.partnerType === "customer" ? "secondary" : "default"}
                            className="text-[10px] h-4.5 px-1.5 font-medium"
                          >
                            {partner.partnerType === "customer" ? "Khách hàng" : "Đối tác"}
                          </Badge>
                        </div>

                        <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {partner.name}
                        </div>
                      </div>
                    </td>

                    <td
                      className="py-3 px-4 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rep ? (
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <Avatar className="w-8 h-8 border border-border">
                              <AvatarImage src={getStorageImageUrl(rep.avatarImage) || undefined} alt={rep.name} />
                              <AvatarFallback className="text-[11px] font-semibold bg-muted">
                                {rep.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {rep.avatarImage && (
                              <button
                                type="button"
                                title="Xem ảnh / tin nhắn chat gợi nhớ"
                                onClick={() => setPreviewImage({ url: getStorageImageUrl(rep.avatarImage), title: `${rep.name} - Ảnh đại diện / tin nhắn` })}
                                className="absolute -bottom-1 -right-1 p-0.5 bg-background border border-border rounded-full shadow-xs hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Eye className="w-2 h-2" />
                              </button>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate max-w-[140px]">
                              {rep.name}
                            </div>
                            <a
                              href={`tel:${rep.phone}`}
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              {rep.phone}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Chưa có đại diện</span>
                      )}
                    </td>

                    <td className="py-3 px-3 align-middle">
                      {partner.services && partner.services.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {partner.services.map((svc) => (
                            <span
                              key={svc}
                              className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary font-medium"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">-</span>
                      )}
                    </td>

                    <td
                      className="py-3 px-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 cursor-pointer group/btn"
                          >
                            {getStatusBadge(partner.status)}
                            <ArrowUpDown className="w-2.5 h-2.5 text-muted-foreground opacity-50 group-hover/btn:opacity-100" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44 text-xs">
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(partner.id, "new_contact")}
                            className="text-amber-600 font-medium"
                          >
                            Mới liên hệ
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(partner.id, "official")}
                            className="text-blue-600 font-medium"
                          >
                            Khách hàng chính thức
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(partner.id, "vip")}
                            className="text-purple-600 font-medium"
                          >
                            Thân thiết / VIP
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    <td className="py-3 px-4 align-middle">
                      {partner.lastCareLog ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          {getChannelIcon(partner.lastCareLog.channel)}
                          <span className="font-medium">{getChannelLabel(partner.lastCareLog.channel)}</span>
                          <span className="text-[11px] text-muted-foreground">
                            • {new Date(partner.lastCareLog.contactedAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Chưa có liên hệ</span>
                      )}
                    </td>

                    <td
                      className="py-3 px-3 text-right align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem onClick={() => onViewDetail(partner)}>
                            <Eye className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditPartner(partner)}>
                            <Edit className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeletePartner(partner)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Xóa hồ sơ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    </>
  );
}

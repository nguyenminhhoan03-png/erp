"use client";

import * as React from "react";
import Link from "next/link";
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  Building,
  Star,
  Eye,
  RotateCcw,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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
import { partnerService } from "@/modules/partners/services/partnerService";
import { PartnerContact, Partner } from "@/modules/partners/types";

interface EnrichedContact extends PartnerContact {
  partnerName: string;
  partnerCode: string;
  partnerType: string;
  partnerStatus: string;
}

export default function ContactsDirectoryPage() {
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [serviceFilter, setServiceFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [projectOptions, setProjectOptions] = React.useState<string[]>([]);
  const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null);

  React.useEffect(() => {
    partnerService.getOptions()
      .then((res) => {
        if (res?.data?.projects) {
          setProjectOptions(res.data.projects.map((p) => p.name));
        }
      })
      .catch(() => {});
  }, []);

  const fetchContacts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await partnerService.getPartners({
        search: search.trim() || undefined,
        service: serviceFilter !== "all" ? serviceFilter : undefined,
      });
      if (res?.data) {
        setPartners(res.data);
      }
    } catch (error) {
      console.error("Failed to load contacts directory:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, serviceFilter]);

  React.useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const allContacts = React.useMemo(() => {
    const list: EnrichedContact[] = [];
    partners.forEach((p) => {
      const pContacts = p.contacts || (p.primaryContact ? [p.primaryContact] : []);
      pContacts.forEach((c) => {
        list.push({
          ...c,
          partnerName: p.name,
          partnerCode: p.code,
          partnerType: p.partnerType,
          partnerStatus: p.status,
        });
      });
    });
    return list;
  }, [partners]);

  const filteredContacts = React.useMemo(() => {
    return allContacts.filter((c) => {
      if (roleFilter === "primary" && !c.isPrimary) return false;
      if (serviceFilter !== "all" && !c.services?.includes(serviceFilter)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPartner = c.partnerName.toLowerCase().includes(q);
        const matchPosition = c.position?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchPartner && !matchPosition) {
          return false;
        }
      }

      return true;
    });
  }, [allContacts, search, serviceFilter, roleFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setServiceFilter("all");
    setRoleFilter("all");
  };

  const hasActiveFilters = search.trim() !== "" || serviceFilter !== "all" || roleFilter !== "all";

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Danh bạ người liên hệ
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tổng hợp toàn bộ đầu mối liên hệ, người đại diện và ảnh chụp tin nhắn chat gợi nhớ từ các đối tác & khách hàng
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredContacts.length}</span> / {allContacts.length} người liên hệ
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng người liên hệ</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{allContacts.length}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Người đại diện chính</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              {allContacts.filter((c) => c.isPrimary).length}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Có ảnh chat / avatar gợi nhớ</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              {allContacts.filter((c) => Boolean(c.avatarImage)).length}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, SĐT, email, công ty, chức vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-background/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs bg-background/80">
              <SelectValue placeholder="Vai trò đại diện" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Tất cả liên hệ</SelectItem>
              <SelectItem value="primary">Đại diện chính</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-background/80">
              <SelectValue placeholder="Dịch vụ phụ trách" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Tất cả dịch vụ</SelectItem>
              {projectOptions.map((proj) => (
                <SelectItem key={proj} value={proj}>{proj}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="w-full border rounded-xl bg-card p-12 text-center space-y-3">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-muted-foreground">Đang tải danh bạ liên hệ từ hệ thống...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="w-full bg-card p-12 text-center space-y-2">
          <UserCheck className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-sm">Không tìm thấy người liên hệ phù hợp</h3>
          <p className="text-xs text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-xs hover:border-primary/40 hover:shadow-sm transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="w-12 h-12 border-2 border-background shadow-xs">
                        <AvatarImage src={getStorageImageUrl(contact.avatarImage) || undefined} alt={contact.name} />
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {contact.avatarImage && (
                        <button
                          type="button"
                          title="Xem ảnh / tin nhắn chat gợi nhớ"
                          onClick={() => setPreviewImage({ url: getStorageImageUrl(contact.avatarImage), title: `${contact.name} - Ảnh đại diện / tin nhắn` })}
                          className="absolute -bottom-1 -right-1 p-1 bg-background border border-border rounded-full shadow-xs hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {contact.name}
                        </span>
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-[10px] h-4.5 px-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0 gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Đại diện
                          </Badge>
                        )}
                      </div>
                      {contact.position && (
                        <span className="text-xs text-muted-foreground block truncate">
                          {contact.position}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Thuộc đơn vị:</span>
                  <Link
                    href={`/partners/${contact.partnerId}`}
                    className="font-medium text-foreground hover:text-primary transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{contact.partnerName}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </Link>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>

                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="truncate hover:text-primary transition-colors"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                </div>

                {contact.services && contact.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {contact.services.map((svc) => (
                      <span
                        key={svc}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                )}

                {contact.note && (
                  <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2 line-clamp-2">
                    "{contact.note}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs gap-1"
                  asChild
                >
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="w-3 h-3 text-primary" />
                    Gọi điện
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  asChild
                >
                  <Link href={`/partners/${contact.partnerId}`}>
                    Xem hồ sơ
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}

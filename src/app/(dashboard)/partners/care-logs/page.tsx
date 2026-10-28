"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  PhoneCall,
  Users,
  HelpCircle,
  Clock,
  Search,
  Filter,
  RotateCcw,
  Building,
  Phone,
  Send,
  Sparkles,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { partnerService } from "@/modules/partners/services/partnerService";
import { CustomerCareLog, CareChannel, Partner } from "@/modules/partners/types";

interface EnrichedCareLog extends CustomerCareLog {
  partnerName: string;
  partnerCode: string;
  partnerType: string;
  partnerPhone?: string;
}

export default function CareLogsAndLeadsPage() {
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState("all");

  const fetchCareLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await partnerService.getPartners();
      if (res?.data) {
        setPartners(res.data);
      }
    } catch (error) {
      console.error("Failed to load care logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCareLogs();
  }, [fetchCareLogs]);

  const allLogs = React.useMemo(() => {
    const list: EnrichedCareLog[] = [];
    partners.forEach((p) => {
      (p.careLogs || []).forEach((l) => {
        list.push({
          ...l,
          partnerName: p.name,
          partnerCode: p.code,
          partnerType: p.partnerType,
          partnerPhone: p.phone || p.primaryContact?.phone,
        });
      });
    });
    return list.sort(
      (a, b) => new Date(b.contactedAt).getTime() - new Date(a.contactedAt).getTime()
    );
  }, [partners]);

  const filteredLogs = React.useMemo(() => {
    return allLogs.filter((l) => {
      if (channelFilter !== "all") {
        if (channelFilter === "other") {
          if (l.channel === "call" || l.channel === "meeting") return false;
        } else if (l.channel !== channelFilter) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchPartner = l.partnerName.toLowerCase().includes(q);
        const matchContent = l.content.toLowerCase().includes(q);
        const matchContact = l.contactName?.toLowerCase().includes(q);
        const matchResult = l.result?.toLowerCase().includes(q);
        if (!matchPartner && !matchContent && !matchContact && !matchResult) {
          return false;
        }
      }

      return true;
    });
  }, [allLogs, channelFilter, search]);

  const stats = React.useMemo(() => {
    return {
      total: allLogs.length,
      calls: allLogs.filter((l) => l.channel === "call").length,
      meetings: allLogs.filter((l) => l.channel === "meeting").length,
    };
  }, [allLogs]);

  const getChannelBadge = (channel: CareChannel) => {
    switch (channel) {
      case "call":
        return (
          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 gap-1">
            <PhoneCall className="w-3 h-3" /> Gọi điện
          </Badge>
        );
      case "meeting":
        return (
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
            <Users className="w-3 h-3" /> Gặp mặt
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/30 gap-1">
            <HelpCircle className="w-3 h-3" /> Kênh khác
          </Badge>
        );
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Nhật ký chăm sóc khách hàng
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quản lý và theo dõi toàn bộ lịch sử tương tác, trao đổi với đối tác và khách hàng
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng tương tác</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cuộc gọi điện</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{stats.calls}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Gặp mặt trực tiếp</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{stats.meetings}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm nội dung, đối tác, người liên hệ, kết quả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background/80"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-background/80">
                <SelectValue placeholder="Kênh liên hệ" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả kênh</SelectItem>
                <SelectItem value="call">Gọi điện</SelectItem>
                <SelectItem value="meeting">Gặp mặt</SelectItem>
                <SelectItem value="other">Kênh khác</SelectItem>
              </SelectContent>
            </Select>

            {(search || channelFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setChannelFilter("all");
                }}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Xóa lọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="w-full bg-card p-12 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-sm">Chưa có bản ghi tương tác nào</h3>
          <p className="text-xs text-muted-foreground">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-xs hover:border-primary/40 transition-colors space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getChannelBadge(log.channel)}
                  {log.service && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {log.service}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(log.contactedAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
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

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{log.partnerName}</span>
                  <span className="font-mono text-[10px] px-1 rounded bg-muted">
                    {log.partnerCode}
                  </span>
                  {log.contactName && (
                    <span>• Người liên hệ: <strong className="text-foreground">{log.contactName}</strong></span>
                  )}
                  {log.partnerPhone && (
                    <a
                      href={`tel:${log.partnerPhone}`}
                      className="text-primary hover:underline flex items-center gap-1 font-medium ml-1"
                    >
                      <Phone className="w-3 h-3" />
                      {log.partnerPhone}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span>
                    {log.userName ? `Nhân sự phụ trách: ${log.userName}` : "Hệ thống tự động ghi nhận"}
                  </span>
                  <Link
                    href={`/partners/${log.partnerId}`}
                    className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs font-medium"
                  >
                    Xem chi tiết hồ sơ
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

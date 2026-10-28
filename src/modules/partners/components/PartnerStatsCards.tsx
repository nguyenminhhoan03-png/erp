"use client";

import * as React from "react";
import { ShieldCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PartnerStatus } from "../types";

interface PartnerStatsCardsProps {
  officialCount: number;
  vipCount: number;
  selectedStatus?: string;
  onSelectStatus: (status: string) => void;
}

export function PartnerStatsCards({
  officialCount,
  vipCount,
  selectedStatus,
  onSelectStatus,
}: PartnerStatsCardsProps) {
  const cards = [
    {
      id: "official",
      title: "Khách hàng chính thức",
      count: officialCount,
      subtext: "Đã ký kết hợp đồng & hoàn tất nghiệm thu",
      icon: ShieldCheck,
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      border: "border-emerald-500/30 hover:border-emerald-500/50",
      iconBg: "bg-emerald-500/10 text-emerald-500",
      statusValue: "official" as PartnerStatus,
    },
    {
      id: "vip",
      title: "Đối tác / KH Thân thiết",
      count: vipCount,
      subtext: "Hợp tác lâu năm & đối tác chiến lược VIP",
      icon: Crown,
      gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
      border: "border-purple-500/30 hover:border-purple-500/50",
      iconBg: "bg-purple-500/10 text-purple-500",
      statusValue: "vip" as PartnerStatus,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = selectedStatus === card.statusValue;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectStatus(isActive ? "all" : card.statusValue)}
            className={cn(
              "relative text-left p-4 rounded-xl border bg-card/60 backdrop-blur-xs transition-all duration-200 cursor-pointer overflow-hidden group hover:shadow-md",
              card.border,
              isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary shadow-sm"
            )}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80 pointer-events-none", card.gradient)} />
            <div className="relative z-10 flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {card.count}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.subtext}
                </p>
              </div>
              <div className={cn("p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-110", card.iconBg)}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

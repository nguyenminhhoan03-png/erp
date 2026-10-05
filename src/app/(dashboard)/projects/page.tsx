"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Building2,
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Layers,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useGovStore } from "@/modules/gov-solutions/store/govStore";
import { DEFAULT_DIGITAL_SOLUTIONS } from "@/modules/gov-solutions/constants";

export default function ProjectsPage() {
  const { projects, solutions } = useGovStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "GOV" | "OUTSOURCE" | "INTERNAL">("ALL");

  // Summary counts
  const totalGovProvinces = 34;
  const completedGovProjects = projects.filter((p) => p.stage === "COMPLETED").length;
  const deployingGovProjects = projects.filter((p) => p.stage === "DEPLOYING").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tổng quan Danh mục Dự án (Portfolio)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
              Enterprise Suite
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản trị tập trung các dự án Chuyển đổi số Chính quyền 34 Tỉnh, Outsource doanh nghiệp và R&D nội bộ IGB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/gov-projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow hover:bg-primary/90 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Vào Cổng CĐS 34 Tỉnh</span>
            <ArrowUpRight className="w-4 h-4 ml-0.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: B2G Digital Transformation */}
        <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-card to-card p-5 shadow-xs transition-all hover:shadow-md hover:border-blue-500/40">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <MapPin className="w-3 h-3" />
                Khối Chính quyền (B2G)
              </span>
              <h3 className="text-lg font-bold text-foreground mt-3">Chuyển đổi số 34 Tỉnh/Thành</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Du lịch thông minh, Đất đai & GIS, Y tế số, Giáo dục số
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
            <div>
              <div className="text-2xl font-black text-foreground">{totalGovProvinces}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Tỉnh tiếp cận</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedGovProjects}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Đã hoàn tất</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{deployingGovProjects}</div>
              <div className="text-[11px] text-muted-foreground font-medium">Đang triển khai</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">5 giải pháp trọng điểm</span>
            <Link
              href="/gov-projects"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Xem chi tiết tiến độ <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Outsource Enterprise */}
        <div className="relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-card to-card p-5 shadow-xs transition-all hover:shadow-md hover:border-purple-500/40">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Building2 className="w-3 h-3" />
                Khối Doanh nghiệp (B2B)
              </span>
              <h3 className="text-lg font-bold text-foreground mt-3">Dự án Outsource & Hợp đồng</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Phần mềm theo yêu cầu, Web app, Ứng dụng di động & ERP
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FolderGit2 className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
            <div>
              <div className="text-2xl font-black text-foreground">18</div>
              <div className="text-[11px] text-muted-foreground font-medium">Hợp đồng</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">12</div>
              <div className="text-[11px] text-muted-foreground font-medium">Đang chạy</div>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">6</div>
              <div className="text-[11px] text-muted-foreground font-medium">Bảo hành</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Doanh số Q3: 4.8 tỷ</span>
            <span className="text-xs font-medium text-muted-foreground">Theo dõi Sprint</span>
          </div>
        </div>

        {/* Card 3: Internal R&D */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-500/40">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                Khối Sản phẩm Nội bộ
              </span>
              <h3 className="text-lg font-bold text-foreground mt-3">R&D & Sản phẩm Core IGB</h3>
              <p className="text-xs text-muted-foreground mt-1">
                IGB ERP Cloud, AI Chatbot SmartGov, Nền tảng GIS Map
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
            <div>
              <div className="text-2xl font-black text-foreground">5</div>
              <div className="text-[11px] text-muted-foreground font-medium">Sản phẩm core</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">v2.4</div>
              <div className="text-[11px] text-muted-foreground font-medium">ERP Engine</div>
            </div>
            <div>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">99.8%</div>
              <div className="text-[11px] text-muted-foreground font-medium">Uptime SLA</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Phát hành tự động CI/CD</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      {/* Solutions Quick Jump Showcase */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Các Giải Pháp Chuyển Đổi Số Chính Quyền (B2G Digital Solutions)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              5 trụ cột giải pháp IGB đang tài trợ & chuyển giao cho 34 tỉnh thành cả nước
            </p>
          </div>
          <Link
            href="/gov-projects"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Quản trị chi tiết 34 tỉnh <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {solutions.map((sol) => (
            <div
              key={sol.id}
              className="p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-all hover:border-primary/40 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1"
                    style={{ borderColor: `${sol.colorHex}40`, color: sol.colorHex, backgroundColor: `${sol.colorHex}15` }}
                  >
                    {sol.shortName}
                  </span>
                  <h4 className="font-bold text-sm text-foreground">{sol.name}</h4>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${sol.colorHex}20`, color: sol.colorHex }}
                >
                  {sol.activeCount}/34
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">{sol.description}</p>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">Đối tác: {sol.targetGovDepartment}</span>
                <Link
                  href={`/gov-projects?sol=${sol.id}`}
                  className="font-semibold text-primary hover:underline text-[11px]"
                >
                  Xem tiến độ &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

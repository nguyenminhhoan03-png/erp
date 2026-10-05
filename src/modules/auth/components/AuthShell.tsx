"use client";

import * as React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const HIGHLIGHTS = [
  "Quản lý công việc Kanban theo phòng ban",
  "Báo cáo ngày & duyệt công việc tập trung",
  "Dự án chuyển đổi số 34 tỉnh/thành",
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white bg-gradient-to-br from-indigo-700 via-blue-600 to-sky-500">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-sky-300/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">ERP Web</p>
            <p className="text-xs text-white/70">Quản trị doanh nghiệp</p>
          </div>
        </div>

        <div className="relative space-y-8 max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Một nơi duy nhất để điều phối công việc toàn công ty.
          </h2>
          <ul className="space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-200" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} ERP Web</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          <div className="text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}

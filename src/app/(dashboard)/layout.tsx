import * as React from "react";
import { AppSidebar } from "@/shared/components/AppSidebar";
import { Header } from "@/shared/components/Header";
import { AuthGate } from "@/modules/auth/components/AuthGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full bg-muted/20">
        <React.Suspense fallback={<aside className="w-64 h-screen border-r border-border/80 bg-card/70" />}>
          <AppSidebar />
        </React.Suspense>
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto w-full">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}

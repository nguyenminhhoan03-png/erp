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
      <div className="flex min-h-screen bg-muted/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Web - Quản lý công việc nội bộ",
  description: "Hệ thống quản lý công việc và báo cáo ngày nội bộ ERP hiện đại",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased`}
    >
      <body className="min-h-full w-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-right" richColors closeButton expand={false} />
      </body>
    </html>
  );
}

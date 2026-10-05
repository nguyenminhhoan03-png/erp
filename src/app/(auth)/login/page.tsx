import type { Metadata } from "next";
import { LoginForm } from "@/modules/auth/components/LoginForm";

export const metadata: Metadata = { title: "Đăng nhập | ERP Web" };

export default function LoginPage() {
  return <LoginForm />;
}

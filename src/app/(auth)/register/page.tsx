import type { Metadata } from "next";
import { RegisterForm } from "@/modules/auth/components/RegisterForm";

export const metadata: Metadata = { title: "Đăng ký | ERP Web" };

export default function RegisterPage() {
  return <RegisterForm />;
}

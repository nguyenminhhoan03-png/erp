import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Vui lòng nhập họ và tên").max(255),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    phone_number: z
      .string()
      .max(15, "Số điện thoại tối đa 15 ký tự")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    password_confirmation: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Mật khẩu nhập lại không khớp",
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

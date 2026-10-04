import { Department } from "../types";

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: "it",
    name: "Phòng Công nghệ Thông tin",
    code: "IT",
    color: "#3b82f6", // Blue
    description: "Phát triển phần mềm, hạ tầng hệ thống và an ninh mạng",
    managerId: "user-it-lead",
  },
  {
    id: "marketing",
    name: "Phòng Marketing & Truyền thông",
    code: "MKT",
    color: "#ec4899", // Pink
    description: "Xây dựng thương hiệu, chiến dịch quảng cáo và nội dung",
    managerId: "user-mkt-lead",
  },
  {
    id: "hr",
    name: "Phòng Nhân sự & Hành chính",
    code: "HR",
    color: "#8b5cf6", // Purple
    description: "Tuyển dụng, đào tạo, chế độ đãi ngộ và văn hóa doanh nghiệp",
    managerId: "user-hr-lead",
  },
  {
    id: "sales",
    name: "Phòng Kinh doanh & Khách hàng",
    code: "SALES",
    color: "#f59e0b", // Amber
    description: "Phát triển thị trường, bán hàng và chăm sóc đối tác B2B",
    managerId: "user-sales-lead",
  },
  {
    id: "accounting",
    name: "Phòng Tài chính - Kế toán",
    code: "ACC",
    color: "#10b981", // Emerald
    description: "Quản lý dòng tiền, báo cáo thuế, ngân sách và kiểm toán",
    managerId: "user-acc-lead",
  },
];

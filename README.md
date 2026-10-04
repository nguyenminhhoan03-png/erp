# ERP Web - Phân hệ Quản lý Công việc & Báo cáo Nội bộ (Enterprise Frontend Demo)

Bản demo giao diện chất lượng cao (Frontend-only với Mock data tiếng Việt thực tế) dành cho phân hệ **Quản lý công việc (Task Management)** và **Báo cáo ngày (Daily Report)** trong hệ thống ERP nội bộ. 

Được thiết kế theo tiêu chuẩn **Senior Frontend Engineer** với kiến trúc **Modular Architecture**, sẵn sàng mở rộng thêm các phân hệ **CRM**, **CMS** và kết nối trực tiếp với backend **Laravel REST API**.

---

## 📚 Bộ Tài Liệu Chuyên Sâu (Documentation Suite)

Hệ thống tài liệu chuyên sâu được chuẩn hóa trong thư mục `/docs`:

1. 🏗️ **[Kiến Trúc Kỹ Thuật (Architecture & TDD)](file:///e:/Project_ItWebDev/JS/erp-fe/docs/ARCHITECTURE.md)**: Phân tầng module, sơ đồ luồng dữ liệu, cơ chế Optimistic DnD, ma trận phân quyền RBAC và kiểm soát ma trận trạng thái.
2. 🔌 **[Hướng Dẫn Tích Hợp Backend Laravel](file:///e:/Project_ItWebDev/JS/erp-fe/docs/BACKEND_INTEGRATION_GUIDE.md)**: Đặc tả API RESTful, lược đồ Database ERD (PostgreSQL/MySQL), cấu hình Laravel Sanctum và hướng dẫn chuyển đổi từ Mock Service sang Axios trong 2 bước.
3. 🎯 **[Kịch Bản Thuyết Trình Demo Cho Sếp (Demo Guide)](file:///e:/Project_ItWebDev/JS/erp-fe/docs/DEMO_GUIDE.md)**: Kịch bản demo 5 phút, giả lập 3 vai trò (Giám đốc, Trưởng phòng, Nhân viên), các kịch bản test vi phạm phân quyền và xử lý ngoại lệ.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Framework**: [Next.js](https://nextjs.org/) (App Router) + TypeScript strict (100% type-safe, không `any`).
- **Styling**: Tailwind CSS + Hệ thống Design Tokens & Component chuẩn [shadcn/ui](https://ui.shadcn.com/).
- **Kéo thả Kanban**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (DragOverlay, keyboard support, optimistic updates).
- **State Management**: [Zustand](https://github.com/pmndrs/zustand).
- **Form & Validation**: `react-hook-form` + `zod` + `@hookform/resolvers`.
- **Biểu đồ & Analytics**: [Recharts](https://recharts.org/).
- **Mock Data**: `@faker-js/faker` (locale `vi`) với seed cố định `2026`.
- **Ngày tháng**: `date-fns` (vi locale).
- **Thông báo**: `sonner` toast system.

---

## 2. Hướng dẫn Khởi chạy (Quick Start)

### Cài đặt dependencies (nếu chưa cài):
```bash
npm install --legacy-peer-deps
```

### Khởi động môi trường phát triển:
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000` (hệ thống tự động chuyển hướng vào **`/dashboard`**).

### Kiểm tra build sản phẩm:
```bash
npm run build
```

---

## 3. Cấu trúc Thư mục Phân hệ (Modular ERP Architecture)

```
src/
├── app/(dashboard)/          # Routing Layer & Layout Shell
│   ├── dashboard/            # 1. Tổng quan Dashboard & KPI
│   ├── tasks/                # 2. Phân hệ Công việc (Kanban Jira Board & Table View)
│   ├── daily-report/         # 2. Báo cáo ngày (Nhân viên nộp & Quản lý theo dõi)
│   ├── approvals/            # 2. Duyệt đề xuất công việc
│   ├── employees/            # 3. Phân hệ Nhân sự & Thành viên (HRM)
│   └── statistics/           # 4. Báo cáo & Phân tích KPI (Recharts)
│
├── modules/tasks/            # Task Management Module (Độc lập & Tự trị)
│   ├── components/           # KanbanBoard, KanbanColumn, TaskCard, TaskDialog, TaskFormDialog...
│   ├── services/             # Async Services (Giả lập latency 300-500ms, localStorage cache)
│   ├── store/                # Zustand Store (Optimistic update, rollback khi sai quyền)
│   ├── constants.ts          # Jira statuses (Pending Approval, To Do, In Progress, In Review, Done)
│   ├── schemas.ts            # Zod validation schemas
│   ├── types.ts              # Data contracts & TypeScript Interfaces
│   └── mock-data.ts          # >75 tasks thực tế phân bổ 5 phòng ban
│
├── shared/                   # Dùng chung cho toàn bộ hệ thống ERP
│   ├── components/           # AppSidebar (Phân hệ ERP), Header, RoleSwitcher, UserFormDialog...
│   ├── permissions/          # can.ts (Tập trung kiểm soát RBAC & ma trận trạng thái)
│   ├── store/                # useUserStore (Quản lý phiên & thêm nhân sự), useSidebarStore
│   ├── mock/                 # 5 phòng ban (IT, Marketing, HR, Sales, Kế toán) & 20+ nhân sự
│   └── types/                # User, Department, Role, Permission
│
└── lib/                      # utils.ts (cn), date.ts (format date-fns tiếng Việt, isOverdue)
```

---

## 4. Các Tính Năng Nổi Bật Sẵn Sàng Trình Chiếu

- 📌 **Bảng Kanban chuẩn Jira**: Các cột `Pending Approval`, `To Do`, `In Progress`, `In Review`, `Done` với kéo thả mượt mà 60fps.
- 🛡️ **Kiểm soát phân quyền chặt chẽ (RBAC Engine)**: Tự động rollback và bắn Toast cảnh báo nếu nhân viên cố tình kéo task do sếp giao sang *Done*.
- 👥 **Quản lý Nhân sự & Giả lập tức thì (Role Switcher)**: Dễ dàng chuyển đổi giữa Giám đốc, Trưởng phòng và Nhân viên để sếp duyệt luồng. Thêm nhân sự mới lập tức có hiệu lực toàn hệ thống.
- 📊 **Executive Dashboard**: Tóm tắt công việc nóng trong ngày, việc trễ hạn, đề xuất chờ duyệt và biểu đồ hiệu suất tuần.
- 📑 **Sub-navigation tiện lợi**: Chuyển nhanh giữa Bảng Kanban, Báo cáo ngày và Duyệt task ngay tại đầu trang Quản lý công việc.

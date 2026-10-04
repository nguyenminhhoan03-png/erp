# Kịch Bản Trình Chiếu Demo Cho Ban Lãnh Đạo (Executive Demo Script)

Tài liệu hướng dẫn từng bước dành cho buổi trình bày và demo tính năng trước Ban Giám Đốc / Sếp. Được xây dựng nhằm làm nổi bật tính chuyên nghiệp, tư duy kiến trúc phân hệ lớn và khả năng mở rộng hệ thống ERP.

---

## 1. Thông Điệp Mở Đầu (The 1-Minute Pitch)

> *"Kính thưa Ban Giám Đốc, hôm nay em xin phép demo phân hệ Quản lý công việc & Báo cáo nội bộ phiên bản v1.0. Bản demo này được thiết kế theo kiến trúc **Modular Architecture** với chuẩn UI/UX cao cấp của Jira và Linear. Toàn bộ logic phân quyền, kéo thả mượt mà, kiểm soát chống sai luồng và dữ liệu báo cáo đã được hoàn thiện độc lập, sẵn sàng mở rộng thêm CRM, CMS và ghép nối trực tiếp vào backend Laravel mà không phải đập đi xây lại."*

---

## 2. Kịch Bản Demo Chi Tiết Theo 3 Vai Trò (Step-by-Step Walkthrough)

### PHẦN 1: TỔNG QUAN HỆ THỐNG (DASHBOARD)
1. **Truy cập hệ thống**: Mở trình duyệt tại [http://localhost:3000](http://localhost:3000) (hệ thống tự động đưa vào `/dashboard`).
2. **Điểm nhấn thuyết trình**:
   - Chỉ vào lời chào cá nhân hóa theo từng người dùng.
   - Thẻ cảnh báo **Khẩn cấp & Quá hạn** (màu đỏ rực, icon hiệu ứng pulse) ➔ Giúp sếp thấy ngay việc gì cần xử lý gấp.
   - Biểu đồ sóng tiến độ hoàn thành tuần (Recharts) so sánh với chỉ tiêu KPI cam kết.
   - Bảng **Nhiệm vụ trọng tâm cần làm hôm nay** (click vào mở ngay popup chi tiết).

---

### PHẦN 2: DEMO VAI TRÒ TRƯỞNG PHÒNG IT (Trần Minh Quân)
*Thao tác: Chọn "Trần Minh Quân" trên thanh Role Switcher góc phải Header.*

1. **Bảng công việc Jira Kanban (`/tasks`)**:
   - Giới thiệu 5 cột chuẩn Jira: `Pending Approval` ➔ `To Do` ➔ `In Progress` ➔ `In Review` ➔ `Done`.
   - **Kéo thả mượt mà**: Kéo 1 task từ *In Review* sang *Done* ➔ Hệ thống cập nhật tức thì (Optimistic update) kèm Toast nghiệm thu.
   - **Chuyển đổi góc nhìn**: Bấm nút **Danh sách (List View)** để xem dạng bảng bảng dữ liệu (Table) thích hợp cho họp giao ban.
2. **Giao việc mới cho nhân sự**:
   - Nhấn **"Tạo công việc"**.
   - Bấm nút **"Giao cho cả phòng ban"** ➔ Cho sếp thấy khả năng phân bổ task hàng loạt cho nhiều người cùng lúc.
   - *(Tùy chọn nâng cao)*: Bấm nút **"+ Thêm nhân sự"** ngay trong form để tạo nhanh nhân viên mới mà không cần thoát form.
3. **Phê duyệt đề xuất công việc (`/approvals`)**:
   - Vào mục **Duyệt công việc**: Xem danh sách các task do nhân viên tự đề xuất.
   - Bấm **Phê duyệt** (Task tự động chuyển sang cột `To Do`) hoặc **Từ chối**.
4. **Theo dõi nộp báo cáo ngày (`/daily-report`)**:
   - Chuyển sang tab **"Theo dõi Phòng ban"**: Xem trực quan danh sách nhân viên trong phòng ai đã nộp, ai chưa nộp hôm nay; bấm **"Xem báo cáo"** để kiểm tra khối lượng giờ làm và vướng mắc của cấp dưới.

---

### PHẦN 3: DEMO VAI TRÒ NHÂN VIÊN (Lê Hoàng Phúc)
*Thao tác: Đổi người dùng sang "Lê Hoàng Phúc" (Senior Frontend Dev).*

1. **Bộ lọc "Task của tôi"**:
   - Bấm nút **"Task của tôi"** trên thanh công cụ ➔ Bảng Kanban tự động lọc đúng các việc Phúc được giao.
2. **DEMO CHẶN QUY TẮC PHÂN QUYỀN (Điểm cộng lớn nhất cho tư duy Senior)**:
   - Thử kéo một task do cấp trên giao từ *In Progress* nhảy cóc sang *Done*:
   - ➔ **Hệ thống tự động từ chối & kéo task trả về vị trí cũ**, bắn Toast cảnh báo:
     > *"Bạn không thể tự đóng task do cấp trên giao. Vui lòng kéo sang 'In Review' để Trưởng phòng nghiệm thu!"*
3. **Tự đề xuất công việc**:
   - Nhấn tạo task ➔ Hệ thống tự động chuyển task vào cột **Pending Approval** (theo quy định phê duyệt nội bộ).
4. **Khai báo báo cáo ngày**:
   - Vào `/daily-report`, nhập các việc đã làm hôm nay, số giờ thực hiện, kế hoạch ngày mai và bấm **"Nộp báo cáo ngày"**.
   - Thử nộp lại lần 2 ➔ Hệ thống hiển thị cảnh báo chống nộp trùng trong cùng 1 ngày.

---

### PHẦN 4: DEMO QUẢN TRỊ NHÂN SỰ & THỐNG KÊ (Admin Nguyễn Hải Đăng)
*Thao tác: Đổi sang tài khoản Giám đốc / Admin "Nguyễn Hải Đăng".*

1. **Quản lý Nhân sự & Thành viên (`/employees`)**:
   - Xem toàn bộ danh sách hơn 20 nhân sự của 5 phòng ban.
   - Thử bấm **"Thêm nhân sự mới"**: Điền tên, chọn phòng ban, chức danh ➔ Nhân sự mới ngay lập tức xuất hiện trên sơ đồ công ty và có thể được giao việc ngay.
   - Nút **"Giả lập người này"**: 1 click chuyển tài khoản để kiểm tra phân quyền.
2. **Dashboard Thống kê & Phân tích (`/statistics`)**:
   - Trình bày biểu đồ phân bổ trạng thái task toàn công ty.
   - Biểu đồ cột so sánh khối lượng công việc giữa các phòng ban: IT, Marketing, Nhân sự, Sales, Kế toán.
   - Bảng danh sách nhân sự chưa nộp báo cáo trong ngày kèm nút nhắc nhở.

---

### PHẦN 5: DEMO MA TRẬN PHÂN QUYỀN & CRUD VAI TRÒ ĐỘNG (Điểm WOW Lãnh Đạo)
*Thao tác: Vào mục "Phân quyền & Cấu hình" hoặc mở Ma trận phân quyền.*

1. **Ma trận Phân quyền & Thu gọn thông minh**:
   - Giới thiệu ma trận RBAC kết hợp ABAC Data Scope (Toàn công ty, Phòng ban, Cá nhân).
   - Nhấn nút **"Thu gọn tất cả"** hoặc bấm icon **Chevron Down** trên từng tiêu đề phân hệ (Công việc, Báo cáo, Nhân sự...) ➔ Bảng gập lại gọn gàng, trực quan và chuyên nghiệp.
2. **CRUD Vai trò Động (Tự sinh cột theo nhu cầu thực tế)**:
   - Nhấn nút **"+ Thêm Vai Trò Mới"**:
     - Nhập: *Chủ tịch HĐQT (Chairman)* hoặc *Trưởng nhóm Kỹ thuật (Lead)*.
     - Mã: `CHAIRMAN` hoặc `LEAD`.
     - Chọn Data Scope: *Toàn công ty* hoặc *Phòng ban*.
     - Chọn sao chép quyền từ vai trò có sẵn.
   - ➔ **Cột mới xuất hiện tức thì trên Ma trận!**
   - Bật **"Cấu hình quyền (Bật/Tắt)"**: Click vào từng ô trên cột mới để cấp/thu hồi quyền trực tiếp.
3. **Phân quyền nhân sự linh hoạt (Tab 2)**:
   - Chuyển sang tab **"Gán quyền theo Nhân viên"**:
   - Chọn 1 nhân viên (VD: Dev Lê Hoàng Phúc) ➔ Dùng dropdown **Vai trò** chuyển sang `LEAD` ➔ Nhân viên ngay lập tức thừa hưởng toàn bộ quyền của Lead!
4. **Chuẩn Quy trình Jira Closed (Won't Fix / Not a Bug)**:
   - Mở một task trên Kanban, nhấn **"Đóng task (Won't Fix)"**.
   - Chọn lý do: `NOT_A_BUG` hoặc `WONT_FIX` và nhập ghi chú.
   - Task được đưa vào cột **Closed / Cancelled** độc lập với badge lý do rõ ràng, giải thích cho sếp hiểu tại sao không đưa vào `Done` để tránh làm sai lệch biểu đồ Burndown và tốc độ Sprint.

---

## 3. Câu Hỏi Dự Kiến & Cách Trả Lời Tự Tin

* **Hỏi: Hệ thống này sau này ghép với Backend Laravel thế nào?**
  * *Trả lời: "Toàn bộ giao diện hiện tại không gọi dữ liệu mock trực tiếp mà đi qua tầng Service độc lập (`taskService`, `reportService`). Đội backend chỉ cần cung cấp đúng các đầu REST API chuẩn JSON theo tài liệu `BACKEND_INTEGRATION_GUIDE.md` là có thể kết nối ngay chỉ trong 1 buổi làm việc."*

* **Hỏi: Sau này muốn thêm phân hệ CRM (Quản lý khách hàng) hay CMS thì có bị vỡ bố cục không?**
  * *Trả lời: "Dạ không, vì Sidebar đã được cấu trúc thành từng Module Group chuẩn ERP. Mỗi phân hệ (Tasks, HRM, CRM, CMS) là một module độc lập, chỉ cần bật cờ tính năng là hiển thị liền mạch trên hệ thống."*

* **Hỏi: Doanh nghiệp mình có các chức danh đặc thù như Chủ tịch, Trợ lý, Phó phòng thì hệ thống có hỗ trợ phân quyền được không?**
  * *Trả lời: "Hoàn toàn hỗ trợ ạ! Hệ thống vừa tách biệt Chức danh nhân sự (Job Title) vừa cho phép Admin bấm '+ Thêm vai trò mới' để sinh thêm cột quyền hạn động ngay trên bảng, hoặc dùng tính năng 'Đặc cách quyền cá nhân' để cấp thêm quyền cho từng người mà không làm xáo trộn cấu trúc chung."*

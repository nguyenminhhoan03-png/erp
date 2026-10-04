# Báo cáo tổng quan hệ thống quản trị công việc và nhân sự
*Tài liệu tóm tắt*

---

## 1. Vấn đề và mục tiêu

* **Thực trạng**: Việc giao việc, theo dõi tiến độ và báo cáo hằng ngày đang phân tán qua tin nhắn và email. Quản lý khó nắm bắt ai đang làm việc gì, tiến độ ra sao và tình hình báo cáo cuối ngày còn chậm trễ.
* **Mục tiêu hệ thống**:
  * Tập trung toàn bộ công việc của 5 phòng ban vào một giao diện chung.
  * Phân định rõ trách nhiệm: Nhân viên đề xuất việc phải có Trưởng phòng duyệt mới được làm; Trưởng phòng giao việc thì được chuyển thẳng vào danh sách cần làm.
  * Tự động hóa theo dõi nộp báo cáo hằng ngày và nhắc nhở nhân sự chỉ với một nút bấm.

---

## 2. Phân công trách nhiệm: Ai làm được gì?

Hệ thống thiết lập sẵn 3 nhóm vai trò cơ bản, bảo đảm an toàn dữ liệu giữa các bộ phận:

| Nhóm vai trò | Phạm vi thấy dữ liệu | Quyền hạn chính trong hệ thống |
| :--- | :--- | :--- |
| **Ban Giám Đốc** | **Toàn công ty** (Cả 5 phòng ban) | Giám sát tiến độ toàn công ty; xem toàn bộ báo cáo ngày; duyệt các đề xuất lớn; có thể tạo thêm chức danh mới (Trưởng nhóm, Phó phòng...). |
| **Trưởng phòng** | **Trong phòng ban của mình** | Giao việc cho nhân viên trong phòng; duyệt hoặc từ chối đề xuất việc của nhân viên; theo dõi và nhắc nộp báo cáo ngày của phòng mình. |
| **Nhân viên** | **Chỉ việc của cá nhân** | Nhận việc được giao; cập nhật tiến độ từng bước việc con; đề xuất việc mới (chờ Trưởng phòng duyệt); nộp báo cáo công việc cuối ngày. |

> **Bảo mật nội bộ**: Dữ liệu giữa các phòng ban (như Kế toán, Nhân sự, Kỹ thuật) được phân vùng độc lập, nhân sự phòng này không xem được nội dung riêng của phòng khác.

---

## 3. Luồng xử lý công việc chính

Mọi công việc trong công ty được theo dõi trực quan trên **bảng công việc kéo thả (Kanban)** theo 1 sơ đồ ngang gồm 6 bước rõ ràng:

```
[1. Tạo việc] ──► [2. Chờ duyệt] ──► [3. Cần làm] ──► [4. Đang làm] ──► [5. Kiểm tra] ──► [6. Hoàn tất]
(Nhập hạn chót)    (Nếu là NV đề xuất)  (Giao việc)       (Tích việc con)   (Trưởng phòng)    (Nghiệm thu / Đóng)
```

* **Bước 1 - Tạo việc**: Nhân viên hoặc Trưởng phòng nhập tiêu đề, hạn chót và chỉ định người làm.
* **Bước 2 - Chờ duyệt**: Nếu do nhân viên tự đề xuất, việc sẽ nằm ở hàng đợi chờ Trưởng phòng phê duyệt. Nếu Trưởng phòng tự tạo thì chuyển thẳng sang bước 3.
* **Bước 3 - Cần làm**: Công việc đã được giao chính thức, nhân sự nhận thông báo và chuẩn bị triển khai.
* **Bước 4 - Đang làm**: Nhân viên thực hiện và tích chọn các bước việc con ngay trên màn hình.
* **Bước 5 - Kiểm tra**: Trưởng phòng hoặc người giao việc kiểm tra chất lượng kết quả.
* **Bước 6 - Hoàn tất**: Nghiệm thu xong việc. Trường hợp việc bị trùng lặp hoặc hủy do thay đổi yêu cầu, người quản lý có thể đóng việc và lưu rõ lý do.

> *[Chèn ảnh chụp màn hình: Giao diện bảng công việc kéo thả với các cột trạng thái]*

---

## 4. Quy trình báo cáo công việc hằng ngày

Quy trình báo cáo cuối ngày được thực hiện qua 3 bước:

1. **Nhân viên nộp báo cáo**: Trước khi về, nhân sự điền 3 mục: *Việc đã làm (kèm số giờ)*, *Kế hoạch ngày mai*, và *Khó khăn cần hỗ trợ (nếu có)*.
2. **Hệ thống tổng hợp tự động**: Màn hình quản lý hiển thị ngay tỷ lệ nộp của từng phòng ban (ví dụ: 4/5 người đã nộp, 1 người chưa nộp).
3. **Nhắc nhở và xác nhận**: Trưởng phòng bấm nút *Nhắc tất cả chưa nộp* để gửi thông báo tức thì đến người quên nộp; bấm xem chi tiết từng báo cáo và xác nhận đã duyệt.

> *[Chèn ảnh chụp màn hình: Màn hình theo dõi báo cáo ngày và danh sách nhân sự đã nộp / chưa nộp]*

---

## 5. Phạm vi giai đoạn 1 và các phân hệ sau

* **Giai đoạn 1 (Đã hoàn thiện giao diện và quy trình)**:
  * Quản lý hồ sơ nhân sự phân bổ theo 5 phòng ban.
  * Bảng công việc kéo thả, hỗ trợ giao việc cho nhiều người và chia việc con.
  * Quy trình xét duyệt công việc và các trường hợp đóng việc có ghi rõ lý do.
  * Phân hệ nộp và theo dõi báo cáo công việc hằng ngày.
  * Thiết kế hoàn chỉnh 15 bảng cơ sở dữ liệu phục vụ vận hành.
* **Các phân hệ mở rộng sau**:
  * Quản lý khách hàng và hợp đồng bán hàng.
  * Kế toán nội bộ, xuất hóa đơn và tạm ứng chi phí.
  * Ứng dụng di động để nhận thông báo tức thời.

---

## 6. Các điểm cần Ban Giám Đốc quyết định

Để chuẩn bị đưa hệ thống vào áp dụng thực tế, nhóm dự án xin ý kiến chỉ đạo của Ban Giám Đốc về 3 nội dung:

1. **Thời gian chốt nộp báo cáo hằng ngày**: Đề xuất chọn mốc **17h30** hay **18h00** mỗi ngày để hệ thống tự động gửi thông báo nhắc nhở nhân sự chưa nộp?
2. **Quy định duyệt việc của Trưởng phòng**: Mọi việc do Trưởng phòng tạo ra có cần Giám đốc duyệt trước hay Trưởng phòng được tự quyết định trong phạm vi phòng ban mình?
3. **Kế hoạch triển khai dùng thử**: Đề xuất chọn **Phòng Công nghệ Thông tin** và **Phòng Marketing** dùng thử trong 2 tuần trước khi áp dụng cho toàn bộ 5 phòng ban.

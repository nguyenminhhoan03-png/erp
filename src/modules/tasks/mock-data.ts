import { fakerVI as faker } from "@faker-js/faker";
import { format, subDays, addDays } from "date-fns";
import { MOCK_USERS } from "@/shared/mock/users";
import { MOCK_DEPARTMENTS } from "@/shared/mock/departments";
import { DepartmentId } from "@/shared/types";
import { Task, TaskPriority, TaskResolution, TaskStatus, DailyReport } from "./types";

// Đặt seed cố định để dữ liệu luôn nhất quán giữa các lần refresh
faker.seed(2026);

// Danh mục đầu việc thực tế theo từng phòng ban
const REALISTIC_TASKS_BY_DEPT: Record<
  DepartmentId,
  Array<{ title: string; desc: string; priority: TaskPriority; tags: string[] }>
> = {
  it: [
    {
      title: "Thiết kế kiến trúc hệ thống xác thực SSO OAuth2 & JWT",
      desc: "Xây dựng sơ đồ phân tầng microservices cho Auth Service, tích hợp Redis cache token và chính sách phân quyền RBAC.",
      priority: "HIGH",
      tags: ["Security", "Architecture", "Backend"],
    },
    {
      title: "Tối ưu hóa Core Web Vitals và Bundle Size Next.js",
      desc: "Phân tích webpack bundle analyzer, áp dụng lazy-loading components và tối ưu hình ảnh Next/Image nhằm đạt điểm Lighthouse > 90.",
      priority: "MEDIUM",
      tags: ["Frontend", "Performance", "Next.js"],
    },
    {
      title: "Xây dựng luồng CI/CD với GitHub Actions & Kubernetes",
      desc: "Thiết lập pipeline tự động chạy unit test, build docker image và deploy staging tự động khi push vào nhánh develop.",
      priority: "HIGH",
      tags: ["DevOps", "K8s", "CI/CD"],
    },
    {
      title: "Viết test case và kiểm thử tự động e2e luồng đặt hàng",
      desc: "Sử dụng Playwright để viết bộ test tự động bao quát kịch bản thêm sản phẩm, thanh toán ví điện tử và hoàn tất hóa đơn.",
      priority: "MEDIUM",
      tags: ["QA", "Automation", "Testing"],
    },
    {
      title: "Nâng cấp cơ sở dữ liệu PostgreSQL lên v16 & thiết lập Read Replica",
      desc: "Lên kế hoạch migration zero-downtime, cấu hình streaming replication và kiểm tra failover định kỳ.",
      priority: "URGENT",
      tags: ["Database", "PostgreSQL", "Infra"],
    },
    {
      title: "Khắc phục lỗi giật lag và memory leak trên bảng Kanban",
      desc: "Kiểm tra re-render thừa của @dnd-kit và tối ưu selector trong Zustand store.",
      priority: "URGENT",
      tags: ["Bug", "Frontend", "Hotfix"],
    },
    {
      title: "Tích hợp cổng thanh toán VNPay và MoMo cho phân hệ Sale",
      desc: "Xử lý IPN callback webhook, chữ ký bảo mật SHA256 và reconciliation đối soát dữ liệu cuối ngày.",
      priority: "HIGH",
      tags: ["Payment", "Backend", "API"],
    },
    {
      title: "Khảo sát và tích hợp giải pháp cảnh báo lỗi Sentry & Grafana",
      desc: "Đẩy metric CPU, RAM, Response Time và cấu hình cảnh báo Slack bot khi có 500 error spike.",
      priority: "LOW",
      tags: ["Monitoring", "Sentry", "DevOps"],
    },
    {
      title: "Refactor API endpoint báo cáo thống kê sang Elasticsearch",
      desc: "Giảm thời gian truy vấn báo cáo tổng hợp từ 4.2s xuống dưới 300ms bằng cách đánh chỉ mục dữ liệu.",
      priority: "MEDIUM",
      tags: ["Elasticsearch", "Performance"],
    },
    {
      title: "Đánh giá an toàn thông tin và vá lỗ hổng phụ thuộc npm audit",
      desc: "Quét lỗ hổng định kỳ, cập nhật các thư viện phụ thuộc có cảnh báo CVE nghiêm trọng.",
      priority: "HIGH",
      tags: ["Security", "Compliance"],
    },
    {
      title: "Nghiên cứu áp dụng Redis Cache cho danh mục sản phẩm ERP",
      desc: "Giảm tải cho database chính trong các giờ cao điểm kinh doanh.",
      priority: "LOW",
      tags: ["Research", "Caching"],
    },
    {
      title: "Hỗ trợ nhân viên mới cấu hình môi trường lập trình Docker",
      desc: "Hướng dẫn cài đặt docker compose, kết nối database local và quy trình git flow.",
      priority: "LOW",
      tags: ["Onboarding", "Support"],
    },
  ],
  marketing: [
    {
      title: "Xây dựng kế hoạch truyền thông ra mắt tính năng ERP v2.0",
      desc: "Lên timeline bài đăng fanpage, bài PR báo chí CafeF/VnExpress và bộ email nurture gửi khách hàng VIP.",
      priority: "HIGH",
      tags: ["Campaign", "PR", "Launch"],
    },
    {
      title: "Thiết kế bộ banner và landing page cho chiến dịch Q4",
      desc: "Thiết kế banner các kích thước Facebook Ads, Google Display Network và layout trang chuyển đổi cao trên Figma.",
      priority: "HIGH",
      tags: ["Design", "Figma", "Creative"],
    },
    {
      title: "Tối ưu bộ từ khóa SEO ngành Quản trị doanh nghiệp",
      desc: "Nghiên cứu danh sách từ khóa volume cao bằng Ahrefs, lên outline 10 bài pillar content chuyên sâu.",
      priority: "MEDIUM",
      tags: ["SEO", "Content", "Organic"],
    },
    {
      title: "Chạy chiến dịch Google Ads tìm kiếm khách hàng B2B tiềm năng",
      desc: "Cài đặt từ khóa chính xác, phủ định từ khóa rác, theo dõi CPA mục tiêu dưới 250.000đ/lead.",
      priority: "URGENT",
      tags: ["Ads", "Performance", "B2B"],
    },
    {
      title: "Biên tập video giới thiệu giải pháp ERP trên Youtube & TikTok",
      desc: "Quay màn hình demo thực tế, lồng tiếng chuyên nghiệp, tạo phụ đề và thumbnail bắt mắt.",
      priority: "MEDIUM",
      tags: ["Video", "Social", "Branding"],
    },
    {
      title: "Khảo sát mức độ hài lòng khách hàng sau triển khai (CSAT)",
      desc: "Gửi biểu mẫu Google Form và phỏng vấn trực tiếp 15 doanh nghiệp tiêu biểu đang sử dụng hệ thống.",
      priority: "LOW",
      tags: ["Customer", "Research"],
    },
    {
      title: "Tổ chức hội thảo trực tuyến (Webinar): Chuyển đổi số nội bộ",
      desc: "Mời diễn giả chuyên gia, chuẩn bị slide thuyết trình, kịch bản dẫn chương trình và quà tặng minigame.",
      priority: "HIGH",
      tags: ["Event", "Webinar"],
    },
    {
      title: "Viết bài chia sẻ Case Study khách hàng Logistics thành công",
      desc: "Khai thác số liệu cải thiện năng suất 35%, phỏng vấn Giám đốc vận hành khách hàng làm tư liệu.",
      priority: "MEDIUM",
      tags: ["CaseStudy", "Content"],
    },
    {
      title: "Kiểm tra và chuẩn hóa dữ liệu pixel tracking trên hệ thống",
      desc: "Đối soát sự kiện Conversion API Meta và Google Analytics 4 để tránh mất dữ liệu đo lường.",
      priority: "HIGH",
      tags: ["Analytics", "Tracking"],
    },
    {
      title: "Gửi bản tin nội bộ (Newsletter) tháng vinh danh cá nhân xuất sắc",
      desc: "Tổng hợp hình ảnh hoạt động teambuilding, lời chúc sinh nhật và danh sách Top Sales.",
      priority: "LOW",
      tags: ["Internal", "Newsletter"],
    },
  ],
  hr: [
    {
      title: "Tuyển dụng bổ sung 03 Senior Fullstack Developer tháng này",
      desc: "Đăng tin tuyển dụng trên ITviec, TopCV, LinkedIn; lọc CV và điều phối lịch phỏng vấn vòng 1.",
      priority: "URGENT",
      tags: ["Recruiting", "IT", "Talent"],
    },
    {
      title: "Hoàn thiện bảng tính lương thưởng và BHXH kỳ tháng",
      desc: "Tổng hợp chấm công vân tay, đối chiếu ngày phép, tính thuế TNCN và gửi phiếu lương bảo mật qua email.",
      priority: "URGENT",
      tags: ["Payroll", "C&B", "Finance"],
    },
    {
      title: "Tổ chức chương trình Onboarding cho đợt thực tập sinh mới",
      desc: "Chuẩn bị bàn làm việc, thẻ nhân viên, tài khoản email và buổi đào tạo văn hóa doanh nghiệp.",
      priority: "MEDIUM",
      tags: ["Onboarding", "Culture"],
    },
    {
      title: "Xây dựng khung năng lực và tiêu chí đánh giá KPI quý mới",
      desc: "Làm việc với các trưởng phòng ban để thống nhất chỉ số đo lường hiệu quả công việc cho từng vị trí.",
      priority: "HIGH",
      tags: ["KPI", "Performance", "Management"],
    },
    {
      title: "Lên kế hoạch chương trình khám sức khỏe định kỳ cho toàn thể CBNV",
      desc: "Liên hệ 3 bệnh viện quốc tế xin báo giá gói khám tổng quát, khảo sát nguyện vọng của nhân viên.",
      priority: "MEDIUM",
      tags: ["Healthcare", "Benefit"],
    },
    {
      title: "Tổ chức buổi Workshop: Quản lý cảm xúc và cân bằng cuộc sống",
      desc: "Thuê diễn giả tâm lý học chia sẻ kỹ năng giải tỏa căng thẳng công việc cho đội ngũ nhân sự.",
      priority: "LOW",
      tags: ["Workshop", "Wellness"],
    },
    {
      title: "Rà soát hợp đồng lao động sắp hết hạn trong 30 ngày tới",
      desc: "Gửi thông báo tái ký hợp đồng không xác định thời hạn và lấy ý kiến đánh giá từ trưởng bộ phận.",
      priority: "HIGH",
      tags: ["Legal", "Contract"],
    },
    {
      title: "Cập nhật sổ tay văn hóa và nội quy lao động công ty",
      desc: "Bổ sung chính sách làm việc Hybrid (làm việc từ xa linh hoạt) và chuẩn hóa quy định trang phục.",
      priority: "LOW",
      tags: ["Policy", "Handbook"],
    },
  ],
  sales: [
    {
      title: "Đàm phán hợp đồng gói ERP doanh nghiệp với Tập đoàn Tân Á",
      desc: "Gặp gỡ ban giám đốc đối tác, giải trình phương án chi phí và các điều khoản bảo hành dịch vụ 24/7.",
      priority: "URGENT",
      tags: ["Deal", "Enterprise", "B2B"],
    },
    {
      title: "Gọi điện tư vấn và chăm sóc danh sách 40 khách hàng tiềm năng",
      desc: "Khai thác nhu cầu chuyển đổi số từ danh sách tải ebook, đặt lịch hẹn demo trực tiếp phần mềm.",
      priority: "HIGH",
      tags: ["Telesales", "Outbound"],
    },
    {
      title: "Chuẩn bị slide báo giá và demo giải pháp cho đối tác Bán lẻ",
      desc: "Tùy biến luồng quản lý kho đa điểm và bán hàng POS trên môi trường demo sát với mô hình của khách.",
      priority: "MEDIUM",
      tags: ["Demo", "Proposal"],
    },
    {
      title: "Thu hồi công nợ đến hạn của các khách hàng quý trước",
      desc: "Đối chiếu biên bản bàn giao, gửi văn bản nhắc nợ lịch sự và phối hợp với kế toán xác nhận ủy nhiệm chi.",
      priority: "HIGH",
      tags: ["Debt", "Collection"],
    },
    {
      title: "Phân tích đối thủ cạnh tranh mảng ERP vừa và nhỏ trên thị trường",
      desc: "Lập bảng so sánh tính năng, bảng giá và chiến lược khuyến mãi của Misa, Bravo, Base.",
      priority: "MEDIUM",
      tags: ["Market", "Competitor"],
    },
    {
      title: "Đào tạo kỹ năng chốt sale (Closing techniques) cho nhân viên mới",
      desc: "Thực hành tình huống xử lý từ chối giá cao và rèn luyện kỹ năng đặt câu hỏi mở.",
      priority: "MEDIUM",
      tags: ["Training", "Skill"],
    },
    {
      title: "Gặp gỡ khách hàng cũ để Upsell gói lưu trữ Cloud và AI Chatbot",
      desc: "Trình bày lợi ích tự động hóa phản hồi khách hàng giúp tiết kiệm 40% chi phí nhân sự trực page.",
      priority: "HIGH",
      tags: ["Upsell", "Account"],
    },
    {
      title: "Tổng kết doanh số tuần và phân bổ chỉ tiêu cho từng cá nhân",
      desc: "Rà soát tỷ lệ chuyển đổi sales pipeline và giải quyết các vướng mắc trong chốt hợp đồng lớn.",
      priority: "HIGH",
      tags: ["Weekly", "Report"],
    },
  ],
  accounting: [
    {
      title: "Quyết toán thuế Thu nhập Doanh nghiệp & TNCN quý vừa qua",
      desc: "Kiểm tra tờ khai thuế, đối chiếu chứng từ hóa đơn điện tử đầu vào đầu ra, nộp báo cáo đúng hạn chi cục thuế.",
      priority: "URGENT",
      tags: ["Tax", "Compliance"],
    },
    {
      title: "Đối soát dòng tiền thu chi với 3 ngân hàng thương mại",
      desc: "Kiểm tra số dư sổ phụ ngân hàng, điều chỉnh các khoản chênh lệch tỷ giá hạch toán tự động.",
      priority: "HIGH",
      tags: ["Bank", "Reconciliation"],
    },
    {
      title: "Duyệt hồ sơ đề nghị tạm ứng chi phí công tác của phòng Sales",
      desc: "Kiểm tra hóa đơn vé máy bay, định mức lưu trú khách sạn theo đúng quy chế tài chính nội bộ.",
      priority: "MEDIUM",
      tags: ["Expense", "Approval"],
    },
    {
      title: "Kiểm kê định kỳ tài sản cố định và trang thiết bị văn phòng",
      desc: "Dán mã barcode kiểm kê laptop, máy in, bàn ghế; lập biên bản hao mòn tài sản theo niên độ.",
      priority: "MEDIUM",
      tags: ["Asset", "Inventory"],
    },
    {
      title: "Lập báo cáo dự báo lưu chuyển tiền tệ (Cashflow) cho 6 tháng tới",
      desc: "Mô phỏng các kịch bản thu hồi vốn, chi phí đầu tư hạ tầng server để ban giám đốc chủ động dòng vốn.",
      priority: "HIGH",
      tags: ["Cashflow", "Forecast"],
    },
    {
      title: "Số hóa và lưu trữ chứng từ thanh toán vào hệ thống đám mây",
      desc: "Scan hóa đơn đỏ, phân loại theo mã dự án nhằm phục vụ thanh tra kiểm toán độc lập cuối năm.",
      priority: "LOW",
      tags: ["Archive", "Digital"],
    },
    {
      title: "Thanh toán tiền điện, nước, internet và phí dịch vụ tòa nhà",
      desc: "Kiểm tra chỉ số đồng hồ, lập ủy nhiệm chi chuyển khoản thanh toán cho ban quản lý tòa nhà văn phòng.",
      priority: "MEDIUM",
      tags: ["Utility", "Office"],
    },
    {
      title: "Hạch toán trích lập quỹ dự phòng nợ phải thu khó đòi",
      desc: "Căn cứ theo thông tư hướng dẫn của Bộ Tài chính, ghi nhận bút toán điều chỉnh vào chi phí quản lý.",
      priority: "LOW",
      tags: ["Audit", "Accounting"],
    },
  ],
};

// Hàm sinh Mock Tasks (75 tasks phân bổ đều phòng ban và trạng thái)
export function generateMockTasks(): Task[] {
  const tasks: Task[] = [];
  let taskIndex = 101;

  const statuses: TaskStatus[] = [
    "PENDING_APPROVAL",
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
  ];

  MOCK_DEPARTMENTS.forEach((dept) => {
    const deptUsers = MOCK_USERS.filter((u) => u.departmentId === dept.id);
    const deptManager = deptUsers.find((u) => u.role === "MANAGER") || deptUsers[0];
    const deptEmployees = deptUsers.filter((u) => u.role === "EMPLOYEE");
    const deptTemplates = REALISTIC_TASKS_BY_DEPT[dept.id] || [];

    // Tạo khoảng 14-16 task cho mỗi phòng ban
    deptTemplates.forEach((template, idx) => {
      // Phân bổ trạng thái xoay vòng chuẩn Jira
      let status: TaskStatus;
      let resolution: TaskResolution | undefined = undefined;
      let resolutionNote: string | undefined = undefined;
      let closedAt: string | undefined = undefined;
      let closedById: string | undefined = undefined;

      if (idx === 0) {
        status = "PENDING_APPROVAL"; // Có task chờ duyệt
      } else if (idx === 10) {
        // Task đóng (Cancelled / Won't Fix / Not a Bug) chuẩn Jira
        status = "CANCELLED";
        if (dept.id === "it") {
          resolution = "NOT_A_BUG";
          resolutionNote = "Tính năng hoạt động đúng theo tài liệu đặc tả SRS v1.2, user lọc sai điều kiện dữ liệu.";
        } else if (dept.id === "marketing") {
          resolution = "WONT_FIX";
          resolutionNote = "Kế hoạch quý này ưu tiên kênh TikTok & Shopee, quyết định dừng triển khai kênh này.";
        } else if (dept.id === "sales") {
          resolution = "DUPLICATE";
          resolutionNote = "Trùng lặp với yêu cầu chăm sóc khách hàng doanh nghiệp lớn ERP-103.";
        } else {
          resolution = "CANNOT_REPRODUCE";
          resolutionNote = "Đã kiểm thử lại 3 lần trên môi trường Staging nhưng không xuất hiện lỗi.";
        }
        closedAt = subDays(new Date(), 2).toISOString();
        closedById = deptManager.id;
      } else if (idx % 4 === 1) {
        status = "TODO";
      } else if (idx % 4 === 2) {
        status = "IN_PROGRESS";
      } else if (idx % 4 === 3) {
        status = "IN_REVIEW";
      } else {
        status = "DONE";
        resolution = "DONE";
        closedAt = subDays(new Date(), idx * 2).toISOString();
        closedById = deptManager.id;
      }

      // Phân bổ người giao và người nhận
      let creatorId = deptManager.id;
      let assigneeIds: string[] = [];

      if (status === "PENDING_APPROVAL") {
        // Task chờ duyệt: do nhân viên tự tạo
        const emp = deptEmployees[idx % deptEmployees.length] || deptUsers[0];
        creatorId = emp.id;
        assigneeIds = [emp.id];
      } else if (idx === deptTemplates.length - 1) {
        // Cố tình có 1 task chưa gán ai (Unassigned)
        assigneeIds = [];
      } else {
        // Task thông thường do Manager giao cho 1 hoặc 2 nhân viên
        const emp1 = deptEmployees[idx % deptEmployees.length];
        if (emp1) assigneeIds.push(emp1.id);
        if (idx % 3 === 0 && deptEmployees.length > 1) {
          const emp2 = deptEmployees[(idx + 1) % deptEmployees.length];
          if (emp2 && emp2.id !== emp1?.id) assigneeIds.push(emp2.id);
        }
      }

      // Deadline: Có task quá hạn, có task hôm nay, có task tương lai
      let dueDate: Date;
      if (idx === 1 && status !== "DONE") {
        // Cố tình có task trễ hạn quá khứ 3 ngày
        dueDate = subDays(new Date(), 3);
      } else if (idx === 2) {
        // Hạn chót hôm nay
        dueDate = new Date();
      } else if (status === "DONE" || status === "CANCELLED") {
        dueDate = subDays(new Date(), idx * 2);
      } else {
        dueDate = addDays(new Date(), (idx % 7) + 2);
      }

      // Checklist mẫu
      const checklist = [
        {
          id: `chk-${taskIndex}-1`,
          title: "Khảo sát và thu thập yêu cầu chi tiết",
          isCompleted: status !== "PENDING_APPROVAL" && status !== "TODO",
        },
        {
          id: `chk-${taskIndex}-2`,
          title: "Triển khai thực hiện theo kế hoạch",
          isCompleted: status === "IN_REVIEW" || status === "DONE",
        },
        {
          id: `chk-${taskIndex}-3`,
          title: "Nghiệm thu chất lượng và đóng tài liệu",
          isCompleted: status === "DONE",
        },
      ];

      tasks.push({
        id: `task-${taskIndex}`,
        code: `ERP-${taskIndex}`,
        title: template.title,
        description: template.desc,
        status,
        priority: template.priority,
        departmentId: dept.id,
        creatorId,
        assigneeIds,
        dueDate: dueDate.toISOString(),
        startDate: subDays(dueDate, 5).toISOString(),
        checklist,
        commentsCount: (idx % 4) + 1,
        tags: template.tags,
        requiresApproval: status === "PENDING_APPROVAL",
        isApproved: status !== "PENDING_APPROVAL",
        resolution,
        resolutionNote,
        closedAt,
        closedById,
        createdAt: subDays(new Date(), 10).toISOString(),
        updatedAt: subDays(new Date(), 1).toISOString(),
      });

      taskIndex++;
    });
  });

  return tasks;
}

// Hàm sinh Mock Daily Reports (14 ngày gần nhất)
export function generateMockDailyReports(): DailyReport[] {
  const reports: DailyReport[] = [];
  let reportIndex = 1;

  // Lấy danh sách 14 ngày qua
  const pastDays = Array.from({ length: 14 }).map((_, i) =>
    format(subDays(new Date(), i), "yyyy-MM-dd")
  );

  pastDays.forEach((dateStr, dayIdx) => {
    MOCK_USERS.filter((u) => u.role !== "ADMIN").forEach((user, userIdx) => {
      // Cố tình để một số nhân viên chưa nộp trong 2 ngày gần nhất
      const isMissingToday =
        dayIdx === 0 && (userIdx === 1 || userIdx === 4 || userIdx === 7);
      const isMissingYesterday = dayIdx === 1 && userIdx === 3;

      if (isMissingToday || isMissingYesterday) {
        return; // Chưa nộp báo cáo
      }

      const status = dayIdx === 0 && userIdx % 2 === 0 ? "DRAFT" : "SUBMITTED";

      reports.push({
        id: `report-${reportIndex++}`,
        userId: user.id,
        departmentId: user.departmentId,
        date: dateStr,
        status,
        todayWorks: [
          {
            id: `item-${reportIndex}-1`,
            taskTitle: `Triển khai công việc định kỳ phòng ${user.departmentId.toUpperCase()}`,
            hoursSpent: 4.5,
            status: "IN_PROGRESS",
            note: "Đã hoàn thành 80% khối lượng dự kiến",
          },
          {
            id: `item-${reportIndex}-2`,
            taskTitle: "Họp giao ban nội bộ và giải quyết các vướng mắc kỹ thuật",
            hoursSpent: 2.0,
            status: "COMPLETED",
            note: "Thống nhất phương án điều phối tài nguyên",
          },
          {
            id: `item-${reportIndex}-3`,
            taskTitle: "Hỗ trợ thành viên mới và xử lý email phát sinh",
            hoursSpent: 1.5,
            status: "COMPLETED",
          },
        ],
        tomorrowPlans:
          "- Tiếp tục nghiệm thu các hạng mục bàn giao.\n- Hoàn thiện tài liệu hướng dẫn sử dụng.\n- Tham gia buổi họp sprint review lúc 14:00.",
        blockers:
          userIdx % 5 === 0
            ? "Đang chờ tài liệu API từ đối tác để kiểm thử tích hợp."
            : undefined,
        submittedAt:
          status === "SUBMITTED"
            ? `${dateStr}T17:30:00.000Z`
            : undefined,
        createdAt: `${dateStr}T09:00:00.000Z`,
        updatedAt: `${dateStr}T17:30:00.000Z`,
      });
    });
  });

  return reports;
}

export const INITIAL_MOCK_TASKS = generateMockTasks();
export const INITIAL_MOCK_REPORTS = generateMockDailyReports();

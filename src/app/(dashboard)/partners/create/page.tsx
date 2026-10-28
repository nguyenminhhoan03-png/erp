"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  UserCheck,
  CheckCircle2,
  FolderKanban,
  Plus,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { partnerService } from "@/modules/partners/services/partnerService";
import { MOCK_PARTNER_OPTIONS } from "@/modules/partners/mockData";
import { PartnerType, PartnerStatus } from "@/modules/partners/types";
import { UserSingleSelect } from "@/modules/tasks/components/form/UserSingleSelect";
import { User } from "@/shared/types";

export default function CreatePartnerPage() {
  const router = useRouter();

  const [partnerType, setPartnerType] = React.useState<PartnerType>("customer");
  const [organizationType, setOrganizationType] = React.useState<"individual" | "organization">("organization");
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<PartnerStatus>("new_contact");
  const [projectOptions, setProjectOptions] = React.useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(true);
  const [customProjectInput, setCustomProjectInput] = React.useState("");
  const [showAddCustom, setShowAddCustom] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [contactName, setContactName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [contactPosition, setContactPosition] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh không được vượt quá 5MB!");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [assignedUserId, setAssignedUserId] = React.useState<string>("none");

  const [salesUsers, setSalesUsers] = React.useState(MOCK_PARTNER_OPTIONS.salesUsers);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userOptions: User[] = React.useMemo(() => {
    return salesUsers.map((u) => ({
      id: String(u.id),
      name: u.name,
      email: u.email || "",
      avatar: u.avatar || "",
      title: u.position || "",
      role: "EMPLOYEE",
      departmentId: "sales",
    }));
  }, [salesUsers]);

  React.useEffect(() => {
    partnerService.getOptions()
      .then((res) => {
        if (res.data?.salesUsers && res.data.salesUsers.length > 0) {
          setSalesUsers(res.data.salesUsers);
        }
        if (res.data?.projects && res.data.projects.length > 0) {
          const apiProjects = res.data.projects.map((p) => p.name);
          setProjectOptions(apiProjects);
          if (apiProjects.length > 0) {
            setSelectedProjects([apiProjects[0]]);
          }
        } else if (res.data?.services && res.data.services.length > 0) {
          setProjectOptions(res.data.services);
          if (res.data.services.length > 0) {
            setSelectedProjects([res.data.services[0]]);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingProjects(false);
      });
  }, []);

  const toggleProject = (project: string) => {
    setSelectedProjects((prev) =>
      prev.includes(project) ? prev.filter((p) => p !== project) : [...prev, project]
    );
  };

  const handleAddCustomProject = () => {
    const trimmed = customProjectInput.trim();
    if (!trimmed) return;
    if (!projectOptions.includes(trimmed)) {
      setProjectOptions((prev) => [...prev, trimmed]);
    }
    if (!selectedProjects.includes(trimmed)) {
      setSelectedProjects((prev) => [...prev, trimmed]);
    }
    setCustomProjectInput("");
    setShowAddCustom(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng hoặc tên đối tác");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.trim();
      const cleanEmail = email.trim();
      const resolvedContactName = contactName.trim() || (organizationType === "individual" ? name.trim() : "");

      await partnerService.createPartner({
        name: name.trim(),
        partner_type: partnerType,
        organization_type: organizationType,
        status,
        source: "cms_manual",
        services: selectedProjects,
        assigned_user_id: assignedUserId === "none" ? null : assignedUserId,
        phone_number: cleanPhone || undefined,
        email: cleanEmail || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        contact_name: resolvedContactName || undefined,
        contact_phone: cleanPhone || undefined,
        contact_email: cleanEmail || undefined,
        contact_position: contactPosition.trim() || undefined,
        avatar_file: avatarFile || undefined,
      });

      toast.success("Thêm mới khách hàng / đối tác thành công");
      router.push("/partners");
    } catch {
      toast.error("Có lỗi xảy ra khi tạo mới, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/partners"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Khách hàng & Đối tác
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Tạo mới</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Thêm mới Khách hàng / Đối tác
          </h1>
          <p className="text-xs text-muted-foreground">
            Nhập thông tin cơ bản của đơn vị và người liên hệ trực tiếp
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/partners")}
            className="text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Building2 className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm text-foreground">
                  Thông tin khách hàng / đối tác
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Tên công ty / Khách hàng <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ví dụ: Công ty Cổ phần Vpick Logistics hoặc Anh Tuấn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Phân loại
                    </label>
                    <Select
                      value={partnerType}
                      onValueChange={(val: PartnerType) => setPartnerType(val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="customer">Khách hàng</SelectItem>
                        <SelectItem value="partner">Đối tác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Hình thức
                    </label>
                    <Select
                      value={organizationType}
                      onValueChange={(val: "individual" | "organization") => setOrganizationType(val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="organization">Doanh nghiệp / Tổ chức</SelectItem>
                        <SelectItem value="individual">Cá nhân</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Trạng thái
                    </label>
                    <Select
                      value={status}
                      onValueChange={(val: PartnerStatus) => setStatus(val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="new_contact">Mới liên hệ</SelectItem>
                        <SelectItem value="official">Chính thức</SelectItem>
                        <SelectItem value="vip">Thân thiết / VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-primary" />
                      Dự án quan tâm / triển khai
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(!showAddCustom)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Thêm dự án khác
                    </button>
                  </div>

                  {showAddCustom && (
                    <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-md border border-border/80">
                      <Input
                        placeholder="Nhập tên dự án hoặc dịch vụ mới..."
                        value={customProjectInput}
                        onChange={(e) => setCustomProjectInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomProject();
                          }
                        }}
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomProject}
                        className="h-8 text-xs shrink-0"
                      >
                        Thêm
                      </Button>
                    </div>
                  )}

                  {isLoadingProjects ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <div className="animate-spin w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full" />
                      <span>Đang tải danh sách dự án từ hệ thống...</span>
                    </div>
                  ) : projectOptions.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-1">
                      Chưa có dự án nào trong hệ thống
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {projectOptions.map((proj) => {
                        const selected = selectedProjects.includes(proj);
                        return (
                          <button
                            key={proj}
                            type="button"
                            onClick={() => toggleProject(proj)}
                            className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors cursor-pointer ${
                              selected
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {proj}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-foreground">
                    Địa chỉ
                  </label>
                  <Input
                    placeholder="Địa chỉ trụ sở hoặc văn phòng làm việc"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Ghi chú
                  </label>
                  <Textarea
                    placeholder="Ghi chú thêm về khách hàng hoặc nhu cầu trao đổi ban đầu..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <UserCheck className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm text-foreground">
                  Người liên hệ & Nguồn tiếp nhận
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Họ và tên người liên hệ
                  </label>
                  <Input
                    placeholder="Ví dụ: Trần Anh Tuấn"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Số điện thoại liên hệ
                  </label>
                  <Input
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="tuan.ta@vpick.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Chức vụ
                    </label>
                    <Input
                      placeholder="Giám đốc, Quản lý..."
                      value={contactPosition}
                      onChange={(e) => setContactPosition(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Ảnh đại diện / Ảnh chat gợi nhớ
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />

                  {avatarPreview ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/80 bg-muted/30">
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-12 h-12 rounded-md object-cover border border-border shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-foreground truncate">
                          {avatarFile?.name || "Ảnh đại diện"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {avatarFile ? `${(avatarFile.size / 1024).toFixed(0)} KB` : "Ảnh đã chọn"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 text-[11px] px-2.5"
                        >
                          Đổi ảnh
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveAvatar}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="text-primary font-medium">Bấm để chọn tệp ảnh</span> từ máy tính (PNG, JPG, WEBP)
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Nhân viên phụ trách
                    </label>
                    <UserSingleSelect
                      value={assignedUserId === "none" ? "" : assignedUserId}
                      onChange={(val) => setAssignedUserId(val || "none")}
                      users={userOptions.length > 0 ? userOptions : undefined}
                      placeholder="Chọn nhân sự phụ trách..."
                      searchPlaceholder="Tìm theo tên, chức vụ..."
                      allowClear
                      clearLabel="Chưa phân bổ"
                      triggerClassName="h-9 text-xs"
                      popoverClassName="w-80"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/partners")}
            className="text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="text-xs gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </div>
      </form>
    </div>
  );
}

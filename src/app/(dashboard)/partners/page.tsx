"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Partner,
  PartnerStatus,
  PartnerOptionsData,
} from "@/modules/partners/types";
import { partnerService } from "@/modules/partners/services/partnerService";
import { INITIAL_PARTNERS_MOCK, MOCK_PARTNER_OPTIONS } from "@/modules/partners/mockData";
import { PartnerTable } from "@/modules/partners/components/PartnerTable";
import { CustomerCareLogDialog } from "@/modules/partners/components/CustomerCareLogDialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Plus,
  Search,
  RotateCcw,
  Trash2,
} from "lucide-react";

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [options, setOptions] = React.useState<PartnerOptionsData>(MOCK_PARTNER_OPTIONS);
  const [isLoading, setIsLoading] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [serviceFilter, setServiceFilter] = React.useState<string>("all");

  const [isCareLogDialogOpen, setIsCareLogDialogOpen] = React.useState(false);
  const [careLogPartner, setCareLogPartner] = React.useState<Partner | null>(null);

  const [partnerToDelete, setPartnerToDelete] = React.useState<Partner | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [partnersRes, optionsRes] = await Promise.allSettled([
        partnerService.getPartners({
          search: search || undefined,
          type: typeFilter,
          status: statusFilter,
          service: serviceFilter,
        }),
        partnerService.getOptions(),
      ]);

      if (partnersRes.status === "fulfilled" && partnersRes.value?.data) {
        setPartners(partnersRes.value.data);
      }

      if (optionsRes.status === "fulfilled" && optionsRes.value?.data) {
        setOptions(optionsRes.value.data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, statusFilter, serviceFilter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPartners = React.useMemo(() => {
    return partners.filter((p) => {
      if (typeFilter !== "all" && p.partnerType !== typeFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (serviceFilter !== "all" && !p.services?.includes(serviceFilter)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchPhone = p.phone?.toLowerCase().includes(q);
        const matchEmail = p.email?.toLowerCase().includes(q);
        const matchContact = p.contacts?.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        );
        if (!matchName && !matchCode && !matchPhone && !matchEmail && !matchContact) {
          return false;
        }
      }

      return true;
    });
  }, [partners, typeFilter, statusFilter, serviceFilter, search]);

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setServiceFilter("all");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    serviceFilter !== "all";

  const handleOpenCreate = () => {
    router.push("/partners/create");
  };

  const handleViewDetail = (partner: Partner) => {
    router.push(`/partners/${partner.id}`);
  };

  const handleOpenEdit = (partner: Partner) => {
    router.push(`/partners/${partner.id}`);
  };

  const handleAddContact = (partner: Partner) => {
    router.push(`/partners/${partner.id}`);
  };

  const handleAddCareLog = (partner: Partner) => {
    setCareLogPartner(partner);
    setIsCareLogDialogOpen(true);
  };

  const handleUpdateStatus = async (partnerId: string, status: PartnerStatus) => {
    try {
      await partnerService.updateStatus(partnerId, status);
    } catch {
    }
    setPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, status } : p))
    );
    toast.success("Đã cập nhật trạng thái");
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    try {
      await partnerService.deletePartner(partnerToDelete.id);
    } catch {
    }
    setPartners((prev) => prev.filter((p) => p.id !== partnerToDelete.id));
    toast.success("Đã xóa hồ sơ thành công");
    setPartnerToDelete(null);
  };

  return (
    <div className="w-full space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>Quản lý tổ chức</span>
            <span>/</span>
            <span className="text-foreground font-medium">Khách hàng & Đối tác</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Danh sách khách hàng & đối tác
          </h1>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-1.5 font-medium text-xs h-9 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm mới
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <Tabs
          value={typeFilter}
          onValueChange={setTypeFilter}
          className="w-full lg:w-auto"
        >
          <TabsList className="h-9 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs px-3">
              Tất cả ({partners.length})
            </TabsTrigger>
            <TabsTrigger value="customer" className="text-xs px-3">
              Khách hàng ({partners.filter((p) => p.partnerType === "customer").length})
            </TabsTrigger>
            <TabsTrigger value="partner" className="text-xs px-3">
              Đối tác ({partners.filter((p) => p.partnerType === "partner").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên, mã, số ĐT, email, người liên hệ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background/80"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background/80">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="new_contact">Mới liên hệ</SelectItem>
              <SelectItem value="official">Chính thức</SelectItem>
              <SelectItem value="vip">Thân thiết / VIP</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-background/80">
              <SelectValue placeholder="Dịch vụ" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Tất cả dịch vụ</SelectItem>
              {options.services.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              title="Xóa toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      <PartnerTable
        partners={filteredPartners}
        isLoading={isLoading}
        onViewDetail={handleViewDetail}
        onEditPartner={handleOpenEdit}
        onDeletePartner={(partner) => setPartnerToDelete(partner)}
        onAddContact={handleAddContact}
        onAddCareLog={handleAddCareLog}
        onUpdateStatus={handleUpdateStatus}
      />

      {careLogPartner && (
        <CustomerCareLogDialog
          open={isCareLogDialogOpen}
          onOpenChange={setIsCareLogDialogOpen}
          partnerId={careLogPartner.id}
          partnerName={careLogPartner.name}
          contacts={careLogPartner.contacts}
          availableServices={options.services}
          currentStatus={careLogPartner.status}
          onSuccess={() => {
            setIsCareLogDialogOpen(false);
            loadData();
            toast.success("Ghi nhận tương tác chăm sóc khách hàng thành công");
          }}
        />
      )}

      <Dialog open={!!partnerToDelete} onOpenChange={(open) => !open && setPartnerToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Xác nhận xóa hồ sơ
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Bạn có chắc chắn muốn xóa hồ sơ{" "}
              <strong className="text-foreground">{partnerToDelete?.name}</strong> ({partnerToDelete?.code})? Toàn bộ danh bạ liên hệ và lịch sử chăm sóc liên quan sẽ bị loại bỏ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPartnerToDelete(null)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeletePartner}
              className="text-xs"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

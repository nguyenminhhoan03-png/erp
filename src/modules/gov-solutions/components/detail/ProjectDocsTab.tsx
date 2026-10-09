"use client";

import * as React from "react";
import { GovDocument } from "../../types";
import { DOCUMENT_TYPE_LABELS } from "../../constants";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectDocsTabProps {
  docs: GovDocument[];
  onOpenDocDialog: () => void;
  onDeleteDoc: (docId: string) => Promise<boolean | void>;
}

export function ProjectDocsTab({ docs, onOpenDocDialog, onDeleteDoc }: ProjectDocsTabProps) {
  const handleDelete = async (docId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      await onDeleteDoc(docId);
      toast.info("Đã xóa tài liệu khỏi hồ sơ");
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Hồ sơ & Tài liệu Dự án
          </h4>
          <p className="text-xs text-muted-foreground">
            Bảng riêng lưu trữ file công văn, biên bản ghi nhớ MOU, logo và dữ liệu địa điểm du lịch
          </p>
        </div>
        <Button
          size="sm"
          onClick={onOpenDocDialog}
          className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tải lên tài liệu</span>
        </Button>
      </div>

      <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-2.5 px-3">Tên tài liệu</th>
              <th className="py-2.5 px-3">Phân loại</th>
              <th className="py-2.5 px-3">Tệp / Link</th>
              <th className="py-2.5 px-3">Ghi chú</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có tài liệu nào trong hồ sơ tỉnh này. Bấm "+ Tải lên tài liệu" để thêm.
                </td>
              </tr>
            ) : (
              docs.map((doc: GovDocument) => (
                <tr key={doc.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    {doc.title}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[10px]">
                      {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.type}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <a
                      href={doc.fileUrlOrLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[150px]">{doc.fileName || doc.fileUrlOrLink}</span>
                    </a>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate">
                    {doc.note || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

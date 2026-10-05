"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useGovStore } from "../store/govStore";
import { DOCUMENT_TYPE_LABELS } from "../constants";
import { GovDocument } from "../types";
import { toast } from "sonner";
import { FileUp, Link2 } from "lucide-react";

export interface GovDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  provinceName: string;
}
export type DltmDocumentDialogProps = GovDocumentDialogProps;

export function GovDocumentDialog({
  open,
  onOpenChange,
  projectId,
  provinceName,
}: GovDocumentDialogProps) {
  const { addDocument } = useGovStore();

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<GovDocument["type"]>("CONG_VAN_DI");
  const [fileUrlOrLink, setFileUrlOrLink] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [fileSize, setFileSize] = React.useState("1.5 MB");
  const [note, setNote] = React.useState("");

  const formatFileSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên tài liệu");
      return;
    }

    addDocument({
      projectId,
      title: title.trim(),
      type,
      fileUrlOrLink: fileUrlOrLink.trim() || "https://drive.google.com/dltm-assets",
      fileName: fileName.trim() || `${title.replace(/\s+/g, "_")}.pdf`,
      fileSize: fileSize.trim() || "1.2 MB",
      note: note.trim(),
      uploadedBy: "Lê Văn Cường (Trưởng phòng IT)",
    });

    toast.success("Đã lưu tài liệu thành công!", {
      description: `Tài liệu "${title}" đã được thêm vào hồ sơ dự án ${provinceName}.`,
    });

    setTitle("");
    setFileUrlOrLink("");
    setFileName("");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            <span>Thêm Tài liệu Dự án - {provinceName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Tên tài liệu */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Tên tài liệu <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: Biên bản ghi nhớ hợp tác MOU (Bản scan có dấu)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          {/* Loại tài liệu */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Phân loại tài liệu</label>
            <Select value={type} onValueChange={(val) => setType(val as GovDocument["type"])}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Chọn phân loại" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File đính kèm */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <FileUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span>File đính kèm (hoặc nhập link bên dưới)</span>
            </label>
            <Input
              type="file"
              onChange={handleFilePick}
              className="text-xs h-9 file:mr-3 file:text-xs file:font-semibold"
            />
          </div>

          {/* Đường dẫn / File link */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Link lưu trữ (Google Drive / S3 / File đính kèm)</span>
            </label>
            <Input
              placeholder="https://drive.google.com/file/d/..."
              value={fileUrlOrLink}
              onChange={(e) => setFileUrlOrLink(e.target.value)}
              className="text-xs h-9 font-mono"
            />
          </div>

          {/* Tên file & Dung lượng */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Tên tệp gốc</label>
              <Input
                placeholder="tailieu.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Dung lượng ước tính</label>
              <Input
                placeholder="2.4 MB"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Ghi chú tài liệu</label>
            <Textarea
              placeholder="Ghi chú chi tiết về tài liệu, số hiệu văn bản hoặc các lưu ý..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" className="text-xs font-semibold">
              Lưu tài liệu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DltmDocumentDialog = GovDocumentDialog;


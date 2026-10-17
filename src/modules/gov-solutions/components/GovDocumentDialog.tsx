"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useGovStore } from "../store/govStore";
import { GOV_DOCUMENT_TYPES, OUTSOURCE_DOCUMENT_TYPES, INTERNAL_DOCUMENT_TYPES } from "../constants";
import { GovDocument } from "../types";
import { toast } from "sonner";
import { FileUp, Link2, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GovDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  provinceName: string;
  category?: "GOV" | "OUTSOURCE" | "INTERNAL" | string;
}
export type DltmDocumentDialogProps = GovDocumentDialogProps;

export function GovDocumentDialog({
  open,
  onOpenChange,
  projectId,
  provinceName,
  category = "GOV",
}: GovDocumentDialogProps) {
  const { addDocument } = useGovStore();

  const docTypeOptions = React.useMemo(() => {
    if (category === "OUTSOURCE") return OUTSOURCE_DOCUMENT_TYPES;
    if (category === "INTERNAL") return INTERNAL_DOCUMENT_TYPES;
    return GOV_DOCUMENT_TYPES;
  }, [category]);

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<GovDocument["type"]>(docTypeOptions[0]?.value || "OTHER");
  const [uploadMode, setUploadMode] = React.useState<"file" | "link">("file");
  const [fileUrlOrLink, setFileUrlOrLink] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (!docTypeOptions.some((opt) => opt.value === type)) {
        setType(docTypeOptions[0]?.value || "OTHER");
      }
    }
  }, [open, docTypeOptions]);

  const formatFileSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên tài liệu");
      return;
    }

    if (uploadMode === "file" && !selectedFile) {
      toast.error("Vui lòng chọn tệp từ máy tính để tải lên");
      return;
    }

    if (uploadMode === "link" && !fileUrlOrLink.trim()) {
      toast.error("Vui lòng nhập đường dẫn liên kết tài liệu");
      return;
    }

    setIsUploading(true);
    try {
      let ok = false;
      if (uploadMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("gov_project_id", projectId);
        formData.append("projectId", projectId);
        formData.append("title", title.trim());
        formData.append("type", type);
        if (note.trim()) formData.append("note", note.trim());

        ok = await addDocument(formData);
      } else {
        ok = await addDocument({
          projectId,
          title: title.trim(),
          type,
          fileUrlOrLink: fileUrlOrLink.trim(),
          fileName: fileName.trim() || undefined,
          note: note.trim() || undefined,
          uploadedBy: "IGB Representative",
        });
      }

      if (ok) {
        toast.success(
          uploadMode === "file"
            ? "Đã lưu tài liệu vào storage baocaocongviec thành công!"
            : "Đã lưu liên kết tài liệu thành công!"
        );
        setTitle("");
        setFileUrlOrLink("");
        setFileName("");
        setSelectedFile(null);
        setNote("");
        onOpenChange(false);
      } else {
        toast.error("Không thể lưu tài liệu, vui lòng thử lại");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi lưu tài liệu");
    } finally {
      setIsUploading(false);
    }
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Phân loại tài liệu</label>
            <Select value={type} onValueChange={(val) => setType(val as GovDocument["type"])}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Chọn phân loại" />
              </SelectTrigger>
              <SelectContent>
                {docTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  uploadMode === "file"
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileUp className="h-3.5 w-3.5" />
                <span>Tải tệp từ máy tính</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("link")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  uploadMode === "link"
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Dán Link Google Drive</span>
              </button>
            </div>

            {uploadMode === "file" ? (
              <div className="space-y-1.5">
                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all group">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                      <FileUp className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      Bấm để chọn tệp từ máy tính
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      PDF, Word, Excel, Ảnh... (Lưu trực tiếp vào Storage baocaocongviec)
                    </span>
                    <input
                      type="file"
                      onChange={handleFilePick}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatFileSize(selectedFile.size)} • Sẵn sàng lưu vào storage
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <label className="text-[11px] font-medium text-primary hover:underline cursor-pointer px-2 py-1">
                        Đổi tệp
                        <input
                          type="file"
                          onChange={handleFilePick}
                          className="hidden"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setFileName("");
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Xóa tệp đã chọn"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    <span>Link tài liệu</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="https://drive.google.com/file/d/... hoặc https://..."
                    value={fileUrlOrLink}
                    onChange={(e) => setFileUrlOrLink(e.target.value)}
                    className="text-xs h-9 font-mono"
                    required={uploadMode === "link"}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Tên tệp hiển thị (Tùy chọn)
                  </label>
                  <Input
                    placeholder="VD: Van-ban-MOU-scan.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

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
              disabled={isUploading}
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={isUploading} className="text-xs font-semibold cursor-pointer">
              {isUploading
                ? "Đang lưu..."
                : uploadMode === "file"
                ? "Lưu file vào Storage"
                : "Lưu liên kết"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DltmDocumentDialog = GovDocumentDialog;

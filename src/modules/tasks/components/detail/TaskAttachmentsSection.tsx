"use client";

import * as React from "react";
import {
  ChevronDown,
  Plus,
  MoreHorizontal,
  Search,
  Download,
  Trash2,
  Eye,
  Copy,
  UploadCloud,
  Loader2,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileCode,
  FileArchive,
  File,
  ArrowDown,
  ArrowUp,
  ExternalLink,
} from "lucide-react";
import { Task, TaskAttachment } from "../../types";
import { useTaskStore } from "../../store/taskStore";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskAttachmentsSectionProps {
  task: Task;
}

type TabType = "all" | "images" | "documents" | "videos" | "other";

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${parseFloat(kb.toFixed(kb < 10 ? 1 : 0))} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${parseFloat(mb.toFixed(1))} MB`;
}

function formatAttachmentDate(dateStr?: string): string {
  if (!dateStr) return "Oct 13, 2026";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getFileCategory(fileName: string, mime?: string): TabType {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext) || mime?.startsWith("image/")) {
    return "images";
  }
  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf"].includes(ext) ||
    mime?.startsWith("application/pdf") ||
    mime?.includes("spreadsheet") ||
    mime?.includes("wordprocessing")
  ) {
    return "documents";
  }
  if (["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"].includes(ext) || mime?.startsWith("video/")) {
    return "videos";
  }
  return "other";
}

function renderFileThumbnail(att: TaskAttachment) {
  const ext = att.fileName.split(".").pop()?.toLowerCase() || "";
  const isImg = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext) || att.fileType?.startsWith("image/");
  const isSvg = ext === "svg" || att.fileType?.includes("svg");

  if (isSvg) {
    return (
      <div className="w-7 h-7 rounded-full border-2 border-sky-500/80 bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
      </div>
    );
  }

  if (isImg && att.fileUrl) {
    return (
      <div className="w-7 h-7 rounded-md overflow-hidden bg-muted shrink-0 border border-border/70 flex items-center justify-center">
        <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (isImg) {
    return <FileImage className="h-6 w-6 text-sky-500 shrink-0" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />;
  }
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext) || att.fileType?.startsWith("video/")) {
    return <FileVideo className="h-6 w-6 text-purple-500 shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="h-6 w-6 text-amber-500 shrink-0" />;
  }
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "php"].includes(ext)) {
    return <FileCode className="h-6 w-6 text-indigo-500 shrink-0" />;
  }
  if (["pdf", "doc", "docx", "txt"].includes(ext)) {
    return <FileText className="h-6 w-6 text-rose-500 shrink-0" />;
  }
  return <File className="h-6 w-6 text-slate-500 shrink-0" />;
}

export function TaskAttachmentsSection({ task }: TaskAttachmentsSectionProps) {
  const { uploadAttachments, deleteAttachment } = useTaskStore();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TabType>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortDirection, setSortDirection] = React.useState<"desc" | "asc">("desc");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const rawAttachments: TaskAttachment[] = React.useMemo(() => {
    return task.attachments || [];
  }, [task.attachments]);

  const filteredAttachments = React.useMemo(() => {
    let list = [...rawAttachments];

    if (activeTab !== "all") {
      list = list.filter((att) => getFileCategory(att.fileName, att.fileType) === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (att) => att.fileName.toLowerCase().includes(q) || att.title?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [rawAttachments, activeTab, searchQuery, sortDirection]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    try {
      await uploadAttachments(task.id, fileArray);
      toast.success(`Đã thêm ${fileArray.length} tệp đính kèm thành công!`);
    } catch {
      toast.error("Lỗi khi tải lên tệp đính kèm.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardFiles = e.clipboardData?.files;
      if (clipboardFiles && clipboardFiles.length > 0) {
        e.preventDefault();
        handleUploadFiles(clipboardFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [task.id]);

  const handleDelete = async (attId: string, attName: string) => {
    try {
      await deleteAttachment(task.id, attId);
      toast.success(`Đã xóa tệp: ${attName}`);
    } catch {
      toast.error("Không thể xóa tệp đính kèm.");
    }
  };

  const handleCopyLink = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép liên kết tệp");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim().startsWith("http")) {
      e.preventDefault();
      const linkUrl = searchQuery.trim();
      const fileName = linkUrl.split("/").pop() || "link-attachment";
      const blob = new Blob([""], { type: "text/plain" });
      const fakeFile = Object.assign(blob, {
        name: fileName,
        lastModified: Date.now(),
        webkitRelativePath: "",
      }) as unknown as File;
      uploadAttachments(task.id, [fakeFile]);
      setSearchQuery("");
      toast.success("Đã lưu liên kết tài liệu");
    }
  };

  const toggleSort = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "space-y-3 transition-colors rounded-xl",
        isDragging && "bg-primary/5 ring-2 ring-primary/40 p-2"
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform duration-200",
              !isOpen && "-rotate-90"
            )}
          />
          <span className="font-semibold text-sm text-foreground">Attachments</span>
          <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-muted text-muted-foreground">
            {rawAttachments.length}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center bg-transparent rounded-lg p-0.5 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "images", label: "Images" },
                { id: "documents", label: "Documents" },
                { id: "videos", label: "Videos" },
                { id: "other", label: "Other" },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                    isActive
                      ? "bg-muted text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 pl-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer"
              title="Thêm nhiều tệp đính kèm (+)"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Tải lên tệp (Chọn nhiều)</span>
                </DropdownMenuItem>
                {rawAttachments.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        rawAttachments.forEach((a) => {
                          if (a.fileUrl) window.open(a.fileUrl, "_blank");
                        });
                      }}
                      className="gap-2 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Tải tất cả về</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-3">
          <div className="border border-border/80 rounded-xl overflow-hidden bg-card/60">
            <div className="grid grid-cols-[1fr_130px_90px_36px] items-center px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/70 bg-muted/20 select-none">
              <span className="truncate">Name</span>
              <button
                type="button"
                onClick={toggleSort}
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer justify-start"
              >
                <span>Date added</span>
                {sortDirection === "desc" ? (
                  <ArrowDown className="h-3.5 w-3.5 text-foreground" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5 text-foreground" />
                )}
              </button>
              <span>Size</span>
              <span className="text-right sr-only">Actions</span>
            </div>

            {filteredAttachments.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-8 px-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Chưa có tệp nào trong mục này. Bấm vào đây hoặc kéo thả nhiều tệp để tải lên.
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Hỗ trợ tải nhiều file cùng lúc (PNG, JPG, PDF, Word, Excel, ZIP...)
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredAttachments.map((att) => {
                  const ext = att.fileName.split(".").pop()?.toLowerCase() || "";
                  const isImg =
                    ["png", "jpg", "jpeg", "gif", "webp"].includes(ext) ||
                    att.fileType?.startsWith("image/");

                  return (
                    <div
                      key={att.id}
                      className="grid grid-cols-[1fr_130px_90px_36px] items-center px-3 py-2 text-xs hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {renderFileThumbnail(att)}
                        <span
                          onClick={() => {
                            if (isImg && att.fileUrl) {
                              setPreviewImage(att.fileUrl);
                            } else if (att.fileUrl) {
                              window.open(att.fileUrl, "_blank");
                            }
                          }}
                          className="font-medium text-foreground hover:text-primary hover:underline truncate cursor-pointer"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </span>
                      </div>

                      <span className="text-muted-foreground truncate">
                        {formatAttachmentDate(att.createdAt)}
                      </span>

                      <span className="text-muted-foreground truncate">
                        {formatBytes(att.fileSize)}
                      </span>

                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer opacity-80 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 text-xs">
                            {isImg && att.fileUrl && (
                              <DropdownMenuItem
                                onClick={() => setPreviewImage(att.fileUrl!)}
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Xem trước</span>
                              </DropdownMenuItem>
                            )}
                            {att.fileUrl && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = att.fileUrl!;
                                  link.download = att.fileName;
                                  link.target = "_blank";
                                  link.click();
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Tải xuống</span>
                              </DropdownMenuItem>
                            )}
                            {att.fileUrl && (
                              <DropdownMenuItem
                                onClick={() => handleCopyLink(att.fileUrl)}
                                className="gap-2 cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Sao chép link</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(att.id, att.fileName)}
                              className="gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Xóa tệp</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search or paste a Confluence or Loom link"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/80 bg-background text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-background p-2"
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 h-8 bg-background/80 backdrop-blur-xs cursor-pointer"
            >
              Đóng (Esc)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

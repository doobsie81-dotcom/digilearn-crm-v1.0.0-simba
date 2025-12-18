"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import Modal from "../ui/modal";
import { Button } from "../ui/button";
import { useFileUploadModalStore } from "~/store/use-file-upload-modal-store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { Progress } from "../ui/progress";

interface FileWithPreview extends File {
  preview?: string;
}

const FILE_TYPE_MAP = {
  "image/jpeg": { type: "image" as const, icon: ImageIcon },
  "image/png": { type: "image" as const, icon: ImageIcon },
  "image/gif": { type: "image" as const, icon: ImageIcon },
  "image/webp": { type: "image" as const, icon: ImageIcon },
  "application/pdf": { type: "pdf" as const, icon: FileText },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { type: "document" as const, icon: FileText },
  "application/msword": { type: "document" as const, icon: FileText },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { type: "spreadsheet" as const, icon: FileSpreadsheet },
  "application/vnd.ms-excel": { type: "spreadsheet" as const, icon: FileSpreadsheet },
  "text/csv": { type: "spreadsheet" as const, icon: FileSpreadsheet },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploadModal() {
  const { isOpen, leadId, dealId, onClose } = useFileUploadModalStore();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const utils = trpc.useUtils();

  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate({ leadId, dealId });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!Object.keys(FILE_TYPE_MAP).includes(file.type)) {
        toast.error(`${file.name} has an unsupported file type.`);
        return false;
      }
      return true;
    });

    const filesWithPreview = validFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith("image/")) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setFiles((prev) => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index]?.preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      let completedFiles = 0;

      for (const file of files) {
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data URL prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const fileTypeInfo = FILE_TYPE_MAP[file.type as keyof typeof FILE_TYPE_MAP] || { type: "other" as const };

        await uploadFile.mutateAsync({
          leadId,
          dealId,
          name: file.name,
          originalName: file.name,
          content: base64,
          mimeType: file.type,
          size: file.size,
          type: fileTypeInfo.type,
        });

        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
      }

      toast.success(`Successfully uploaded ${files.length} file(s)`);
      setFiles([]);
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (uploading) {
      toast.error("Please wait for uploads to complete");
      return;
    }
    // Clean up previews
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    onClose();
  };

  const getFileIcon = (mimeType: string) => {
    const fileTypeInfo = FILE_TYPE_MAP[mimeType as keyof typeof FILE_TYPE_MAP];
    const Icon = fileTypeInfo?.icon || FileText;
    return <Icon className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Modal
      title="Upload Files"
      description="Upload images, PDFs, documents, or spreadsheets"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-sm font-medium mb-1">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: Images, PDFs, Word, Excel (Max 10MB per file)
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
              >
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? "Uploading..." : `Upload ${files.length} file(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

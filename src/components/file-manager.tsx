"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import {
  Upload,
  MoreVertical,
  Download,
  Copy,
  Trash2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useFileUploadModalStore } from "~/store/use-file-upload-modal-store";
import { FileUploadModal } from "./modals/file-upload-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface FileManagerProps {
  leadId?: string;
  dealId?: string;
}

const FILE_TYPE_ICONS = {
  image: ImageIcon,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  other: FileText,
};

export function FileManager({ leadId, dealId }: FileManagerProps) {
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const { onOpen } = useFileUploadModalStore();

  const { data: files, isLoading } = trpc.files.list.useQuery({
    leadId,
    dealId,
  });

  const utils = trpc.useUtils();

  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate({ leadId, dealId });
      toast.success("File deleted successfully");
      setDeleteFileId(null);
    },
    onError: (error) => {
      toast.error(`Error deleting file: ${error.message}`);
    },
  });

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("File downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleDelete = (fileId: string) => {
    setDeleteFileId(fileId);
  };

  const confirmDelete = () => {
    if (deleteFileId) {
      deleteFile.mutate({ id: deleteFileId });
    }
  };

  const getFileIcon = (type: string, url: string) => {
    if (type === "image") {
      return (
        <img
          src={url}
          alt="File thumbnail"
          className="h-10 w-10 object-cover rounded"
        />
      );
    }
    const Icon = FILE_TYPE_ICONS[type as keyof typeof FILE_TYPE_ICONS] || FileText;
    return <Icon className="h-10 w-10 text-muted-foreground p-2" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Files</CardTitle>
          <Button onClick={() => onOpen(leadId, dealId)} size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading files...
            </div>
          ) : files && files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {/* File Icon/Thumbnail */}
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type, file.url)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(file.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                      {file.uploader && (
                        <>
                          <span>•</span>
                          <span>{file.uploader.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDownload(file.url, file.originalName)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyUrl(file.url)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(file.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No files uploaded yet</p>
              <p className="text-xs mt-1">
                Click the Upload Files button to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload Modal */}
      <FileUploadModal />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteFileId !== null}
        onOpenChange={(open) => !open && setDeleteFileId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFile.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

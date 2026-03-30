import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  FolderIcon,
  FolderPlus,
  Grid3X3,
  List,
  Loader2,
  MoreHorizontal,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { FileMetadata, Folder } from "../backend";
import {
  useCreateFolder,
  useDeleteFolder,
  useGetFolderContents,
  useRenameFolder,
  useSaveFile,
} from "../hooks/useQueries";
import type { BreadcrumbItem } from "./StorageLayout";

type ViewMode = "list" | "grid";

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FileTypeIcon({
  mimeType,
  isFolder,
  size = 18,
}: { mimeType?: string; isFolder?: boolean; size?: number }) {
  if (isFolder)
    return (
      <FolderIcon
        style={{ width: size, height: size }}
        className="text-primary"
      />
    );
  if (!mimeType)
    return (
      <FileIcon
        style={{ width: size, height: size }}
        className="text-muted-foreground"
      />
    );
  if (mimeType.startsWith("image/"))
    return (
      <FileImage
        style={{ width: size, height: size }}
        className="text-accent-foreground"
      />
    );
  if (mimeType.startsWith("video/"))
    return (
      <FileVideo
        style={{ width: size, height: size }}
        className="text-accent-foreground"
      />
    );
  if (mimeType.startsWith("text/"))
    return (
      <FileText
        style={{ width: size, height: size }}
        className="text-accent-foreground"
      />
    );
  return (
    <FileIcon
      style={{ width: size, height: size }}
      className="text-muted-foreground"
    />
  );
}

interface FileBrowserProps {
  currentFolderId: string | null;
  breadcrumb: BreadcrumbItem[];
  onNavigate: (folderId: string | null, name: string) => void;
}

export function FileBrowser({
  currentFolderId,
  breadcrumb,
  onNavigate,
}: FileBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "folder" | "file";
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ folder: Folder } | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useGetFolderContents(currentFolderId);
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();
  const saveFile = useSaveFile();

  const folders = data?.subfolders ?? [];
  const files = data?.files ?? [];
  const isEmpty = folders.length === 0 && files.length === 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder.mutateAsync({
        id: crypto.randomUUID(),
        name: newFolderName.trim(),
        parentFolderId: currentFolderId ?? undefined,
      });
      toast.success(`Folder "${newFolderName.trim()}" created`);
      setNewFolderName("");
      setShowNewFolderDialog(false);
    } catch {
      toast.error("Failed to create folder");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "folder") {
        await deleteFolder.mutateAsync(deleteTarget.id);
      }
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
      setDeleteTarget(null);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await renameFolder.mutateAsync({
        id: renameTarget.folder.id,
        name: renameValue.trim(),
        parentFolderId: renameTarget.folder.parentFolderId,
      });
      toast.success("Folder renamed");
      setRenameTarget(null);
    } catch {
      toast.error("Failed to rename");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      await saveFile.mutateAsync({ file, folderId: currentFolderId });
      toast.success(`"${file.name}" uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      const bytes = await file.blob.getBytes();
      const blob = new Blob([bytes], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="max-w-6xl">
      {/* Page title + breadcrumb */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground mb-1">My Files</h1>
        <nav className="flex items-center gap-1" aria-label="breadcrumb">
          {breadcrumb.map((item, i) => (
            <span key={item.id ?? "root"} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
              <button
                type="button"
                data-ocid="files.link"
                onClick={() => onNavigate(item.id, item.name)}
                className={cn(
                  "text-xs font-medium transition-colors",
                  i === breadcrumb.length - 1
                    ? "text-foreground cursor-default pointer-events-none"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {item.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      {/* Main card */}
      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5 mr-2">
            <button
              type="button"
              data-ocid="files.toggle"
              onClick={() => setViewMode("list")}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded transition-colors",
                viewMode === "list"
                  ? "bg-card shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-ocid="files.toggle"
              onClick={() => setViewMode("grid")}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded transition-colors",
                viewMode === "grid"
                  ? "bg-card shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <Button
            data-ocid="files.secondary_button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowNewFolderDialog(true)}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Folder
          </Button>
          <Button
            data-ocid="files.primary_button"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={saveFile.isPending}
          >
            {saveFile.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploadProgress !== null ? `${uploadProgress}%` : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            data-ocid="files.upload_button"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-4 space-y-2" data-ocid="files.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md" />
            ))}
          </div>
        ) : isEmpty ? (
          <div
            data-ocid="files.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
              <FolderIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              This folder is empty
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Create a folder or upload a file to get started.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setShowNewFolderDialog(true)}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New Folder
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </Button>
            </div>
          </div>
        ) : viewMode === "list" ? (
          <ListView
            folders={folders}
            files={files}
            selected={selected}
            onToggleSelect={toggleSelect}
            onNavigateFolder={(f) => onNavigate(f.id, f.name)}
            onDeleteFolder={(f) =>
              setDeleteTarget({ id: f.id, name: f.name, type: "folder" })
            }
            onRenameFolder={(f) => {
              setRenameTarget({ folder: f });
              setRenameValue(f.name);
            }}
            onDownloadFile={handleDownload}
            onDeleteFile={(f) =>
              setDeleteTarget({ id: f.id, name: f.name, type: "file" })
            }
          />
        ) : (
          <GridView
            folders={folders}
            files={files}
            onNavigateFolder={(f) => onNavigate(f.id, f.name)}
            onDeleteFolder={(f) =>
              setDeleteTarget({ id: f.id, name: f.name, type: "folder" })
            }
            onRenameFolder={(f) => {
              setRenameTarget({ folder: f });
              setRenameValue(f.name);
            }}
            onDownloadFile={handleDownload}
            onDeleteFile={(f) =>
              setDeleteTarget({ id: f.id, name: f.name, type: "file" })
            }
          />
        )}
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent data-ocid="files.dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label
              htmlFor="folder-name"
              className="text-sm font-medium mb-1.5 block"
            >
              Folder name
            </Label>
            <Input
              id="folder-name"
              data-ocid="files.input"
              placeholder="My Folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              data-ocid="files.cancel_button"
              onClick={() => {
                setShowNewFolderDialog(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              data-ocid="files.confirm_button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolder.isPending}
            >
              {createFolder.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent data-ocid="files.dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label
              htmlFor="rename-input"
              className="text-sm font-medium mb-1.5 block"
            >
              New name
            </Label>
            <Input
              id="rename-input"
              data-ocid="files.input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              data-ocid="files.cancel_button"
              onClick={() => setRenameTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              data-ocid="files.confirm_button"
              onClick={handleRename}
              disabled={!renameValue.trim() || renameFolder.isPending}
            >
              {renameFolder.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="files.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
              {deleteTarget?.type === "folder" &&
                " All contents inside this folder will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="files.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="files.delete_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFolder.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ——— List View ———

interface ListViewProps {
  folders: Folder[];
  files: FileMetadata[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onNavigateFolder: (f: Folder) => void;
  onDeleteFolder: (f: Folder) => void;
  onRenameFolder: (f: Folder) => void;
  onDownloadFile: (f: FileMetadata) => void;
  onDeleteFile: (f: FileMetadata) => void;
}

function ListView({
  folders,
  files,
  selected,
  onToggleSelect,
  onNavigateFolder,
  onDeleteFolder,
  onRenameFolder,
  onDownloadFile,
  onDeleteFile,
}: ListViewProps) {
  return (
    <table className="w-full text-sm" data-ocid="files.table">
      <thead>
        <tr className="border-b border-border">
          <th className="w-10 px-4 py-2.5">
            <Checkbox className="w-3.5 h-3.5" />
          </th>
          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">
            Name
          </th>
          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-28 hidden md:table-cell">
            Size
          </th>
          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-36 hidden md:table-cell">
            Date Modified
          </th>
          <th className="w-10" />
        </tr>
      </thead>
      <tbody>
        {folders.map((folder, i) => (
          <tr
            key={folder.id}
            data-ocid={`files.row.${i + 1}`}
            className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group"
          >
            <td className="px-4 py-3">
              <Checkbox
                checked={selected.has(folder.id)}
                onCheckedChange={() => onToggleSelect(folder.id)}
                className="w-3.5 h-3.5"
                data-ocid={`files.checkbox.${i + 1}`}
              />
            </td>
            <td className="px-3 py-3">
              <button
                type="button"
                onClick={() => onNavigateFolder(folder)}
                className="flex items-center gap-2.5 hover:text-primary transition-colors"
              >
                <FolderIcon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium truncate max-w-xs">
                  {folder.name}
                </span>
              </button>
            </td>
            <td className="px-3 py-3 text-muted-foreground text-xs hidden md:table-cell">
              —
            </td>
            <td className="px-3 py-3 text-muted-foreground text-xs hidden md:table-cell">
              {formatDate(folder.updatedAt)}
            </td>
            <td className="px-3 py-3">
              <RowMenu
                onRename={() => onRenameFolder(folder)}
                onDelete={() => onDeleteFolder(folder)}
                isFolder
                index={i + 1}
              />
            </td>
          </tr>
        ))}
        {files.map((file, i) => (
          <tr
            key={file.id}
            data-ocid={`files.row.${folders.length + i + 1}`}
            className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group"
          >
            <td className="px-4 py-3">
              <Checkbox
                checked={selected.has(file.id)}
                onCheckedChange={() => onToggleSelect(file.id)}
                className="w-3.5 h-3.5"
                data-ocid={`files.checkbox.${folders.length + i + 1}`}
              />
            </td>
            <td className="px-3 py-3">
              <div className="flex items-center gap-2.5">
                <FileTypeIcon mimeType={file.mimeType} size={16} />
                <span className="font-medium truncate max-w-xs">
                  {file.name}
                </span>
              </div>
            </td>
            <td className="px-3 py-3 text-muted-foreground text-xs hidden md:table-cell">
              {formatBytes(file.size)}
            </td>
            <td className="px-3 py-3 text-muted-foreground text-xs hidden md:table-cell">
              {formatDate(file.createdAt)}
            </td>
            <td className="px-3 py-3">
              <RowMenu
                onDownload={() => onDownloadFile(file)}
                onDelete={() => onDeleteFile(file)}
                isFolder={false}
                index={folders.length + i + 1}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ——— Grid View ———

interface GridViewProps {
  folders: Folder[];
  files: FileMetadata[];
  onNavigateFolder: (f: Folder) => void;
  onDeleteFolder: (f: Folder) => void;
  onRenameFolder: (f: Folder) => void;
  onDownloadFile: (f: FileMetadata) => void;
  onDeleteFile: (f: FileMetadata) => void;
}

function GridView({
  folders,
  files,
  onNavigateFolder,
  onDeleteFolder,
  onRenameFolder,
  onDownloadFile,
  onDeleteFile,
}: GridViewProps) {
  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {folders.map((folder, i) => (
        <div
          key={folder.id}
          data-ocid={`files.item.${i + 1}`}
          className="group relative bg-muted/30 hover:bg-accent/50 border border-transparent hover:border-border rounded-lg p-3 transition-colors cursor-pointer"
        >
          <button
            type="button"
            className="w-full flex flex-col items-center gap-2 text-center"
            onClick={() => onNavigateFolder(folder)}
          >
            <FolderIcon className="w-10 h-10 text-primary" />
            <span className="text-xs font-medium text-foreground truncate w-full">
              {folder.name}
            </span>
          </button>
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <RowMenu
              onRename={() => onRenameFolder(folder)}
              onDelete={() => onDeleteFolder(folder)}
              isFolder
              index={i + 1}
            />
          </div>
        </div>
      ))}
      {files.map((file, i) => (
        <div
          key={file.id}
          data-ocid={`files.item.${folders.length + i + 1}`}
          className="group relative bg-muted/30 hover:bg-accent/50 border border-transparent hover:border-border rounded-lg p-3 transition-colors"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <FileTypeIcon mimeType={file.mimeType} size={40} />
            <span className="text-xs font-medium text-foreground truncate w-full">
              {file.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </div>
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <RowMenu
              onDownload={() => onDownloadFile(file)}
              onDelete={() => onDeleteFile(file)}
              isFolder={false}
              index={folders.length + i + 1}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ——— Row Menu ———

function RowMenu({
  onRename,
  onDownload,
  onDelete,
  isFolder,
  index,
}: {
  onRename?: () => void;
  onDownload?: () => void;
  onDelete: () => void;
  isFolder: boolean;
  index: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-ocid={`files.button.${index}`}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {isFolder && onRename && (
          <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
        )}
        {!isFolder && onDownload && (
          <DropdownMenuItem onClick={onDownload}>Download</DropdownMenuItem>
        )}
        <DropdownMenuItem
          data-ocid={`files.delete_button.${index}`}
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

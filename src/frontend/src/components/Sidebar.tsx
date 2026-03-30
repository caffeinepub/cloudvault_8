import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, FolderIcon, Home, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGetCallerFolders, useGetUsedStorage } from "../hooks/useQueries";

const TOTAL_BYTES = 2n * 1024n * 1024n * 1024n * 1024n; // 2TB

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n < 1024 * 1024 * 1024 * 1024)
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  return `${(n / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
}

interface SidebarProps {
  currentFolderId: string | null;
  onNavigate: (folderId: string | null, name: string) => void;
}

export function Sidebar({ currentFolderId, onNavigate }: SidebarProps) {
  const { data: usedStorage = 0n } = useGetUsedStorage();
  const { data: folders = [] } = useGetCallerFolders();
  const [foldersOpen, setFoldersOpen] = useState(true);

  const usedNum = Number(usedStorage);
  const totalNum = Number(TOTAL_BYTES);
  const percentage = Math.min((usedNum / totalNum) * 100, 100);
  const rootFolders = folders.filter((f) => !f.parentFolderId);

  return (
    <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <nav className="flex-1 py-4 px-3 space-y-0.5" data-ocid="sidebar.panel">
        {/* Home */}
        <button
          type="button"
          data-ocid="sidebar.link"
          onClick={() => onNavigate(null, "Home")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            currentFolderId === null
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span>My Files</span>
        </button>

        {/* Recent */}
        <button
          type="button"
          data-ocid="sidebar.link"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Recent</span>
        </button>

        {/* Folders section */}
        {rootFolders.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setFoldersOpen((o) => !o)}
              className="w-full flex items-center gap-1 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight
                className={cn(
                  "w-3 h-3 transition-transform duration-150",
                  foldersOpen && "rotate-90",
                )}
              />
              Folders
            </button>
            {foldersOpen && (
              <div className="mt-0.5 space-y-0.5">
                {rootFolders.map((folder) => (
                  <button
                    type="button"
                    key={folder.id}
                    data-ocid="sidebar.link"
                    onClick={() => onNavigate(folder.id, folder.name)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                      currentFolderId === folder.id
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <FolderIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <div className="h-px bg-sidebar-border mx-3 mb-2" />
          <button
            type="button"
            data-ocid="sidebar.link"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span>Trash</span>
          </button>
        </div>
      </nav>

      {/* Storage widget */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-accent/60 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-foreground">
              Storage
            </span>
            <span className="text-xs text-muted-foreground">2TB Plan</span>
          </div>
          <Progress value={percentage} className="h-1.5 mb-2" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatBytes(usedStorage)}
            </span>
            {" used of 2.0 TB"}
          </p>
        </div>
      </div>
    </aside>
  );
}

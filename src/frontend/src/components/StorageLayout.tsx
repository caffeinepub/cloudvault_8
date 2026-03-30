import { useState } from "react";
import { AppHeader } from "./AppHeader";
import { FileBrowser } from "./FileBrowser";
import { Sidebar } from "./Sidebar";

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export function StorageLayout() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: null, name: "Home" },
  ]);

  const navigateTo = (folderId: string | null, folderName: string) => {
    if (folderId === null) {
      setBreadcrumb([{ id: null, name: "Home" }]);
      setCurrentFolderId(null);
      return;
    }
    const existingIndex = breadcrumb.findIndex((b) => b.id === folderId);
    if (existingIndex >= 0) {
      setBreadcrumb(breadcrumb.slice(0, existingIndex + 1));
    } else {
      setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
    }
    setCurrentFolderId(folderId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentFolderId={currentFolderId} onNavigate={navigateTo} />
        <main className="flex-1 overflow-auto p-6">
          <FileBrowser
            currentFolderId={currentFolderId}
            breadcrumb={breadcrumb}
            onNavigate={navigateTo}
          />
        </main>
      </div>
      <footer className="bg-card border-t border-border py-3 px-6">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} AuraDrive. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

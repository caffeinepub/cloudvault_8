import { Toaster } from "@/components/ui/sonner";
import { AuthScreen } from "./components/AuthScreen";
import { StorageLayout } from "./components/StorageLayout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading AuraDrive…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      {identity ? <StorageLayout /> : <AuthScreen />}
    </>
  );
}

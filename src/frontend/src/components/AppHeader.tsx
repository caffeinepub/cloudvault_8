import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CloudIcon, HelpCircle, Settings } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function AppHeader() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortId = principal
    ? `${principal.slice(0, 5)}…${principal.slice(-3)}`
    : "User";
  const initials = shortId.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border h-14 flex items-center px-5 gap-4">
      {/* Brand */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <CloudIcon className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold text-foreground">
          AuraDrive
        </span>
      </div>

      <div className="flex-1" />

      {/* Utilities */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-ocid="header.dropdown_menu"
              className="flex items-center gap-2 hover:bg-accent px-2 py-1 rounded-md transition-colors"
            >
              <span className="text-sm text-foreground hidden sm:block">
                {shortId}
              </span>
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              data-ocid="header.button"
              onClick={clear}
              className="text-destructive focus:text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

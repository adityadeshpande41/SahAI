import { type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme" data-testid="button-theme-toggle">
      {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-1 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">S</span>
            </div>
            <span className="font-semibold text-sm">SahAI</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="pb-20 px-4 py-4">
          {children}
        </main>
        <BottomNav />
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-1 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

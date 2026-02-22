import { type ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Info, X } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme" data-testid="button-theme-toggle">
      {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("sahai-disclaimer-dismissed") === "true");
  if (dismissed) return null;
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2" data-testid="banner-disclaimer">
      <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <p className="text-xs text-amber-800 dark:text-amber-300 flex-1">
        SahAI provides supportive guidance only — it is not a substitute for professional medical advice or diagnosis.
      </p>
      <button
        onClick={() => { setDismissed(true); localStorage.setItem("sahai-disclaimer-dismissed", "true"); }}
        className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 flex-shrink-0"
        aria-label="Dismiss disclaimer"
        data-testid="button-dismiss-disclaimer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <DisclaimerBanner />
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
          <DisclaimerBanner />
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

import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Pill,
  UtensilsCrossed,
  MessageCircle,
  MoreHorizontal,
  Activity,
  BarChart3,
  Heart,
  Settings,
  Dumbbell,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const mainItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Meds", url: "/medications", icon: Pill },
  { title: "Meals", url: "/meals", icon: UtensilsCrossed },
  { title: "Talk", url: "/voice", icon: MessageCircle },
];

const moreItems = [
  { title: "Exercise", url: "/exercise", icon: Dumbbell },
  { title: "Vitals", url: "/vitals", icon: Heart },
  { title: "Symptoms", url: "/symptoms", icon: Activity },
  { title: "Insights", url: "/insights", icon: BarChart3 },
  { title: "Caregiver", url: "/caregiver", icon: Heart },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMoreActive = moreItems.some(i => location === i.url || (i.url !== "/" && location.startsWith(i.url)));

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50" role="navigation" aria-label="Main navigation" data-testid="nav-bottom">
      <div className="glass floating-nav rounded-2xl border border-border/50 px-2 py-1.5 max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {mainItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link key={item.title} href={item.url} data-testid={`link-bottom-${item.title.toLowerCase()}`}>
                <button
                  className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-300 min-w-[52px] ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:scale-95"
                  }`}
                  aria-label={item.title}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/8 dark:bg-primary/12 rounded-xl nav-indicator" />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                  <span className={`text-[10px] font-medium relative z-10 ${isActive ? "font-semibold" : ""}`}>{item.title}</span>
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              </Link>
            );
          })}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-300 min-w-[52px] ${
                  isMoreActive ? "text-primary" : "text-muted-foreground active:scale-95"
                }`}
                aria-label="More options"
                data-testid="button-more-nav"
              >
                {isMoreActive && (
                  <div className="absolute inset-0 bg-primary/8 dark:bg-primary/12 rounded-xl nav-indicator" />
                )}
                <MoreHorizontal className={`w-5 h-5 relative z-10 ${isMoreActive ? "scale-110" : ""}`} />
                <span className={`text-[10px] font-medium relative z-10 ${isMoreActive ? "font-semibold" : ""}`}>More</span>
                {isMoreActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="text-left">More</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 py-4">
                {moreItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <Link key={item.title} href={item.url} data-testid={`link-more-${item.title.toLowerCase()}`}>
                      <button
                        onClick={() => setSheetOpen(false)}
                        className={`flex items-center gap-3 w-full p-3.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium shadow-sm"
                            : "text-foreground hover:bg-muted active:scale-[0.98]"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isActive ? "bg-primary/15" : "bg-muted"
                        }`}>
                          <item.icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-sm">{item.title}</span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

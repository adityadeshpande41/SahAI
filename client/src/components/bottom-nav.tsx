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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" role="navigation" aria-label="Main navigation" data-testid="nav-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {mainItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link key={item.title} href={item.url} data-testid={`link-bottom-${item.title.toLowerCase()}`}>
              <button
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors min-w-[56px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                aria-label={item.title}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.title}</span>
              </button>
            </Link>
          );
        })}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors min-w-[56px] ${
                isMoreActive ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="More options"
              data-testid="button-more-nav"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {moreItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <Link key={item.title} href={item.url} data-testid={`link-more-${item.title.toLowerCase()}`}>
                    <button
                      onClick={() => setSheetOpen(false)}
                      className={`flex items-center gap-3 w-full p-3 rounded-md transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

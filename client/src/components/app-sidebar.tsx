import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Pill,
  UtensilsCrossed,
  Activity,
  MessageCircle,
  BarChart3,
  Heart,
  Settings,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Medications", url: "/medications", icon: Pill },
  { title: "Meals", url: "/meals", icon: UtensilsCrossed },
  { title: "Symptoms", url: "/symptoms", icon: Activity },
  { title: "Talk to SahAI", url: "/voice", icon: MessageCircle },
  { title: "Insights", url: "/insights", icon: BarChart3 },
  { title: "Caregiver", url: "/caregiver", icon: Heart },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="link-logo">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SahAI</h1>
              <p className="text-xs text-muted-foreground">Your Health Copilot</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <span>SahAI is active</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

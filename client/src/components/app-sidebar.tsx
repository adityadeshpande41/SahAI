import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Pill,
  UtensilsCrossed,
  Activity,
  MessageCircle,
  BarChart3,
  Heart,
  Settings,
  Sparkles,
  LogOut,
  Dumbbell,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-api";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Medications", url: "/medications", icon: Pill },
  { title: "Meals", url: "/meals", icon: UtensilsCrossed },
  { title: "Exercise", url: "/exercise", icon: Dumbbell },
  { title: "Vitals", url: "/vitals", icon: Heart },
  { title: "Symptoms", url: "/symptoms", icon: Activity },
  { title: "Talk to SahAI", url: "/voice", icon: MessageCircle },
  { title: "Insights", url: "/insights", icon: BarChart3 },
  { title: "Caregiver", url: "/caregiver", icon: Heart },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { data: userData, isLoading, error } = useCurrentUser();
  
  // Debug logging
  console.log("Sidebar user data:", userData);
  
  // Handle both response formats: { user: {...} } or direct user object
  const user = userData?.user || userData || { name: "User", ageGroup: "65-74" };

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem("sahai-user-id");
    localStorage.removeItem("sahai-authenticated");
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    
    // Redirect to landing page
    window.location.href = "/landing";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-3">
        <Link href="/" data-testid="link-logo">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/SahAI.png" 
                alt="SahAI Logo" 
                className="w-10 h-10 object-contain rounded-xl"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gradient">SahAI</h1>
              <p className="text-[10px] text-muted-foreground font-medium">Health Copilot</p>
            </div>
          </div>
        </Link>
        <div className="mt-4 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">Age {user.ageGroup}</p>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">Active</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={`rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 dark:bg-primary/15 text-primary font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-gentle-pulse" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-ring" />
            </div>
            <span className="font-medium">SahAI Twin is active</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

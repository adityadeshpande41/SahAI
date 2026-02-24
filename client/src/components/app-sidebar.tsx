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
  
  // Handle both response formats: { user: {...} } or direct user object
  const user = userData?.user || userData || { name: "User", username: "user", ageGroup: "65-74" };

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
    <Sidebar className="border-r border-gray-200/50 bg-white">
      <SidebarHeader className="p-4 pb-3">
        <Link href="/" data-testid="link-logo">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SahAI</h1>
              <p className="text-[10px] text-gray-500 font-medium">Health Copilot</p>
            </div>
          </div>
        </Link>
        <div className="mt-4 p-3 rounded-xl bg-gray-50/50 border border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-sm font-bold text-white shadow-sm">
              {(user.name || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name || user.username || "User"}</p>
              <p className="text-[10px] text-gray-500">{user.ageGroup || "Age not set"}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/50">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span className="text-[9px] font-semibold text-emerald-700">Active</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={`rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 !text-white font-semibold shadow-md hover:shadow-lg"
                          : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      }`}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className={`w-4 h-4 ${isActive ? "!text-white" : "text-blue-600"}`} />
                        <span className={isActive ? "!text-white" : ""}>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-gentle-pulse" />
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
      <SidebarFooter className="p-4 space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-50/50 to-teal-50/50 border border-cyan-200/50">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring" />
            </div>
            <span className="font-medium">SahAI Twin is active</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

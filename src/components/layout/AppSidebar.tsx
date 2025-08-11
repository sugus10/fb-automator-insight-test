import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Brain,
  Settings,
  Facebook
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/", icon: BarChart3 },
  { title: "Post Performance", url: "/posts", icon: TrendingUp },
  { title: "AI Suggestions", url: "/suggestions", icon: Brain },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => 
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  return (
    <Sidebar className={collapsed ? "w-12 sm:w-16" : "w-56 sm:w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="flex items-center justify-center p-3 sm:p-4 border-b border-sidebar-border">
          <Facebook className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          {!collapsed && (
            <span className="ml-2 text-base sm:text-lg font-semibold text-foreground">
              Dashboard
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`flex items-center w-full transition-smooth ${
                          active 
                            ? "bg-primary text-primary-foreground font-medium" 
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="ml-2 sm:ml-3 text-sm sm:text-base">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
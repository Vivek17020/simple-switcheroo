import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  FileText, 
  PlusCircle, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Pen,
  BarChart3,
  Trophy,
  Video,
  BookOpen,
  Search,
  Globe,
  Briefcase,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Layers,
  FileQuestion,
  ImageIcon
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "All Articles", url: "/admin/articles", icon: FileText },
  { title: "New Article", url: "/admin/articles/new", icon: PlusCircle },
  { title: "📰 Web Stories", url: "/admin/web-stories", icon: BookOpen },
  { title: "💼 Jobs", url: "/admin/jobs", icon: Briefcase },
  { title: "Videos", url: "/admin/videos", icon: Video },
  { title: "Cricket Matches", url: "/admin/cricket-matches", icon: Trophy },
  { title: "Admit Cards", url: "/admin/admit-cards", icon: FileText },
  { title: "Exam Papers", url: "/admin/exam-papers", icon: FileText },
  { title: "Previous Year Papers", url: "/admin/pyq", icon: FileText },
  { title: "Engagement", url: "/admin/engagement", icon: BarChart3 },
  { title: "SEO Audit", url: "/admin/seo-audit", icon: Search },
  { title: "Indexing", url: "/admin/indexing", icon: Globe },
  { title: "Image Migration", url: "/admin/image-migration", icon: ImageIcon },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const upscItems = [
  { title: "Quizzes", url: "/admin/upsc/quizzes", icon: HelpCircle },
  { title: "Flashcards", url: "/admin/upsc/flashcards", icon: Layers },
  { title: "Notes", url: "/admin/upsc/notes", icon: FileQuestion },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [upscOpen, setUpscOpen] = useState(currentPath.includes('/admin/upsc'));

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-gradient-primary text-primary-foreground font-medium shadow-glow" 
      : "hover:bg-accent/50 transition-all duration-300";

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} border-r border-border bg-sidebar transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Pen className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                  CMS Admin
                </h2>
                <p className="text-xs text-muted-foreground">Content Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-4">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`${getNavCls(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* UPSC Briefs Section */}
        <SidebarGroup>
          <Collapsible open={upscOpen} onOpenChange={setUpscOpen}>
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-300 ${currentPath.includes('/admin/upsc') ? 'bg-gradient-primary text-primary-foreground' : ''}`}>
                <GraduationCap className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">UPSC Briefs</span>
                    {upscOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </>
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu className="ml-4 mt-2 space-y-1">
                {upscItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`${getNavCls(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300`}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* User Section */}
        <div className="mt-auto pt-8">
          {!collapsed && (
            <div className="mb-4 p-3 bg-card/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={signOut}
            className={`${collapsed ? "w-12 h-12 p-0" : "w-full"} border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40 transition-all duration-300`}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
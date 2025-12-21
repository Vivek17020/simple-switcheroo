import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  GraduationCap, Search, Menu, X, ChevronDown, ChevronRight,
  BookOpen, Users, FileText, History, Globe, Leaf, Cpu, Palette, Building, Home,
  Target, PenTool, Newspaper, Brain, FolderOpen, Info,
  CheckSquare, Clock, BookMarked, Download, Calendar, Map, User, LogIn, LogOut, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPSCSearchDialog } from "./UPSCSearchDialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Navigation data structure
const gsSubjects = [
  { name: "Polity", slug: "polity", icon: Building, color: "#2563EB" },
  { name: "Economy", slug: "economy", icon: FileText, color: "#059669" },
  { name: "Geography", slug: "geography", icon: Globe, color: "#D97706" },
  { name: "History", slug: "history", icon: History, color: "#DC2626" },
  { name: "Environment", slug: "upsc-environment", icon: Leaf, color: "#16A34A" },
  { name: "Science & Tech", slug: "science-tech", icon: Cpu, color: "#7C3AED" },
  { name: "Art & Culture", slug: "art-culture", icon: Palette, color: "#DB2777" },
  { name: "International Relations", slug: "upsc-international-relations", icon: Users, color: "#0891B2" },
  { name: "Society", slug: "upsc-society", icon: Users, color: "#EA580C" },
];

const prelimsItems = [
  { name: "Prelims GS Notes", slug: "upsc-prelims-gs-notes", icon: BookOpen },
  { name: "Topic-wise MCQs", slug: "upsc-topic-wise-mcqs", icon: CheckSquare },
  { name: "CSAT", slug: "upsc-csat", icon: Brain },
  { name: "Previous Year Questions", slug: "upsc-prelims-pyq", icon: History },
  { name: "Prelims Mock Tests", slug: "upsc-prelims-mock-tests", icon: Target },
];

const mainsItems = [
  { name: "GS Paper 1", slug: "upsc-gs1", description: "Heritage, History, Geography" },
  { name: "GS Paper 2", slug: "upsc-gs2", description: "Governance, Constitution, Polity" },
  { name: "GS Paper 3", slug: "upsc-gs3", description: "Economy, Environment, S&T" },
  { name: "GS Paper 4", slug: "upsc-gs4", description: "Ethics, Integrity, Aptitude" },
  { name: "Essay Strategy", slug: "upsc-essay-strategy", description: "Writing techniques" },
  { name: "Model Answers", slug: "upsc-model-answers", description: "Sample answers" },
  { name: "Mains PYQs", slug: "upsc-mains-pyq", description: "Previous year questions" },
];

const optionalItems = [
  { name: "PSIR", slug: "upsc-psir" },
  { name: "Sociology", slug: "upsc-sociology-optional" },
  { name: "Geography", slug: "upsc-geography-optional" },
  { name: "Anthropology", slug: "upsc-anthropology" },
  { name: "Public Administration", slug: "upsc-public-admin" },
  { name: "History", slug: "upsc-history-optional" },
  { name: "Philosophy", slug: "upsc-philosophy" },
  { name: "Economics", slug: "upsc-economics-optional" },
  { name: "Literature Optionals", slug: "upsc-literature-optional" },
];

const currentAffairsItems = [
  { name: "Daily CA", slug: "upsc-daily-ca", icon: Calendar },
  { name: "Monthly CA", slug: "upsc-monthly-ca", icon: BookMarked },
  { name: "PIB Summary", slug: "upsc-pib-summary", icon: FileText },
  { name: "Yojana Summary", slug: "upsc-yojana-summary", icon: BookOpen },
  { name: "Kurukshetra Summary", slug: "upsc-kurukshetra-summary", icon: BookOpen },
  { name: "Editorial Notes", slug: "upsc-editorial-notes", icon: PenTool },
];

const practiceItems = [
  { name: "Daily Quiz", slug: "upsc-daily-quiz", icon: CheckSquare },
  { name: "Weekly Quiz", slug: "upsc-weekly-quiz", icon: Clock },
  { name: "Topic-wise Test", slug: "upsc-topic-test", icon: Target },
  { name: "Flashcards", slug: "upsc-flashcards", icon: BookMarked },
  { name: "Revision Notes", slug: "upsc-revision-notes", icon: FileText },
];

const resourcesItems = [
  { name: "UPSC Syllabus", slug: "upsc-syllabus", icon: FileText },
  { name: "NCERT Notes", slug: "upsc-ncert-notes", icon: BookOpen },
  { name: "Standard Booklist", slug: "upsc-booklist", icon: BookMarked },
  { name: "Previous Year Papers", slug: "upsc-pyp", icon: History },
  { name: "Maps & Infographics", slug: "upsc-maps-infographics", icon: Map },
  { name: "UPSC Calendar", slug: "upsc-calendar", icon: Calendar },
  { name: "PDF Downloads", slug: "upsc-pdf-downloads", icon: Download },
];

interface DropdownProps {
  items: Array<{ name: string; slug: string; icon?: any; color?: string; description?: string }>;
  basePath?: string;
  onClose: () => void;
}

const SimpleDropdown = ({ items, basePath = "/upscbriefs", onClose }: DropdownProps) => (
  <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[220px] z-[99999] animate-in fade-in-0 slide-in-from-top-2 duration-200">
    {items.map((item) => (
      <Link
        key={item.slug}
        to={`${basePath}/${item.slug}`}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 hover:pl-5"
        onClick={onClose}
      >
        {item.icon && <item.icon className="w-4 h-4 text-gray-400 transition-colors group-hover:text-blue-600" />}
        <div>
          <div className="font-medium">{item.name}</div>
          {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
        </div>
      </Link>
    ))}
  </div>
);

const SubjectsMegaDropdown = ({ onClose }: { onClose: () => void }) => (
  <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-[99999] w-[600px] -translate-x-1/4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
    <div className="grid grid-cols-3 gap-4">
      {gsSubjects.map((subject) => (
        <Link
          key={subject.slug}
          to={`/upscbriefs/${subject.slug}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-150 group hover:shadow-sm"
          onClick={onClose}
        >
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-md"
            style={{ backgroundColor: `${subject.color}15` }}
          >
            <subject.icon className="w-5 h-5 transition-transform duration-200" style={{ color: subject.color }} />
          </div>
          <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{subject.name}</span>
        </Link>
      ))}
    </div>
  </div>
);

// Mobile bottom navigation items
const mobileNavItems = [
  { name: "Home", icon: Home, path: "/upscbriefs" },
  { name: "Subjects", icon: BookOpen, path: "#subjects-mobile" },
  { name: "Practice", icon: Target, path: "/upscbriefs/upsc-daily-quiz" },
  { name: "Search", icon: Search, path: "#search" },
];

export const UPSCNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [showMobileSubjects, setShowMobileSubjects] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/upscbriefs");
  };

  const isActive = (path: string) => location.pathname === path;

  // Reset dropdown state on route change - fixes the stuck dropdown bug
  useEffect(() => {
    setActiveDropdown(null);
    setMobileExpanded(null);
    setMobileMenuOpen(false);
    setShowMobileSubjects(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const closeDropdown = () => setActiveDropdown(null);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileExpanded(null);
  };

  // Immediate dropdown handlers - no delay for responsive UX
  const handleMouseEnter = (dropdownKey: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(dropdownKey);
  };

  const handleMouseLeave = () => {
    // Immediate close - no delay
    setActiveDropdown(null);
  };

  const handleMobileNavClick = (path: string) => {
    if (path === "#search") {
      setSearchOpen(true);
    } else if (path === "#subjects-mobile") {
      setShowMobileSubjects(!showMobileSubjects);
    }
  };

  const NavItem = ({ 
    label, 
    dropdownKey, 
    children 
  }: { 
    label: string; 
    dropdownKey: string; 
    children: React.ReactNode;
  }) => (
    <div 
      className="relative group"
      onMouseEnter={() => handleMouseEnter(dropdownKey)}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
          activeDropdown === dropdownKey
            ? "bg-blue-100 text-blue-700 shadow-sm"
            : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
        )}
        onClick={() => setActiveDropdown(activeDropdown === dropdownKey ? null : dropdownKey)}
      >
        {label}
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-300 ease-out",
          activeDropdown === dropdownKey && "rotate-180 text-blue-700"
        )} />
      </button>
      <div
        className={cn(
          "absolute top-full left-0 pt-1 transition-all duration-200 ease-out",
          activeDropdown === dropdownKey 
            ? "opacity-100 visible translate-y-0" 
            : "opacity-0 invisible -translate-y-2 pointer-events-none"
        )}
      >
        {children}
      </div>
    </div>
  );

  const MobileAccordion = ({ 
    label, 
    items, 
    basePath = "/upscbriefs" 
  }: { 
    label: string; 
    items: Array<{ name: string; slug: string; icon?: any }>; 
    basePath?: string;
  }) => (
    <div className="border-b border-gray-100">
      <button
        className="w-full flex items-center justify-between px-4 py-4 text-gray-700 font-medium active:bg-gray-50"
        onClick={() => setMobileExpanded(mobileExpanded === label ? null : label)}
      >
        {label}
        <ChevronRight className={cn(
          "w-5 h-5 transition-transform",
          mobileExpanded === label && "rotate-90"
        )} />
      </button>
      {mobileExpanded === label && (
        <div className="bg-gray-50 pb-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              to={`${basePath}/${item.slug}`}
              className="flex items-center gap-3 px-8 py-3 text-sm text-gray-600 hover:text-blue-700 active:bg-gray-100"
              onClick={closeMobileMenu}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" ref={navRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Logo - Extreme Left */}
            <Link to="/upscbriefs" className="flex items-center gap-2 flex-shrink-0 mr-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UPSCBriefs</span>
            </Link>

            {/* Desktop Navigation - After Logo */}
            <nav className="hidden lg:flex items-center space-x-1 flex-1">
              <Link
                to="/upscbriefs"
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive("/upscbriefs")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>

              <NavItem label="Subjects (GS)" dropdownKey="subjects">
                <SubjectsMegaDropdown onClose={closeDropdown} />
              </NavItem>

              <NavItem label="Prelims" dropdownKey="prelims">
                <SimpleDropdown items={prelimsItems} onClose={closeDropdown} />
              </NavItem>

              <NavItem label="Mains" dropdownKey="mains">
                <SimpleDropdown items={mainsItems} onClose={closeDropdown} />
              </NavItem>

              <NavItem label="Optional" dropdownKey="optional">
                <SimpleDropdown items={optionalItems} onClose={closeDropdown} />
              </NavItem>

              <NavItem label="Current Affairs" dropdownKey="ca">
                <SimpleDropdown items={currentAffairsItems} onClose={closeDropdown} />
              </NavItem>

              <NavItem label="Practice" dropdownKey="practice">
                <SimpleDropdown items={practiceItems} onClose={closeDropdown} />
              </NavItem>

              <NavItem label="Resources" dropdownKey="resources">
                <SimpleDropdown items={resourcesItems} onClose={closeDropdown} />
              </NavItem>

              <Link
                to="/upscbriefs/about"
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive("/upscbriefs/about")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                About
              </Link>
            </nav>

            {/* Search, User Menu & Mobile Menu - Extreme Right */}
            <div className="flex items-center gap-4 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="text-gray-700"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                          {user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/upscbriefs/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/upscbriefs/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <BookMarked className="w-4 h-4" />
                        My Bookmarks
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/upscbriefs/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <Target className="w-4 h-4" />
                        My Progress
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:flex items-center gap-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                >
                  <Link to="/auth">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white max-h-[70vh] overflow-y-auto pb-20">
            <Link
              to="/upscbriefs"
              className="flex items-center gap-3 px-4 py-4 text-gray-700 font-medium border-b border-gray-100 active:bg-gray-50"
              onClick={closeMobileMenu}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>

            <MobileAccordion label="Subjects (GS)" items={gsSubjects} />
            <MobileAccordion label="Prelims" items={prelimsItems} />
            <MobileAccordion label="Mains" items={mainsItems} />
            <MobileAccordion label="Optional Subjects" items={optionalItems} />
            <MobileAccordion label="Current Affairs" items={currentAffairsItems} />
            <MobileAccordion label="Practice" items={practiceItems} />
            <MobileAccordion label="Resources" items={resourcesItems} />

            <Link
              to="/upscbriefs/about"
              className="flex items-center gap-3 px-4 py-4 text-gray-700 font-medium active:bg-gray-50"
              onClick={closeMobileMenu}
            >
              <Info className="w-5 h-5" />
              About
            </Link>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const isCurrentActive = item.path === location.pathname || 
              (item.path === "/upscbriefs" && location.pathname === "/upscbriefs");
            
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.path.startsWith("#")) {
                    handleMobileNavClick(item.path);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-colors",
                  isCurrentActive ? "text-blue-600" : "text-gray-500"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Subjects Sheet */}
      {showMobileSubjects && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileSubjects(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Browse Subjects</h3>
              <button onClick={() => setShowMobileSubjects(false)} className="p-2 -mr-2">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 pb-8">
              {gsSubjects.map((subject) => (
                <Link
                  key={subject.slug}
                  to={`/upscbriefs/${subject.slug}`}
                  onClick={() => setShowMobileSubjects(false)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 active:bg-gray-50"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${subject.color}15` }}
                  >
                    <subject.icon className="w-5 h-5" style={{ color: subject.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <UPSCSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Add padding for mobile bottom nav */}
      <style>{`
        @media (max-width: 1023px) {
          main, .main-content {
            padding-bottom: 4rem;
          }
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
        }
      `}</style>
    </>
  );
};
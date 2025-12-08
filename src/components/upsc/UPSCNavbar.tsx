import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GraduationCap, Search, Menu, X, ChevronDown, BookOpen, Users, FileText, History, Globe, Leaf, Cpu, Palette, Building, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UPSCSearchDialog } from "./UPSCSearchDialog";
import { cn } from "@/lib/utils";

const subjects = [
  { name: "Polity", slug: "polity", icon: Building, color: "#2563EB" },
  { name: "Economy", slug: "economy", icon: FileText, color: "#059669" },
  { name: "Geography", slug: "geography", icon: Globe, color: "#D97706" },
  { name: "History", slug: "history", icon: History, color: "#DC2626" },
  { name: "Environment", slug: "environment", icon: Leaf, color: "#16A34A" },
  { name: "Science & Tech", slug: "science-tech", icon: Cpu, color: "#7C3AED" },
  { name: "Art & Culture", slug: "art-culture", icon: Palette, color: "#DB2777" },
  { name: "International Relations", slug: "international-relations", icon: Users, color: "#0891B2" },
  { name: "Society", slug: "society", icon: Users, color: "#EA580C" },
];

export const UPSCNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/upscbriefs" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UPSCBriefs</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/upscbriefs"
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive("/upscbriefs")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Home className="w-4 h-4 inline mr-1" />
                Home
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Subjects
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white">
                  {subjects.map((subject) => (
                    <DropdownMenuItem key={subject.slug} asChild>
                      <Link
                        to={`/upscbriefs/${subject.slug}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <subject.icon className="w-4 h-4" style={{ color: subject.color }} />
                        {subject.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to="/upscbriefs/about"
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive("/upscbriefs/about")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                About
              </Link>
            </nav>

            {/* Search & Mobile Menu */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="text-gray-700"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/upscbriefs"
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <div className="px-3 py-2 text-sm font-semibold text-gray-500">Subjects</div>
              {subjects.map((subject) => (
                <Link
                  key={subject.slug}
                  to={`/upscbriefs/${subject.slug}`}
                  className="flex items-center gap-2 px-6 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <subject.icon className="w-4 h-4" style={{ color: subject.color }} />
                  {subject.name}
                </Link>
              ))}
              <Link
                to="/upscbriefs/about"
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
            </div>
          </div>
        )}
      </header>

      <UPSCSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

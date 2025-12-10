import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface UPSCBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const UPSCBreadcrumb = ({ items }: UPSCBreadcrumbProps) => {
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4 overflow-x-auto">
      <Link
        to="/upscbriefs"
        className="flex items-center hover:text-blue-700 transition-colors flex-shrink-0"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center flex-shrink-0">
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          {item.href ? (
            <Link to={item.href} className="hover:text-blue-700 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
};

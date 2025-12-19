import { Helmet } from "react-helmet-async";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

// Hook to generate breadcrumb items from current route
export function useBreadcrumbs(currentPage: string, categoryName?: string, categorySlug?: string) {
  const baseUrl = window.location.origin;
  const breadcrumbs: BreadcrumbItem[] = [
    {
      name: "Home",
      url: baseUrl
    }
  ];

  if (categoryName && categorySlug) {
    breadcrumbs.push({
      name: categoryName,
      url: `${baseUrl}/category/${categorySlug}`
    });
  }

  if (currentPage !== "Home") {
    breadcrumbs.push({
      name: currentPage,
      url: window.location.href
    });
  }

  return breadcrumbs;
}
import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/public/navbar";
import { ArticleGrid } from "@/components/public/article-grid";
import { useCategories, Category } from "@/hooks/use-articles";
import { SEOHead } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight } from "lucide-react";
import { CricketMatchesSection } from "@/components/public/cricket-matches-section";
import { useAutoTranslate } from "@/hooks/use-auto-translate";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";

export default function CategoryPage() {
  const { slug, parentSlug, childSlug, pageNumber } = useParams<{ 
    slug?: string; 
    parentSlug?: string; 
    childSlug?: string;
    pageNumber?: string;
  }>();
  
  // Determine the actual category slug to use
  const categorySlug = childSlug || slug;
  const currentPage = pageNumber ? parseInt(pageNumber, 10) : 1;
  
  const { data: categories } = useCategories();
  
  const contentRef = useRef<HTMLElement>(null);
  const { currentLanguage } = useTranslation();
  
  useAutoTranslate(contentRef);
  
  // Find the category (could be parent or child)
  let category: Category | undefined = categories?.find(cat => cat.slug === categorySlug);
  let parentCategory: Category | null = null;
  
  // If not found in top-level, search in subcategories
  if (!category && categories) {
    for (const parent of categories) {
      const found = parent.subcategories?.find(sub => sub.slug === categorySlug);
      if (found) {
        category = found;
        parentCategory = parent;
        break;
      }
    }
  }
  
  // Check if this is a Cricket subcategory
  const isCricketSubcategory = categorySlug === 'cricket' || (parentCategory?.slug === 'sports' && categorySlug === 'cricket');
  
  // Normalize and dedupe category display name (prevents "Football Football" etc.)
  const dedupeAdjacentWords = (str: string) => {
    // Remove duplicate consecutive words (case-insensitive)
    return str.split(' ')
      .filter((word, i, arr) => i === 0 || word.toLowerCase() !== arr[i - 1]?.toLowerCase())
      .join(' ')
      .trim();
  };
  
  const displayName = dedupeAdjacentWords(category?.name ?? '');
  const baseTitle = `${displayName} News`;
  
  // Generate breadcrumb data
  const breadcrumbItems = [
    { name: "Home", url: window.location.origin },
    ...(parentCategory ? [{ name: parentCategory.name, url: `${window.location.origin}/category/${parentCategory.slug}` }] : []),
    { name: displayName || "", url: window.location.href }
  ];

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The category you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/">Return to Homepage</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Generate canonical URL
  const baseUrl = parentCategory 
    ? `${window.location.origin}/${parentCategory.slug}/${category.slug}`
    : `${window.location.origin}/category/${category.slug}`;
  const canonicalPageUrl = currentPage > 1 ? `${baseUrl}/page/${currentPage}` : baseUrl;

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      
      <SEOHead
        title={currentPage > 1 ? `${baseTitle} - Page ${currentPage} - TheBulletinBriefs` : `${baseTitle} - TheBulletinBriefs`}
        description={category.description || `Latest ${displayName.toLowerCase()} news and articles from TheBulletinBriefs.`}
        type="website"
        canonicalUrl={canonicalPageUrl}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: baseTitle,
          description: category.description || `Latest ${displayName.toLowerCase()} news and articles`,
          url: canonicalPageUrl,
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbItems.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: item.url
            }))
          },
          mainEntity: {
            "@type": "ItemList",
            name: `${displayName} Articles`,
            description: `Latest articles in ${displayName}`
          }
        }}
      />
      

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8" ref={contentRef}>
          {currentLanguage !== 'en' && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground text-center">
                🤖 Translated via AI
              </p>
            </div>
          )}
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {parentCategory && (
                <>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/category/${parentCategory.slug}`}>{parentCategory.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{displayName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Category Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {baseTitle}
              </h1>
            </div>
            {category.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                {category.description}
              </p>
            )}
          </div>

          {/* Content - display article grid for all categories */}
          {isCricketSubcategory && <CricketMatchesSection />}
          <ArticleGrid categorySlug={categorySlug} />
        </main>
      </div>
    </>
  );
}
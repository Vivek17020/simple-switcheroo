import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/public/navbar";
import { ArticleGrid } from "@/components/public/article-grid";
import { useCategories, useArticles, Category } from "@/hooks/use-articles";
import { SEOHead } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "@/components/public/share-buttons";
import { CommentsSection } from "@/components/public/comments-section";
import { LikeButton } from "@/components/public/like-button";
import { ArrowLeft, FileText, Calendar, Clock, Eye, User, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { slug, parentSlug, childSlug } = useParams<{ slug?: string; parentSlug?: string; childSlug?: string }>();
  
  // Determine the actual category slug to use
  const categorySlug = childSlug || slug;
  const { data: categories } = useCategories();
  
  const { data: articlesData, isLoading: articlesLoading } = useArticles(categorySlug, 1, 6);
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
  
  
  // Generate breadcrumb data
  const breadcrumbItems = [
    { name: "Home", url: window.location.origin },
    ...(parentCategory ? [{ name: parentCategory.name, url: `${window.location.origin}/category/${parentCategory.slug}` }] : []),
    { name: category?.name || "", url: window.location.href }
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

  // Construct proper canonical URL based on category structure
  const canonicalUrl = parentCategory 
    ? `https://www.thebulletinbriefs.in/${parentCategory.slug}/${category.slug}`
    : `https://www.thebulletinbriefs.in/category/${category.slug}`;

  // Generate SEO-optimized meta title and description
  const seoTitle = parentCategory 
    ? `${category.name} - ${parentCategory.name} News & Updates | TheBulletinBriefs`
    : `${category.name} News - Latest Updates & Breaking Stories | TheBulletinBriefs`;
  
  const seoDescription = category.description 
    ? category.description.substring(0, 160)
    : `Stay updated with latest ${category.name.toLowerCase()} news, breaking stories, and in-depth analysis from TheBulletinBriefs. Comprehensive coverage you can trust.`;

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        url={canonicalUrl}
        type="website"
        tags={category.name ? [category.name.toLowerCase(), 'news', 'articles', 'breaking news', 'updates'] : undefined}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.name} News`,
          description: category.description || seoDescription,
          url: canonicalUrl,
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
            name: `${category.name} Articles`,
            description: `Latest ${category.name.toLowerCase()} articles and news coverage`,
            numberOfItems: articlesData?.totalCount || 0
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
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Category Header with SEO Content */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {category.name} News
                </h1>
              </div>
              {articlesData && (
                <p className="text-sm text-muted-foreground">
                  {articlesData.totalCount > 0 
                    ? `${articlesData.totalCount} article${articlesData.totalCount === 1 ? '' : 's'} available`
                    : 'No articles in this category yet'
                  }
                </p>
              )}
            </div>

            {/* SEO-Rich Category Description */}
            {category.description && (
              <div className="max-w-4xl mx-auto mb-8 p-6 bg-card border rounded-lg">
                <p className="text-base leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </div>
            )}
          </div>

          {/* Related Categories/Subcategories */}
          {!parentCategory && category.subcategories && category.subcategories.length > 0 && (
            <div className="mb-12 border rounded-lg p-6 bg-card">
              <h2 className="text-2xl font-bold mb-4">Explore {category.name} Topics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {category.subcategories.map((subcat) => (
                  <Link
                    key={subcat.id}
                    to={`/${category.slug}/${subcat.slug}`}
                    className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all bg-background"
                  >
                    <h3 className="font-semibold mb-1">{subcat.name}</h3>
                    {subcat.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {subcat.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sibling Categories (for subcategories) */}
          {parentCategory && parentCategory.subcategories && parentCategory.subcategories.length > 1 && (
            <div className="mb-12 border rounded-lg p-6 bg-card">
              <h2 className="text-2xl font-bold mb-4">More in {parentCategory.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {parentCategory.subcategories
                  .filter(subcat => subcat.id !== category.id)
                  .map((subcat) => (
                    <Link
                      key={subcat.id}
                      to={`/${parentCategory.slug}/${subcat.slug}`}
                      className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all bg-background"
                    >
                      <h3 className="font-semibold mb-1">{subcat.name}</h3>
                      {subcat.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {subcat.description}
                        </p>
                      )}
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Article Grid for All Categories */}
          <ArticleGrid categorySlug={categorySlug} />
        </main>
      </div>
    </>
  );
}
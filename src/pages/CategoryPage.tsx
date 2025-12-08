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
import { sanitizeHtml } from "@/lib/sanitize";
import { LikeButton } from "@/components/public/like-button";
import { ArrowLeft, FileText, Calendar, Clock, Eye, User, ChevronRight } from "lucide-react";
import { CricketMatchesSection } from "@/components/public/cricket-matches-section";
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
  const { slug, parentSlug, childSlug, pageNumber } = useParams<{ 
    slug?: string; 
    parentSlug?: string; 
    childSlug?: string;
    pageNumber?: string;
  }>();
  
  // Determine the actual category slug to use
  const categorySlug = childSlug || slug;
  const currentPage = pageNumber ? parseInt(pageNumber, 10) : 1;
  const articlesPerPage = 20;
  
  const { data: categories } = useCategories();
  
  // For Jobs subcategories, fetch the oldest article (first posted)
  const isJobsSubcategory = parentSlug === 'jobs';
  const { data: articlesData, isLoading: articlesLoading } = useArticles(
    categorySlug, 
    currentPage, 
    articlesPerPage,
    isJobsSubcategory ? 'oldest' : undefined
  );
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
  
  // Check if this is a Jobs subcategory or Cricket subcategory
  const isJobsSubcategoryView = parentCategory?.slug === 'jobs' || (categorySlug && categories?.some(c => c.slug === 'jobs' && c.subcategories?.some(s => s.slug === categorySlug)));
  const isCricketSubcategory = categorySlug === 'cricket' || (parentCategory?.slug === 'sports' && categorySlug === 'cricket');
  const article = articlesData?.articles?.[0];
  
  // Normalize and dedupe category display name (prevents "Football Football" etc.)
  const dedupeAdjacentWords = (str: string) => {
    // Remove duplicate consecutive words (case-insensitive)
    return str.split(' ')
      .filter((word, i, arr) => i === 0 || word.toLowerCase() !== arr[i - 1]?.toLowerCase())
      .join(' ')
      .trim();
  };
  
  const displayName = dedupeAdjacentWords(category?.name ?? '');
  const baseTitle = isJobsSubcategoryView ? displayName : `${displayName} News`;
  
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

  // Calculate pagination
  const totalPages = articlesData ? Math.ceil(articlesData.totalCount / articlesPerPage) : 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  // Generate prev/next URLs
  const baseUrl = parentCategory 
    ? `${window.location.origin}/${parentCategory.slug}/${category.slug}`
    : `${window.location.origin}/category/${category.slug}`;
  const prevUrl = hasPrevPage ? `${baseUrl}/page/${currentPage - 1}` : undefined;
  const nextUrl = hasNextPage ? `${baseUrl}/page/${currentPage + 1}` : undefined;
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
            description: `Latest articles in ${displayName}`,
            numberOfItems: articlesData?.totalCount || 0
          }
        }}
      />
      
      {/* Pagination SEO Tags */}
      {(hasPrevPage || hasNextPage) && (
        <>
          {prevUrl && (
            <link rel="prev" href={prevUrl} />
          )}
          {nextUrl && (
            <link rel="next" href={nextUrl} />
          )}
        </>
      )}

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
            {articlesData && (
              <p className="text-sm text-muted-foreground">
                {articlesData.totalCount > 0 
                  ? `${articlesData.totalCount} article${articlesData.totalCount === 1 ? '' : 's'} available`
                  : 'No articles in this category yet'
                }
              </p>
            )}
          </div>

          {/* Content based on category type */}
          {isJobsSubcategoryView ? (
            // For Jobs categories, display full article content directly
            articlesLoading ? (
              <div className="max-w-4xl mx-auto">
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-8" />
                <Skeleton className="aspect-[16/9] w-full mb-8" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ) : article ? (
              <div className="max-w-4xl mx-auto">
                {/* Article Header */}
                <header className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    {article.title}
                  </h2>
                  
                  {article.excerpt && (
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground" data-no-translate>
                      {article.public_profiles?.username && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>By {article.public_profiles.username}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={new Date(article.published_at || article.created_at).toISOString()}>
                          {formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}
                        </time>
                      </div>
                      {article.reading_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{article.reading_time} min read</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>{article.views_count} views</span>
                      </div>
                    </div>
                    
                    <ShareButtons 
                      url={`${window.location.origin}/article/${article.slug}`}
                      title={article.title}
                      description={article.excerpt || ""}
                      articleId={article.id}
                    />
                  </div>
                </header>

                {/* Featured Image */}
                {article.image_url && (
                  <div className="mb-8 overflow-hidden rounded-lg">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full aspect-[16/9] object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Article Content */}
                <article className="prose prose-lg max-w-none dark:prose-invert mb-12 article-content">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
                </article>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-lg font-semibold mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Section */}
                <div className="border-t border-border pt-8 mb-12">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <LikeButton articleId={article.id} />
                      <h3 className="text-lg font-semibold">Share this article</h3>
                    </div>
                    <ShareButtons 
                      url={`${window.location.origin}/article/${article.slug}`}
                      title={article.title}
                      description={article.excerpt || ""}
                      articleId={article.id}
                    />
                  </div>
                </div>

                {/* Comments Section */}
                <CommentsSection articleId={article.id} />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No article available in this category yet.</p>
              </div>
            )
          ) : (
            // For regular categories, display article grid with cricket matches section if applicable
            <>
              {isCricketSubcategory && <CricketMatchesSection />}
              <ArticleGrid categorySlug={categorySlug} />
            </>
          )}
        </main>
      </div>
    </>
  );
}
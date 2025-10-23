import React, { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useArticle } from "@/hooks/use-articles";
import { useTrackReading } from "@/hooks/use-reading-history";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { ContinuousArticleReader } from "@/components/public/continuous-article-reader";
import { ShareButtons } from "@/components/public/share-buttons";
import { CommentsSection } from "@/components/public/comments-section";
import { LikeButton } from "@/components/public/like-button";
import { AuthorBio } from "@/components/public/author-bio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead, generateArticleStructuredData, generateSEOKeywords } from "@/utils/seo";
import { BreadcrumbSchema, useBreadcrumbs } from "@/components/seo/breadcrumb-schema";
import { sanitizeHtml } from "@/lib/sanitize";
import { Calendar, Clock, Eye, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getFirstName } from "@/lib/utils";
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

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticle(slug!);
  const trackReading = useTrackReading();
  const contentRef = useRef<HTMLDivElement>(null);
  const { currentLanguage } = useTranslation();
  
  useAutoTranslate(contentRef);

  // Track reading when article loads
  useEffect(() => {
    if (article?.id) {
      // Track initial view
      trackReading.mutate({ 
        articleId: article.id,
        duration: 0,
        percentage: 0
      });

      // Track reading time and scroll percentage
      const startTime = Date.now();
      let maxScroll = 0;

      const handleScroll = () => {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        maxScroll = Math.max(maxScroll, scrolled);
      };

      const handleBeforeUnload = () => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        trackReading.mutate({ 
          articleId: article.id,
          duration,
          percentage: Math.floor(maxScroll)
        });
      };

      window.addEventListener('scroll', handleScroll);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        // Track final reading stats
        const duration = Math.floor((Date.now() - startTime) / 1000);
        trackReading.mutate({ 
          articleId: article.id,
          duration,
          percentage: Math.floor(maxScroll)
        });
      };
    }
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <Skeleton className="aspect-[16/9] w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">Return to Homepage</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const publishedDate = article.published_at ? new Date(article.published_at) : new Date(article.created_at);
  // Use database canonical URL if available, fallback to generated
  const canonicalUrl = (article as any).canonical_url || `https://www.thebulletinbriefs.in/article/${article.slug}`;
  
  // Auto-generate SEO keywords from article content
  const seoKeywords = generateSEOKeywords(article.title, article.content, article.tags);
  
  // Generate breadcrumbs
  const breadcrumbs = useBreadcrumbs(
    article.title, 
    article.categories?.name, 
    article.categories?.slug
  );
  const authorUsername = article.public_profiles?.username || article.profiles?.username;

  return (
    <>
      <SEOHead
        title={article.meta_title || article.title}
        description={article.meta_description || article.excerpt || ""}
        image={article.image_url || undefined}
        url={canonicalUrl}
        type="article"
        publishedTime={article.published_at || article.created_at}
        modifiedTime={article.updated_at}
        author={article.author}
        tags={seoKeywords}
        content={article.content}
        structuredData={generateArticleStructuredData({
          title: article.title,
          description: article.excerpt || "",
          author: article.author,
          authorUsername: article.profiles?.username,
          publishedTime: article.published_at || article.created_at,
          modifiedTime: article.updated_at,
          image: article.image_url || undefined,
          url: canonicalUrl,
          keywords: seoKeywords,
        })}
      />
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8" ref={contentRef}>
          <div className="max-w-4xl mx-auto">
            {/* Visual Breadcrumbs */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/category/${article.categories?.slug}`}>
                      {article.categories?.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[200px] md:max-w-md truncate">
                    {article.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {article.categories?.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(publishedDate, "MMMM d, yyyy")}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {authorUsername && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>By {authorUsername}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDistanceToNow(publishedDate, { addSuffix: true })}</span>
                  </div>
                  {article.updated_at && article.published_at && 
                   new Date(article.updated_at) > new Date(article.published_at) && (
                    <div className="flex items-center gap-1 text-primary">
                      <Clock className="h-4 w-4" />
                      <span>Updated {format(new Date(article.updated_at), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{article.reading_time} min read</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{article.views_count} views</span>
                  </div>
                </div>
                
                <ShareButtons 
                  url={canonicalUrl}
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
                  width="1200"
                  height="675"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  style={{ objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '16/9' }}
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
                  url={canonicalUrl}
                  title={article.title}
                  description={article.excerpt || ""}
                  articleId={article.id}
                />
              </div>
            </div>

            {/* Author Bio */}
            <AuthorBio 
              authorId={article.author_id || undefined} 
              authorName={article.author}
              authorUsername={article.profiles?.username}
            />

            {/* Comments Section */}
            <CommentsSection articleId={article.id} />

            {/* Continuous Article Reader */}
            <ContinuousArticleReader 
              articleId={article.id}
              categoryId={article.category_id}
              tags={article.tags || []}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Calendar, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";
import { UPSCTOCGenerator } from "@/components/upsc/UPSCTOCGenerator";
import { UPSCStructuredData } from "@/components/upsc/UPSCStructuredData";
import { useUPSCArticle, useUPSCArticles } from "@/hooks/use-upsc-articles";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const UPSCArticlePage = () => {
  const { categorySlug, articleSlug } = useParams<{ categorySlug: string; articleSlug: string }>();
  const { data: article, isLoading } = useUPSCArticle(categorySlug || "", articleSlug || "");
  const { data: relatedArticles = [] } = useUPSCArticles(categorySlug, 5);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Article not found</p>
        <Button asChild variant="outline">
          <Link to="/upscbriefs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const otherArticles = relatedArticles.filter((a) => a.id !== article.id).slice(0, 4);

  return (
    <>
      <Helmet>
        <title>{article.meta_title || article.title} | UPSCBriefs</title>
        <meta
          name="description"
          content={article.meta_description || article.excerpt || `${article.title} - UPSC notes and study material.`}
        />
        <meta name="keywords" content={article.seo_keywords?.join(", ") || `UPSC, ${article.category_name}, IAS`} />
        <link rel="canonical" href={`https://www.thebulletinbriefs.in/upscbriefs/${categorySlug}/${articleSlug}`} />
      </Helmet>

      <UPSCStructuredData
        type="article"
        data={{
          title: article.title,
          description: article.meta_description || article.excerpt || "",
          url: `https://www.thebulletinbriefs.in/upscbriefs/${categorySlug}/${articleSlug}`,
          datePublished: article.created_at,
          dateModified: article.updated_at,
          subject: article.category_name,
        }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <UPSCBreadcrumb
          items={[
            { label: article.category_name, href: `/upscbriefs/${categorySlug}` },
            { label: article.title },
          ]}
        />

        {/* Header */}
        <header className="mb-8">
          <Badge
            variant="secondary"
            className="mb-3"
            style={{
              backgroundColor: `${article.category_color}15`,
              color: article.category_color,
            }}
          >
            {article.category_name}
          </Badge>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(article.created_at), "MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.reading_time || 5} min read
            </span>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </header>

        {/* Table of Contents */}
        <div className="mb-8">
          <UPSCTOCGenerator content={article.content} />
        </div>

        {/* Content */}
        <div
          className="prose prose-gray max-w-none
            prose-headings:scroll-mt-20
            prose-h2:text-xl prose-h2:font-bold prose-h2:text-gray-900 prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:font-semibold prose-h3:text-gray-800 prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-li:text-gray-700
            prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900
            prose-table:border prose-table:border-gray-200
            prose-th:bg-gray-50 prose-th:p-3 prose-th:text-left prose-th:font-semibold
            prose-td:p-3 prose-td:border-t prose-td:border-gray-200"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Related Articles */}
        {otherArticles.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Related Articles</h2>
            <ul className="space-y-3">
              {otherArticles.map((relatedArticle) => (
                <li key={relatedArticle.id}>
                  <Link
                    to={`/upscbriefs/${relatedArticle.category_slug}/${relatedArticle.slug}`}
                    className="text-gray-700 hover:text-blue-700 transition-colors"
                  >
                    {relatedArticle.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
};

export default UPSCArticlePage;

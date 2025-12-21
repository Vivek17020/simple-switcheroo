import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Web3ProgressButton } from "@/components/web3/Web3ProgressButton";
import { Web3Breadcrumb } from "@/components/web3/Web3Breadcrumb";
import { Web3StructuredData } from "@/components/web3/Web3StructuredData";

export default function Web3ArticlePage() {
  const { slug, articleSlug, categorySlug } = useParams();
  const actualSlug = articleSlug || slug; // Support both URL patterns

  const { data: article, isLoading } = useQuery({
    queryKey: ["web3-article", actualSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          categories:category_id(id, name, slug, color)
        `)
        .eq("slug", actualSlug)
        .eq("published", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!actualSlug,
  });

  // Fetch related articles from same category
  const { data: relatedArticles } = useQuery({
    queryKey: ["web3-related-articles", article?.category_id, article?.id],
    queryFn: async () => {
      if (!article?.category_id) return [];
      
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, image_url, excerpt, reading_time")
        .eq("category_id", article.category_id)
        .eq("published", true)
        .neq("id", article.id)
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!article?.category_id && !!article?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-16 w-full max-w-4xl mb-4" />
          <Skeleton className="h-96 w-full max-w-4xl mb-8" />
          <Skeleton className="h-64 w-full max-w-4xl" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <Link to="/web3forindia" className="text-[#6A5BFF] hover:text-[#4AC4FF]">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} | Web3 for India Tutorial - Blockchain Learning</title>
        <meta 
          name="description" 
          content={`${article.excerpt || article.summary || article.title} - Learn Web3, Blockchain, Smart Contracts, DeFi, NFTs and cryptocurrency with comprehensive tutorials and guides.`}
        />
        <meta 
          name="keywords" 
          content={`${article.tags?.join(', ')}, web3 tutorial, blockchain guide, smart contracts, cryptocurrency, ${article.categories?.name}`}
        />
        <link rel="canonical" href={`https://www.thebulletinbriefs.in/web3forindia/${article.categories?.slug}/${article.slug}`} />
        <meta property="og:title" content={`${article.title} - Web3 for India`} />
        <meta property="og:description" content={article.excerpt || article.summary || ""} />
        <meta property="og:image" content={article.image_url || "https://www.thebulletinbriefs.in/og-image.jpg"} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.thebulletinbriefs.in/web3forindia/${article.categories?.slug}/${article.slug}`} />
        <meta property="article:published_time" content={article.published_at || ""} />
        <meta property="article:modified_time" content={article.updated_at} />
        <meta property="article:section" content={article.categories?.name} />
        {article.tags?.map((tag: string) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Helmet>

      {/* Structured Data */}
      <Web3StructuredData
        type="article"
        data={{
          headline: article.title,
          description: article.excerpt || article.summary || "",
          author: article.author,
          datePublished: article.published_at || article.created_at,
          dateModified: article.updated_at,
          imageUrl: article.image_url || undefined,
          articleUrl: `https://www.thebulletinbriefs.in/web3forindia/${article.categories?.slug}/${article.slug}`,
        }}
      />

      <Web3StructuredData
        type="breadcrumb"
        data={{
          breadcrumbs: [
            { name: "Web3 for India", url: "https://www.thebulletinbriefs.in/web3forindia" },
            { name: article.categories?.name || "Category", url: `https://www.thebulletinbriefs.in/web3forindia/${article.categories?.slug}` },
            { name: article.title, url: `https://www.thebulletinbriefs.in/web3forindia/${article.categories?.slug}/${article.slug}` },
          ],
        }}
      />

      <article className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <Web3Breadcrumb
              items={[
                { 
                  label: article.categories?.name || "Category", 
                  href: `/web3forindia/${article.categories?.slug}` 
                },
                { label: article.title },
              ]}
            />

            {/* Category Badge */}
            {article.categories && (
              <Link to={`/web3forindia/${article.categories.slug}`}>
                <Badge className="mb-4 bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white border-0">
                  {article.categories.name}
                </Badge>
              </Link>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 max-w-4xl">
              {article.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6">
              {article.published_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(article.published_at), "MMM dd, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{article.reading_time || 5} min read</span>
              </div>
            </div>

            {/* Progress Button */}
            <Web3ProgressButton 
              articleId={article.id} 
              readingTime={article.reading_time || 5}
            />
          </div>
        </div>

        {/* Featured Image */}
        {article.image_url && (
          <div className="w-full max-w-4xl mx-auto px-4 py-8">
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div 
            className="web3-article-content prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#6A5BFF] hover:prose-a:text-[#4AC4FF]"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[#6A5BFF] border-[#6A5BFF]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div className="bg-gray-50 py-16 mt-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Tutorials</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link 
                    key={related.id}
                    to={`/web3forindia/${article.categories?.slug}/${related.slug}`}
                    className="group"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#6A5BFF] transition-all">
                      {related.image_url && (
                        <img 
                          src={related.image_url} 
                          alt={related.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#6A5BFF] transition-colors">
                          {related.title}
                        </h3>
                        {related.excerpt && (
                          <p className="text-sm text-gray-600 line-clamp-2">{related.excerpt}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </>
  );
}

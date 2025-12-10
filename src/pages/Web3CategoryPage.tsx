import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TutorialCard } from "@/components/web3/TutorialCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Web3Breadcrumb } from "@/components/web3/Web3Breadcrumb";
import { Web3StructuredData } from "@/components/web3/Web3StructuredData";

export default function Web3CategoryPage() {
  const { categorySlug } = useParams();

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["web3-category", categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!categorySlug,
  });

  // Fetch articles for this category
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ["web3-category-articles", category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("category_id", category.id)
        .eq("published", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  const isLoading = categoryLoading || articlesLoading;

  return (
    <>
      <Helmet>
        <title>{category?.name ? `${category.name} Tutorials | Web3 for India` : 'Web3 Tutorials | Web3 for India'}</title>
        <meta 
          name="description" 
          content={category?.description || `Learn Web3, blockchain, smart contracts, DeFi, and cryptocurrency with comprehensive tutorials for India.`}
        />
        <meta 
          name="keywords" 
          content={`${category?.name || 'web3'}, web3 tutorial, blockchain guide, smart contracts india, ${categorySlug}`}
        />
        <link rel="canonical" href={`https://www.thebulletinbriefs.in/web3forindia/${categorySlug}`} />
        <meta property="og:title" content={category?.name ? `${category.name} Tutorials | Web3 for India` : 'Web3 Tutorials | Web3 for India'} />
        <meta property="og:description" content={category?.description || 'Learn Web3 with comprehensive tutorials'} />
        <meta property="og:url" content={`https://www.thebulletinbriefs.in/web3forindia/${categorySlug}`} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Structured Data - Course Schema */}
      <Web3StructuredData
        type="course"
        data={{
          courseName: `${category?.name} - Web3 for India`,
          courseDescription: category?.description || `Learn ${category?.name} with comprehensive tutorials`,
          provider: "Web3 for India",
          courseUrl: `https://www.thebulletinbriefs.in/web3forindia/${categorySlug}`,
          modules: articles?.slice(0, 5).map((article: any) => ({
            name: article.title,
            description: article.excerpt || article.summary || "",
            url: `https://www.thebulletinbriefs.in/web3forindia/${categorySlug}/${article.slug}`,
          })),
        }}
      />

      {/* Breadcrumb Schema */}
      <Web3StructuredData
        type="breadcrumb"
        data={{
          breadcrumbs: [
            { name: "Web3 for India", url: "https://www.thebulletinbriefs.in/web3forindia" },
            { name: category?.name || "Category", url: `https://www.thebulletinbriefs.in/web3forindia/${categorySlug}` },
          ],
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#6A5BFF]/10 via-white to-[#4AC4FF]/10 py-16">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#6A5BFF]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#4AC4FF]/20 rounded-full blur-3xl" />
          
          <div className="container relative mx-auto px-4">
            {/* Breadcrumb */}
            <Web3Breadcrumb
              items={[
                { label: category?.name || "Category" },
              ]}
            />

            {categoryLoading ? (
              <Skeleton className="h-12 w-96 mb-4" />
            ) : (
              <>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent mb-4">
                  {category?.name}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  {category?.description}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="container mx-auto px-4 py-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <TutorialCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt || article.summary || ""}
                  slug={article.slug}
                  categorySlug={category?.slug}
                  readingTime={article.reading_time || 5}
                  imageUrl={article.image_url || undefined}
                  tags={article.tags || []}
                  difficulty={
                    article.tags?.includes("beginner") ? "Beginner" :
                    article.tags?.includes("advanced") ? "Advanced" :
                    "Intermediate"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#6A5BFF]/20 to-[#4AC4FF]/20 flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Tutorials Yet</h3>
              <p className="text-gray-600 mb-8">We're working on creating amazing content for this category. Check back soon!</p>
              <Link 
                to="/web3forindia" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Explore Other Topics
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

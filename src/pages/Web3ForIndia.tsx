import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Web3Hero } from "@/components/web3/Web3Hero";
import { TopicCard } from "@/components/web3/TopicCard";
import { TutorialCard } from "@/components/web3/TutorialCard";
import { StatsCounter } from "@/components/web3/StatsCounter";
import { LearningPath } from "@/components/web3/LearningPath";
import { useWeb3Progress } from "@/hooks/use-web3-progress";
import { Blocks, Code, Coins, FileCode, Landmark, Palette, Shield, Newspaper, Wrench, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";
import { Web3StructuredData } from "@/components/web3/Web3StructuredData";

const topicIcons: Record<string, any> = {
  "blockchain-basics": Blocks,
  "smart-contracts": Code,
  defi: Landmark,
  nfts: Palette,
  "web3-development": FileCode,
  "crypto-fundamentals": Coins,
  "blockchain-india": Shield,
};

export default function Web3ForIndia() {
  const { learningPaths, pathsLoading } = useWeb3Progress();
  
  // Fetch everything in a single optimized query
  const { data: web3Data, isLoading } = useQuery({
    queryKey: ["web3-complete-data"],
    queryFn: async () => {
      // Fetch category with subcategories in one query
      const { data: category, error: catError } = await supabase
        .from("categories")
        .select(`
          *,
          subcategories:categories!parent_id(*)
        `)
        .eq("slug", "web3forindia")
        .single();
      
      if (catError) throw catError;
      
      const subcategories = Array.isArray(category.subcategories) 
        ? category.subcategories 
        : [];
      const subcatIds = subcategories.map((s: any) => s.id);
      
      // Fetch articles and counts in parallel
      const [articlesResult, countsResults] = await Promise.all([
        // Fetch articles with category info
        subcatIds.length > 0
          ? supabase
              .from("articles")
              .select(`
                *,
                category:categories!category_id(slug)
              `)
              .in("category_id", subcatIds)
              .eq("published", true)
              .order("created_at", { ascending: false })
              .limit(6)
          : Promise.resolve({ data: [], error: null }),
        // Fetch counts for all subcategories in parallel
        Promise.all(
          subcategories.map(async (subcat) => {
            const { count } = await supabase
              .from("articles")
              .select("*", { count: "exact", head: true })
              .eq("category_id", subcat.id)
              .eq("published", true);
            return { id: subcat.id, count: count || 0 };
          })
        ),
      ]);
      
      const articleCounts: Record<string, number> = {};
      countsResults.forEach(({ id, count }) => {
        articleCounts[id] = count;
      });
      
      return {
        category,
        subcategories,
        articles: articlesResult.data || [],
        articleCounts,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  const web3Category = web3Data?.category;
  const subcategories = web3Data?.subcategories || [];
  const latestArticles = web3Data?.articles || [];
  const articleCounts = web3Data?.articleCounts || {};
  
  // Calculate total stats
  const totalArticles = Object.values(articleCounts).reduce((sum, count) => sum + count, 0);
  const totalTopics = subcategories.length;

  const articlesLoading = isLoading;

  return (
    <>
      <Helmet>
        <title>Web3 for India - Learn Blockchain, Smart Contracts & Cryptocurrency | Free Tutorials</title>
        <meta
          name="description"
          content="Master blockchain technology and Web3 development with free tutorials in Hindi and English. Learn smart contracts, DeFi, NFTs, cryptocurrency, Solidity programming, and Web3 development specifically designed for Indian developers and beginners."
        />
        <meta name="keywords" content="web3 india, blockchain tutorial hindi, smart contracts tutorial, cryptocurrency guide india, DeFi tutorial, NFT guide, solidity programming, blockchain development india, web3 development course, ethereum tutorial" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/web3forindia" />
        <meta property="og:title" content="Web3 for India - Free Blockchain & Cryptocurrency Learning Platform" />
        <meta property="og:description" content="Comprehensive Web3 learning platform for Indians. Free tutorials on blockchain, smart contracts, DeFi, NFTs, and cryptocurrency." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.thebulletinbriefs.in/web3forindia" />
        <meta property="og:image" content="https://www.thebulletinbriefs.in/og-images/web3-homepage.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Web3 for India - Free Blockchain & Cryptocurrency Learning" />
        <meta name="twitter:description" content="Master blockchain, smart contracts, and cryptocurrency with free tutorials in Hindi & English." />
        <meta name="twitter:image" content="https://www.thebulletinbriefs.in/og-images/web3-homepage.jpg" />
      </Helmet>

      {/* FAQ Schema */}
      <Web3StructuredData
        type="faq"
        data={{
          faqs: [
            {
              question: "What is Web3 and why should I learn it?",
              answer: "Web3 represents the next evolution of the internet, built on blockchain technology. Learning Web3 opens opportunities in cryptocurrency, smart contracts, DeFi, NFTs, and decentralized applications. India has a growing Web3 ecosystem with numerous job opportunities for skilled developers.",
            },
            {
              question: "Is this Web3 course suitable for beginners?",
              answer: "Yes! Web3 for India offers tutorials for all levels - from complete beginners to advanced developers. Start with Blockchain Basics and progress through our structured learning paths at your own pace.",
            },
            {
              question: "Do I need programming knowledge to start learning Web3?",
              answer: "Basic programming knowledge is helpful but not required for beginner tutorials. For smart contract development, JavaScript/TypeScript knowledge is recommended. We provide beginner-friendly tutorials to get you started.",
            },
            {
              question: "What topics are covered in Web3 for India?",
              answer: "We cover Blockchain Basics, Smart Contracts with Solidity, DeFi (Decentralized Finance), NFTs, Cryptocurrency fundamentals, Web3 Development, and Blockchain regulations in India. All tutorials include practical examples and real-world use cases.",
            },
            {
              question: "Is the content available in Hindi?",
              answer: "Currently, our tutorials are in English, but we're working on Hindi translations. The content is designed to be accessible for Indian learners with clear explanations and practical examples relevant to the Indian context.",
            },
          ],
        }}
      />

      {/* Course Schema */}
      <Web3StructuredData
        type="course"
        data={{
          courseName: "Web3 for India - Complete Blockchain & Cryptocurrency Course",
          courseDescription: "Comprehensive Web3 learning platform covering blockchain technology, smart contracts, DeFi, NFTs, and cryptocurrency development specifically designed for Indian developers and beginners.",
          provider: "The Bulletin Briefs",
          courseUrl: "https://www.thebulletinbriefs.in/web3forindia",
          modules: subcategories?.map((cat: any) => ({
            name: cat.name,
            description: cat.description || `Learn ${cat.name} with comprehensive tutorials`,
            url: `https://www.thebulletinbriefs.in/web3forindia/${cat.slug}`,
          })),
        }}
      />

      <div className="min-h-screen bg-background">
        <Web3Hero />

        <div className="container mx-auto px-4 pb-16">
          <StatsCounter totalArticles={totalArticles} totalTopics={totalTopics} />

          {/* Topics Grid */}
          <section className="mb-20" id="tutorials">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-3">Explore Web3 Topics</h2>
              <p className="text-foreground/70 text-lg">Choose a learning path and start your Web3 journey</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subcategories?.map((subcat) => {
                  const Icon = topicIcons[subcat.slug] || Blocks;
                  return (
                    <TopicCard
                      key={subcat.id}
                      title={subcat.name}
                      description={subcat.description || ""}
                      slug={subcat.slug}
                      icon={Icon}
                      articleCount={articleCounts?.[subcat.id] || 0}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Learning Paths */}
          <section className="mb-20" id="learning-paths">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-3">Recommended Learning Paths</h2>
              <p className="text-foreground/70 text-lg">Structured curriculum to master Web3 from basics to advanced</p>
            </div>

            {pathsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-96 rounded-2xl" />
                ))}
              </div>
            ) : learningPaths && learningPaths.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningPaths.map((path) => {
                  const steps = (path.steps as any[]) || [];
                  return (
                    <LearningPath
                      key={path.id}
                      title={path.title}
                      description={path.description || ""}
                      duration={path.duration}
                      level={path.difficulty as "Beginner" | "Intermediate" | "Advanced"}
                      steps={steps.map((s) => ({ 
                        title: s.title || "Step",
                        description: s.description,
                        article_slug: s.article_slug,
                        completed: false 
                      }))}
                      slug={path.slug}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-foreground/70">
                <p>No learning paths available yet. Check back soon!</p>
              </div>
            )}
          </section>

          {/* Explore TheBulletinBriefs */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-3">Explore TheBulletinBriefs</h2>
              <p className="text-foreground/70 text-lg">Discover more content from our platform</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link to="/" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-[#6A5BFF]/50 bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4 group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <Newspaper className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Latest News</h3>
                    <p className="text-sm text-muted-foreground">Breaking news, politics, sports & entertainment</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/tools" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-[#6A5BFF]/50 bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mx-auto mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <Wrench className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Free Tools</h3>
                    <p className="text-sm text-muted-foreground">PDF, image & video tools - 100% free</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/web-stories" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-[#6A5BFF]/50 bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Web Stories</h3>
                    <p className="text-sm text-muted-foreground">Visual stories for quick updates</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          {/* Latest Tutorials */}
          <section>
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-3">Latest Tutorials</h2>
                <p className="text-foreground/70 text-lg">Fresh content added regularly</p>
              </div>
            </div>

            {articlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-96 rounded-2xl" />
                ))}
              </div>
            ) : latestArticles && latestArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.map((article) => (
                  <TutorialCard
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    excerpt={article.excerpt || article.summary || ""}
                    slug={article.slug}
                    categorySlug={(article as any).category?.slug}
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
              <div className="text-center py-12 text-foreground/70">
                <p>No tutorials available yet. Check back soon!</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Building, Globe, History, Leaf, Cpu, Palette, Users, TrendingUp, ArrowRight } from "lucide-react";
import { UPSCStructuredData } from "@/components/upsc/UPSCStructuredData";
import { useUPSCArticles, useUPSCCategoryArticleCount } from "@/hooks/use-upsc-articles";
import UPSCHero from "@/components/upsc/UPSCHero";
import UPSCHexagonGrid from "@/components/upsc/UPSCHexagonGrid";
import UPSCDailyBriefing from "@/components/upsc/UPSCDailyBriefing";
import UPSCQuickActions from "@/components/upsc/UPSCQuickActions";
import UPSCLatestBriefs from "@/components/upsc/UPSCLatestBriefs";

const subjects = [
  { name: "Polity", slug: "polity", description: "Constitution, Parliament, Judiciary", icon: Building, color: "#2563EB", gsPaper: "GS2" },
  { name: "Geography", slug: "geography", description: "Physical, Human, Economic Geography", icon: Globe, color: "#D97706", gsPaper: "GS1" },
  { name: "History", slug: "history", description: "Ancient, Medieval & Modern India", icon: History, color: "#DC2626", gsPaper: "GS1" },
  { name: "Environment", slug: "upsc-environment", description: "Climate Change, Biodiversity, Ecology", icon: Leaf, color: "#16A34A", gsPaper: "GS3" },
  { name: "Science & Tech", slug: "science-tech", description: "Space, IT, Biotechnology", icon: Cpu, color: "#7C3AED", gsPaper: "GS3" },
  { name: "Art & Culture", slug: "art-culture", description: "Heritage, Traditions, Music, Dance", icon: Palette, color: "#DB2777", gsPaper: "GS1" },
  { name: "International Relations", slug: "upsc-international-relations", description: "Foreign Policy, Organizations", icon: Users, color: "#0891B2", gsPaper: "GS2" },
  { name: "Society", slug: "society", description: "Social Issues, Welfare Schemes", icon: Users, color: "#EA580C", gsPaper: "GS1" },
  { name: "Current Affairs", slug: "upsc-daily-ca", description: "Daily news for UPSC", icon: TrendingUp, color: "#059669", gsPaper: "CA" },
];

const UPSCBriefs = () => {
  const { data: articles = [], isLoading } = useUPSCArticles(undefined, 20);
  const { data: articleCounts = {} } = useUPSCCategoryArticleCount();

  const subjectsWithCounts = subjects.map(subject => ({
    ...subject,
    articleCount: articleCounts[subject.slug] || 0,
  }));

  const totalArticles = Object.values(articleCounts).reduce((sum: number, count) => sum + (count as number), 0);

  return (
    <>
      <Helmet>
        <title>UPSCBriefs - UPSC Preparation Made Simple | Free IAS Study Material</title>
        <meta
          name="description"
          content="Free UPSC preparation material for IAS, IPS, and Civil Services. Clear, concise, and exam-oriented study notes for Polity, Economy, History, Geography, and more."
        />
        <meta name="keywords" content="UPSC, IAS, IPS, Civil Services, UPSC Notes, UPSC Preparation, GS Paper, Polity Notes, Economy Notes" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs" />
      </Helmet>

      <UPSCStructuredData type="website" data={{}} />

      {/* Hero Section - Command Center Style */}
      <UPSCHero totalArticles={totalArticles} />

      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
          {/* Quick Actions - Mobile friendly */}
          <UPSCQuickActions />
          
          {/* Daily Intelligence Brief */}
          {!isLoading && articles.length > 0 && (
            <UPSCDailyBriefing articles={articles} />
          )}
          
          {/* Subject Command - Hexagon Grid */}
          <UPSCHexagonGrid subjects={subjectsWithCounts} />
          
          {/* Latest Briefs - Intelligence Style */}
          {!isLoading && articles.length > 5 && (
            <UPSCLatestBriefs articles={articles} />
          )}

          {/* Back to Main Site */}
          <section className="mt-8 md:mt-12 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-slate-500 hover:text-blue-700 transition-colors py-3"
            >
              Visit The Bulletin Briefs for more news and updates
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
};

export default UPSCBriefs;

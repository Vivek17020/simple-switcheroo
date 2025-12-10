import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, TrendingUp, ArrowRight, Building, Globe, History, Leaf, Cpu, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPSCArticleList } from "@/components/upsc/UPSCArticleList";
import { UPSCSubjectCard } from "@/components/upsc/UPSCSubjectCard";
import { UPSCStructuredData } from "@/components/upsc/UPSCStructuredData";
import { useUPSCArticles, useUPSCCategoryArticleCount } from "@/hooks/use-upsc-articles";

const subjects = [
  { name: "Polity", slug: "polity", description: "Constitution, Parliament, Judiciary", icon: Building, color: "#2563EB" },
  { name: "Geography", slug: "geography", description: "Physical, Human, Economic Geography", icon: Globe, color: "#D97706" },
  { name: "History", slug: "history", description: "Ancient, Medieval & Modern India", icon: History, color: "#DC2626" },
  { name: "Environment", slug: "upsc-environment", description: "Climate Change, Biodiversity, Ecology", icon: Leaf, color: "#16A34A" },
  { name: "Science & Tech", slug: "science-tech", description: "Space, IT, Biotechnology", icon: Cpu, color: "#7C3AED" },
  { name: "Art & Culture", slug: "art-culture", description: "Heritage, Traditions, Music, Dance", icon: Palette, color: "#DB2777" },
  { name: "International Relations", slug: "upsc-international-relations", description: "Foreign Policy, Organizations", icon: Users, color: "#0891B2" },
  { name: "Society", slug: "society", description: "Social Issues, Welfare Schemes", icon: Users, color: "#EA580C" },
  { name: "Current Affairs", slug: "upsc-daily-ca", description: "Daily news for UPSC", icon: TrendingUp, color: "#059669" },
];

const UPSCBriefs = () => {
  const { data: articles = [], isLoading } = useUPSCArticles(undefined, 15);
  const { data: articleCounts = {} } = useUPSCCategoryArticleCount();

  return (
    <>
      <Helmet>
        <title>UPSCBriefs - UPSC Preparation Made Simple | Free IAS Study Material</title>
        <meta
          name="description"
          content="Free UPSC preparation material for IAS, IPS, and Civil Services. Clear, concise, and exam-oriented study notes for Polity, Economy, History, Geography, and more."
        />
        <meta name="keywords" content="UPSC, IAS, IPS, Civil Services, UPSC Notes, UPSC Preparation, GS Paper, Polity Notes, Economy Notes" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs" />
      </Helmet>

      <UPSCStructuredData type="website" data={{}} />

      {/* Hero Section - Mobile optimized */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-4 md:mb-6">
              <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium">Free UPSC Study Material</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              UPSC Preparation
              <span className="block text-blue-200">Made Simple</span>
            </h1>
            <p className="text-sm md:text-lg text-blue-100 mb-6 md:mb-8 px-2">
              Clear, concise, and exam-oriented study notes for IAS, IPS, and Civil Services aspirants.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 h-12 md:h-11">
                <Link to="#subjects">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Browse Subjects
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 h-12 md:h-11">
                <Link to="#latest">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Latest Articles
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
        {/* Mobile: Subjects first, then articles */}
        {/* Desktop: Articles first (in main column), subjects in sidebar then below */}
        
        {/* Mobile Subjects Horizontal Scroll - Only visible on mobile */}
        <section className="mb-6 md:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Quick Access</h2>
            <Link to="#subjects" className="text-sm text-blue-600 font-medium">
              View All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {subjects.slice(0, 6).map((subject) => (
              <Link
                key={subject.slug}
                to={`/upscbriefs/${subject.slug}`}
                className="flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl border border-gray-200 bg-white active:bg-gray-50 flex-shrink-0"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${subject.color}15` }}
                >
                  <subject.icon className="w-5 h-5" style={{ color: subject.color }} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{subject.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content - Latest Articles */}
          <div className="lg:col-span-2">
            <section id="latest">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Latest Articles</h2>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="p-3 md:p-4">
                  <UPSCArticleList articles={articles} loading={isLoading} />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <aside className="hidden md:block space-y-6">
            {/* Quick Stats */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Facts</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  9 Subject Categories
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full" />
                  Exam-Oriented Format
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full" />
                  Prelims MCQs Included
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full" />
                  Mains Answer Writing Tips
                </li>
              </ul>
            </div>

            {/* Popular Subjects */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Popular Subjects</h3>
              <ul className="space-y-2">
                {subjects.slice(0, 5).map((subject) => (
                  <li key={subject.slug}>
                    <Link
                      to={`/upscbriefs/${subject.slug}`}
                      className="flex items-center justify-between text-sm py-2 hover:text-blue-700 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <subject.icon className="w-4 h-4" style={{ color: subject.color }} />
                        {subject.name}
                      </span>
                      <span className="text-gray-400">{articleCounts[subject.slug] || 0}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Subjects Grid - Full width on all screens */}
        <section id="subjects" className="mt-8 md:mt-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Browse by Subject</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {subjects.map((subject) => (
              <UPSCSubjectCard
                key={subject.slug}
                name={subject.name}
                slug={subject.slug}
                description={subject.description}
                icon={subject.icon}
                color={subject.color}
                articleCount={articleCounts[subject.slug] || 0}
              />
            ))}
          </div>
        </section>

        {/* Back to Main Site */}
        <section className="mt-8 md:mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-700 transition-colors py-3"
          >
            Visit The Bulletin Briefs for more news and updates
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </section>
      </div>

      {/* Hide horizontal scrollbar but keep functionality */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default UPSCBriefs;
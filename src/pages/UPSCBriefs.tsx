import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, TrendingUp, ArrowRight, Building, FileText, Globe, History, Leaf, Cpu, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPSCArticleList } from "@/components/upsc/UPSCArticleList";
import { UPSCSubjectCard } from "@/components/upsc/UPSCSubjectCard";
import { UPSCStructuredData } from "@/components/upsc/UPSCStructuredData";
import { useUPSCArticles, useUPSCCategoryArticleCount } from "@/hooks/use-upsc-articles";

const subjects = [
  { name: "Polity", slug: "polity", description: "Constitution, Parliament, Judiciary", icon: Building, color: "#2563EB" },
  { name: "Economy", slug: "economy", description: "Budget, Banking, Economic Policies", icon: FileText, color: "#059669" },
  { name: "Geography", slug: "geography", description: "Physical, Human, Economic Geography", icon: Globe, color: "#D97706" },
  { name: "History", slug: "history", description: "Ancient, Medieval & Modern India", icon: History, color: "#DC2626" },
  { name: "Environment", slug: "environment", description: "Climate Change, Biodiversity, Ecology", icon: Leaf, color: "#16A34A" },
  { name: "Science & Tech", slug: "science-tech", description: "Space, IT, Biotechnology", icon: Cpu, color: "#7C3AED" },
  { name: "Art & Culture", slug: "art-culture", description: "Heritage, Traditions, Music, Dance", icon: Palette, color: "#DB2777" },
  { name: "International Relations", slug: "international-relations", description: "Foreign Policy, Organizations", icon: Users, color: "#0891B2" },
  { name: "Society", slug: "society", description: "Social Issues, Welfare Schemes", icon: Users, color: "#EA580C" },
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm font-medium">Free UPSC Study Material</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              UPSC Preparation
              <span className="block text-blue-200">Made Simple</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Clear, concise, and exam-oriented study notes for IAS, IPS, and Civil Services aspirants.
              No fluff, just what you need to crack the exam.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                <Link to="#subjects">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Browse Subjects
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="#latest">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Latest Articles
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Latest Articles */}
          <div className="lg:col-span-2">
            <section id="latest">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Latest Articles</h2>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4">
                  <UPSCArticleList articles={articles} loading={isLoading} />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
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
            <div className="bg-white border border-gray-200 rounded-lg p-4">
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

        {/* Subjects Grid */}
        <section id="subjects" className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Browse by Subject</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <section className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-700 transition-colors"
          >
            Visit The Bulletin Briefs for more news and updates
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </section>
      </div>
    </>
  );
};

export default UPSCBriefs;

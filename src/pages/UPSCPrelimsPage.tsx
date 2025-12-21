import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, CheckSquare, Brain, History, Target, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";

interface PrelimsSection {
  name: string;
  slug: string;
  icon: typeof BookOpen;
  color: string;
  description: string;
  articles: number;
  isDirectLink?: boolean;
}

const prelimsSections: PrelimsSection[] = [
  {
    name: "Prelims GS Notes",
    slug: "upsc-prelims-gs-notes",
    icon: BookOpen,
    color: "#3B82F6",
    description: "Comprehensive GS notes covering all Prelims topics",
    articles: 0
  },
  {
    name: "Topic-wise MCQs",
    slug: "topic-mcqs",
    icon: CheckSquare,
    color: "#8B5CF6",
    description: "Practice MCQs organized by subject and topic",
    articles: 0,
    isDirectLink: true
  },
  {
    name: "CSAT Preparation",
    slug: "upsc-csat",
    icon: Brain,
    color: "#EC4899",
    description: "CSAT aptitude and comprehension practice",
    articles: 0
  },
  {
    name: "Previous Year Questions",
    slug: "upsc-prelims-pyq",
    icon: History,
    color: "#F59E0B",
    description: "Year-wise and topic-wise PYQ analysis",
    articles: 0
  },
  {
    name: "Mock Tests",
    slug: "upsc-prelims-mock-tests",
    icon: Target,
    color: "#10B981",
    description: "Full-length mock tests with detailed solutions",
    articles: 0
  }
];

const UPSCPrelimsPage = () => {
  return ( 
    <>
      <Helmet>
        <title>UPSC Prelims Preparation | GS Notes, MCQs, Mock Tests</title>
        <meta name="description" content="Complete UPSC Prelims preparation material. Get GS notes, topic-wise MCQs, CSAT practice, previous year questions, and mock tests." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs/prelims" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UPSCBreadcrumb items={[{ label: "Prelims", href: "/upscbriefs/prelims" }]} />
            <div className="mt-6">
              <Badge className="bg-white/20 text-white mb-4">Prelims Preparation</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                UPSC Prelims - Complete Guide
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Master the first stage of Civil Services with comprehensive notes, practice questions, and mock tests.
              </p>
            </div>
          </div>
        </section>

        {/* Prelims Info Cards */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-blue-900 mb-3">Paper I - General Studies</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• 100 Questions | 200 Marks</li>
                    <li>• 2 Hours Duration</li>
                    <li>• Negative Marking: 1/3rd</li>
                    <li>• Covers: History, Geography, Polity, Economy, Science, Environment, Current Affairs</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-purple-900 mb-3">Paper II - CSAT</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• 80 Questions | 200 Marks</li>
                    <li>• 2 Hours Duration</li>
                    <li>• Qualifying: 33% (66 marks)</li>
                    <li>• Covers: Comprehension, Reasoning, Aptitude, Decision Making</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sections Grid */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Prelims Sections</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prelimsSections.map((section) => (
                <Link key={section.slug} to={section.isDirectLink ? `/upscbriefs/${section.slug}` : `/upscbriefs/${section.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${section.color}15` }}
                      >
                        <section.icon className="w-6 h-6" style={{ color: section.color }} />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{section.articles} articles</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Strategy Section */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Prelims Strategy 2025</h3>
                      <p className="text-blue-100">
                        6-month structured plan with daily targets, revision schedule, and mock test series
                      </p>
                    </div>
                    <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                      <Link to="/upscbriefs/upsc-prelims-gs-notes">
                        Get Started <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default UPSCPrelimsPage;

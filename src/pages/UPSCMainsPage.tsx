import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FileText, PenTool, BookOpen, History, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";

const mainsPapers = [
  {
    name: "GS Paper 1",
    slug: "upsc-gs1",
    color: "#2563EB",
    description: "Indian Heritage & Culture, History, Geography",
    topics: ["Art & Culture", "Modern History", "World History", "Indian Geography", "World Geography"]
  },
  {
    name: "GS Paper 2",
    slug: "upsc-gs2",
    color: "#7C3AED",
    description: "Governance, Constitution, Polity, Social Justice, IR",
    topics: ["Constitution", "Governance", "Social Justice", "International Relations", "Parliament"]
  },
  {
    name: "GS Paper 3",
    slug: "upsc-gs3",
    color: "#059669",
    description: "Technology, Economic Development, Environment, Security",
    topics: ["Economy", "Agriculture", "Science & Tech", "Environment", "Disaster Management", "Security"]
  },
  {
    name: "GS Paper 4",
    slug: "upsc-gs4",
    color: "#DC2626",
    description: "Ethics, Integrity, and Aptitude",
    topics: ["Ethics Basics", "Emotional Intelligence", "Attitude", "Civil Service Values", "Case Studies"]
  }
];

const additionalSections = [
  {
    name: "Essay Strategy",
    slug: "upsc-essay-strategy",
    icon: PenTool,
    color: "#DB2777",
    description: "Master the art of essay writing with structure and examples"
  },
  {
    name: "Model Answers",
    slug: "upsc-model-answers",
    icon: BookOpen,
    color: "#0EA5E9",
    description: "Learn from toppers' answers and improve your writing"
  },
  {
    name: "Mains PYQs",
    slug: "upsc-mains-pyq",
    icon: History,
    color: "#F97316",
    description: "Year-wise previous year questions with analysis"
  }
];

const UPSCMainsPage = () => {
  return (
    <>
      <Helmet>
        <title>UPSC Mains Preparation | GS Papers, Essay, Model Answers</title>
        <meta name="description" content="Complete UPSC Mains preparation. Get GS Paper notes, essay writing strategy, model answers, and previous year questions." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs/mains" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-900 to-purple-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UPSCBreadcrumb items={[{ label: "Mains", href: "/upscbriefs/mains" }]} />
            <div className="mt-6">
              <Badge className="bg-white/20 text-white mb-4">Mains Preparation</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                UPSC Mains - Complete Guide
              </h1>
              <p className="text-purple-100 text-lg max-w-2xl">
                Master answer writing with comprehensive notes, model answers, and structured preparation for all GS papers.
              </p>
            </div>
          </div>
        </section>

        {/* Mains Overview */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 mb-10">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-purple-900 mb-4">UPSC Mains Exam Structure</h3>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="font-bold text-2xl text-purple-600 mb-1">9</div>
                    <div className="text-gray-600">Total Papers</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="font-bold text-2xl text-purple-600 mb-1">1750</div>
                    <div className="text-gray-600">Total Marks</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="font-bold text-2xl text-purple-600 mb-1">250</div>
                    <div className="text-gray-600">Per GS Paper</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="font-bold text-2xl text-purple-600 mb-1">3 Hours</div>
                    <div className="text-gray-600">Per Paper</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GS Papers Grid */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">General Studies Papers</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {mainsPapers.map((paper) => (
                <Link key={paper.slug} to={`/upscbriefs/${paper.slug}`}>
                  <Card className="h-full hover:shadow-xl transition-all group overflow-hidden bg-white border-2 border-slate-200 hover:border-purple-300">
                    <div className="h-3" style={{ backgroundColor: paper.color }}></div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">
                        {paper.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">{paper.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {paper.topics.map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center text-sm font-semibold text-purple-700">
                        Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Additional Sections */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mains Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {additionalSections.map((section) => (
                <Link key={section.slug} to={`/upscbriefs/${section.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${section.color}15` }}
                      >
                        <section.icon className="w-6 h-6" style={{ color: section.color }} />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Answer Writing Tips */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Answer Writing Practice</h3>
                      <p className="text-purple-100">
                        Daily answer writing practice with peer review and model answers
                      </p>
                    </div>
                    <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                      <Link to="/upscbriefs/upsc-model-answers">
                        Start Practice <ArrowRight className="w-5 h-5 ml-2" />
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

export default UPSCMainsPage;
